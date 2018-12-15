class StaticMesh {
    constructor(MeshFromJson, material, Shader, parentmesh)
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
        this.initData(gl, program, 'a_Normal', this.normals, 3);
        
        if(this.texcoords)
            this.initData(gl, program, 'a_TexCoords', this.texcoords, 2);
        
        if(this.parent.bones.getLength() > 0)
        {
            
            this.initData(gl, program, 'a_BoneIds', this.BoneIds, 3);
            this.initData(gl, program, 'a_Weights', this.Weights, 3);
                 
        }


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
        
        
        console.log(this.parent.name);
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
