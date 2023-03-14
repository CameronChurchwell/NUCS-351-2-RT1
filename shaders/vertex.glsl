#version 300 es
precision mediump float;

in vec4 a_Position;
in vec3 a_Normal;
uniform mat4 u_mvpMat;
uniform mat4 u_modelMatrix;
uniform mat4 u_normalMat;
out vec4 v_Color;
out vec4 v_Normal;
out vec4 v_Position;
void main() {
    gl_Position = u_mvpMat * a_Position;
    v_Position = u_modelMatrix * a_Position;
    v_Normal = normalize(u_normalMat * vec4(a_Normal, 0.0));
    v_Color = vec4(0.0, 0.0, 0.0, 1.0);
}