class Shader {
    constructor(gl, program, uniforms)
    {
        this.gl = gl;    
        this.program = program;
        gl.useProgram(program);
        uniforms.forEach((uniform)=>{
            this[uniform] = gl.getUniformLocation(program, uniform);
            if(!this[uniform]){
                console.log(uniform);
                console.log("uniform error");
                return;
            }
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

