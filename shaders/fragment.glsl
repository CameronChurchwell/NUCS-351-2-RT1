#version 300 es
precision mediump float; 
uniform highp int u_isBall;
in vec4 v_Color;
out vec4 color;
void main() {
    u_isBall;

    if(u_isBall > 0){ 
	    // float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); 
	    // if(dist < 0.5) { 
	  	//     color = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0);
	    // } else { 
        //     discard;
        // }
        color = v_Color;
	} else { // NOT drawing a ball; just use vertex color.
	    color = v_Color;
	}
}