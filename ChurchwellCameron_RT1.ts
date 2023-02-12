import { initShaders } from "./lib/cuon-utils";
import { Matrix4, Vector3 } from "./lib/cuon-matrix-quat03";
import { GraphicsObject } from "./lib/graphics-object";
import { GraphicsSystem } from "./lib/graphics-system";
import { Constraint, ConstraintFixed } from "./lib/constraint";
import { ForceGenerator, ForceGeneratorDrag, ForceGeneratorSpring, ForceGeneratorSpringDamped } from "./lib/change-generator";
import { ParticleAttributes } from "./lib/particle-attributes";
import { ParticleSystem } from "./lib/particle-system";
import { makeGroundGrid } from "./vertex-objects/ground-vertices";
import { makeBox } from "./vertex-objects/box-vertices";
import { groundGraphicsObject, boxGraphicsObject } from "./graphics-objects";
import { makeTornadoSystem } from "./particle-systems/tornado-system";
import { makeSpringSystem } from "./particle-systems/spring-system";
import { makeFireSystem } from "./particle-systems/fire-system";
import { makeLanternSystem } from "./particle-systems/lantern-system";
import { makeBoidSystem } from "./particle-systems/boid-system";
import { backward, euler, fmid, naive } from "./particle-systems/common-definitions";

var VSHADER_SOURCE = require('./shaders/vertex.glsl');
var FSHADER_SOURCE = require('./shaders/fragment.glsl');

var u_positions_loc;
var u_vertsPerParticle_loc;
var u_chunkOffset_loc;
var u_colors_loc;

var particleSystems: Array<ParticleSystem>;

var forwardVelocity = 0;
var leftVelocity = 0;
var g_cameraRotate = new Matrix4();
var g_cameraLook = new Vector3([-4, -4, 0]);
g_cameraLook = g_cameraLook.normalize();
var g_cameraPosition = new Vector3([5, 5, 1.5]);
var g_xyProjectionMatrix = new Matrix4();
g_xyProjectionMatrix.elements[10] = 0;
var g_upVector = new Vector3([0,0,1]);
var g_absoluteUpVector = new Vector3([0,0,1]);

var g_solvers = [
    euler,
    naive,
    fmid,
    backward
];

var u_isBallLoc;
var u_runModeID

var program

// Global Variables
// =========================

var timeStep = 1.0/30.0;				// initialize; current timestep in seconds
var g_last = Date.now();				//  Timestamp: set after each frame of animation

// For keyboard, mouse-click-and-drag:		
var myRunMode = 3;	// particle system state: 0=reset; 1= pause; 2=step; 3=run

var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

var mvpMat = new Matrix4();
var u_mvpMat_loc;
var myIsBall;

var gs: GraphicsSystem

