
class Animator {
    constructor (Animations, model)
    {
        this.currentAnimation = -1;
        
        this.animationStartTime = 0;
        this.animations = Animations;
        this.Model = model;
        
    }

    playAnimation(id)
    {
        if(this.animations[id] == undefined)
            return false;
        this.currentAnimation = this.animations[id];
        this.animationStartTime = Date.now();
        return true;
      
    }

    getAnimationTime()
    {
        
        return ((Date.now() - this.animationStartTime) / (1000 / this.currentAnimation.tickspersecond)) % this.currentAnimation.duration;
    }

    loopinside(root, ParentTransform, m_GlobalInverseTransform, ATime)
    {
        //console.log(root);
        
        var NodeTransformation = glMatrix.mat4.clone(root.getTransformation());
       

        var currentAnimChannel = this.currentAnimation.channels.getChannelbyName(root.name);
        
        if(currentAnimChannel != undefined)
        {

            //console.log("asda");
                var RotationMatrix = glMatrix.mat4.create();
                var TransformationMatrix = glMatrix.mat4.create();
                var ScalingMatrix = glMatrix.mat4.create();
                var quad = this.CalcInterpolatedRotation(currentAnimChannel.getRKey(ATime),currentAnimChannel.rotationkeys, ATime);
               // console.log(NodeTransformation);
                glMatrix.mat4.fromQuat(RotationMatrix, quad);

                var v3 = this.CalcInterpolatedLocation(currentAnimChannel.getPKey(ATime),currentAnimChannel.positionkeys, ATime);
                glMatrix.mat4.fromTranslation(TransformationMatrix, v3);

                var sv3 = this.CalcInterpolatedScaling(currentAnimChannel.getSKey(ATime),currentAnimChannel.scalingkeys, ATime);
                glMatrix.mat4.fromScaling(ScalingMatrix, sv3);
             
                

                glMatrix.mat4.mul(NodeTransformation, TransformationMatrix, RotationMatrix);
                glMatrix.mat4.mul(NodeTransformation, NodeTransformation, ScalingMatrix);
                //console.log(NodeTransformation);
                //glMatrix.mat4.transpose(NodeTransformation, NodeTransformation);
            
            
           
        }

        var GlobalTransformation = glMatrix.mat4.create();
        glMatrix.mat4.mul(GlobalTransformation, ParentTransform, NodeTransformation);
       
        var bone = this.Model.getBoneByName(root.name);
        //console.log(bone + root.name);
        if(bone != undefined)
        {
            bone.calcFinaltransformation(m_GlobalInverseTransform, GlobalTransformation);
        }
       //  root.finaltransformation = glMatrix.mat4.clone(globaltranformation);

        root.childs.forEach((child) => {
            this.loopinside(child, glMatrix.mat4.clone(GlobalTransformation),m_GlobalInverseTransform, ATime);
        });  
        
    }

    CalcInterpolatedRotation(index,RotationKeys, AnimationTime )
    {   
        //console.log(index == RotationKeys.length);
       
        var q1= glMatrix.quat.fromValues(RotationKeys[index].arr[1], RotationKeys[index].arr[2], RotationKeys[index].arr[3] ,RotationKeys[index].arr[0]);
    
        if(RotationKeys.length == 1)
        {
            //console.log(index);
            return q1;
        }
         

        var nextIndex = index+1;
        var DeltaTime = RotationKeys[nextIndex].time - RotationKeys[index].time;
        var Factor = (AnimationTime - RotationKeys[index].time) / DeltaTime;
   
        var q2= glMatrix.quat.fromValues(RotationKeys[nextIndex].arr[1], RotationKeys[nextIndex].arr[2], RotationKeys[nextIndex].arr[3] ,RotationKeys[nextIndex].arr[0]);
        var q3 = glMatrix.quat.create();
        glMatrix.quat.slerp(q3, q1,q2, Factor);
        glMatrix.quat.normalize(q3, q3);
        return q3;
    }
    CalcInterpolatedLocation(index,TransformationKes, AnimationTime )
    {

        var v3= glMatrix.vec3.fromValues(TransformationKes[index].arr[0], TransformationKes[index].arr[1], TransformationKes[index].arr[2]);
        if(TransformationKes.length == 1)
        {
            return v3;
        }
         

        var nextIndex = index+1;
        var DeltaTime = TransformationKes[nextIndex].time - TransformationKes[index].time;
        var Factor = (AnimationTime - TransformationKes[index].time) / DeltaTime;

        var v32= glMatrix.vec3.fromValues(TransformationKes[nextIndex].arr[0], TransformationKes[nextIndex].arr[1], TransformationKes[nextIndex].arr[2]);
        var Delta = glMatrix.vec3.create();
        var Out = glMatrix.vec3.create();
        glMatrix.vec3.subtract(Delta, v32, v3);
        glMatrix.vec3.scaleAndAdd(Out, v3, Delta, Factor);
        return Out;
    }
    CalcInterpolatedScaling(index, ScalingKeys, AnimationTime)
    {

        var v3= glMatrix.vec3.fromValues(ScalingKeys[index].arr[0], ScalingKeys[index].arr[1], ScalingKeys[index].arr[2]);
        if(ScalingKeys.length == 1)
        {
            return v3;
        }
         

        var nextIndex = index+1;
        var DeltaTime = ScalingKeys[nextIndex].time - ScalingKeys[index].time;
        var Factor = (AnimationTime - ScalingKeys[index].time) / DeltaTime;

        var v32= glMatrix.vec3.fromValues(ScalingKeys[nextIndex].arr[0], ScalingKeys[nextIndex].arr[1], ScalingKeys[nextIndex].arr[2]);
        var Delta = glMatrix.vec3.create();
        var Out = glMatrix.vec3.create();
        glMatrix.vec3.subtract(Delta, v32, v3);
        glMatrix.vec3.scaleAndAdd(Out, v3, Delta, Factor);
        return Out;
    }
   


   
}


