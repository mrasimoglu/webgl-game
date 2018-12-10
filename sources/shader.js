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

    disableVertexAttribArray(AttribLoc)
    {
        this.gl.disableVertexAttribArray(this.attriblocations[AttribLoc]);
    }
}

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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
            gl.UNSIGNED_BYTE,
            img
        );
        
        return Texture;
    }   
}