function main() {
    // Retrieve <canvas> element
    var canvas = <HTMLCanvasElement> document.getElementById('webgl');

	var gl = canvas!.getContext("webgl2", { preserveDrawingBuffer: true}) as any as WebGLRenderingContextStrict;

    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gs = new GraphicsSystem(gl, [
        groundGraphicsObject, boxGraphicsObject
    ]);

    let tornadoSystem = makeTornadoSystem(gs);
    let springSystem = makeSpringSystem(gs);
    function changeSpringSolver(springSystem, solverNum) {
        springSystem.solver = g_solvers[solverNum];
    }
    let fireSystem = makeFireSystem(gs);
    let lanternSystem = makeLanternSystem(gs);
    function getUserPosition() {
        return g_cameraPosition
    }
    let boidSystem = makeBoidSystem(gs, getUserPosition);
    particleSystems = [boidSystem, springSystem, fireSystem, lanternSystem, tornadoSystem];

    var radios = document.querySelectorAll('input[type=radio][name="solver_select"]') as any;
    radios.forEach(radio => radio.addEventListener('change', () => {
        return changeSpringSolver(springSystem, radio.value);
    }));

	// Register the Mouse & Keyboard Event-handlers-------------------------------
    canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
    canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };				
    canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};

    // Next, register all keyboard events found within our HTML webpage window:
	window.addEventListener("keydown", myKeyDown, false);
	window.addEventListener("keyup", myKeyUp, false);
	window.addEventListener("keypress", myKeyPress, false);
	

    // Initialize shaders
    program = initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    if (!program) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Write the positions of vertices into an array, transfer array contents to a 
    // Vertex Buffer Object created in the graphics hardware.
    var myVerts = initVertexBuffers(gl);
    if (myVerts < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }
    gl.clearColor(0, 0, 0, 1);	  // RGBA color for clearing <canvas>
  
    // Get graphics system storage location of uniforms our shaders use:
    // (why? see  http://www.opengl.org/wiki/Uniform_(GLSL) )
    u_runModeID = gl.getUniformLocation(program, 'u_runMode');
    if(!u_runModeID) {
  	    console.log('Failed to get u_runMode variable location');
  	    return;
    }
	gl.uniform1i(u_runModeID, myRunMode);		// keyboard callbacks set 'myRunMode'

    u_isBallLoc = gl.getUniformLocation(program, 'u_isBall');
    if(!u_isBallLoc) {
  	    console.log('Failed to get u_isBallLoc variable location');
  	    return;
    }
	gl.uniform1i(u_isBallLoc, myIsBall);		// keyboard callbacks set 'myRunMode'

    u_mvpMat_loc = gl.getUniformLocation(program, 'u_mvpMat');

    if(!u_mvpMat_loc) {
		console.log('Failed to get u_ModelMatrix variable location');
	    return;
    }

    u_positions_loc = gl.getUniformLocation(program, 'positions');
    if(!u_positions_loc) {
		console.log('Failed to get positions variable location');
	    return;
    }

    u_vertsPerParticle_loc = gl.getUniformLocation(program, 'vertsPerParticle');
    if(!u_vertsPerParticle_loc) {
		console.log('Failed to get vertsPerParticle variable location');
	    return;
    }

    u_chunkOffset_loc = gl.getUniformLocation(program, 'chunkOffset');
    if(!u_chunkOffset_loc) {
		console.log('Failed to get chunkOffset variable location');
	    return;
    }

    u_colors_loc = gl.getUniformLocation(program, 'colors');
    if(!u_colors_loc) {
		console.log('Failed to get colors variable location');
	    return;
    }

    var tick = function() {
        timeStep = animate(timeStep);  // get time passed since last screen redraw.
        draw(gl, myVerts, timeStep);	// compute new particle state at current time
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
    // Return the amount of time passed.

    let newCameraLook = g_cameraRotate.multiplyVector3(g_cameraLook).normalize();
    let cos = newCameraLook.dot(g_absoluteUpVector)
    if (cos <= 0.9 && cos >= -0.9) {
        g_cameraLook = newCameraLook;
    }

    let forwardVector = g_xyProjectionMatrix.multiplyVector3(g_cameraLook).normScale(forwardVelocity);
    g_cameraPosition = g_cameraPosition.add(forwardVector);

    let leftVector = g_upVector.cross(g_cameraLook).normScale(leftVelocity);
    g_cameraPosition = g_cameraPosition.add(leftVector);

    return elapsed;
}

function setLook(mvpMat) {
    let lookVector = g_cameraPosition.add(g_cameraLook);
    mvpMat.lookAt(
        g_cameraPosition.elements[0], g_cameraPosition.elements[1], g_cameraPosition.elements[2],
        lookVector.elements[0], lookVector.elements[1], lookVector.elements[2],
        g_upVector.elements[0], g_upVector.elements[1], g_upVector.elements[2]
    );
}

function draw(gl, n, timeStep) {
//==============================================================================  
 
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1i(u_runModeID, myRunMode);		// run/step/pause the particle system
																					// update particle system state?
    gl.uniform1i(u_isBallLoc, 1);		// keyboard callbacks set 'myRunMode'
    if(myRunMode>1) {									// 0=reset; 1= pause; 2=step; 3=run
		if(myRunMode==2) myRunMode=1;				// (if 2, do just one step and pause.)
        for (let particleSystem of particleSystems) {
            particleSystem.doAll(u_positions_loc, u_vertsPerParticle_loc, u_chunkOffset_loc, u_colors_loc);
        }
	} else {
        for (let particleSystem of particleSystems) {
            particleSystem.drawUniform(u_positions_loc, u_vertsPerParticle_loc, u_chunkOffset_loc, u_colors_loc);
        }
    }
	// Assign value to mvpMatrix
	mvpMat.setIdentity(); 
    var canvas = <HTMLCanvasElement> document.getElementById('webgl');
    mvpMat.setPerspective(35, canvas.width/canvas.height, 1, 100);
    setLook(mvpMat);
	gl.uniformMatrix4fv(u_mvpMat_loc, false, mvpMat.elements);
    gl.uniform1i(u_isBallLoc, 0);
    groundGraphicsObject.draw();
    boxGraphicsObject.draw();
}

