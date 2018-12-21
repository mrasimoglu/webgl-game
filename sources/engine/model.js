class Model {
    constructor(ModelFromJson, Shader) {
        this.meshes = [];
        this.Shader = Shader;
        this.materials = [];
        ModelFromJson.materials.forEach((mat) => {
            this.materials.push(new Material(mat, Shader));
        });

        ModelFromJson.meshes.forEach((mesh) => {
            this.meshes.push(new Mesh(mesh, this.materials[mesh.materialindex], Shader));
        });

        this.m_GlobalInverseTransform = glMatrix.mat4.fromValues(...ModelFromJson.rootnode.transformation);
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
        
        this.callAnimator();
    }

    copy()
    {
        var newone = Object.create(Model.prototype);
        newone.Shader = this.Shader;
        newone.materials = this.materials;
        newone.animations = this.animations;
        newone.root = this.root;
        newone.m_GlobalInverseTransform = this.m_GlobalInverseTransform;
        newone.animator = new Animator(this.animations, newone);
        newone.meshes = [];
        this.meshes.forEach(mesh => {
            newone.meshes.push(mesh.copy());
        });

        if(this.boundings != undefined)
            newone.boundings = this.boundings;

        return newone;

    }


    addBoundingBox(target)
    {
        this.boundings = [];
        this.loopForBoundingBox(this.root, target, glMatrix.mat4.create());
    }

    loopForBoundingBox(root, target, parent)
    {
      
        glMatrix.mat4.mul(parent, root.transformation, parent);
        if(root.name.startsWith(target))
        {
            var tmp = glMatrix.vec3.create();
            glMatrix.mat4.getTranslation(tmp, parent);
            this.boundings.push(tmp);
        }
        root.childs.forEach((child) => {
            this.loopForBoundingBox(child, target, glMatrix.mat4.clone(parent));
        });  
        
    }

    loopinside(root, globaltranformation)
    {
        
        glMatrix.mat4.mul(globaltranformation,  root.transformation,globaltranformation);
        if (root.meshes == undefined)
            var tmp = new Joint(root.name, root.transformation);
        else
        {
            var tmp = new Joint(root.name, root.transformation, root.meshes);
            root.meshes.forEach((mesh) =>{
                var ma = glMatrix.mat4.clone(globaltranformation);
            
                this.meshes[mesh].transformation.push(glMatrix.mat4.clone(ma));

            });

            var bones= this.getBoneByName(root.name);
    
            bones.forEach((bone)=>{
                bone.calcFinaltransformation(this.m_GlobalInverseTransform, glMatrix.mat4.clone(globaltranformation));
            });
        }

        if(root.children != undefined)
        {
            root.children.forEach((child) => {
                tmp.addChild(this.loopinside(child, glMatrix.mat4.clone(globaltranformation)));
            });  
        }

        return tmp;
    }

    drawModel(ModelMatrix)
    {
         glMatrix.mat4.transpose(ModelMatrix, ModelMatrix);
       // this.drawModell(this.root, glMatrix.mat4.clone(ModelMatrix));
        // console.log("--");
        this.meshes.forEach((mesh)=>{
           mesh.transformation.forEach((trans) => {
            var ma = glMatrix.mat4.create();

           // glMatrix.mat4.mul(ma, ma, trans);
            if(mesh.bones.getLength() <= 0)
            {
                glMatrix.mat4.mul(ma, trans, ModelMatrix);
                
            }
            else
            {
            
                glMatrix.mat4.mul(ma, ma, ModelMatrix);
            }
           
            glMatrix.mat4.transpose(ma, ma);
        
            mesh.drawMesh(this.Shader, glMatrix.mat4.clone(ma));
           });
           
        });
    }

    drawModell(root,parenttrans)
    {
        var ma2 = glMatrix.mat4.create();
   //    glMatrix.mat4.transpose(ma2, root.transformation);

   glMatrix.mat4.mul(parenttrans,root.transformation,parenttrans);
      
       
        root.mesh.forEach((mesh)=>{
            var ma = glMatrix.mat4.clone(parenttrans);
          //  glMatrix.mat4.invert(ma, parenttrans);
            glMatrix.mat4.transpose(ma, parenttrans);
            this.meshes[mesh].drawMesh(this.Shader, glMatrix.mat4.clone(ma));
        });


        root.childs.forEach((child)=>{
            this.drawModell(child, glMatrix.mat4.clone(parenttrans));
        });
    }

    addChild(ajoint)
    {
        this.childs.push(ajoint);
    }

    callAnimator()
    {
        if(this.animator.animations.length > 0 && this.animator.currentAnimation != -1)
        {
            this.meshes.forEach(m => {
                m.transformation = [];
            });
            this.animator.loopinside(this.root,  glMatrix.mat4.create(),this.m_GlobalInverseTransform, this.animator.getAnimationTime());
        }
           
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

    getBoneByName(name)
    {
        var bones = [];
        
        this.meshes.forEach((mesh) => {
           
            if(mesh.bones != undefined)
            {
                var tmp = mesh.bones.getBoneByName(name);
                
                if(tmp != undefined)
                {
                    bones.push(tmp);
                }
            }
      
        });
        return bones;
    }
}





