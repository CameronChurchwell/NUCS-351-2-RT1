import { Matrix4, Vector3 } from "./lib/cuon-matrix-quat03";
import { GraphicsSystem } from "./lib/graphics-system";
import { groundGraphicsObject } from "./graphics-objects";
import { Camera } from "./lib/camera";
import { InputContextManager } from "./lib/user-input";
import { ShaderProgram } from "./lib/shader-program";

var rasterizedShader = new ShaderProgram(
    require('./shaders/vertex.glsl'),
    require('./shaders/fragment.glsl')
)

var raytracedShader = new ShaderProgram(
    require("./shaders/rt-vertex.glsl"),
    require("./shaders/rt-fragment.glsl")
);

var camera = new Camera(
    new Vector3([5, 5, 1.5]),
    new Vector3([0, 0, 1]),
    new Vector3([-4, -4, 0]).normalize(),
);
var inputCtx = new InputContextManager([camera]);
inputCtx.activate();

var timeStep = 1.0/30.0;				// initialize; current timestep in seconds
var g_last = Date.now();				//  Timestamp: set after each frame of animation

var mvpMat = new Matrix4();
var u_mvpMat_loc;

var gs: GraphicsSystem

function main() {
    // Retrieve <canvas> element
    var canvas = <HTMLCanvasElement> document.getElementById('webgl');

	var gl = canvas!.getContext("webgl2", { preserveDrawingBuffer: true}) as any as WebGL2RenderingContextStrict;

    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gs = new GraphicsSystem(gl, [
        groundGraphicsObject
    ]);

    window.addEventListener("keydown", inputCtx.generateCallback("keyDown"), false);
    window.addEventListener("keyup", inputCtx.generateCallback("keyUp"), false);
    window.addEventListener("keypress", inputCtx.generateCallback("keyPress"), false);

    // Initialize shaders
    rasterizedShader.createInContext(gl);
    raytracedShader.createInContext(gl);
    rasterizedShader.useWithContext(gl);

    var myVerts = initVertexBuffers(gl);
    if (myVerts < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }

    gl.clearColor(0, 0, 0, 1);	  // RGBA color for clearing <canvas>
    var tick = function() {
        timeStep = animate(timeStep);  // get time passed since last screen redraw.
        draw(gl);	// compute new particle state at current time
        requestAnimationFrame(tick);  // Call us again 'at next opportunity', //edit: removed canvas as second argument
    };
    tick();
}

function animate(timeStep) {
//==============================================================================  
// How much time passed since we last updated the 'canvas' screen elements?
    var now = Date.now();	
    var elapsed = now - g_last;
    g_last = now;
    camera.solve();
    return elapsed;
}

function draw(gl: WebGL2RenderingContextStrict) {
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    //Draw left (rasterized) view
    rasterizedShader.useWithContext(gl);
    updateLocations(gl, rasterizedShader); //update uniform locations
    gl.viewport(0, 0, gl.drawingBufferWidth/2, gl.drawingBufferHeight);
	mvpMat.setIdentity(); 
    var canvas = <HTMLCanvasElement> document.getElementById('webgl');
    mvpMat.setPerspective(35, canvas.width/2/canvas.height, 1, 100);
    camera.applyTo(mvpMat);
	gl.uniformMatrix4fv(u_mvpMat_loc, false, mvpMat.elements);
    groundGraphicsObject.draw();

    //Draw right (raytraced) view
    rasterizedShader.useWithContext(gl);
    // updateLocations(gl, rasterizedShader); //update uniform locations
    gl.viewport(gl.drawingBufferWidth/2, 0, gl.drawingBufferWidth/2, gl.drawingBufferHeight);
    mvpMat.setIdentity(); 
    var canvas = <HTMLCanvasElement> document.getElementById('webgl');
    mvpMat.setPerspective(35, canvas.width/2/canvas.height, 1, 100);
    camera.applyTo(mvpMat);
	gl.uniformMatrix4fv(u_mvpMat_loc, false, mvpMat.elements);
    groundGraphicsObject.draw();
}

function updateLocations(gl: WebGL2RenderingContextStrict, sp: ShaderProgram) {
    u_mvpMat_loc = sp.getUniformLocationInContext(gl, 'u_mvpMat');
}

function initVertexBuffers(gl: WebGL2RenderingContextStrict) {
// Set up all buffer objects on our graphics hardware.

    gs.initVertexBuffer();

    // Get the ID# for the a_Position variable in the graphics hardware
    var a_PositionID = gl.getAttribLocation(rasterizedShader.program, 'a_Position');
    if(a_PositionID < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    var a_ColorID = gl.getAttribLocation(rasterizedShader.program, 'a_Color');
    if (a_ColorID < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_PositionID, 
                            4,  // # of values in this attrib (1,2,3,4) 
                            gl.FLOAT, // data type (usually gl.FLOAT)
                            false,    // use integer normalizing? (usually false)
                            7*4,  // Stride: #bytes from 1st stored value to next 
                            0*4); // Offset; #bytes from start of buffer to 
                                    // 1st stored attrib value we will actually use.
    // Enable this assignment of the bound buffer to the a_Position variable:
    gl.enableVertexAttribArray(a_PositionID);

    gl.vertexAttribPointer(
        a_ColorID,
        3,
        gl.FLOAT,
        false,
        7*4,
        4*4
    );
    gl.enableVertexAttribArray(a_ColorID);
}
main();