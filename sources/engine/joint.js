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

