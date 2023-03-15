import { Vector3 } from "./lib/cuon-matrix-quat03";
import { GraphicsObject } from "./lib/graphics-object";
import { basicMaterial, basicMatte, basicRed, metalGreen, metalPurple, mirrorBlue, mirrorRed, perfectMirror } from "./lib/material";
// import { makeBox } from "./vertex-objects/box-vertices";
import { makeGroundGrid } from "./vertex-objects/ground-vertices";
// import { makeMiniCube } from "./vertex-objects/minicube-vertices";

//TODO figure out how to have LINES instead of 0x0001

let floatsPerVertex = 7;

let gndVerts = makeGroundGrid();
export let groundGraphicsObject = new GraphicsObject(gndVerts, 0x0001, floatsPerVertex); //lines

let textureVerts = require('./vertex-objects/texture-vertices.json');
export let textureGraphicsObject = new GraphicsObject(textureVerts, WebGL2RenderingContext.TRIANGLE_STRIP, 4);

// let teapotVerts = require('./vertex-objects/teapot-vertices.json');
let teapotVerts = require('./vertex-objects/teapot-normal-vertices.json');
export let teapotGraphicsObject = new GraphicsObject(teapotVerts, WebGL2RenderingContext.TRIANGLES, 7, new Vector3([0, 8, 0]), basicMatte);
export let teapot0GraphicsObject = new GraphicsObject(teapotVerts, WebGL2RenderingContext.TRIANGLES, 7, new Vector3([0, 8, 0]));
export let teapot1GraphicsObject = new GraphicsObject(teapotVerts, WebGL2RenderingContext.TRIANGLES, 7, new Vector3([0, 4, 1.0]), metalPurple);

let bearVerts = require('./vertex-objects/bear-normal-vertices.json');
export let bearGraphicsObject = new GraphicsObject(bearVerts, WebGL2RenderingContext.TRIANGLES, 7, new Vector3([0, 3, 0.0]), mirrorBlue);

let bunnyVerts = require('./vertex-objects/bunny-normal-vertices.json');
export let bunnyGraphicsObject = new GraphicsObject(bunnyVerts, WebGL2RenderingContext.TRIANGLES, 7, new Vector3([1.5, 5, 0]), basicRed);

let sphereVerts = require('./vertex-objects/sphere-normal-vertices.json');
export let sphereGraphicsObject = new GraphicsObject(sphereVerts, WebGL2RenderingContext.TRIANGLES, 7, new Vector3([-3, 10, 0]), basicMatte);
export let sphere1GraphicsObject = new GraphicsObject(sphereVerts, WebGL2RenderingContext.TRIANGLES, 7, new Vector3([3, 10, 0]));

export let sphere1GraphicsObject1 = new GraphicsObject(sphereVerts, WebGL2RenderingContext.TRIANGLES, 7, new Vector3([3, 10, 0]));
export let sphere2GraphicsObject = new GraphicsObject(sphereVerts, WebGL2RenderingContext.TRIANGLES, 7, new Vector3([0, 8, 0]), mirrorRed);
export let sphere3GraphicsObject = new GraphicsObject(sphereVerts, WebGL2RenderingContext.TRIANGLES, 7, new Vector3([-3, 10, 0]), mirrorBlue);

export let sphere4GraphicsObject = new GraphicsObject(sphereVerts, WebGL2RenderingContext.TRIANGLES, 7, new Vector3([0, 5, 0]), perfectMirror);
export let sphere5GraphicsObject = new GraphicsObject(sphereVerts, WebGL2RenderingContext.TRIANGLES, 7, new Vector3([-3, -4, 0]), basicMaterial);
export let sphere6GraphicsObject = new GraphicsObject(sphereVerts, WebGL2RenderingContext.TRIANGLES, 7, new Vector3([4, -3, 0]), basicMaterial);