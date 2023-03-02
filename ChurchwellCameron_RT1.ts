import { Matrix4, Vector3 } from "./lib/cuon-matrix-quat03";
import { GraphicsSystem } from "./lib/graphics-system";
import { groundGraphicsObject, teapotGraphicsObject, textureGraphicsObject } from "./graphics-objects";
import { Camera } from "./lib/camera";
import { InputContextManager } from "./lib/user-input";
import { ShaderProgram } from "./lib/shader-program";
import { DiscGeometry, GridPlaneGeometry, MeshGeometry, CompositeGeometry, TriangleGoemetry, SphereGeometry, PlaneGeometry } from "./lib/geometry";
import { ImageBuffer } from "./lib/buffer";
import { Perspective } from "./lib/perspective";
import { Viewport } from "./lib/viewport";
import { Tracer } from "./lib/tracer";

let resolution = 256;
var img = new ImageBuffer(resolution, resolution);

var rasterizedShader = new ShaderProgram(
    require('./shaders/vertex.glsl'),
    require('./shaders/fragment.glsl')
);

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
        new Uint8Array([255, 0, 0])
    );
    // let disc = new DiscGeometry(
    //     new Vector3([5, 5, 1]),
    //     new Vector3([1, 0, 0]),
    //     2,
    //     new Uint8Array([0xFF, 0xFF, 0xFF])
    // );
    // let wallPlane = new GridPlaneGeometry(
    //     new Vector3([100, 0, 0]),
    //     new Vector3([1, 0, 0]),
    //     new Uint8Array([0xFF, 0xFF, 0])
    // )
    // let triangle = new TriangleGoemetry(
    //     new Vector3([10, 0, 0]),
    //     new Vector3([10, 0, 4]),
    //     new Vector3([10, 4, 0,]),
    //     new Uint8Array([0xFF, 0xFF, 0xFF])
    // );
    let sphere = new SphereGeometry(
        new Vector3([0, 10, 1]),
        2,
        new Uint8Array([0xFF, 0xFF, 0xFF])
    );
    // let mesh = new MeshGeometry(teapotGraphicsObject.vertexArray, teapotGraphicsObject.floatsPerVertex, new Vector3([0, 0, 0]), Math.floor(teapotGraphicsObject.vertexArray.length / 7 / 2 / 3));
    // let mesh = new MeshGeometry(teapotGraphicsObject.vertexArray, teapotGraphicsObject.floatsPerVertex, new Vector3([0, 0, 0]));
    let teapot0 = new MeshGeometry(teapotGraphicsObject.vertexArray, teapotGraphicsObject.floatsPerVertex, new Vector3([0, 8, 0]), 1000);
    // let teapot0 = new MeshGeometry(teapotGraphicsObject.vertexArray, teapotGraphicsObject.floatsPerVertex, new Vector3([0, 8, 0]), Infinity);
    console.log(teapot0);
    // let teapot1 = new MeshGeometry(teapotGraphicsObject.vertexArray, teapotGraphicsObject.floatsPerVertex, new Vector3([8, 0, 0]), 100);
    let globalScene = new CompositeGeometry([
        // teapot1,
        // sphere,
        groundPlane,
        teapot0,
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

    window.addEventListener('resize', () => {
        canvas.width = innerWidth - 16;
        canvas.height = innerHeight * 0.6;

        leftViewport.width = canvas.width/2;
        leftViewport.height = canvas.height;
        rightViewport.width = canvas.width/2;
        rightViewport.xOffset = canvas.width/2;
        rightViewport.height = canvas.height;

        perspective.aspect = canvas.width/2/canvas.height;
    })


    camera = new Camera(
        new Vector3([0, 0, 1]),
        new Vector3([0, 0, 1]),
        new Vector3([0, 1, 0]).normalize(),
        perspective
    );
    tracer = new Tracer(camera, img, globalScene, gl, 1, 1.0);

    inputCtx = new InputContextManager([
        camera, tracer
    ]);
    inputCtx.activate();

    gs = new GraphicsSystem(gl, [
        groundGraphicsObject,
        teapotGraphicsObject,
        textureGraphicsObject,
    ]);
    gs.initVertexBuffer();

    window.addEventListener("keydown", inputCtx.generateCallback("keyDown"), false);
    window.addEventListener("keyup", inputCtx.generateCallback("keyUp"), false);
    window.addEventListener("keypress", inputCtx.generateCallback("keyPress"), false);

    // Initialize shaders
    rasterizedShader.createInContext(gl);
    raytracedShader.createInContext(gl);

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
    mvpMat.translate(0, 8, 0);
    gl.uniformMatrix4fv(u_mvpMat_loc, false, mvpMat.elements);
    teapotGraphicsObject.draw();
    // mvpMat.translate(8, -8, 0);
    // gl.uniformMatrix4fv(u_mvpMat_loc, false, mvpMat.elements);
    // teapotGraphicsObject.draw();

    //Draw right (raytraced) view
    // tracer.trace(); //real time test
    rightViewport.focusWithContext(gl);
    raytracedShader.useWithContext(gl);
    updateLocationsRaytraced(gl);
    gl.uniform1i(u_Sampler_loc, 0);
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

function resize() {

}

main();