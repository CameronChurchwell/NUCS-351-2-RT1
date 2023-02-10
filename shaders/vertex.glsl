#version 300 es
precision mediump float;
in vec4 a_Position;
in vec3 a_Color;
uniform int u_runMode; // particle system state: 0=reset; 1= pause; 2=step; 3=run
uniform vec4 positions[100];
uniform vec3 colors[100];
uniform int vertsPerParticle;
uniform int chunkOffset;
uniform highp int u_isBall;
uniform mat4 u_mvpMat;
out vec4 v_Color;
vec4 pos;
void main() {
    vertsPerParticle;
    positions;
    if (u_isBall > 0) {
        int idx = (gl_VertexID-chunkOffset) / vertsPerParticle;
        // pos = positions[idx] + a_Position;
        pos = a_Position;
        pos.xyz += positions[idx].xyz;
        v_Color.rgb = colors[idx]; //TODO combine with a_Color?
    } else {
        pos = a_Position;
        v_Color.rgb = a_Color.rgb;
    }
    v_Color.a = 1.0;
    // gl_PointSize = 10.0;
    gl_Position = u_mvpMat * pos; 	
    // Let u_runMode determine particle color:
    // if(u_runMode == 0) {
    //     v_Color = vec4(1.0, 0.0, 0.0, 1.0);	// red: 0==reset
    // } else if(u_runMode == 1) {
    //     v_Color = vec4(1.0, 1.0, 0.0, 1.0); 	// yellow: 1==pause
    // } else if(u_runMode == 2) {
    //     v_Color = vec4(1.0, 1.0, 1.0, 1.0); 	// white: 2==step
    // } else {
    //     v_Color = vec4(0.2, 1.0, 0.2, 1.0); 	// green: >3==run
    // }
    u_runMode;
}