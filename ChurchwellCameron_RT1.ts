import { Matrix4, Vector3 } from "./lib/cuon-matrix-quat03";
import { GraphicsSystem } from "./lib/graphics-system";
import { groundGraphicsObject, textureGraphicsObject } from "./graphics-objects";
import { Camera } from "./lib/camera";
import { InputContextManager } from "./lib/user-input";
import { ShaderProgram } from "./lib/shader-program";
import { GridPlaneGeometry } from "./lib/geometry";
import { ImageBuffer } from "./lib/buffer";
import { Perspective } from "./lib/perspective";
import { Viewport } from "./lib/viewport";
import { Tracer } from "./lib/tracer";
import { Scene } from "./lib/scene";


let resolution = 512;
var img = new ImageBuffer(resolution, resolution);

var rasterizedShader = new ShaderProgram(
    require('./shaders/vertex.glsl'),
    require('./shaders/fragment.glsl')
)

var raytracedShader = new ShaderProgram(
    require("./shaders/rt-vertex.glsl"),
    require("./shaders/rt-fragment.glsl")
);

var leftViewport: Viewport;
var rightViewport: Viewport;
var perspective: Perspective
var camera: Camera;
var tracer: Tracer;

var inputCtx: InputContextManager;

var timeStep = 1.0/30.0;				// initialize; current timestep in seconds
var g_last = Date.now();				//  Timestamp: set after each frame of animation

var mvpMat = new Matrix4();
var u_mvpMat_loc;
var u_Texture_loc;
var u_Sampler_loc;

var gs: GraphicsSystem;

function main() {
    let groundPlane = new GridPlaneGeometry(
        new Vector3([0, 0, -1]),
        new Vector3([0, 0, 1]),
        new Uint8Array([0xFF, 0xFF, 0xFF])
    );
    let globalScene = new Scene([
        groundPlane
    ]);

    // Retrieve <canvas> element
    var canvas = <HTMLCanvasElement> document.getElementById('webgl');
    var gl = canvas!.getContext("webgl2", { preserveDrawingBuffer: true}) as any as WebGL2RenderingContextStrict;
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL2');
        return;
    }

    leftViewport = new Viewport(0, 0, gl.drawingBufferWidth/2, gl.drawingBufferHeight);
    rightViewport = new Viewport(gl.drawingBufferWidth/2, 0, gl.drawingBufferWidth/2, gl.drawingBufferHeight);

    perspective = new Perspective(35, canvas.width/2/canvas.height, 1, 100);

    camera = new Camera(
        new Vector3([0, 0, 1]),
        new Vector3([0, 0, 1]),
        new Vector3([1, 0, 0]).normalize(),
        perspective
    );
    tracer = new Tracer(camera, img, globalScene, gl, 4, 0.1);

    inputCtx = new InputContextManager([
        camera, tracer
    ]);
    inputCtx.activate();

    // let testGen = camera.makeRayGenerator(256, 256, 2);
    // for (let i=0; i<1024; i++) {
    //     console.log(i%4, testGen.next().value.elements);
    // }

    gs = new GraphicsSystem(gl, [
        groundGraphicsObject,
        textureGraphicsObject
    ]);

    window.addEventListener("keydown", inputCtx.generateCallback("keyDown"), false);
    window.addEventListener("keyup", inputCtx.generateCallback("keyUp"), false);
    window.addEventListener("keypress", inputCtx.generateCallback("keyPress"), false);

    // Initialize shaders
    rasterizedShader.createInContext(gl);
    raytracedShader.createInContext(gl);
    gs.initVertexBuffer();

    //Configre texture and sampler
    u_Sampler_loc = raytracedShader.getUniformLocationInContext(gl, 'u_Sampler');
    u_Texture_loc = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, u_Texture_loc);
    gl.texImage2D(
        gl.TEXTURE_2D, //target use
        0, //mip-map level
        gl.RGB, //gpu target format
        img.width, //width
        img.height, //height
        0, //offset to start
        gl.RGB, //source format
        gl.UNSIGNED_BYTE,
        new Uint8Array(img.width*img.height*3).fill(0x00)
        // img.data
    );
    gl.texParameteri(
        gl.TEXTURE_2D, 
  		gl.TEXTURE_MIN_FILTER, 
  	    gl.LINEAR
    );

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
    leftViewport.focusWithContext(gl);
    rasterizedShader.useWithContext(gl);
    updateLocationsRasterized(gl); //update uniform locations
    camera.applyTo(mvpMat);
	gl.uniformMatrix4fv(u_mvpMat_loc, false, mvpMat.elements);
    groundGraphicsObject.draw();

    //Draw right (raytraced) view
    // tracer.trace(); //real time test
    rightViewport.focusWithContext(gl);
    raytracedShader.useWithContext(gl);
    updateLocationsRaytraced(gl);
    gl.uniform1i(u_Sampler_loc, 0);
    // camera.applyTo(mvpMat);
    textureGraphicsObject.draw();
}

function updateLocationsRasterized(gl: WebGL2RenderingContextStrict) {
    u_mvpMat_loc = rasterizedShader.getUniformLocationInContext(gl, 'u_mvpMat');
    // Get the ID# for the a_Position variable in the graphics hardware
    var a_PositionID = rasterizedShader.getAttributeLocationInContext(gl, 'a_Position');
    var a_ColorID = rasterizedShader.getAttributeLocationInContext(gl, 'a_Color');
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

function updateLocationsRaytraced(gl: WebGL2RenderingContextStrict) {
    //TODO getting these positions might be slow (it will be slow)
    var a_PositionID = raytracedShader.getAttributeLocationInContext(gl, 'a_Position');
    var a_TexCoordID = raytracedShader.getAttributeLocationInContext(gl, 'a_TexCoord');
    gl.vertexAttribPointer(
        a_PositionID,
        2, //TODO not sure on this one
        gl.FLOAT,
        false,
        4*4,
        0
    );
    gl.enableVertexAttribArray(a_PositionID);
    gl.vertexAttribPointer(
        a_TexCoordID,
        2,
        gl.FLOAT,
        false,
        4*4,
        2*4
    );
    gl.enableVertexAttribArray(a_TexCoordID);
}

main();