class SkyboxMesh
{
    constructor(MeshFromJson, Shader, tex) 
    {
        this.name = MeshFromJson.name;
        this.vao = Shader.gl.createVertexArray();
        this.texture = tex;
        this.vertices = Float32Array.from(MeshFromJson.vertices);
        this.vertices = Float32Array.from([
        -1.0,  1.0, -1.0,
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
        -1.0,  1.0, -1.0,

        -1.0, -1.0,  1.0,
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
        -1.0, -1.0,  1.0,

         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,

        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,

        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0
        ]);
        this.indices = Uint16Array.from([].concat.apply([], MeshFromJson.faces));

        this.initVertexArray(Shader.gl, Shader.program);

    }

    initData(gl, program, attrib, data, size)
    {
      
        var loc = gl.getAttribLocation(program, attrib);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.vertexAttribPointer(loc,size,gl.FLOAT, gl.FALSE, 0, 0);
        gl.enableVertexAttribArray(loc);
    }

    initVertexArray(gl, program)
    {
       
        gl.bindVertexArray(this.vao);

       gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
       gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
         
        this.initData(gl, program, 'a_Position', this.vertices, 3);

        gl.bindVertexArray(null);

    }

    drawMesh(Shader, ModelMatrix)
    {   
        Shader.gl.useProgram(Shader.program);
    
        Shader.gl.bindTexture(Shader.gl.TEXTURE_CUBE_MAP, null);
  
        Shader.gl.bindTexture(Shader.gl.TEXTURE_CUBE_MAP, this.texture);
        Shader.gl.activeTexture(Shader.gl.TEXTURE0);

        Shader.gl.bindVertexArray(this.vao);
        
        Shader.gl.drawArrays(Shader.gl.TRIANGLES,  0, this.vertices.length/3);
        Shader.gl.bindVertexArray(null);
    }
}

class CubeMap
{
    constructor(Shader, textures)
    {   
        Shader.gl.useProgram(Shader.program);
        var gl = Shader.gl;
        this.Texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.Texture);


        this.loadImages(textures).then((texs)=>{
            for(var i = 0;i < 6;i++)
            {
                console.log(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i);
                gl.texImage2D(
                    gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA,gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    texs[i],
                );        
            }
        });
     
         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
     gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }

    async loadImages(textures)
    {
        var tmp = [];
        for(var i = 0;i < 6;i++)
        {
            var img = await loadImageawait(textures[i]);
            
            tmp.push(img);
        }
     
        return tmp;
    }
}

class Skybox
{
    constructor(Shader, textures, SkyboxJSON)
    {
        this.Shader = Shader;
        this.cubemap = new CubeMap(Shader, textures);
        this.mesh = new SkyboxMesh(SkyboxJSON.meshes[0],Shader, this.cubemap.Texture);
        console.log(Shader);
    }

    render()
    {
        this.mesh.drawMesh(this.Shader, glMatrix.mat4.create());
    }
       
    
}