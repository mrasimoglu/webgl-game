class Model {
    constructor(ModelFromJson, Shader) {
        this.meshes = [];
        
        this.materials = [];
        ModelFromJson.materials.forEach((mat) => {
            this.materials.push(new Material(mat, Shader));
        });

        ModelFromJson.meshes.forEach((mesh) => {
            this.meshes.push(new Mesh(mesh, this.materials[mesh.materialindex]));
        });

        this.m_GlobalInverseTransform = glMatrix.mat4.fromValues(...ModelFromJson.rootnode.transformation);
        glMatrix.mat4.rotateX(this.m_GlobalInverseTransform, this.m_GlobalInverseTransform, glMatrix.glMatrix.toRadian(90));
        glMatrix.mat4.invert(this.m_GlobalInverseTransform, this.m_GlobalInverseTransform);


        this.root = this.loopinside(ModelFromJson.rootnode, glMatrix.mat4.create());
        this.animations = [];
        if(ModelFromJson.animations != undefined)
        {
            ModelFromJson.animations.forEach((animation)=> {
                this.animations.push(new AnimationGL(animation));
            });
        }
      
        this.animator = new Animator(this.animations, this);
        
        console.log(this);
    }

    loopinside(root, globaltranformation)
    {

        if (root.meshes == undefined)
            var tmp = new Joint(root.name, root.transformation);
        else
        {
            var tmp = new Joint(root.name, root.transformation, root.meshes);
            root.meshes.forEach((mesh) =>{
                var ma = glMatrix.mat4.clone(tmp.transformation);
                glMatrix.mat4.transpose(ma, ma);
                this.meshes[mesh].transformation = glMatrix.mat4.clone(ma);
            });
        }
       
        if(root.children != undefined)
        {
            root.children.forEach((child) => {
                tmp.addChild(this.loopinside(child, glMatrix.mat4.clone(globaltranformation)));
            });  
        }

        return tmp;
    }

    drawModel(Shader, ModelMatrix)
    {

        this.meshes.forEach((mesh)=>{
            var ma = glMatrix.mat4.create();
            glMatrix.mat4.mul(ma, ModelMatrix.elements, this.root.transformation);
            glMatrix.mat4.mul(ma, ma, mesh.transformation);
         
            mesh.drawMesh(Shader, ma);
        });
    }

    addChild(ajoint)
    {
        this.childs.push(ajoint);
    }

    callAnimator()
    {
        if(this.animator.animations.length > 0 && this.animator.currentAnimation != -1)
            this.animator.loopinside(this.root,  glMatrix.mat4.create(),this.m_GlobalInverseTransform, this.animator.getAnimationTime());
    }

    getJointByName(node, searchingName)
    {
        if(node.name == searchingName)
            return node;

        var tmp;
        var i = 0;
        var flag = false;
        while(node.childs[i] && !flag)
        {
            tmp = this.getJointByName(node.childs[i], searchingName);
            if(tmp)
                flag = true;
            else
                i++;
        }
        return tmp;
    }

    getBoneByName(name)
    {
        var bones = [];
        
        this.meshes.forEach((mesh) => {
           
            if(mesh.bones != undefined)
            {
                var tmp = mesh.bones.getBoneByName(name);
                
                if(tmp != undefined)
                {
                    bones.push(tmp);
                }
            }
      
        });
        return bones;
    }
}

class Joint {
    constructor(name, transformation, mesh=[]) {
        this.childs = [];
        this.name = name;
        this.transformation = glMatrix.mat4.fromValues(...transformation);
        //glMatrix.mat4.transpose(this.transformation, this.transformation);
       
        this.finaltransformation = glMatrix.mat4.create();
        this.mesh = mesh;
    }

    addChild(ajoint)
    {
        this.childs.push(ajoint);
    }

    getTransformation()
    {
     
        return this.transformation;
    }
}

class Bone {
    constructor(name, offsetmatrixfromjson)
    {
        this.name = name;
        this.offsetmatrix = glMatrix.mat4.fromValues(...offsetmatrixfromjson);
        glMatrix.mat4.transpose(this.offsetmatrix, this.offsetmatrix);
        this.finaltransformation = glMatrix.mat4.create();
        glMatrix.mat4.rotateX(this.finaltransformation, this.finaltransformation, glMatrix.glMatrix.toRadian(-90));
    }

    calcFinaltransformation(m_GlobalInverseTransform, GlobalTransformation)
    {

        glMatrix.mat4.mul(this.finaltransformation, m_GlobalInverseTransform, GlobalTransformation);
        glMatrix.mat4.mul(this.finaltransformation, this.finaltransformation, this.offsetmatrix);
        
    }
}

var BoneArrayClass =
   function() {
        this.bones = [];
        this.bonesnames = new Object();
        this.push = (bone) => {this.bones.push(bone); this.bonesnames[bone.name] = this.bones[this.bones.length-1]};
        this.getBoneByID = (id) => {return this.bones[id]};
        this.getBoneByName = (name) => { return this.bonesnames[name]};
        this.getBonesFinalFlat = () => {return this.bones.reduce((x,y) => x.concat(y.finaltransformation.reduce((a,b) => a.concat(b),[])), [])};
        this.getLength = () =>{return this.bones.length};
    };

