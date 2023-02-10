import { Vector3 } from "../lib/cuon-matrix-quat03";
import { ColorChangeGenerator, ForceGeneratorBoid, ForceGeneratorEvadePlanar, ForceGeneratorParametric} from "../lib/change-generator";
import { GraphicsObject } from "../lib/graphics-object";
import { GraphicsSystem } from "../lib/graphics-system";
import { ParticleAttributes } from "../lib/particle-attributes";
import { ParticleSystem } from "../lib/particle-system";
import { drag, floor, gravity, naive } from "./common-definitions";
let saucerVerts = require("../vertex-objects/saucer-vertices.json");


let numParticles = 200;

let maxRadius = 20;
let maxSpeed = 2;

let graphicsObject = new GraphicsObject(saucerVerts, WebGLRenderingContext.TRIANGLES, 7);

let initialStates: ParticleAttributes[] = [];
for (let i = 0; i < numParticles; i++) {
    let initialRadius = maxRadius * Math.random();
    let initialAngle = 2 * Math.random() * Math.PI;
    let initialX = initialRadius * Math.cos(initialAngle);
    let initialY = initialRadius * Math.sin(initialAngle);
    let initialPosition = new Vector3([initialX, initialY, 5]);
    let initialColor = new Vector3([0.19, 0.8, 0.19]);
    let initialSpeed = Math.random() * maxSpeed;
    let initialVelocity = Vector3.random();
    initialVelocity.elements[2] = 0; //remove up and down movement
    initialVelocity.normScale(initialSpeed);
    initialStates.push(new ParticleAttributes(initialPosition, initialVelocity, 0.1, initialColor));
}

let constraints = [];

let containmentFactor = 0.01;
function containementForce(v: Vector3) {
    let v_xy = new Vector3(v);
    v_xy.elements[2] = 0;
    v_xy.scaleInPlace(-1*containmentFactor);
    return v_xy;
}
let center = new Vector3([0, 0, 0]);
let containment = new ForceGeneratorParametric(containementForce, center);
let boid = new ForceGeneratorBoid(2.5, 0.5, 0.5, 1);


export function makeBoidSystem(graphicsSystem: GraphicsSystem, userPosition: () => Vector3) {
    let evade = new ForceGeneratorEvadePlanar(userPosition, 10);
    let changeGenerators = [boid, drag, containment, evade];
    let boidSystem = new ParticleSystem(numParticles, initialStates, graphicsObject, changeGenerators, constraints, naive, graphicsObject.numVertices);
    boidSystem.registerGraphicsSystem(graphicsSystem);
    return boidSystem;
}