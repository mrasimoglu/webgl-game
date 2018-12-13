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

