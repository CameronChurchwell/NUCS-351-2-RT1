import { Matrix4, Vector3 } from "./lib/cuon-matrix-quat03";
import { GraphicsSystem } from "./lib/graphics-system";
import { bearGraphicsObject, bunnyGraphicsObject, groundGraphicsObject, sphere1GraphicsObject, sphere1GraphicsObject1, sphere2GraphicsObject, sphere3GraphicsObject, sphere4GraphicsObject, sphere5GraphicsObject, sphere6GraphicsObject, sphereGraphicsObject, teapot1GraphicsObject, teapot0GraphicsObject, textureGraphicsObject, teapotGraphicsObject } from "./graphics-objects";
import { Camera } from "./lib/camera";
import { InputContextManager } from "./lib/user-input";
import { ShaderProgram } from "./lib/shader-program";
import { DiscGeometry, GridPlaneGeometry, MeshGeometry, CompositeGeometry, SphereGeometry, Geometry} from "./lib/geometry";
import { ImageBuffer } from "./lib/buffer";
import { Perspective } from "./lib/perspective";
import { Viewport } from "./lib/viewport";
import { Tracer } from "./lib/tracer";
import { basicMaterial, basicMatte, basicRed, Material, metalGreen, metalPurple, mirrorBlue, mirrorRed, perfectMirror } from "./lib/material";
import { Light } from "./lib/light";

let resolution = 512;
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
var lights: Light[];

type Scene = [GraphicsSystem, Geometry, Light[]];

var scenes: Scene[] = [];
var currentScene: number = 0;
var rtgs: GraphicsSystem;

var inputCtx: InputContextManager;

var timeStep = 1.0/30.0;				// initialize; current timestep in seconds
var g_last = Date.now();				//  Timestamp: set after each frame of animation

var mvpMat = new Matrix4();
var u_mvpMat_loc;
var u_Texture_loc;
var u_Sampler_loc;
var u_normalMat_loc;
var u_modelMat_loc;
var u_cameraPos_loc;
var u_material_locs = {};

const numLights = 2;
var u_light_locs = [];
for (let i=0; i<numLights; i++) {
    u_light_locs.push({});
}

