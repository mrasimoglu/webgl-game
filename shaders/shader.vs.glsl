#define MaxBone 120
#ifdef GL_ES
precision highp float;
#endif


attribute vec3 a_Position;
attribute vec3 a_Normal;
attribute vec3 a_BoneIds;
attribute vec3 a_Weights;
attribute vec2 a_TexCoords;

uniform bool u_HasBones;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform mat4 u_NormalMatrix;
uniform mat4 u_Bones[MaxBone];
uniform float u_HasTex;

varying vec3 v_Normal;
varying vec3 v_FragPos;
varying vec2 v_TexCoords;
varying float v_HasTex;
    
void main()
{    
    vec4 newVertex = vec4(a_Position, 1.0);
    vec3 tmp = a_Normal;
    if(u_HasBones)
    {
        mat4 boneMatrix = u_Bones[int(a_BoneIds[0])] * a_Weights[0];
        boneMatrix += (u_Bones[int(a_BoneIds[1])]  * a_Weights[1]);
        boneMatrix += (u_Bones[int(a_BoneIds[2])]  * a_Weights[2]);
        newVertex = boneMatrix * newVertex;
        tmp = mat3(boneMatrix) * a_Normal;
    }
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * newVertex;
    v_FragPos = (u_ModelMatrix * newVertex).xyz;
    v_Normal =  mat3(u_NormalMatrix) * tmp;
    v_HasTex = u_HasTex;
    if(u_HasTex > 0.5)
    {
       v_TexCoords = a_TexCoords;
    }
    else
    {
        v_TexCoords = vec2(0.5, 0.5);
    }
   
    
    gl_PointSize = 10.0;
}