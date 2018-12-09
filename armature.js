var VERTEX_SHADER = [
    '#define MaxBone 100',
    ' #ifdef GL_ES',
    'precision highp float;',

    '  #endif',
    'attribute vec3 a_Position;',
    'attribute vec3 a_Normal;',
    'attribute vec3 a_BoneIds;',
    'attribute vec3 a_Weights;',
    'attribute vec2 a_TexCoords;',

    'uniform bool u_HasBones;',
    'uniform mat4 u_ModelMatrix;',
    'uniform mat4 u_ViewMatrix;',
    'uniform mat4 u_ProjectionMatrix;',
    'uniform mat4 u_NormalMatrix;',
    'uniform mat4 u_Bones[MaxBone];',
    
    'varying vec3 v_Normal;',
    'varying vec3 v_FragPos;',
    'varying vec2 v_TexCoords;',
    
    'void main(){',
        'vec4 newVertex = vec4(a_Position, 1.0);',
        'vec3 tmp = a_Normal;',
        'if(u_HasBones){',
        'mat4 boneMatrix = u_Bones[int(a_BoneIds[0])] * a_Weights[0];',
        'boneMatrix += (u_Bones[int(a_BoneIds[1])]  * a_Weights[1]);',
        'boneMatrix += (u_Bones[int(a_BoneIds[2])]  * a_Weights[2]);',
        'newVertex = boneMatrix * newVertex;',
        'tmp = mat3(boneMatrix) * a_Normal;',
        '}',
        'gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * newVertex;',
        'v_FragPos = (u_ModelMatrix * newVertex).xyz;',
        'v_Normal =  mat3(u_NormalMatrix) * tmp;',
        'v_TexCoords = a_TexCoords;',
        'gl_PointSize = 10.0;',
    '}',
].join("\n");


var FRAGMENT_SHADER = [
    ' #ifdef GL_ES',
    'precision highp float;',
    '  #endif',
    
    'uniform sampler2D u_t_diffuse;',
    'uniform vec3 u_specular;',
    'uniform float u_shiness;',
    'uniform bool u_HasTex;',
    'uniform bool u_HasSpecular;',
    'uniform vec3 u_ambient;',
    'uniform vec3 u_diffuse;',

    
    'uniform vec3 u_lightColor;',
    'uniform vec3 u_lightPos;',
    'uniform vec3 u_viewPos;',
    'varying vec3 v_Normal;',
    'varying vec3 v_FragPos;',
    'varying vec2 v_TexCoords;',
    'void main(){',
        'vec3 norm = normalize(v_Normal);',
        //Ambient
        'float ambientStrenght = 0.9;',
        'vec3 ambient = vec3(1,1,1);',
        'vec3 diffuse = vec3(1,1,1);',
        //Diffuse
        'vec3 lightDirection = normalize(u_lightPos-v_FragPos);',
        'float diff = max(dot(lightDirection, norm), 0.0);',
        

        'if(!u_HasTex){',
            'ambient = ambientStrenght * u_lightColor * u_ambient;',
            'diffuse = u_lightColor * diff * u_diffuse;',
        '}else{',
            'diffuse = u_lightColor * diff * vec3(texture2D(u_t_diffuse, v_TexCoords));',
            'ambient = ambientStrenght * u_lightColor * vec3(texture2D(u_t_diffuse, v_TexCoords));',
        '}',
        //Specular
        'float specularStrength = 0.5;',
        'vec3 viewDir = normalize(u_viewPos - v_FragPos);',
        'vec3 reflectDir = reflect(-lightDirection, norm); ',
        'float spec = pow(max(dot(viewDir, reflectDir), 0.0), u_shiness);',
        'vec3 specular =  u_lightColor * (spec * u_specular); ',
        'if(!u_HasSpecular){',
            'specular = vec3(0,0,0);',
        '}',
        //Mix
        'gl_FragColor = vec4(diffuse + ambient + specular, 1);',
    '}',
].join("\n");


