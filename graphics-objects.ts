import { GraphicsObject } from "./lib/graphics-object";
import { makeBox } from "./vertex-objects/box-vertices";
import { makeGroundGrid } from "./vertex-objects/ground-vertices";
import { makeMiniCube } from "./vertex-objects/minicube-vertices";

//TODO figure out how to have LINES instead of 0x0001

let floatsPerVertex = 7;

let gndVerts = makeGroundGrid();
export let groundGraphicsObject = new GraphicsObject(gndVerts, 0x0001, floatsPerVertex); //lines

let textureVerts = require('./vertex-objects/texture-vertices.json');
export let textureGraphicsObject = new GraphicsObject(textureVerts, WebGL2RenderingContext.TRIANGLE_STRIP, 4);

let boxVerts = makeBox();
export let boxGraphicsObject = new GraphicsObject(boxVerts, 0x0002, floatsPerVertex);

let cubeVerts = makeMiniCube();
export let cubeGraphicsObject = new GraphicsObject(cubeVerts, WebGL2RenderingContext.TRIANGLES, 7);

let teapotVerts = require('./vertex-objects/teapot-vertices.json');
export let teapotGraphicsObject = new GraphicsObject(teapotVerts, WebGL2RenderingContext.TRIANGLES, 7);

// let particleVerts = new Float32Array([0, 0, 0, 0, 1, 1, 1]);
// export let particleGraphicsObject = new GraphicsObject(particleVerts, 0x0000, floatsPerVertex);