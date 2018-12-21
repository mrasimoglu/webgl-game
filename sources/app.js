var ax = 10, ay = 20;
var kx = -60, ky = 2, kz = -300;//light position
var s = 1;
var isPlay = false;
var DeltaTime = 0;
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
    var playerPath = ["models/characters/cowboy.json", "models/characters/horse.json"];
   


    var buildingJSON = await getModels(buildingPaths);
    var enemiesJSONs = await getModels(enemiesPaths);
    var terrainJSON = await getModels(terrainPath);
    var playerJSON = await getModels(playerPath);

    var generalJSONs = {"terrain": terrainJSON[0]};

    Run(gl, buildingJSON, enemiesJSONs, playerJSON, generalJSONs, GeneralShader, SkyboxShader, aspectratio);


    
}

function Run(gl, buildingJSONs, enemiesJSONs,playerJSON, generalJSONs, GeneralShader, SkyboxShader, aspectratio){
    var canvashud = document.getElementById("hud");

  
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

 
    var skyBox = new Skybox(SkyboxShader, ["textures/skybox/right.png" ,"textures/skybox/left.png",
        "textures/skybox/bottom.png" ,"textures/skybox/top.png" ,
        "textures/skybox/back.png" , "textures/skybox/front.png" ], 
    );
    
    var Lx=0,Ly=100,Lz=-200; //Camera position
    var before = Date.now(); var now = Date.now(); //for FPS calculation

   var game = new Game(buildingModels, enemyModels, generalModels, playerModels);
  
    const loop = () => {
        gl.useProgram(GeneralShader.program);
        gl.clearColor(0.4, 0.4, 0.4, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniform3fv(GeneralShader.u_lightPos, new Float32Array([kx, ky, kz]));
        gl.uniform3fv(GeneralShader.u_viewPos, new Float32Array([Lx, Ly, Lz]));

        var t = glMatrix.mat4.create();
        glMatrix.mat4.lookAt(t, [1350,30,0], [1350,0,-150], [0,1,0]);
        var viewMatrix = glMatrix.mat4.clone(t);
        gl.uniformMatrix4fv(GeneralShader.u_ViewMatrix, false, viewMatrix);
        
        var projectionMatrix = new Matrix4();
        projectionMatrix.setPerspective(30, aspectratio, 1, 10000);
        gl.uniformMatrix4fv(GeneralShader.u_ProjectionMatrix, false, projectionMatrix.elements);

        gl.useProgram(SkyboxShader.program);
 
        gl.uniformMatrix4fv(SkyboxShader.u_ViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(SkyboxShader.u_ProjectionMatrix, false, projectionMatrix.elements);
    
        game.update();
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
        if(event.key == "+")
            s += 0.1;
        else if(event.key == "-")
            s-= 0.1;
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
    canvashud.onmousedown = (event) => {;
        var x = event.clientX, y = event.clientY;
        var difx = 0;
        var dify = 0;
        
        canvashud.onmousemove = (event2) => {
            difx = event2.clientX - x;
            dify = event2.clientY - y;
            var rMatrix =  new Matrix4();
            rMatrix.setRotate(dify, -1, 0 ,0);
            rMatrix.rotate(difx, 0, -1 ,0);
            var pp = new Vector4([Lx, Ly, Lz, 1]);
            var np = rMatrix.multiplyVector4(pp);
            Lx = np.elements[0]; Ly = np.elements[1]; Lz = np.elements[2];

            x = event2.clientX;
            y = event2.clientY;
        };
    };
    canvashud.onmouseup = (event) => {
        canvashud.onmousemove = null;
    };
    canvashud.onmousewheel = (event) => {
        rate  = Lx*Lx + Ly*Ly + Lz*Lz;
        rate = Math.sqrt(rate)*event.deltaY/-100;

        Lx -= Lx/rate;
        Ly -= Ly/rate;
        Lz -= Lz/rate;
    };
}