class Game
{
    constructor(buildingModels, enemyModels, environmentModels, playerModel)
    {
        this.player = new Player(playerModel);

        this.camera = new Camera(glMatrix.vec3.fromValues(-120, 40 ,0), this.player.transformation);

        this.enemyModels = enemyModels;
   
        this.environmentModels = environmentModels;

        this.buildings = [];
        buildingModels.forEach(building => {
            this.buildings.push(new Building(building));
        });
      
        this.leftBuildings = [];
        this.rightBuildings = [];

        this.leftcount = 0;
        this.rightcount = 0;

        console.log(this);

        this.initBuildings(this.buildings, this.enemies);
    }

    checkClicks(ray_origin, ray_direction)
    {
        
        this.leftBuildings.forEach(left => {
            left.enemies.forEach(enemy => {
                var aabb_min = enemy.model.boundings[1];
                var aabb_max = enemy.model.boundings[0];
                var ma = glMatrix.mat4.clone(enemy.transformation);
                //glMatrix.mat4.transpose(ma, ma);
        
           
                console.log(TestRayOBBIntersection(ray_origin, ray_direction, aabb_min, aabb_max, ma));
            });
        });
    }

    initBuildings()
    {
        for(var i = 0; i < 1; i++)
        {
            this.rightBuildings.push(this.createNewBuilding(true));
            
        
        }

        this.leftBuildings.forEach((b) => {
        });
    }

    createNewBuilding(lr)
    {
        var newbuild = this.buildings[Math.floor(Math.random()*this.buildings.length)].copy();
        if(lr ==true)
        {
            this.rightcount++;
            newbuild.initBuild(this.rightcount * 150,100);
        }
        else
        {
            this.leftcount++;
            newbuild.initBuild(this.leftcount * 150,-100);
            glMatrix.mat4.rotateY(newbuild.transformation, newbuild.transformation, glMatrix.glMatrix.toRadian(180));
        }
           
        newbuild.initEnemies(this.enemyModels, this.player.transformation);

        return newbuild;
    }

    updateBuildings()
    {
        this.rightBuildings.shift();
        this.leftBuildings.shift();

        this.rightBuildings.push(this.createNewBuilding(true));
        this.leftBuildings.push(this.createNewBuilding(false));
    }

    render()
    {

        this.rightBuildings.forEach((b) => {
            b.render();
            var tmp = glMatrix.vec3.create();
            glMatrix.mat4.getTranslation(tmp, b.transformation);
            var ma = glMatrix.mat4.create();
            glMatrix.mat4.fromTranslation(ma,[tmp[0] - 150, 0, 0]);
            this.environmentModels.terrain.drawModel(ma);
            
        });
        this.leftBuildings.forEach((b) => {
            b.render();
        });

        this.player.render();
    }

    update()
    {
        var tmp = glMatrix.vec3.create();
        glMatrix.mat4.getTranslation(tmp, this.player.transformation);
        if((tmp[0] / 150) > ( this.leftcount - 9))
        {
            this.updateBuildings();
        }
    }
}

class Player
{
    constructor(model)
    {
        this.transformation = glMatrix.mat4.create();;

        this.ownModel = model[0];
        this.horseModel = model[1];

        this.ownModel.animator.playAnimation(0);
        this.horseModel.animator.playAnimation(0);
    }

    render()
    {
        this.ownModel.callAnimator();
        this.horseModel.callAnimator();
        this.ownModel.drawModel(glMatrix.mat4.clone(this.transformation));
        this.horseModel.drawModel(glMatrix.mat4.clone(this.transformation));
      //  this.moveYourAss();
    }

    moveYourAss()
    {
        glMatrix.mat4.translate(this.transformation, this.transformation, [0.1*DeltaTime,0,0]);
    }
}

class Building
{
    constructor(model)
    {
        this.model = model;
        this.transformation;
        this.enemies;
        this.enemiesTransformations = [];
        this.findEnemiesTransformations(this.model.root, glMatrix.mat4.create());
    }