class Mesh {
    constructor(MeshFromJson, material) {
        


        this.name = MeshFromJson.name;
        
        this.vertices = Float32Array.from(MeshFromJson.vertices);
        this.indices = Uint16Array.from([].concat.apply([], MeshFromJson.faces));
        this.normals = Float32Array.from(MeshFromJson.normals);
        this.texcoords = (MeshFromJson.texturecoords != undefined) ? Float32Array.from(MeshFromJson.texturecoords[0]) : null;

        this.bones = new BoneArrayClass(); 
        this.material = material;
        this.boneswithnames = new Object();
        this.WeightInfo = [];
        this.BoneIds = [];
        this.Weights = [];

        this.finaltransformation = glMatrix.mat4.create();
        if (MeshFromJson.bones != undefined)
        {
            for(var i = 0; i<this.vertices.length / 3; i++)
            {
                this.WeightInfo.push([]);   
            }

            MeshFromJson.bones.forEach((bone, boneid) => {
                var b  = new Bone(bone.name, bone.offsetmatrix);
           
                
                this.bones.push(b);
                //this.boneswithnames[bone.name] = this.bones[boneid];

                bone.weights.forEach((aweight) => {
                this.pushWeight(boneid, aweight);
                });
            });
            
            this.sortWeights();
            this.clearWeights();
        }
      
    }
  
    pushWeight(boneid, aweight) {
        var vert = aweight[0];
        var impact = aweight[1];

        this.WeightInfo[vert].push({"boneid":boneid,"weight":impact});
    }

    sortWeights(){
        for(var i =0; i<this.vertices.length/3;i++)
            this.WeightInfo[i].sort(function(a, b){return b.weight - a.weight});
    }

    clearWeights(maxweight=3){
        for(var i =0; i<this.vertices.length/3;i++)
        {
            this.WeightInfo[i].splice(maxweight);
            var sum = 0;
            this.WeightInfo[i].forEach((val) => {
                sum += val.weight;
            });
            this.WeightInfo[i].forEach((val, index) => {
                this.WeightInfo[i][index].weight /= sum;
            });
        }
        
        this.WeightInfo.forEach((info)=>{
            for(var i =0; i<3;i++)
            {
                if(info[i] != undefined)
                {
                    this.BoneIds.push(info[i].boneid);
                    this.Weights.push(info[i].weight);
                }
                else
                {
                    this.BoneIds.push(0);
                    this.Weights.push(0);
                }
            }
        });
        this.BoneIds = Float32Array.from(this.BoneIds);
        this.Weights = Float32Array.from(this.Weights);
        
    }

    drawMesh(Shader, ModelMatrix)
    {   
    
        Shader.gl.bindTexture(Shader.gl.TEXTURE_2D, null);
        if(this.bones.getLength() > 0)
        {
            var flatBones = this.bones.getBonesFinalFlat();
            Shader.gl.uniformMatrix4fv(Shader.u_Bones, false, Float32Array.from(flatBones));
            Shader.initArrayBuffer(this.BoneIds, 'a_BoneIds', 3, 0, 0);
            Shader.initArrayBuffer(this.Weights, 'a_Weights', 3, 0, 0);
            Shader.gl.uniform1f(Shader.u_HasBones, true);
            
        }
        else
        {
            Shader.gl.uniform1f(Shader.u_HasBones, false);
        }


        if(this.material.diffusemaps.length > 0)
        {
            Shader.gl.bindTexture(Shader.gl.TEXTURE_2D, this.material.diffusemaps[0]);
            Shader.gl.activeTexture(Shader.gl.TEXTURE0);
        }
     
        
        if(this.texcoords)
        {
            Shader.gl.uniform1f(Shader.u_HasTex, 0.9);
            Shader.initArrayBuffer(this.texcoords, 'a_TexCoords', 2, 0, 0);
        }
        else
        {
            Shader.disableVertexAttribArray('a_TexCoords');
            Shader.gl.uniform1f(Shader.u_HasTex, 0.1);
            //console.log("yok" + this.name + this.material.diffuse + this.material.ambient);
            Shader.gl.uniform3fv(Shader.u_diffuse, this.material.diffuse);
            Shader.gl.uniform3fv(Shader.u_ambient, this.material.ambient);
        }
            
        if(this.material.specular)
        {
            Shader.gl.uniform1f(Shader.u_shiness, this.material.shiness);
            Shader.gl.uniform3fv(Shader.u_specular, this.material.specular);
            Shader.gl.uniform1f(Shader.u_HasSpecular, true);
        }
        else
        {
            Shader.gl.uniform1f(Shader.u_HasSpecular, false);
        }
       

        Shader.gl.uniformMatrix4fv(Shader.u_ModelMatrix, false, ModelMatrix);
        
        Shader.initArrayBuffer(this.vertices, 'a_Position', 3, 0, 0);
        Shader.initArrayBuffer(this.normals, 'a_Normal', 3, 0, 0);
       
        glMatrix.mat4.invert(ModelMatrix, ModelMatrix);
        glMatrix.mat4.transpose(ModelMatrix, ModelMatrix);
        
        Shader.gl.uniformMatrix4fv(Shader.u_NormalMatrix, false, ModelMatrix);
        //ÜÇGENLERİN BAĞLANTILARINI AKTARIYORUZ.

        Shader.gl.bindBuffer(Shader.gl.ELEMENT_ARRAY_BUFFER, Shader.IndicesBuffer);
        Shader.gl.bufferData(Shader.gl.ELEMENT_ARRAY_BUFFER, this.indices, Shader.gl.STATIC_DRAW);
        //ÜÇGENLERİN BAĞLANTILARINI AKTARIYORUZ.

        
        Shader.gl.drawElements(Shader.gl.TRIANGLES, this.indices.length, Shader.gl.UNSIGNED_SHORT, 0);
    }
}