var ax = 10;
var ay = 20;

var kx=-6,ky=3,kz=-3;//light position



var Init = function() 
{
    	
			var modelTexts = [ "models/wolf.json"];

			var promises = [];
			modelTexts.forEach(function(element)
			{
				promises.push(loadJSONResource(element));
			});
			Promise.all(promises).then((res) => {
                modelObjects = res;
                console.log(res);
                Run(modelObjects);
			});
		
}

function Run(jsonmodels){
    var canvas = document.getElementById("mycanvas");
    var gl = getWebGLContext(canvas);
    var canvashud = document.getElementById("hud");
    var hud = canvashud.getContext("2d");
    if(!gl)
    {
        console.log("Gl Error");
        return;
    }

    if(!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER))
    {
        console.log("Shader Error");
        return;
    }
        gl.enable(gl.DEPTH_TEST);
        var shad = new Shader(gl, ['a_TexCoords', 'a_Normal','a_Position', 'a_BoneIds', 'a_Weights'], 
        ['u_HasSpecular', 'u_HasTex', 'u_ambient', 'u_diffuse','u_shiness', 'u_specular', 'u_HasBones','u_ModelMatrix', 
            'u_ViewMatrix', 'u_ProjectionMatrix', 'u_NormalMatrix', 'u_Bones', 'u_lightColor', 'u_lightPos', 'u_viewPos']);    
        
        var models = [];
        jsonmodels.forEach((model) => {
            models.push(new Model(model, shad));
           
        });
        models.forEach((model)=>{
            model.animator.playAnimation(9);
        });
        
        var Lx=0,Ly=0,Lz=-10; //Camera position
        var before = Date.now();
        var now = Date.now();
        
        const loop = () => {
            gl.clearColor(0.4, 0.4, 0.4, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            shad.gl.uniform3fv(shad.u_lightPos, new Float32Array([kx, ky, kz]));
            shad.gl.uniform3fv(shad.u_viewPos, new Float32Array([Lx, Ly, Lz]));

            var viewMatrix = new Matrix4();
            viewMatrix.setLookAt(Lx, Ly, Lz, 0, 0, 0, 0, 1, 0);
            gl.uniformMatrix4fv(shad.u_ViewMatrix, false, viewMatrix.elements);
            
            var projectionMatrix = new Matrix4();
            projectionMatrix.setPerspective(30, canvas.width/canvas.height, 1, 10000);
            gl.uniformMatrix4fv(shad.u_ProjectionMatrix, false, projectionMatrix.elements);
            
            //
            models.forEach((model)=>{
                
            model.callAnimator();
                var modelMatrix = new Matrix4();
                modelMatrix.setIdentity();
                //modelMatrix.scale(0.1,0.1,0.1);
                model.drawModel(model.root, shad, modelMatrix);
            });
           
            //var joint = model.getJointByName(model.root, "SolKol");
           // var joint2 = model.getJointByName(model.root, "Cone_002");
          //  joint.rotateJoint(270, 1, 0, 1);
            //joint2.rotateJoint(60, 1, 0, 0);
          
            //draw light
       /*     modelMatrix.setIdentity();
            gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
            initArrayBuffer(new Float32Array([kx, ky, kz]), 'a_Position', 3, 0, 0);
            gl.drawArrays(gl.POINTS,0 ,1);
*/
            now = Date.now();
            var DeltaTime = now-before;
            before = now;
            var fps = parseInt(1000/DeltaTime);
            hud.clearRect(0,0,400,400);
            hud.font = "30px Arial";
            hud.fillText(fps, 50 ,30);
        
            requestAnimationFrame(loop);
        }  
    loop();


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
            console.log(rate);
            //Lz += event.deltaY/100*-1;
        };
}

function is(){
	kx--;
}

function iss(){
	kx++;
}
function ia(){
	ky--;
}
function iy(){
	ky++;
}
function ig(){
	kz--;
}
function ii(){
	kz++;
}