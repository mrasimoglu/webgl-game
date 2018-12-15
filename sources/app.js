var ax = 10, ay = 20;
var kx = -60, ky = 2, kz = -300;//light position
var s = 1;
var isPlay = false;

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
        ['u_ProjectionMatrix', 'u_ViewMatrix']);

    var buildingPaths = ["models/buildings/nationalBank.json"];
    var enemiesPaths = ["models/characters/enemy1.json"];
    var terrainPath= ["models/terrain.json"];
    var skyBoxPath = ["models/skybox.json"];
   


    var buildingJSON = await getModels(buildingPaths);
    var enemiesJSONs = await getModels(enemiesPaths);
    var terrainJSON = await getModels(terrainPath);
    var skyBoxJSON = await getModels(skyBoxPath);
    skyBoxJSON = skyBoxJSON[0];

    var generalJSONs = {"terrain": terrainJSON[0]};

    Run(gl, buildingJSON, enemiesJSONs, generalJSONs, skyBoxJSON, GeneralShader, SkyboxShader, aspectratio);


    
}

function Run(gl, buildingJSONs, enemiesJSONs, generalJSONs, skyBoxJSON, GeneralShader, SkyboxShader, aspectratio){
    var canvashud = document.getElementById("hud");
  
    var buildingModels = [];
    buildingJSONs.forEach((model) => {
        buildingModels.push(new Model(model, GeneralShader));
    }); 
    console.log(GeneralShader);
    var enemyModels = [];
    enemiesJSONs.forEach((model) => {
        enemyModels.push(new Model(model, GeneralShader));
    });

    var generalModels = new Object();
    for (var k in generalJSONs){
        generalModels[k] = new Model(generalJSONs[k], GeneralShader);
    }

    var skyBox = new Skybox(SkyboxShader, ["textures/skybox/right.png", "textures/skybox/left.png" ,
        "textures/skybox/top.png" ,"textures/skybox/bottom.png" ,
        "textures/skybox/front.png" ,"textures/skybox/back.png"], 
        skyBoxJSON);
    console.log();
    
    var Lx=0,Ly=1000,Lz=-1000
; //Camera position
    var before = Date.now(); var now = Date.now(); //for FPS calculation

   var game = new Game(buildingModels, enemyModels, generalModels);
  
    const loop = () => {
        gl.useProgram(GeneralShader.program);
        gl.clearColor(0.4, 0.4, 0.4, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniform3fv(GeneralShader.u_lightPos, new Float32Array([kx, ky, kz]));
        gl.uniform3fv(GeneralShader.u_viewPos, new Float32Array([Lx, Ly, Lz]));

        var viewMatrix = new Matrix4();
        viewMatrix.setLookAt(Lx, Ly, Lz, 0, 0, 0, 0, 1, 0);
        gl.uniformMatrix4fv(GeneralShader.u_ViewMatrix, false, viewMatrix.elements);
        
        var projectionMatrix = new Matrix4();
        projectionMatrix.setPerspective(30, aspectratio, 1, 10000);
        gl.uniformMatrix4fv(GeneralShader.u_ProjectionMatrix, false, projectionMatrix.elements);

        gl.useProgram(SkyboxShader.program);
  
        var tv3 = glMatrix.vec3.create();
        var sv3 = glMatrix.vec3.create();
        var ma = glMatrix.mat4.clone(viewMatrix.elements);
        //glMatrix.mat4.transpose(ma, viewMatrix.elements);
      //  glMatrix.mat4.getTranslation(tv3, viewMatrix.elements);
       // console.log([-tv3[0], -tv3[1] ,-tv3[2]]);
        //console.log(viewMatrix.elements);
        
      //  glMatrix.mat4.translate(ma, viewMatrix.elements, [-tv3[0], -tv3[1] ,-tv3[2]]);
        ma[12] = 0;
        ma[13] = 0;
        ma[14] = 0;
       
   

        
        gl.uniformMatrix4fv(SkyboxShader.u_ViewMatrix, false, ma);
        gl.uniformMatrix4fv(SkyboxShader.u_ProjectionMatrix, false, projectionMatrix.elements);
    
        game.render();
        gl.depthFunc(gl.LEQUAL);
        skyBox.render();
        gl.depthFunc(gl.LESS);
     
        /*buildingModels.forEach((model)=>{

            
            
            model.drawModel(shad, modelMatrix);
        });
        
        /*modelMatrix.setIdentity(); //Draw Light
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        initArrayBuffer(new Float32Array([kx, ky, kz]), 'a_Position', 3, 0, 0);
        gl.drawArrays(gl.POINTS,0 ,1);*/

        /*now = Date.now();
        var DeltaTime = now - before;
        before = now;
        var fps = parseInt(1000/DeltaTime);
        hud.clearRect(0,0,400,400);
        hud.font = "30px Arial";
        hud.fillText(fps, 50 ,30);*/
    
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