class AnimationGL {
    constructor(AnimationFromJson)
    {
        this.name = AnimationFromJson.name;
        this.duration = AnimationFromJson.duration;
        this.tickspersecond = AnimationFromJson.tickspersecond;
        this.channels = new ChannelArrayclass();
        
        AnimationFromJson.channels.forEach((channel) => {
            this.channels.push(new Channel(channel.name, channel.positionkeys, channel.rotationkeys, channel.scalingkeys));
        });

    }

    getAnimationTime()
    {
        return
    }


   

    
}

class Channel {
    constructor(name, positionkeys, rotationkeys, scalingkeys)
    {
        this.name = name;
        this.positionkeys = [];
        this.rotationkeys = [];
        this.scalingkeys = [];
        positionkeys.forEach((pkey) => {
            this.positionkeys.push({"time": pkey[0], "arr": Object.assign([], pkey[1])});
        });
        rotationkeys.forEach((pkey) => {
            this.rotationkeys.push({"time": pkey[0], "arr": Object.assign([], pkey[1])});
        });
        scalingkeys.forEach((pkey) => {
            this.scalingkeys.push({"time": pkey[0], "arr": Object.assign([], pkey[1])});
        });

    }

    getPKey(AnimationTime)
    {
        for(var i = this.positionkeys.length-1; i>=0;i--)
        {
            if(AnimationTime >= this.positionkeys[i].time)
                return i;
        }
    }
    getRKey(AnimationTime)
    {
        for(var i = this.rotationkeys.length-1; i>=0;i--)
        {
            if(AnimationTime >= this.rotationkeys[i].time)
                return i;
        }
    }
    getSKey(AnimationTime)
    {
        for(var i = this.scalingkeys.length-1; i>=0;i--)
        {
            if(AnimationTime >= this.scalingkeys[i].time)
                return i;
        }
    }

}

var ChannelArrayclass =
   function() {
        this.channels = [];
        this.channelsnames = new Object();
        this.push = (channel) => {this.channels.push(channel); this.channelsnames[channel.name] = this.channels[this.channels.length-1]};
        this.getChannelbyName = (name) => { return this.channelsnames[name]};
    };
        

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
        
class Material {
    constructor(MaterialFromJson, Shader)
    {
        var Hm = new Object();
        MaterialFromJson.properties.forEach((pr) => {
            Hm[pr.key] = pr.value;
        });
        this.name = Hm["?mat.name"];
        this.diffuse = Float32Array.from(Hm["$clr.diffuse"]);
        this.ambient = (Hm["$clr.ambient"] != undefined) ? Float32Array.from(Hm["$clr.ambient"]) : this.diffuse;
        this.specular = (Hm["$clr.specular"] != undefined) ? Float32Array.from(Hm["$clr.specular"]) : null;
        this.emissive = (Hm["$clr.emissive"] != undefined) ? Float32Array.from(Hm["$clr.emissive"]) : 0;
        this.shinpercent = (Hm["$mat.shinpercent"] != undefined) ? Float32Array.from(Hm["$mat.shinpercent"]) : 0;
        this.shiness = (Hm["$mat.shininess"] != undefined) ? Hm["$mat.shininess"] : 0;

        this.diffusemaps = [];
        this.normalmaps = [];

        MaterialFromJson.properties.forEach((pr) => {
            if(pr.key == "$tex.file")
            {
                if(pr.semantic == 1)
                {
                    var imgloc = (pr.value).split("\\");
                    imgloc = imgloc[imgloc.length-1];
                    loadImage("textures/" + imgloc).then((img) => {
                        this.diffusemaps.push(this.createTexture(img, Shader));
                    });
                    
                    
                }
                else if(pr.semantic == 6)
                {
                    this.normalmaps.push(pr.value);
                }
            }
        });
    }

    createTexture(img, Shader)
    {   
        var gl = Shader.gl;
        var Texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, Texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
            gl.UNSIGNED_BYTE,
            img
        );
            return Texture;
    }

    
    
}

