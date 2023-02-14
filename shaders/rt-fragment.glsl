// #version 300 es
// precision mediump float; 
// uniform sampler2D u_Sampler;
// in vec2 v_TexCoord;
// out vec4 color;
// void main() {
//     // color = texture(u_Sampler, v_TexCoord);
//     u_Sampler;
//     color = vec4(1.0, 1.0, 1.0, 1.0);
// }

precision mediump float;
uniform sampler2D u_Sampler;
varying vec2 v_TexCoord; 
void main() {
    gl_FragColor = texture2D(u_Sampler, v_TexCoord); 
}