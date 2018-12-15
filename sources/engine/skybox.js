class CubeMap
{
    constructor(Shader, textures)
    {   
        Shader.gl.useProgram(Shader.program);
        var gl = Shader.gl;
        this.Texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.Texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        for(var i = 0;i < 6;i++)
        {
            loadImage(textures[i]).then((img) => {
                gl.texImage2D(
                    gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    img
                );
            });
            
        }
      
    }
}

class SkyBox
{
    constructor(Shader, textures, SkyboxJSON)
    {
        this.cubemap = new CubeMap(Shader, textures);
        console.log(SkyboxJSON);
    }
}