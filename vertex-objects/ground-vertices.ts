export function makeGroundGrid(xcount: number = 1000, ycount: number = 1000, xymax:  number = 500.0) {
        
    var floatsPerVertex = 7;
    let gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
                        // draw a grid made of xcount+ycount lines; 2 vertices per line.
                        
    let xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
    let ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))

    // First, step thru x values as we make vertical lines of constant-x:
    let j = 0;
    for(let v=0; v<2*xcount; v++, j+= floatsPerVertex) {
        if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
            gndVerts[j  ] = -xymax + (v  )*xgap;	// x
            gndVerts[j+1] = -xymax;								// y
            gndVerts[j+2] = -1.0;									// z
            gndVerts[j+3] = 1.0;									// w.
        }
        else {				// put odd-numbered vertices at (xnow, +xymax, 0).
            gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
            gndVerts[j+1] = xymax;								// y
            gndVerts[j+2] = -1.0;									// z
            gndVerts[j+3] = 1.0;									// w.
        }
        gndVerts[j+4] = 1.0;
        gndVerts[j+5] = 1.0;
        gndVerts[j+6] = 1.0;
    }
    // Second, step thru y values as wqe make horizontal lines of constant-y:
    // (don't re-initialize j--we're adding more vertices to the array)
    for(let v=0; v<2*ycount; v++, j += floatsPerVertex) {
        if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
            gndVerts[j  ] = -xymax;								// x
            gndVerts[j+1] = -xymax + (v  )*ygap;	// y
            gndVerts[j+2] = -1.0;									// z
            gndVerts[j+3] = 1.0;									// w.
        }
        else {					// put odd-numbered vertices at (+xymax, ynow, 0).
            gndVerts[j  ] = xymax;								// x
            gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
            gndVerts[j+2] = -1.0;									// z
            gndVerts[j+3] = 1.0;									// w.
        }
        gndVerts[j+4] = 1.0;
        gndVerts[j+5] = 1.0;
        gndVerts[j+6] = 1.0;
    }

    return gndVerts;
}