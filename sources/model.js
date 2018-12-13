class Model {
    constructor(ModelFromJson, Shader) {
        this.meshes = [];
        this.Shader = Shader;
        this.materials = [];
        ModelFromJson.materials.forEach((mat) => {
            this.materials.push(new Material(mat, Shader));
        });

        ModelFromJson.meshes.forEach((mesh) => {
            this.meshes.push(new Mesh(mesh, this.materials[mesh.materialindex], Shader));
        });

        this.m_GlobalInverseTransform = glMatrix.mat4.fromValues(...ModelFromJson.rootnode.transformation);
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
        
        this.callAnimator();
    }

    copy()
    {
        var newone = Object.create(Model.prototype);
        newone.Shader = this.Shader;
        newone.materials = this.materials;
        newone.animations = this.animations;
        newone.root = this.root;
        newone.m_GlobalInverseTransform = this.m_GlobalInverseTransform;
        newone.animator = new Animator(this.animations, newone);
        newone.meshes = [];
        this.meshes.forEach(mesh => {
            newone.meshes.push(mesh.copy());
        });
        return newone;

    }

    loopinside(root, globaltranformation)
    {
        glMatrix.mat4.mul(globaltranformation,  root.transformation,globaltranformation);
        if (root.meshes == undefined)
            var tmp = new Joint(root.name, root.transformation);
        else
        {
            var tmp = new Joint(root.name, root.transformation, root.meshes);
               root.meshes.forEach((mesh) =>{
                var ma = glMatrix.mat4.clone(globaltranformation);
                //glMatrix.mat4.transpose(ma, ma);
                console.log(ma);
                console.log(root.name);
                this.meshes[mesh].transformation.push(glMatrix.mat4.clone(ma));
            });
            var bones= this.getBoneByName(root.name);
    
            bones.forEach((bone)=>{
                bone.calcFinaltransformation(this.m_GlobalInverseTransform, glMatrix.mat4.clone(globaltranformation));
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

    drawModel(ModelMatrix)
    {
         glMatrix.mat4.transpose(ModelMatrix, ModelMatrix);
       // this.drawModell(this.root, glMatrix.mat4.clone(ModelMatrix));
       // console.log("--");
       this.meshes.forEach((mesh)=>{
           mesh.transformation.forEach((trans) => {
            var ma = glMatrix.mat4.create();

           // glMatrix.mat4.mul(ma, ma, trans);
            if(mesh.bones.getLength() <= 0)
            {
                
                glMatrix.mat4.mul(ma, trans, ModelMatrix);
            }
            else
            {
            
                glMatrix.mat4.mul(ma, ma, ModelMatrix);
            }
           
            glMatrix.mat4.transpose(ma, ma);
            mesh.drawMesh(this.Shader, ma);
           });
           
        });
    }

    drawModell(root,parenttrans)
    {
        var ma2 = glMatrix.mat4.create();
   //    glMatrix.mat4.transpose(ma2, root.transformation);

   glMatrix.mat4.mul(parenttrans,root.transformation,parenttrans);
      
       
        root.mesh.forEach((mesh)=>{
            var ma = glMatrix.mat4.clone(parenttrans);
          //  glMatrix.mat4.invert(ma, parenttrans);
            glMatrix.mat4.transpose(ma, parenttrans);
            this.meshes[mesh].drawMesh(this.Shader, glMatrix.mat4.clone(ma));
        });


        root.childs.forEach((child)=>{
            this.drawModell(child, glMatrix.mat4.clone(parenttrans));
        });
    }

    addChild(ajoint)
    {
        this.childs.push(ajoint);
    }

    callAnimator()
    {
        if(this.animator.animations.length > 0 && this.animator.currentAnimation != -1)
        {
            this.meshes.forEach(m => {
                m.transformation = [];
            });
            this.animator.loopinside(this.root,  glMatrix.mat4.create(),this.m_GlobalInverseTransform, this.animator.getAnimationTime());
        }
           
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
    }

    calcFinaltransformation(m_GlobalInverseTransform, GlobalTransformation)
    {

        glMatrix.mat4.mul(this.finaltransformation, m_GlobalInverseTransform, GlobalTransformation);
        glMatrix.mat4.mul(this.finaltransformation, this.finaltransformation, this.offsetmatrix);
        
    }
}
class BoneArrayClass
{
    constructor()
    {
        this.bones = [];
        this.bonesnames = new Object();
    }

    push(bone)
    {
        this.bones.push(bone); 
        this.bonesnames[bone.name] = this.bones[this.bones.length-1];
    }
    getBoneByID(id)
    {
        return this.bones[id];
    } 
    getBoneByName(name)
    {
        return this.bonesnames[name];
    }
    getBonesFinalFlat()
    {
        return this.bones.reduce((x,y) => x.concat(y.finaltransformation.reduce((a,b) => a.concat(b),[])), []);
    }
    getLength()
    {
        return this.bones.length;
    }
    copy()
    {
        var newone = Object.create(BoneArrayClass.prototype);
        newone.bones = Array.from(this.bones);;
        newone.bonesnames = this.bonesnames;
        return newone;
    }
}



class StaticMesh {
    constructor(MeshFromJson, material,Shader, parentmesh)
    {  

        this.parent = parentmesh;
        var gl = Shader.gl;
        this.vao = gl.createVertexArray();

        this.vertices = Float32Array.from(MeshFromJson.vertices);
        this.indices = Uint16Array.from([].concat.apply([], MeshFromJson.faces));
        this.normals = Float32Array.from(MeshFromJson.normals);
        this.texcoords = (MeshFromJson.texturecoords != undefined) ? Float32Array.from(MeshFromJson.texturecoords[0]) : null;
        
        this.BoneIds = [];
        this.Weights = [];
        this.material = material;
        this.WeightInfo = [];
        if (MeshFromJson.bones != undefined)
        {
            for(var i = 0; i<this.vertices.length / 3; i++)
            {
                this.WeightInfo.push([]);   
            }

            MeshFromJson.bones.forEach((bone, boneid) => {
                bone.weights.forEach((aweight) => {
                this.pushWeight(boneid, aweight);
                });
            });
            
            this.sortWeights();
            this.clearWeights();

        }


        gl.bindVertexArray(this.vao);

        Shader.gl.bindBuffer(Shader.gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        Shader.gl.bufferData(Shader.gl.ELEMENT_ARRAY_BUFFER, this.indices, Shader.gl.STATIC_DRAW);

        var loc = gl.getAttribLocation(gl.program, 'a_Position');
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(loc,3,gl.FLOAT, gl.FALSE, 0, 0);
        gl.enableVertexAttribArray(loc);

        var loc = gl.getAttribLocation(gl.program, 'a_Normal');
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
        gl.vertexAttribPointer(loc,3,gl.FLOAT, gl.FALSE, 0, 0);
        gl.enableVertexAttribArray(loc);

        if(this.texcoords)
        {
            var loc = gl.getAttribLocation(gl.program, 'a_TexCoords');
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ARRAY_BUFFER, this.texcoords, gl.STATIC_DRAW);
            gl.vertexAttribPointer(loc,2,gl.FLOAT, gl.FALSE, 0, 0);
            gl.enableVertexAttribArray(loc);
            
        }

       
        if(this.parent.bones.getLength() > 0)
        {
            
            var loc = gl.getAttribLocation(gl.program, 'a_BoneIds');
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ARRAY_BUFFER, this.BoneIds, gl.STATIC_DRAW);
            gl.vertexAttribPointer(loc,3,gl.FLOAT, gl.FALSE, 0, 0);
            gl.enableVertexAttribArray(loc);

            var loc = gl.getAttribLocation(gl.program, 'a_Weights');
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ARRAY_BUFFER, this.Weights, gl.STATIC_DRAW);
            gl.vertexAttribPointer(loc,3,gl.FLOAT, gl.FALSE, 0, 0);
            gl.enableVertexAttribArray(loc);                  
        }
       /* var loc = gl.getAttribLocation(program, 'a_TexCoords');
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, this.texcoords, gl.STATIC_DRAW);
        gl.vertexAttribPointer(loc,2,this.gl.FLOAT, this.gl.FALSE, 0, 0);
        gl.enableVertexAttribArray(loc);*/

        gl.bindVertexArray(null);



     
    
        
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
}

class Mesh {
    constructor(MeshFromJson, material, Shader) 
    {
        this.name = MeshFromJson.name;
        this.bones = new BoneArrayClass(); 
        this.transformation = [];
      
        if (MeshFromJson.bones != undefined)
        {
            MeshFromJson.bones.forEach((bone) => {
                this.bones.push(new Bone(bone.name, bone.offsetmatrix));
            });
        }
        
        this.staticMesh = new StaticMesh(MeshFromJson, material, Shader, this);
        this.finaltransformation = glMatrix.mat4.create();


    }
    copy()
    {
        var newone = Object.create(Mesh.prototype);
        newone.name = this.name;
        newone.staticMesh = this.staticMesh;
       // newone.transformation = glMatrix.mat4.clone(this.transformation);
       newone.transformation = [];
       this.transformation.forEach(trans => {
           newone.transformation.push(glMatrix.mat4.clone(trans));
       });
        newone.finaltransformation = glMatrix.mat4.clone(this.finaltransformation);
        newone.name = this.name;
        newone.bones = this.bones.copy();
        return newone;
    }
    drawMesh(Shader, ModelMatrix)
    {   
       
    
        Shader.gl.bindTexture(Shader.gl.TEXTURE_2D, null);
        if(this.bones.getLength() > 0)
        {
            var flatBones = this.bones.getBonesFinalFlat();
            Shader.gl.uniformMatrix4fv(Shader.u_Bones, false, Float32Array.from(flatBones));
            Shader.gl.uniform1f(Shader.u_HasBones, true);
           
            
        }
        else
        {
            Shader.gl.uniform1f(Shader.u_HasBones, false);
        }


        if(this.staticMesh.material.diffusemaps.length > 0)
        {
            Shader.gl.bindTexture(Shader.gl.TEXTURE_2D, this.staticMesh.material.diffusemaps[0]);
            Shader.gl.activeTexture(Shader.gl.TEXTURE0);
        }
     
        
        if(this.staticMesh.texcoords)
        {
            Shader.gl.uniform1f(Shader.u_HasTex, 0.9);
            
        }
        else
        {
            Shader.disableVertexAttribArray('a_TexCoords');
            Shader.gl.uniform1f(Shader.u_HasTex, 0.1);
            //console.log("yok" + this.name + this.material.diffuse + this.material.ambient);
            Shader.gl.uniform3fv(Shader.u_diffuse, this.staticMesh.material.diffuse);
            Shader.gl.uniform3fv(Shader.u_ambient, this.staticMesh.material.ambient);
        }
            
        if(this.staticMesh.material.specular)
        {
            Shader.gl.uniform1f(Shader.u_shiness, this.staticMesh.material.shiness);
            Shader.gl.uniform3fv(Shader.u_specular, this.staticMesh.material.specular);
            Shader.gl.uniform1f(Shader.u_HasSpecular, true);
        }
        else
        {
            Shader.gl.uniform1f(Shader.u_HasSpecular, false);
        }
       
        Shader.gl.uniformMatrix4fv(Shader.u_ModelMatrix, false, ModelMatrix);
        
      //  Shader.initArrayBuffer(this.staticMesh.vertices, 'a_Position', 3, 0, 0);
       // Shader.initArrayBuffer(this.staticMesh.normals, 'a_Normal', 3, 0, 0);

       Shader.gl.bindVertexArray(this.staticMesh.vao);

       
        glMatrix.mat4.invert(ModelMatrix, ModelMatrix);
        glMatrix.mat4.transpose(ModelMatrix, ModelMatrix);
        
        Shader.gl.uniformMatrix4fv(Shader.u_NormalMatrix, false, ModelMatrix);
        //ÜÇGENLERİN BAĞLANTILARINI AKTARIYORUZ.

     
        //ÜÇGENLERİN BAĞLANTILARINI AKTARIYORUZ.

        
        Shader.gl.drawElements(Shader.gl.TRIANGLES, this.staticMesh.indices.length, Shader.gl.UNSIGNED_SHORT, 0);
        Shader.gl.bindVertexArray(null);
    }
}