function main() {
    //materials

    let groundPlane = new GridPlaneGeometry(
        new Vector3([0, 0, -1]),
        new Vector3([0, 0, 1]),
        basicMatte
    );
    let disc = new DiscGeometry(
        new Vector3([3, 8, 1]),
        new Vector3([1, 1, 0]),
        2,
        basicMaterial
    );
    let disc1 = new DiscGeometry(
        new Vector3([-3, 8, 1]),
        new Vector3([1, 0, 0]),
        2,
        basicMaterial
    );
    let disc2 = new DiscGeometry(
        new Vector3([-3, 4, 1]),
        new Vector3([-1, -1, 0]),
        2,
        basicMaterial
    );
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
        new Vector3([-3, 10, 0]),
        1,
        basicMatte
    );
    let sphere1 = new SphereGeometry(
        new Vector3([3, 10, 0]),
        1,
        basicMaterial
    );
    let sphere2 = new SphereGeometry(
        new Vector3([0, 8, 0]),
        1,
        mirrorRed
    );
    let sphere3 = new SphereGeometry(
        new Vector3([-3, 10, 0]),
        1,
        mirrorBlue
    );

    let sphere4 = new SphereGeometry(
        new Vector3([0, 5, 0]),
        1,
        perfectMirror
    );

    let sphere5 = new SphereGeometry(
        new Vector3([-3, -4, 0]),
        1,
        basicMaterial
    );

    let sphere6 = new SphereGeometry(
        new Vector3([4, -3, 0]),
        1,
        basicMaterial
    );

    let teapot = new MeshGeometry(teapot0GraphicsObject.vertexArray, teapot0GraphicsObject.floatsPerVertex, new Vector3([0, 8, 0]), 1000, basicMatte);
    let teapot0 = new MeshGeometry(teapot0GraphicsObject.vertexArray, teapot0GraphicsObject.floatsPerVertex, new Vector3([0, 8, 0]), 1000, basicMaterial);
    let teapot1 = new MeshGeometry(teapot0GraphicsObject.vertexArray, teapot0GraphicsObject.floatsPerVertex, new Vector3([0, 4, 1.0]), 1000, metalPurple);
    let bear0 = new MeshGeometry(bearGraphicsObject.vertexArray, bearGraphicsObject.floatsPerVertex, new Vector3([0, 3, 0.0]), 1000, mirrorBlue);
    let bunny0 = new MeshGeometry(bunnyGraphicsObject.vertexArray, bunnyGraphicsObject.floatsPerVertex, new Vector3([1.5, 5, 0]), 1000, basicRed);

    // Retrieve <canvas> element
    var canvas = <HTMLCanvasElement> document.getElementById('webgl');
    var gl = canvas!.getContext("webgl2", { preserveDrawingBuffer: true}) as any as WebGL2RenderingContextStrict;

    // // Test gpgpu raytracing stuff
    // const width = 512
    // let raygenSrc = [
    //     require('./shaders/rt-shaders/raygen/vertex.glsl'),
    //     require('./shaders/rt-shaders/raygen/fragment.glsl')
    // ];
    // let raygenProgram = new ShaderProgram(raygenSrc[0], raygenSrc[1]);
    // raygenProgram.createInContext(gl, ['ray']);
    // raygenProgram.useWithContext(gl);
    // let locations = {};
    // let uniforms = ['center', 'dx', 'dy', 'strafeDirection', 'upDirection', 'width'];
    // for (let u of uniforms) {
    //     locations[u] = raygenProgram.getUniformLocationInContext(gl, u);
    // }

    
    // //create transform feedbacks
    // const transformFeedback = gl.createTransformFeedback();
    // gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);
    // const rayBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, rayBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, width*width*3*4, gl.DYNAMIC_DRAW);
    // gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, rayBuffer);
    // gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    
    // let pointlessBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, pointlessBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, width*width, gl.DYNAMIC_DRAW);
    
    
    // //INVOCATION
    // //setup
    // gl.enable(gl.RASTERIZER_DISCARD);
    // gl.bindBuffer(gl.ARRAY_BUFFER, pointlessBuffer);
    // gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);
    // gl.beginTransformFeedback(gl.POINTS);


    // //uniforms
    // gl.uniform3f(locations['center'], 1.0, 0.0, 0.0);
    // gl.uniform3f(locations['strafeDirection'], 0.0, 1.0, 0.0);
    // gl.uniform3f(locations['upDirection'], 0.0, 0.0, 1.0);
    // gl.uniform1f(locations['dx'], 0.01);
    // gl.uniform1f(locations['dy'], 0.01);
    // gl.uniform1i(locations['width'], width);

    // //compute
    // gl.drawArrays(gl.POINTS, 0, width*width);

    // //teardown
    // gl.endTransformFeedback();
    // gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    // gl.bindBuffer(gl.ARRAY_BUFFER, null);


    // //print results
    // let results = new Float32Array(width*width*3);
    // gl.bindBuffer(gl.ARRAY_BUFFER, rayBuffer);
    // gl.getBufferSubData(
    //     gl.ARRAY_BUFFER,
    //     0,
    //     results
    // );

    // console.log(results);
    // return;
    //TODO maybe in the future I'll do GPGPU

    gl.enable(gl.DEPTH_TEST); //disabled is default

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
    });

    canvas.width = innerWidth - 16;
    canvas.height = innerHeight * 0.6;

    leftViewport.width = canvas.width/2;
    leftViewport.height = canvas.height;
    rightViewport.width = canvas.width/2;
    rightViewport.xOffset = canvas.width/2;
    rightViewport.height = canvas.height;

    perspective.aspect = canvas.width/2/canvas.height;

    camera = new Camera(
        new Vector3([0, 0, 1]),
        new Vector3([0, 0, 1]),
        new Vector3([0, 1, 0]).normalize(),
        perspective
    );

    scenes.push([
        new GraphicsSystem(gl, [
            groundGraphicsObject,
            teapotGraphicsObject
        ]),
        new CompositeGeometry([
            teapot,
            groundPlane
        ]),
        [
            new Light(
                new Vector3([-5, 8, 0]),
                new Float32Array([0.1, 0.1, 0.1]),
                new Float32Array([1.0, 0.5, 0.5]),
                new Float32Array([0.5, 0.5, 0.5])
            ),
            new Light(
                new Vector3([5, 8, 0]),
                new Float32Array([0, 0, 0]),
                new Float32Array([0.5, 0.5, 1.0]),
                new Float32Array([0.5, 0.5, 0.5])
            )
        ]
    ])

    scenes.push([
        new GraphicsSystem(gl, [
            groundGraphicsObject,
            teapot0GraphicsObject,
            sphereGraphicsObject,
            sphere1GraphicsObject,
        ]),
        new CompositeGeometry([
            teapot0,
            sphere,
            sphere1,
            groundPlane,
        ]),
        [
            new Light(
                new Vector3([0, 0, 5]),
                new Float32Array([0.1, 0.1, 0.1]),
                new Float32Array([0.75, 0.75, 0.75]),
                new Float32Array([0.5, 0.5, 0.5])
            ),
            new Light(
                new Vector3([5, 8, 5]),
                new Float32Array([0, 0, 0]),
                new Float32Array([0, 0.75, 0]),
                new Float32Array([0, 0.5, 0])
            )
        ]
    ]);

    scenes.push([
        new GraphicsSystem(gl, [
            groundGraphicsObject,
            bearGraphicsObject,
            teapot1GraphicsObject,
            bunnyGraphicsObject
        ]),
        new CompositeGeometry([
            bear0,
            teapot1,
            bunny0,
            groundPlane
        ]),
        [
            new Light(
                new Vector3([0, 0, 5]),
                new Float32Array([0.1, 0.1, 0.1]),
                new Float32Array([0.75, 0.75, 0.75]),
                new Float32Array([0.5, 0.5, 0.5])
            ),
            new Light(
                new Vector3([0, 10, 0]),
                new Float32Array([0.1, 0.1, 0.1]),
                new Float32Array([1.0, 1.0, 1.0]),
                new Float32Array([0.5, 0.5, 0.5])
            ),
        ]
    ]);

    scenes.push([
        new GraphicsSystem(gl, [
            groundGraphicsObject,
            sphere3GraphicsObject,
            sphere1GraphicsObject1,
            sphere2GraphicsObject
        ]),
        new CompositeGeometry([
            sphere3,
            sphere1,
            sphere2,
            groundPlane
        ]),
        [
            new Light(
                new Vector3([0, 0, 5]),
                new Float32Array([0.1, 0.1, 0.1]),
                new Float32Array([0.4, 0.4, 1.0]),
                new Float32Array([0.5, 0.5, 0.5])
            ),
            new Light(
                new Vector3([3, 0, 5]),
                new Float32Array([0.1, 0.1, 0.1]),
                new Float32Array([1.0, 0.4, 0.4]),
                new Float32Array([0.5, 0.5, 0.5])
            ),
        ]
    ]);

    scenes.push([
        new GraphicsSystem(gl, [
            groundGraphicsObject,
            sphere4GraphicsObject,
            sphere5GraphicsObject,
            sphere6GraphicsObject
        ]),
        new CompositeGeometry([
            sphere4,
            sphere5,
            sphere6,
            groundPlane
        ]),
        [
            new Light(
                new Vector3([0, 0, 5]),
                new Float32Array([0.1, 0.1, 0.1]),
                new Float32Array([1.0, 1.0, 1.0]),
                new Float32Array([0.25, 0.25, 0.25])
            ),
            new Light(
                new Vector3([0, 0, 0]),
                new Float32Array([0, 0, 0]),
                new Float32Array([0, 0, 0]),
                new Float32Array([0, 0, 0])
            ),
        ]
    ]);

    //create graphics system for ray tracing texture
    rtgs = new GraphicsSystem(gl, [textureGraphicsObject]);

    // Create tracer object
    tracer = new Tracer(camera, img, scenes[0][1], gl, 1, 1.0, lights);
    // Initialize shaders
    rasterizedShader.createInContext(gl);
    raytracedShader.createInContext(gl);

    //User input managing
    inputCtx = new InputContextManager([
        camera, tracer
    ]);
    inputCtx.activate();

    //generate all callbacks
    window.addEventListener("keydown", inputCtx.generateCallback("keyDown"), false);
    window.addEventListener("keyup", inputCtx.generateCallback("keyUp"), false);
    window.addEventListener("keypress", inputCtx.generateCallback("keyPress"), false);
    var radios = document.querySelectorAll('input[type=radio][name="scene_select"]');
    radios.forEach(radio => radio.addEventListener('change', () => currentScene=+(<HTMLInputElement>radio).value));
    var checkboxes = document.querySelectorAll('input[type=checkbox][name="lights_control"]');
    checkboxes.forEach(checkbox => checkbox.addEventListener('change',
        () => scenes.forEach(scene => scene[2][(<HTMLInputElement>checkbox).value].enabled = (<HTMLInputElement>checkbox).checked)));

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
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //Draw left (rasterized) view
    leftViewport.focusWithContext(gl);
    rasterizedShader.useWithContext(gl);
    let sceneGS = scenes[currentScene][0];
    gl.bindBuffer(gl.ARRAY_BUFFER, sceneGS.vertexBufferLoc);
    updateLocationsRasterized(gl); //update uniform locations
    let lights = scenes[currentScene][2];
    for (let i=0; i<numLights; i++) {
        let light = lights[i];
        let light_locs = u_light_locs[i];
        if (light.enabled) {
            let p = light.position.elements;
            let a = light.ambient;
            let d = light.diffuse;
            let s = light.specular;
            gl.uniform4f(light_locs['position'], p[0], p[1], p[2], 1.0);
            gl.uniform3f(light_locs['ambient'], a[0], a[1], a[2]);
            gl.uniform3f(light_locs['diffuse'], d[0], d[1], d[2]);
            gl.uniform3f(light_locs['specular'], s[0], s[1], s[2]);
        } else {
            gl.uniform4f(light_locs['position'], 0, 0, 0, 0);
            gl.uniform3f(light_locs['ambient'], 0, 0, 0);
            gl.uniform3f(light_locs['diffuse'], 0, 0, 0);
            gl.uniform3f(light_locs['specular'], 0, 0, 0);
        }
    }
    // camera.applyTo(mvpMat);
	gl.uniformMatrix4fv(u_mvpMat_loc, false, mvpMat.elements);
    scenes[currentScene][0].drawAll(u_mvpMat_loc, mvpMat, camera, u_modelMat_loc, u_normalMat_loc, u_cameraPos_loc, u_material_locs);

    //Draw right (raytraced) view
    rightViewport.focusWithContext(gl);
    raytracedShader.useWithContext(gl);
    gl.bindBuffer(gl.ARRAY_BUFFER, rtgs.vertexBufferLoc);
    updateLocationsRaytraced(gl);
    tracer.lights = scenes[currentScene][2];
    gl.uniform1i(u_Sampler_loc, 0);
    textureGraphicsObject.draw();
}

