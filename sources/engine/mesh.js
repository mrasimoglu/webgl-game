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
        Shader.gl.useProgram(Shader.program);
    
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


        if(this.staticMesh.material!=null && this.staticMesh.material.diffusemaps.length > 0)
        {
            Shader.gl.bindTexture(Shader.gl.TEXTURE_2D, this.staticMesh.material.diffusemaps[0]);
            Shader.gl.activeTexture(Shader.gl.TEXTURE0);
        }
     
        
        if(this.staticMesh.texcoords)
        {
            Shader.gl.uniform1f(Shader.u_HasTex, 0.9);
            
        }
        else if (this.staticMesh.material!=null)
        {
           // Shader.disableVertexAttribArray('a_TexCoords');
            Shader.gl.uniform1f(Shader.u_HasTex, 0.1);
            //console.log("yok" + this.name + this.material.diffuse + this.material.ambient);
            Shader.gl.uniform3fv(Shader.u_diffuse, this.staticMesh.material.diffuse);
            Shader.gl.uniform3fv(Shader.u_ambient, this.staticMesh.material.ambient);
        }
            
        if(this.staticMesh.material!=null && this.staticMesh.material.specular)
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

       Shader.gl.bindVertexArray(this.staticMesh.vao);

       
        glMatrix.mat4.invert(ModelMatrix, ModelMatrix);
        glMatrix.mat4.transpose(ModelMatrix, ModelMatrix);
        
        Shader.gl.uniformMatrix4fv(Shader.u_NormalMatrix, false, ModelMatrix);
        
        Shader.gl.drawElements(Shader.gl.TRIANGLES, this.staticMesh.indices.length, Shader.gl.UNSIGNED_SHORT, 0);
        Shader.gl.bindVertexArray(null);
    }
}