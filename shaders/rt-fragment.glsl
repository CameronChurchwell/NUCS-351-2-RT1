#version 300 es
precision mediump float; 
uniform sampler2D u_Sampler;
in vec2 v_TexCoord;
out vec4 color;
void main() {
    color = texture(u_Sampler, v_TexCoord);
}