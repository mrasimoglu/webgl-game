class Mesh {
    constructor(MeshFromJson) {
        this.vertices = Float32Array.from(MeshFromJson.vertices);
        this.indices = Uint16Array.from([].concat.apply([], MeshFromJson.faces));
        this.normals = Float32Array.from(MeshFromJson.normals);
        this.bones = [];
        this.WeightInfo = [];
        if (MeshFromJson.bones != undefined)
        {
            
            
    
            for(var i = 0; i<this.vertices.length / 3; i++)
            {
                this.WeightInfo.push([]);   
            }

            MeshFromJson.bones.forEach((bone, boneid) => {
                var tm4 = new Matrix4();
                tm4.setFromArray(bone.offsetmatrix);
                this.bones.push(tm4);
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
    }


    //
    drawMesh(Shader, ModelMatrix)
    {   
        
        Shader.gl.uniformMatrix4fv(Shader.u_ModelMatrix, false, ModelMatrix.elements);

        
        Shader.initArrayBuffer(this.vertices, 'a_Position', 3, 0, 0);
        Shader.initArrayBuffer(this.normals, 'a_Normal', 3, 0, 0);

        ModelMatrix.invert();
        ModelMatrix.transpose();
        Shader.gl.uniformMatrix4fv(Shader.u_NormalMatrix, false, ModelMatrix.elements);
        //ÜÇGENLERİN BAĞLANTILARINI AKTARIYORUZ.

        Shader.gl.bindBuffer(Shader.gl.ELEMENT_ARRAY_BUFFER, Shader.IndicesBuffer);
        Shader.gl.bufferData(Shader.gl.ELEMENT_ARRAY_BUFFER, this.indices, Shader.gl.STATIC_DRAW);
        //ÜÇGENLERİN BAĞLANTILARINI AKTARIYORUZ.
        Shader.gl.drawElements(Shader.gl.TRIANGLES, this.indices.length, Shader.gl.UNSIGNED_SHORT, 0);
    }
}


class Joint {
    constructor(name, transformation, mesh=-1) {
        this.childs = [];
        this.name = name;
        this.transformation = new Matrix4();
        this.transformation.setFromArray(transformation);
        this.mesh = mesh;

    }

    addChild(ajoint)
    {
        this.childs.push(ajoint);
    }
}

class Model {
    constructor(ModelFromJson) {
        this.meshes = [];
        ModelFromJson.meshes.forEach((mesh) => {
            this.meshes.push(new Mesh(mesh));
        });
        this.root = this.loopinside(ModelFromJson.rootnode);

        console.log(this);
    }

    loopinside(root)
    {
        if (root.meshes == undefined)
            var tmp = new Joint(root.name, root.transformation);
        else
            var tmp = new Joint(root.name, root.transformation,root.meshes[0]);
        if(root.children != undefined)
        {
            root.children.forEach((child) => {
                tmp.addChild(this.loopinside(child));
            });  
        }

        return tmp;
    }

    addChild(ajoint)
    {
        this.childs.push(ajoint);
    }

   


    drawModel(root, Shader, ModelMatrix)
    {
      
        ModelMatrix.translate(0.5,0,0);
        console.log(ModelMatrix);
        console.log(root);
        if(root.mesh != -1)
        {
            this.meshes[root.mesh].drawMesh(Shader, ModelMatrix);
        }
       
        root.childs.forEach((child)=> { 
            pushMatrix(ModelMatrix);    
           this.drawModel(child, Shader, ModelMatrix);
           ModelMatrix = popMatrix();    
        });
    }
}

class Shader {
    constructor(gl)
    {
        this.gl = gl;
        
    
        this.IndicesBuffer = gl.createBuffer();
  
        this.u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
        this.u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
        this.u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
        this.u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

        
        this.u_objectColor = gl.getUniformLocation(gl.program, 'u_objectColor');
        this.u_lightColor = gl.getUniformLocation(gl.program, 'u_lightColor');
        this.u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
        this.u_viewPos = gl.getUniformLocation(gl.program, 'u_viewPos');

        this.gl.uniform3fv(this.u_objectColor, new Float32Array([0, 1, 1]));
        this.gl.uniform3fv(this.u_lightColor, new Float32Array([1, 1, 1]));
        if ( !this.u_ModelMatrix || !this.u_NormalMatrix || !this.u_ViewMatrix || !this.u_ProjectionMatrix || !this.u_objectColor || !this.u_lightColor )
        {
            console.log("Buffer error");
            return;
        }
    }
    initArrayBuffer(Data, AttribLoc, Size, Stribe, Offset)
    {
        var buf = this.gl.createBuffer();
        if ( !buf )
        {
            console.log("Buffer error");
            return;
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, Data, this.gl.STATIC_DRAW);
        var atrib = this.gl.getAttribLocation(this.gl.program, AttribLoc);
        if(atrib < 0 )
        {
            console.log("get attrib error");
            return;
        }
        this.gl.vertexAttribPointer(atrib, Size, this.gl.FLOAT, this.gl.FALSE, Stribe, Offset);
        this.gl.enableVertexAttribArray(atrib);
    }
}


var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}