    copy()
    {
        var newone = Object.create(Building.prototype);
        newone.model = this.model.copy();
        newone.enemiesTransformations = this.enemiesTransformations;
        newone.transformation = null;
        newone.enemies = [];
        return newone;
    }

    initBuild(x,y, )
    {
        
        this.transformation = glMatrix.mat4.create();
       
        glMatrix.mat4.translate(this.transformation, this.transformation, [x,0,y]);

    }

    initEnemies(EnemyModels, targetransformation)
    {

        this.enemiesTransformations.forEach((trans)=>{
        if(Math.random() > 0.3) // zorluk seviyesi
        {
            var enemy = EnemyModels[(Math.floor(Math.random() * EnemyModels.length))].copy();
            var Trans = glMatrix.mat4.create();
    
            glMatrix.mat4.mul(Trans, this.transformation,trans);
            glMatrix.mat4.scale(Trans, Trans, [0.01, 0.01, 0.01]);
            glMatrix.mat4.rotateX(Trans, Trans, glMatrix.glMatrix.toRadian(90));
            this.enemies.push(new Enemy(enemy, glMatrix.mat4.clone(Trans), targetransformation));
        }
                
        });

    }

    findEnemiesTransformations(root, parent)
    {
       glMatrix.mat4.mul(parent,root.transformation,parent);
        if(root.name.startsWith("EnemyPosition"))
        {
            var trans = glMatrix.mat4.clone(parent);
           
            glMatrix.mat4.transpose(trans, trans);
            this.enemiesTransformations.push(trans);
        }

        root.childs.forEach((child) => {
            this.findEnemiesTransformations(child, glMatrix.mat4.clone(parent));
        });
     
    }

    render()
    {
        this.enemies.forEach((enemy,id) => {


            enemy.render();

        });
        this.model.drawModel(glMatrix.mat4.clone(this.transformation));
    }
}

class Enemy
{
    constructor(model, trans, target)
    {
        
        this.model = model;
        this.transformation = trans;
        this.targetransformation = target;
        this.v3tranlate = glMatrix.vec3.create();
        glMatrix.mat4.getTranslation(this.v3tranlate, trans);

        this.model.addBoundingBox("EnemyBoundingBoxVertex");
        
      


    }

    getAngleY()
    {
        var v31 = glMatrix.vec2.fromValues(this.v3tranlate[0], this.v3tranlate[2]);
        var v32 = glMatrix.vec3.create();
        glMatrix.mat4.getTranslation(v32, this.targetransformation);
        var v30 = glMatrix.vec2.fromValues(v32[0], v32[2]);
        glMatrix.vec2.sub(v31, v31,v30);
        return Math.atan(v31[0]/v31[1]);
    }
    getAngleX()
    {
        var v31 = glMatrix.vec2.fromValues(this.v3tranlate[1], this.v3tranlate[2]);
        var v32 = glMatrix.vec3.create();
        glMatrix.mat4.getTranslation(v32, this.targetransformation);
        var v30 = glMatrix.vec2.fromValues(v32[1], v32[2]);
        glMatrix.vec2.sub(v31, v31,v30);
        if(v31[1]< 0)
            return -Math.atan(v31[0]/v31[1]);
        else
            return Math.atan(v31[0]/v31[1]);

    }

    render()
    {   

        this.model.animator.addExtraRotation("Enemy1", [this.getAngleX(),this.getAngleY(),0]);
        this.model.callAnimator();
        this.model.drawModel(glMatrix.mat4.clone(this.transformation));
    }
}

class Camera
{
    constructor(offset, target)
    {
        this.direction = glMatrix.vec3.fromValues(0,1,0);
        this.offset = offset;
        this.target = target;
    }

    getViewMatrix()
    {   
        var a = glMatrix.vec3.create();
        var b = glMatrix.vec3.create();
        glMatrix.mat4.getTranslation(b, this.target);
        glMatrix.vec3.add(a,this.offset,b);
      
        var tmp = glMatrix.mat4.create();
        glMatrix.vec3.add(b,b,[0,30,0]);
 
        glMatrix.mat4.lookAt(tmp,a,b,this.direction);
        
        return tmp;
    }
}