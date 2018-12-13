class Game
{
    constructor(buildingModels, enemyModels, environmentModels)
    {
        this.player = new Player();

        this.enemyModels = enemyModels;
        this.environmentModels = environmentModels;

        this.buildings = [];
        buildingModels.forEach(building => {
            this.buildings.push(new Building(building));
          
        });
      
        this.leftBuildings = [];
        this.rightBuildings = [];

        this.initEnvironment();

        this.initBuildings(this.buildings, this.enemies);
    }

    initEnvironment()
    {
        
    }

    initBuildings()
    {
        for(var i = 0; i < 10; i++)
        {
            var newbuild = this.buildings[Math.floor(Math.random()*this.buildings.length)].copy();
            newbuild.initBuild(i*100,-100,this.enemyModels);
            newbuild.model.animator.playAnimation(4);

            this.leftBuildings.push(newbuild);
           newbuild = this.buildings[Math.floor(Math.random()*this.buildings.length)].copy();
            newbuild.initBuild(i*100,100,this.enemyModels);
            newbuild.model.animator.playAnimation(0);
            this.rightBuildings.push(newbuild);
        }

        this.leftBuildings.forEach((b) => {
            glMatrix.mat4.rotateY(b.transformation, b.transformation, glMatrix.glMatrix.toRadian(180));
        });
    }

    render()
    {
        this.environmentModels.terrain.drawModel(glMatrix.mat4.create());

        this.rightBuildings.forEach((b) => {
            b.render();
        });
        this.leftBuildings.forEach((b) => {
            b.render();
        });
    }
}

class Player
{
    constructor(model)
    {
        this.model = model;
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

    initBuild(x,y, EnemyModels)
    {
        this.transformation = glMatrix.mat4.create();
       
        glMatrix.mat4.translate(this.transformation, this.transformation, [x,0,y]);

        this.enemiesTransformations.forEach((trans)=>{
            var enemy = EnemyModels[(Math.floor(Math.random()*EnemyModels.length))].copy();
            this.enemies.push(new Enemy(enemy));
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
        console.log(this);
    }

    render()
    {
        this.enemies.forEach((enemy,id) => {
            var Trans = glMatrix.mat4.create();
            glMatrix.mat4.mul(Trans, this.transformation,this.enemiesTransformations[id]);
            glMatrix.mat4.scale(Trans, Trans, [0.01, 0.01, 0.01]);
            glMatrix.mat4.rotateX(Trans, Trans, glMatrix.glMatrix.toRadian(90));
            enemy.model.drawModel(Trans);

        });
        this.model.callAnimator();
        this.model.drawModel(glMatrix.mat4.clone(this.transformation));
    }
}

class Enemy
{
    constructor(model)
    {
        this.model = model;
    }
}

