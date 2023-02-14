import { GraphicsObject } from "./lib/graphics-object";
import { makeBox } from "./vertex-objects/box-vertices";
import { makeGroundGrid } from "./vertex-objects/ground-vertices";

//TODO figure out how to have LINES instead of 0x0001

let floatsPerVertex = 7;

let gndVerts = makeGroundGrid();
export let groundGraphicsObject = new GraphicsObject(gndVerts, 0x0001, floatsPerVertex); //lines

let boxVerts = makeBox();
export let boxGraphicsObject = new GraphicsObject(boxVerts, 0x0002, floatsPerVertex);

let particleVerts = new Float32Array([0, 0, 0, 0, 1, 1, 1]);
export let particleGraphicsObject = new GraphicsObject(particleVerts, 0x0000, floatsPerVertex);