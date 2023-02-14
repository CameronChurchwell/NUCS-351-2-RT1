#version 300 es
precision mediump float; 
in vec4 v_Color;
out vec4 color;
void main() {
    color = v_Color;
}