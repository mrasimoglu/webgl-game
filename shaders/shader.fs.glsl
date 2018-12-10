#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_t_diffuse;
uniform vec3 u_specular;
uniform float u_shiness;

uniform bool u_HasSpecular;
uniform vec3 u_ambient;
uniform vec3 u_diffuse;

uniform vec3 u_lightColor;
uniform vec3 u_lightPos;
uniform vec3 u_viewPos;

varying vec3 v_Normal;
varying vec3 v_FragPos;
varying vec2 v_TexCoords;
varying float v_HasTex;

void main(){
    vec3 norm = normalize(v_Normal);

    //Ambient
    float ambientStrenght = 0.9;
    vec3 ambient = vec3(1,1,1);
    vec3 diffuse = vec3(1,1,1);
    
    //Diffuse
    vec3 lightDirection = normalize(u_lightPos-v_FragPos);
    float diff = max(dot(lightDirection, norm), 0.0);
    if(v_HasTex < 0.5){
        ambient = ambientStrenght * u_lightColor * u_ambient;
        diffuse = u_lightColor * diff * u_diffuse;
    }
    else
    {
        diffuse = u_lightColor * diff * vec3(texture2D(u_t_diffuse, v_TexCoords));
        ambient = ambientStrenght * u_lightColor * vec3(texture2D(u_t_diffuse, v_TexCoords));
    }

    //Specular
    float specularStrength = 0.5;
    vec3 viewDir = normalize(u_viewPos - v_FragPos);
    vec3 reflectDir = reflect(-lightDirection, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), u_shiness);
    vec3 specular =  u_lightColor * (spec * u_specular);
    if(!u_HasSpecular){
        specular = vec3(0,0,0);
    }

    //Mix
    gl_FragColor = vec4(diffuse + ambient + specular, 1);
}