class Game
{
    constructor(buildingModels, enemyModels)
    {
        this.player = new Player();

        this.enemyModels = enemyModels;
    
        console.log(enemyModels);
        this.buildings = [];
        buildingModels.forEach(building => {
            this.buildings.push(new Building(building));
          
        });

        //console.log(this.buildings);
        
        this.leftBuildings = [];
        this.rightBuildings = [];

        this.initBuildings(this.buildings, this.enemies);
    }

    initBuildings()
    {
        for(var i = 0; i < 3; i++)
        {
            var newbuild = this.buildings[Math.floor(Math.random()*this.buildings.length)].copy();
            newbuild.initBuild(i*100,-100,this.enemyModels);
            this.leftBuildings.push(newbuild);
           newbuild = this.buildings[Math.floor(Math.random()*this.buildings.length)].copy();
            newbuild.initBuild(i*100,100,this.enemyModels);
            this.rightBuildings.push(newbuild);
        }

        this.leftBuildings.forEach((b) => {
            glMatrix.mat4.rotateY(b.transformation, b.transformation, glMatrix.glMatrix.toRadian(180));
        });
    }

    render()
    {
     this.rightBuildings.forEach((b) => {
            b.render();
        });
        this.leftBuildings.forEach((b) => {
            //console.log(b);
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
        this.enemies;
        this.model = model;
        this.enemiesTransformations = [];
        this.transformation;
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
        //glMatrix.mat4.scale(this.transformation, this.transformation);
        console.log(glMatrix.mat4.clone(this.transformation));
        this.enemiesTransformations.forEach((trans)=>{
            var enemy = EnemyModels[(Math.floor(Math.random()*EnemyModels.length))].copy();
            this.enemies.push(new Enemy(enemy));
        });

    }

    findEnemiesTransformations(root, parent)
    {
        
        glMatrix.mat4.mul(parent,root.transformation, parent);
        
        if(root.name.startsWith("EnemyPosition"))
        {
            var trans = glMatrix.mat4.clone(parent);
             glMatrix.mat4.transpose(trans, parent);
        
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
          //  glMatrix.mat4.mul(Trans, this.transformation,);
            glMatrix.mat4.mul(Trans, this.transformation,this.enemiesTransformations[id]);
      glMatrix.mat4.scale(Trans, Trans, [0.001,0.001,0.001]);
            enemy.model.drawModel(Trans);
        });
       
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

