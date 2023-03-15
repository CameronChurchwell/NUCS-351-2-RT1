#version 300 es
precision mediump float;

uniform vec3 offset;
uniform vec3 normal;

in vec3 source;
in vec3 direction;

out float intersect;
out vec3 intersection;

void main() {
    intersect = false;

    float numerator = dot(normal, offset-source);
    float denominator = dot(direction, normal);
    if (denominator != 0.0) {
        float t = numerator/denominator;
        intersect = (t >= 0.0);
    }

    if (intersect) {
        intersection = source + t * direction;
    }
}