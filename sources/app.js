var ax = 10, ay = 20;
var kx = -60, ky = 2, kz = -300;//light position
var s = 1;
var isPlay = false;
var DeltaTime = 0;
var hud;
var canvashud;
var Init = async function() 
{
    var canvas = document.getElementById("mycanvas");
    var aspectratio = canvas.width/canvas.height;

    var vsText = await loadTextResourceWait("shaders/shader.vs.glsl");
    var fsText = await loadTextResourceWait("shaders/shader.fs.glsl");
  
    var gl = getWebGLContext(canvas);
    if(!gl)
    {
        console.log("Gl Error");
        return;
    }
    var prog = createProgram(gl, vsText, fsText);
    if(!prog)
    {
        console.log("Shader Error");
        return;
    }
    gl.enable(gl.DEPTH_TEST);
    
    var GeneralShader = new Shader(gl, prog, 
        ['u_HasSpecular', 'u_HasTex', 'u_ambient', 'u_diffuse','u_shiness', 'u_specular', 'u_HasBones','u_ModelMatrix', 
        'u_ViewMatrix', 'u_ProjectionMatrix', 'u_NormalMatrix', 'u_Bones', 'u_lightColor', 'u_lightPos', 'u_viewPos']);
   

    var vsText = await loadTextResourceWait("shaders/skybox.vs.glsl");
    var fsText = await loadTextResourceWait("shaders/skybox.fs.glsl");

    var prog = createProgram(gl, vsText, fsText);
    if(!prog)
    {
        console.log("Shader Error");
        return;
    }
   // gl2.enable(gl.DEPTH_TEST);
    var SkyboxShader = new Shader(gl, prog, 
        ['u_ProjectionMatrix', 'u_ViewMatrix',]);

    var buildingPaths = ["models/buildings/nationalBank.json","models/buildings/barn.json","models/buildings/church.json","models/buildings/blackSmith.json","models/buildings/hotelBlackSmith.json"];
    var enemiesPaths = ["models/characters/enemy1.json"];
    var terrainPath= ["models/terrain.json"];
    var playerPath = ["models/characters/cowboy.json", "models/characters/test.json"];
    var barrierPath = ["models/barriers/barrier1.json", "models/barriers/barrier2.json", "models/barriers/barrier3.json"];

    var buildingJSON = await getModels(buildingPaths);
    var enemiesJSONs = await getModels(enemiesPaths);
    var terrainJSON = await getModels(terrainPath);
    var playerJSON = await getModels(playerPath);
    var barrierJSONs = await getModels(barrierPath);

    console.log(playerJSON);

    var generalJSONs = {"terrain": terrainJSON[0]};

    Run(gl, buildingJSON, enemiesJSONs, playerJSON, generalJSONs, GeneralShader, SkyboxShader, aspectratio, barrierJSONs);
}

