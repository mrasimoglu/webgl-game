#ifdef GL_ES
precision highp float;
#endif

attribute vec3 a_Position;

uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

varying vec3 v_TexCoords;



void main()
{

    v_TexCoords = a_Position;
    vec4 pos = u_ProjectionMatrix * u_ViewMatrix * vec4(a_Position, 1.0);
    gl_Position = pos;
}