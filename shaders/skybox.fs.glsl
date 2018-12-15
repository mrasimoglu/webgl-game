
#ifdef GL_ES
precision highp float;
#endif

uniform samplerCube skybox;

varying vec3 v_TexCoords;


void main()
{
    gl_FragColor = textureCube(skybox, v_TexCoords);
}