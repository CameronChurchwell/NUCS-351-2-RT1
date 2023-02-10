import { ConstraintFixed } from '../lib/constraint';
import { Vector3 } from '../lib/cuon-matrix-quat03';
import { ForceGeneratorDrag, ForceGeneratorSpringDamped } from '../lib/change-generator';
import { ParticleAttributes } from '../lib/particle-attributes';
import { ParticleSystem } from '../lib/particle-system';
import {backward, breeze, drag, euler, floor, fmid, gravity, lightBreeze, naive} from './common-definitions';
import { GraphicsObject } from '../lib/graphics-object';
import { makeMiniCube } from '../vertex-objects/minicube-vertices';

let numParticles = 100;

let graphicsObject = new GraphicsObject(makeMiniCube(), WebGL2RenderingContext.TRIANGLES, 7);

let chainStart = new Vector3([-2, -5, 5]);
let chainEnd = new Vector3([2, -5, 5]);
let chainDirection = chainEnd.add(chainStart.scale(-1));
let chainLength = chainDirection.magnitude();
let chainStep = chainLength / (numParticles-1);
let springDamped = new ForceGeneratorSpringDamped(30, chainStep, 0.0, true);
let fixed = new ConstraintFixed([0, numParticles-1], [chainStart, chainEnd]);

let smallDrag = new ForceGeneratorDrag(0.015);

let forceGenerators = [springDamped, gravity, smallDrag, lightBreeze];
let constraints = [fixed, floor];

let initialStates: ParticleAttributes[] = [];
for (let i=0; i<numParticles; i++) {
    initialStates.push(new ParticleAttributes(chainDirection.normScale(chainStep * i).add(chainStart), new Vector3([0, 0, 0]), 0.01, new Vector3([1.0, 1.0, 1.0])));
}


export function makeSpringSystem(graphicsSystem) {
    let springSystem = new ParticleSystem(numParticles, initialStates, graphicsObject, forceGenerators, constraints, backward, graphicsObject.numVertices);
    springSystem.registerGraphicsSystem(graphicsSystem);
    return springSystem;
}