class Mesh {
    constructor(MeshFromJson, material) {
        
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
                
                this.bones.push(new Bone(bone.name, bone.offsetmatrix));
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
            Shader.gl.uniform1f(Shader.u_HasTex, true);
            Shader.initArrayBuffer(this.texcoords, 'a_TexCoords', 2, 0, 0);
        }
        else
        {
            Shader.gl.uniform1f(Shader.u_HasTex, false);
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

    rotateMeshByWeight(bone)
    {

    }
}

class Joint {
    constructor(name, transformation, mesh=[]) {
        this.childs = [];
        this.name = name;
        this.transformation = glMatrix.mat4.fromValues(...transformation);
        
        glMatrix.mat4.invert(this.transformation, this.transformation);
        glMatrix.mat4.transpose(this.transformation, this.transformation);
        this.finaltransformation = glMatrix.mat4.create();
        this.mesh = mesh;
    }

    addChild(ajoint)
    {
        this.childs.push(ajoint);
    }

    getTransformation()
    {
        
        return this.finaltransformation;
    }
}

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
        glMatrix.mat4.rotateX(this.m_GlobalInverseTransform, this.m_GlobalInverseTransform, glMatrix.glMatrix.toRadian(-90));
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

    getBoneByName(name)
    {
        var bone;
        this.meshes.forEach((mesh) => {
           
            if(mesh.bones != undefined)
            {
                var tmp = mesh.bones.getBoneByName(name);
                
                if(tmp != undefined)
                {
                    bone = tmp;
                }
                   

            }
      
        });
        return bone;
    }

    loopinside(root, globaltranformation)
    {

        if (root.meshes == undefined)
            var tmp = new Joint(root.name, root.transformation);
        else
            var tmp = new Joint(root.name, root.transformation, root.meshes);
        
        glMatrix.mat4.multiply(globaltranformation, globaltranformation, tmp.transformation);
        tmp.finaltransformation = glMatrix.mat4.clone(globaltranformation);
        
        if(root.meshes != undefined)
        {
            
            root.meshes.forEach((mm) => {
        
                this.meshes[mm].finaltransformation = glMatrix.mat4.clone(globaltranformation);
            });
        }
            
        var bone = this.getBoneByName(root.name);
       
        if(bone != undefined)
        {

            bone.calcFinaltransformation(this.m_GlobalInverseTransform, globaltranformation);
        }
      
        if(root.children != undefined)
        {
            root.children.forEach((child) => {
                tmp.addChild(this.loopinside(child, glMatrix.mat4.clone(globaltranformation)));
            });  
        }

        return tmp;
    }

    addChild(ajoint)
    {
        this.childs.push(ajoint);
    }

    callAnimator()
    {
        if(this.animator.animations.length > 0)
            this.animator.loopinside(this.root,  glMatrix.mat4.create(),this.m_GlobalInverseTransform, this.animator.getAnimationTime());
    }

    drawModel(root, Shader, ModelMatrix)
    {

       /* ModelMatrix.multiply(new Matrix4(root.getTransformation()));
        
        if(root.mesh != -1)
        {
            this.meshes[root.mesh].drawMesh(Shader, new Matrix4(ModelMatrix));
        }
       
        root.childs.forEach((child)=> { 
           this.drawModel(child, Shader, new Matrix4(ModelMatrix));
        });*/
     
        this.meshes.forEach((mesh)=>{
            var ma = glMatrix.mat4.create();
            glMatrix.mat4.mul(ma, ModelMatrix.elements, mesh.finaltransformation);
            mesh.drawMesh(Shader, ma);
        });
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
}

class Shader {
    constructor(gl, attributes, uniforms)
    {
        this.gl = gl;    
        
        this.IndicesBuffer = gl.createBuffer();
        this.attriblocations = new Object();
        uniforms.forEach((uniform)=>{
            this[uniform] = gl.getUniformLocation(gl.program, uniform);
            if(!this[uniform]){
                console.log(uniform);
                console.log("uniform error");
                return;
            }
        });
        attributes.forEach((attribute)=>{
            this[attribute] = gl.createBuffer();
            if(!this[attribute]){
                console.log("buffer error");
                return;
            }
            this.attriblocations[attribute] = this.gl.getAttribLocation(this.gl.program, attribute);
         
        });
        
        this.gl.uniform3fv(this.u_lightColor, new Float32Array([1, 1, 1]));
     
    }

    initArrayBuffer(Data, AttribLoc, Size, Stribe, Offset)
    {
 
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this[AttribLoc]);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, Data, this.gl.STATIC_DRAW);
    
        this.gl.vertexAttribPointer(this.attriblocations[AttribLoc], Size, this.gl.FLOAT, this.gl.FALSE, Stribe, Offset);
        this.gl.enableVertexAttribArray(this.attriblocations[AttribLoc]);
    }
}