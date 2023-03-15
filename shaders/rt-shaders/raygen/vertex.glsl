#version 300 es
precision mediump float;

uniform vec3 center;
uniform vec3 strafeDirection;
uniform vec3 upDirection;
uniform float dx;
uniform float dy;
uniform int width; // also height

out vec3 ray;

void main() {
    int x = gl_VertexID % width - width/2;
    int y = gl_VertexID / width - width/2;

    ray = center;
    ray += (dx * float(x)) * strafeDirection;
    ray += (dy * float(y)) * upDirection;
    ray = normalize(ray);
}