function Run(gl, buildingJSONs, enemiesJSONs,playerJSON, generalJSONs, GeneralShader, SkyboxShader, aspectratio, barrierJSONs){
    canvashud = document.getElementById("hud");
    hud = canvashud.getContext("2d");

  
    var buildingModels = [];
    buildingJSONs.forEach((model) => {
        buildingModels.push(new Model(model, GeneralShader));
    }); 

    var enemyModels = [];
    enemiesJSONs.forEach((model) => {
        enemyModels.push(new Model(model, GeneralShader));
    });
    console.log(enemyModels);
    console.log(buildingModels);
    var generalModels = new Object();
    for (var k in generalJSONs){
        generalModels[k] = new Model(generalJSONs[k], GeneralShader);
    }

    var playerModels = [];
    playerJSON.forEach((model) => {
        playerModels.push(new Model(model, GeneralShader));
    });

    var barrierModels = [];
    barrierJSONs.forEach(model => {
        barrierModels.push(new Model(model, GeneralShader));
    }); 
 
    var skyBox = new Skybox(SkyboxShader, ["textures/skybox/right.png" ,"textures/skybox/left.png",
        "textures/skybox/bottom.png" ,"textures/skybox/top.png" ,
        "textures/skybox/back.png" , "textures/skybox/front.png" ], 
    );
    
    var Lx=0,Ly=100,Lz=-200; //Camera position
    var before = Date.now(); var now = Date.now(); //for FPS calculation

    var RayMatrix = glMatrix.mat4.create();
    var RayStart_world = glMatrix.vec4.create();
    var RayEnd_world = glMatrix.vec4.create();
    var RayDir_world = glMatrix.vec3.create();
    var game = new Game(buildingModels, enemyModels, generalModels, playerModels, barrierModels);
    var VP = glMatrix.mat4.create();
    const loop = () => {
        hud.clearRect(0, 0, canvashud.width, canvashud.height);
        

        gl.useProgram(GeneralShader.program);
        gl.clearColor(0.4, 0.4, 0.4, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniform3fv(GeneralShader.u_lightPos, new Float32Array([kx, ky, kz]));
        gl.uniform3fv(GeneralShader.u_viewPos, new Float32Array([Lx, Ly, Lz]));

       
        var viewMatrix = glMatrix.mat4.clone(game.camera.getViewMatrix());
        gl.uniformMatrix4fv(GeneralShader.u_ViewMatrix, false, viewMatrix);
        
        var projectionMatrix = new Matrix4();
        projectionMatrix.setPerspective(30, aspectratio, 1, 10000);
        gl.uniformMatrix4fv(GeneralShader.u_ProjectionMatrix, false, projectionMatrix.elements);

        gl.useProgram(SkyboxShader.program);
 
        gl.uniformMatrix4fv(SkyboxShader.u_ViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(SkyboxShader.u_ProjectionMatrix, false, projectionMatrix.elements);
        
        if(clicked)
        {
            glMatrix.mat4.mul(RayMatrix, projectionMatrix.elements, viewMatrix);
            glMatrix.mat4.invert(RayMatrix, RayMatrix);
            glMatrix.vec4.transformMat4(RayStart_world, RayStart_NDC, RayMatrix);
            glMatrix.vec4.scale(RayStart_world, RayStart_world, 1/RayStart_world[3]);
            glMatrix.vec4.transformMat4(RayEnd_world, RayEnd_NDC, RayMatrix);
            glMatrix.vec4.scale(RayEnd_world, RayEnd_world, 1/RayEnd_world[3])
            
            glMatrix.vec3.sub(RayDir_world, RayEnd_world, RayStart_world);
         
            glMatrix.vec3.normalize(RayDir_world, RayDir_world);
            
            clicked = false;
            
            game.checkClicks(RayStart_world, RayDir_world)
        }

        if(forwardPressed)
        {
            game.player.goForward();
            forwardPressed = false;
        }
        else if(rightPressed)
        {
            game.player.goRight();
            rightPressed = false;
        }
        else if(leftPressed)
        {
            game.player.goLeft();
            leftPressed = false;
        }

        glMatrix.mat4.mul(VP, projectionMatrix.elements, viewMatrix);
        game.update(glMatrix.mat4.clone(VP));
        game.render();

        gl.depthFunc(gl.LEQUAL);
        skyBox.render();
        gl.depthFunc(gl.LESS);
        now = Date.now();
        DeltaTime = now - before;
        before = now;

       
        requestAnimationFrame(loop);
    }
    loop();






    document.onkeypress = (event) => {
        if(event.key == "A" || event.key == "a")
            leftPressed = true;
        else if(event.key == "D" || event.key == "d")
            rightPressed = true;
        else if(event.key == "W" || event.key == "w")
            forwardPressed = true;
    };

    document.onkeydown = (event) => {
        switch(event.key)
        {
            case "ArrowRight":
                ax++;
            break;
            case "ArrowLeft":
                ax--;
            break;
            case "ArrowUp":
                ay++;
            break;
            case "ArrowDown":
                ay--;
            break;
        }
    };
    
   
    var RayStart_NDC = glMatrix.vec4.create();
    var RayEnd_NDC = glMatrix.vec4.create();
    canvashud.onmousedown = (event) => {;
       var x =((event.layerX/canvashud.width-0.5)*2)
       var y = ((event.layerY/canvashud.height-0.5)*-2)
        
       glMatrix.vec4.set(RayStart_NDC, x, y, -1, 1);
       glMatrix.vec4.set(RayEnd_NDC, x, y, 0, 1);
     
       clicked = true;
    };
    canvashud.onmouseup = (event) => {
      
    };
    canvashud.onmousewheel = (event) => {
        rate  = Lx*Lx + Ly*Ly + Lz*Lz;
        rate = Math.sqrt(rate)*event.deltaY/-100;

        Lx -= Lx/rate;
        Ly -= Ly/rate;
        Lz -= Lz/rate;
    };
}
function drawHealthBar(health, point3D)
{
    var winX = Math.round((( point3D[0] + 1 ) / 2.0) *
    canvashud.width );
    var winY = Math.round((( 1 - point3D[1] ) / 2.0) *
    canvashud.height );
    

    far = (point3D[2] * 100) - parseInt(point3D[2] * 100)
    far *= 10;
    if(far < 1)
        far = 1;
    var wx = 100 / far;
    hud.fillStyle = "#FF0000";
    hud.fillRect(winX - wx/2, winY, wx ,20 / far);
    hud.fillStyle = "#00FF00";
    hud.fillRect(winX - wx/2, winY, health / far ,20 / far);
    
}
function TestRayOBBIntersection(ray_origin, ray_direction, aabb_min, aabb_max, ModelMatrix)
{
    var tMin = 0;
    var tMax = 100000;
    
    var OBBposition_worldspace = glMatrix.vec3.fromValues(ModelMatrix[12], ModelMatrix[13], ModelMatrix[14]);
    var delta = glMatrix.vec3.create();
    glMatrix.vec3.sub(delta, OBBposition_worldspace, ray_origin);

    
        var xaxis = glMatrix.vec3.fromValues(ModelMatrix[0],ModelMatrix[1],ModelMatrix[2]);
        var e = glMatrix.vec3.dot(xaxis, delta);
        var f = glMatrix.vec3.dot(ray_direction, xaxis);

        if(Math.abs(f) > 0.001)
        {
            var t1 = (e+aabb_min[0])/f;
            var t2 = (e+aabb_max[0])/f;

            if (t1 > t2)
            {
                var w = t1;
                t1=t2;
                t2=w;
            }

            if(t2 < tMax)
                tMax = t2;
            if(t1 > tMin)
                tMin = t1;
            
            if( tMax < tMin )
                return false;
            
        }
        else
        {
            
            if(-e+aabb_min[0] > 0  || -e+aabb_max[0] < 0)
                return false;
        }
    

    
        var yaxis = glMatrix.vec3.fromValues(ModelMatrix[4],ModelMatrix[5],ModelMatrix[6]);
        var e = glMatrix.vec3.dot(yaxis, delta);
        var f = glMatrix.vec3.dot(ray_direction, yaxis);
        
        if(Math.abs(f) > 0.001)
        {
            var t1 = (e+aabb_min[1])/f;
            var t2 = (e+aabb_max[1])/f;

            if (t1 > t2)
            {
                var w = t1;
                t1=t2;
                t2=w;
            }

            if(t2 < tMax)
                tMax = t2;
            if(t1 > tMin)
                tMin = t1;
            
            if( tMax < tMin )
                return false;
            
        }
        else
        {
            if(-e+aabb_min[1] > 0  || -e+aabb_max[1] < 0)
                return false;
        }
    

    
        var zaxis = glMatrix.vec3.fromValues(ModelMatrix[8],ModelMatrix[9],ModelMatrix[10]);
        var e = glMatrix.vec3.dot(zaxis, delta);
        var f = glMatrix.vec3.dot(ray_direction, zaxis);
        
        if(Math.abs(f) > 0.001)
        {
            var t1 = (e+aabb_min[2])/f;
            var t2 = (e+aabb_max[2])/f;

            if (t1 > t2)
            {
                var w = t1;
                t1=t2;
                t2=w;
            }

            if(t2 < tMax)
                tMax = t2;
            if(t1 > tMin)
                tMin = t1;
            
            if( tMax < tMin )
                return false;
            
        }
        else
        {
            if(-e+aabb_min[2] > 0  || -e+aabb_max[2] < 0)
                return false;
        }
    

    return true;

}


var clicked = false;
var rightPressed = false;
var leftPressed = false;
var forwardPressed = false;