function initVertexBuffers(gl: WebGLRenderingContextStrict) {
// Set up all buffer objects on our graphics hardware.

    gs.initVertexBuffer();

    // Get the ID# for the a_Position variable in the graphics hardware
    var a_PositionID = gl.getAttribLocation(program, 'a_Position');
    if(a_PositionID < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }

    var a_ColorID = gl.getAttribLocation(program, 'a_Color');
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

//===================Mouse and Keyboard event-handling Callbacks================
//==============================================================================
function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = true;											// set our mouse-dragging flag
	xMclik = x;													// record where mouse-dragging began
	yMclik = y;
	// 	document.getElementById('MouseResult1').innerHTML = 
	// 'myMouseDown() at CVV coords x,y = '+x+', '+y+'<br>';
};


function myMouseMove(ev,gl,canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);
	xMclik = x;													// Make next drag-measurement from here.
	yMclik = y;
};

function myMouseUp(ev,gl,canvas) {
    // ev.clientX, ev.clientY == mouse location measured in left-handed coords: UPPER left origin Y increases DOWNWARDS
    // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
	// console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
	// console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
};


function myKeyDown(kev) {
    let rotationAxis = new Vector3();
    switch(kev.code) {
        //------------------WASD navigation-----------------
        case "KeyA":
            leftVelocity = 0.1;
            break;
        case "KeyD":
            leftVelocity = -0.1;
            break;
        case "KeyS":
            forwardVelocity = -0.1
            break;
        case "KeyW":
            forwardVelocity = 0.1;
            break;
        //----------------Arrow keys------------------------
        case "ArrowLeft":
            g_cameraRotate.setRotate(1, 0, 0, 1);
            break
        case "ArrowRight":
            g_cameraRotate.setRotate(1, 0, 0, -1);
            break
        case "ArrowUp":		
            rotationAxis = g_cameraLook.cross(g_upVector);
            g_cameraRotate.setRotate(1, rotationAxis.elements[0], rotationAxis.elements[1], rotationAxis.elements[2]);
            break;
        case "ArrowDown":
            rotationAxis = g_cameraLook.cross(g_upVector);
            g_cameraRotate.setRotate(-1, rotationAxis.elements[0], rotationAxis.elements[1], rotationAxis.elements[2]);
            break;
        default:
            break;
    }
}

function myKeyUp(kev) {
    //===============================================================================
    // Called when user releases ANY key on the keyboard; captures scancodes well
    
    switch(kev.code) {
        //------------------WASD navigation-----------------
        case "KeyA":
            leftVelocity = 0;
            break;
        case "KeyD":
            leftVelocity = 0;
            break;
        case "KeyS":
            forwardVelocity = 0
            break;
        case "KeyW":
            forwardVelocity = 0;
            break;
        //----------------Arrow keys------------------------
        case "ArrowLeft":
            g_cameraRotate.setIdentity();
            break;
        case "ArrowRight":
            g_cameraRotate.setIdentity();
            break
        case "ArrowUp":	
            g_cameraRotate.setIdentity();	
            break;
        case "ArrowDown":
            g_cameraRotate.setIdentity();
            break;	
        default:
            break;
    }
}

function myKeyPress(ev) {
//===============================================================================
    let myChar = String.fromCharCode(ev.keyCode);	//	convert code to character-string
  			
  // update particle system state? myRunMode 0=reset; 1= pause; 2=step; 3=run
	switch(myChar) {
		case '0':	
			myRunMode = 0;			// RESET!
			break;
		case '1':
			myRunMode = 1;			// PAUSE!
			break;
		case '2':
			myRunMode = 2;			// STEP!
			break;
		case '3':							// RUN!
			myRunMode = 3;
			break;
		case 'R':  // HARD reset: position AND velocity.
		  myRunMode = 0;			// RESET!
          particleSystems.forEach((particleSystem) => {particleSystem.reset()});
			break;
		case 'r':		// 'SOFT' reset: boost velocity only.
			// don't change myRunMode
			// for (let particle of particleSystem.particleObjects) {
            //     particle.currentState.position = particle.currentState.position.normScale(0.5);
            // }
            // particleSystem.particleObjects[0].currentState.velocity = new Vector3([0, -0.2, 0]);
            // particleSystem.particleObjects[1].currentState.velocity = new Vector3([0, 0.2, 0]);
			break;	
		case 'p':
		case 'P':			// toggle pause/run:
			if(myRunMode==3) myRunMode = 1;		// if running, pause
									else myRunMode = 3;		// if paused, run.
			break;
		case ' ':			// space-bar: single-step
			myRunMode = 2;
			break;
		default:
			break;
	}
}

main();