function updateLocationsRasterized(gl: WebGL2RenderingContextStrict) {
    u_mvpMat_loc = rasterizedShader.getUniformLocationInContext(gl, 'u_mvpMat');
    u_modelMat_loc = rasterizedShader.getUniformLocationInContext(gl, 'u_modelMatrix');
    u_normalMat_loc = rasterizedShader.getUniformLocationInContext(gl, 'u_normalMat');
    u_cameraPos_loc = rasterizedShader.getUniformLocationInContext(gl, 'u_cameraPos');

    u_material_locs['ambient'] = rasterizedShader.getUniformLocationInContext(gl, 'u_material.ambient');
    u_material_locs['diffuse'] = rasterizedShader.getUniformLocationInContext(gl, 'u_material.diffuse');
    u_material_locs['specular'] = rasterizedShader.getUniformLocationInContext(gl, 'u_material.specular');
    u_material_locs['shiny'] = rasterizedShader.getUniformLocationInContext(gl, 'u_material.shiny');

    for (let i=0; i<numLights; i++) {
        u_light_locs[i]['position'] = rasterizedShader.getUniformLocationInContext(gl, `u_lights[${i}].position`); 
        u_light_locs[i]['ambient'] = rasterizedShader.getUniformLocationInContext(gl, `u_lights[${i}].ambient`);
        u_light_locs[i]['diffuse'] = rasterizedShader.getUniformLocationInContext(gl, `u_lights[${i}].diffuse`);
        u_light_locs[i]['specular'] = rasterizedShader.getUniformLocationInContext(gl, `u_lights[${i}].specular`);
    }

    // Get the ID# for the a_Position variable in the graphics hardware
    var a_PositionID = rasterizedShader.getAttributeLocationInContext(gl, 'a_Position');
    var a_NormalID = rasterizedShader.getAttributeLocationInContext(gl, 'a_Normal');
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
        a_NormalID,
        3,
        gl.FLOAT,
        false,
        7*4,
        4*4
    );
    gl.enableVertexAttribArray(a_NormalID);
}

function updateLocationsRaytraced(gl: WebGL2RenderingContextStrict) {
    //TODO getting these positions might be slow (it will be slow)
    tracer.geometry = scenes[currentScene][1];
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