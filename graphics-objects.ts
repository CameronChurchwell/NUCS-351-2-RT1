import { Vector3 } from "./lib/cuon-matrix-quat03";
import { GraphicsObject } from "./lib/graphics-object";
import { basicMatte } from "./lib/material";
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
export let teapotGraphicsObject = new GraphicsObject(teapotVerts, WebGL2RenderingContext.TRIANGLES, 7, new Vector3([0, 8, 0]));

let bearVerts = require('./vertex-objects/bear-normal-vertices.json');
export let bearGraphicsObject = new GraphicsObject(bearVerts, WebGL2RenderingContext.TRIANGLES, 7);

let sphereVerts = require('./vertex-objects/sphere-normal-vertices.json');
export let sphereGraphicsObject = new GraphicsObject(sphereVerts, WebGL2RenderingContext.TRIANGLES, 7, new Vector3([-3, 10, 0]), basicMatte);
export let sphere1GraphicsObject = new GraphicsObject(sphereVerts, WebGL2RenderingContext.TRIANGLES, 7, new Vector3([3, 10, 0]));