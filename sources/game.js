class Game
{
    constructor(buildingModels, enemyModels, environmentModels, playerModel, barrierModels)
    {
        this.player = new Player(playerModel);

        this.camera = new Camera(glMatrix.vec3.fromValues(-120, 40 ,0), this.player.transformation);

        this.enemyModels = enemyModels;

        this.barrierModels = barrierModels;
        console.log(this.   barrierModels);
        this.barrierModels.forEach(m => {
            m.addBoundingBox("CollidingBoxVertex");
        });
   
        this.environmentModels = environmentModels;

        this.buildings = [];
        buildingModels.forEach(building => {
            this.buildings.push(new Building(building));
        });
      
        this.leftBuildings = [];
        this.rightBuildings = [];

        this.barrierLocs = [];

        this.leftcount = 0;
        this.rightcount = 0;

        this.initBuildings(this.buildings, this.enemies);
    }

    checkClicks(ray_origin, ray_direction)
    {
        if(this.player.alive == false)
            return;
        this.leftBuildings.forEach(left => {
            left.enemies.forEach(enemy => {
                var aabb_min = enemy.model.boundings[1];
                var aabb_max = enemy.model.boundings[0];
                var ma = glMatrix.mat4.clone(enemy.transformation);
                
        
                if (TestRayOBBIntersection(ray_origin, ray_direction, aabb_min, aabb_max, ma))
                    enemy.hit()
            });
        });
        this.rightBuildings.forEach(right => {
            right.enemies.forEach(enemy => {
                var aabb_min = enemy.model.boundings[1];
                var aabb_max = enemy.model.boundings[0];
                var ma = glMatrix.mat4.clone(enemy.transformation);

                if (TestRayOBBIntersection(ray_origin, ray_direction, aabb_min, aabb_max, ma))
                    enemy.hit()
            });
        });
    }

    initBuildings()
    {
        for(var i = 0; i < 10; i++)
        {
            this.rightBuildings.push(this.createNewBuilding(true));
            this.leftBuildings.push(this.createNewBuilding(false));
        }

        for(var i = 0; i < 10; i++)
        {
            var rnd = Math.floor(Math.random() * 100) % 3;
            var rnd2 = Math.floor(Math.random() * 100) % this.barrierModels.length; 
            if(rnd == 0)
                this.barrierLocs.push([0, 0, -20], rnd2);
            else if(rnd == 1)
                this.barrierLocs.push([0, 0, 20], rnd2);
            else
                this.barrierLocs.push([0, 0, 0], rnd2);
        }
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
        
        this.barrierLocs.shift();
        this.barrierLocs.shift();

        this.rightBuildings.push(this.createNewBuilding(true));
        this.leftBuildings.push(this.createNewBuilding(false));

        var rnd = Math.floor(Math.random() * 100) % 3;
        var rnd2 = Math.floor(Math.random() * 100) % this.barrierModels.length; 
        if(rnd == 0)
            this.barrierLocs.push([0, 0, -20], rnd2);
        else if(rnd == 1)
            this.barrierLocs.push([0, 0, 20], rnd2);
        else
            this.barrierLocs.push([0, 0, 0], rnd2);
    }

    render()
    {
        var counter = 0;
        this.rightBuildings.forEach((b) => {
            b.render();

            var tmp = glMatrix.vec3.create();
            var ma = glMatrix.mat4.create();
            glMatrix.mat4.getTranslation(tmp, b.transformation);
            glMatrix.mat4.fromTranslation(ma,[tmp[0] - 150, 0, 0]);

            this.environmentModels.terrain.drawModel(glMatrix.mat4.clone(ma));

            glMatrix.mat4.translate(ma, ma, this.barrierLocs[counter]);
            this.barrierModels[this.barrierLocs[counter + 1]].drawModel(ma);

            counter = counter + 2;
        });
        this.leftBuildings.forEach((b) => {
            b.render();
        });

        this.player.render();
    }

    update(VP)
    {
        var tmp = glMatrix.vec3.create();
        glMatrix.mat4.getTranslation(tmp, this.player.transformation);
        if((tmp[0] / 150) > ( this.leftcount - 9))
        {
            this.updateBuildings();

            var pos = glMatrix.vec3.create();
            glMatrix.mat4.getTranslation(pos, this.player.transformation);

            var v3 = glMatrix.vec3.clone(this.barrierModels[this.barrierLocs[1]].boundings[0]);
            var v4 = glMatrix.vec3.clone(this.barrierModels[this.barrierLocs[1]].boundings[1]);

            glMatrix.vec3.add(v3, v3, this.barrierLocs[0]);
            glMatrix.vec3.add(v4, v4, this.barrierLocs[0]);

            this.checkCollision(pos[2], v3[2], v4[2]);
        }

        this.leftBuildings.forEach(left => {
            left.update(VP);
        });
        this.rightBuildings.forEach(right => {
            right.update(VP);
        });

        
    }

    checkCollision(pos, min, max)
    {
        if(min < max)
        {
            if(pos > min - 2.5 && pos < max + 2.5)
                this.player.hit();

        }
        else
        {
            if(pos < min + 2.5 && pos > max - 2.5)
                this.player.hit();

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
        this.horseModel.animator.playAnimation(3);
        this.health = 100;
        this.alive = true;
    }

    render()
    {
        drawHealthBar(this.health, [0,-0.2,0.98]);
        this.ownModel.callAnimator();
        this.horseModel.callAnimator();
        this.ownModel.drawModel(glMatrix.mat4.clone(this.transformation));
        this.horseModel.drawModel(glMatrix.mat4.clone(this.transformation));
        if(this.alive)
            this.moveYourAss();
    }

    hit()
    {
        this.health -= 10;
        if(this.health < 0)
            this.health = 0;
        if(this.health <= 0 && this.alive==true)
        {
            this.horseModel.animator.playAnimation(2, false);
            this.ownModel.animator.playAnimation(2, false);
            this.alive = false;
      
        }
    }

    moveYourAss()
    {
        if(this.alive == false)
            return;

        glMatrix.mat4.translate(this.transformation, this.transformation, [0.1*DeltaTime,0,0]);

        var pos = glMatrix.vec3.create();
        glMatrix.mat4.getTranslation(pos, this.transformation);

        if(this.horseModel.animator.currentAnimation.name.includes("Right"))
            if(pos[2] < 20)
                glMatrix.mat4.translate(this.transformation, this.transformation, [0,0,0.025*DeltaTime]);
            else
                this.goForward();
        else if(this.horseModel.animator.currentAnimation.name.includes("Left"))
            if(pos[2] > -20)
                glMatrix.mat4.translate(this.transformation, this.transformation, [0,0,-0.025*DeltaTime]);
            else
                this.goForward();
    }

    goRight()
    {
        if(this.alive == false)
            return;

        var pos = glMatrix.vec3.create();
        glMatrix.mat4.getTranslation(pos, this.transformation);

        if(pos[2] < 20 && !this.horseModel.animator.currentAnimation.name.includes("Right"))
            this.horseModel.animator.playAnimation(1);
    }

    goLeft()
    {
        if(this.alive == false)
            return;

        var pos = glMatrix.vec3.create();
        glMatrix.mat4.getTranslation(pos, this.transformation);

        if(pos[2] > -20 && !this.horseModel.animator.currentAnimation.name.includes("Left"))
            this.horseModel.animator.playAnimation(0);
    }
    
    goForward()
    {
        if(this.alive == false)
            return;
            
        if(!this.horseModel.animator.currentAnimation.name.includes("Run"))
            this.horseModel.animator.playAnimation(3);
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
    update(VP)
    {
        this.enemies.forEach(enemy => {
            enemy.update(VP);
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
        this.alive = true
        this.model.addBoundingBox("EnemyBoundingBoxVertex");
        this.health = 100;
        this.model.animator.playAnimation(2, true);
        this.alive=true;
    }
    hit()
    {
        this.health -= 50;
        if(this.health < 0)
            this.health = 0;
        if(this.health <= 0 && this.alive==true)
        {
            this.model.animator.playAnimation(0, false);
            this.alive = false;
      
        }
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

    update(VP)
    {
        var ma = glMatrix.mat4.create();
        var v3 = glMatrix.vec4.create();
        glMatrix.mat4.getTranslation(v3, this.transformation);
        
        glMatrix.vec3.transformMat4(ma, v3, VP);
        glMatrix.mat4.getTranslation(v3, ma);
        
        drawHealthBar(this.health,[ma[0], ma[1], ma[2]]);
    }

    render()
    {   
        
        if(this.alive==true)
        {
            this.model.animator.addExtraRotation("Enemy1", [this.getAngleX(),this.getAngleY(),0]);
        }
  
        
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