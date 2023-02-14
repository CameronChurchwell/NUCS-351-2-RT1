#version 300 es
precision mediump float;
in vec4 a_Position;
in vec3 a_Color;
uniform mat4 u_mvpMat;
out vec4 v_Color;
void main() {
    v_Color.rgb = a_Color.rgb;
    v_Color.a = 1.0;
    gl_Position = u_mvpMat * a_Position;
}