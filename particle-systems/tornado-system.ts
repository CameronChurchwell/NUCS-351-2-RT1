import { Constraint, ConstraintKill } from "../lib/constraint";
import { Vector3 } from "../lib/cuon-matrix-quat03";
import { GraphicsObject } from "../lib/graphics-object";
import { GraphicsSystem } from "../lib/graphics-system";
import { ParticleAttributes } from "../lib/particle-attributes";
import { drag, floor, gravity, naive, wind } from "./common-definitions";
import { particleGraphicsObject } from "../graphics-objects";
import { ParticleSystem } from "../lib/particle-system";
import { ForceGeneratorParametric } from "../lib/change-generator";
import { makeMiniCube } from "../vertex-objects/minicube-vertices";

let numParticles = 4000;

let maxRadius = 0.75;
let centeringConstant = 0.0;
let brightnessConstant = 0.8;

let cubeScaleFactor = 0.03;
let graphicsObject = new GraphicsObject(makeMiniCube(new Vector3([-cubeScaleFactor, -cubeScaleFactor, -cubeScaleFactor]), new Vector3([cubeScaleFactor, cubeScaleFactor, cubeScaleFactor])), WebGLRenderingContext.TRIANGLES, 7);

let killBox = new ConstraintKill(new Vector3([5, 5, -1]), new Vector3([9, 9, 3]));
let constraints = [floor, killBox];

let initialStates: ParticleAttributes[] = [];
for (let i = 0; i < numParticles; i++) {
    let initialRadius = maxRadius * (Math.pow(Math.random()-centeringConstant, 2)+centeringConstant);
    let initialAngle = 2 * Math.random() * Math.PI;
    let initialX = initialRadius * Math.cos(initialAngle);
    let initialY = initialRadius * Math.sin(initialAngle);
    let initialPosition = new Vector3([initialX+7, initialY+7, -1]);
    let initialColor = new Vector3([.75, .75, .75]);
    initialStates.push(new ParticleAttributes(initialPosition, null, 1.0, initialColor));
}

let upVec = new Vector3([0, 0, 1])
function tornadoField(v: Vector3) {
    let tangent = v.cross(upVec);
    let up = upVec.scale(10);
    tangent.scaleInPlace(2);
    return up.add(tangent);
}
let tornado = new ForceGeneratorParametric(tornadoField, new Vector3([7, 7, 0]));

let maxLaunchForce = new Vector3([2.0, 2.0, 10.0]);
let halfVec = new Vector3([0.5, 0.5, 0.0]);
function randomLaunch(v: Vector3) {
    if (v.elements[2] < 0) {
        let u = Vector3.random().subtract(halfVec);
        u.elements[0] *= maxLaunchForce.elements[0];
        u.elements[1] *= maxLaunchForce.elements[1];
        u.elements[2] *= maxLaunchForce.elements[2];
        return u;
    } else {
        return new Vector3([0, 0, 0]);
    }
}
let randomLaunchForce = new ForceGeneratorParametric(randomLaunch, new Vector3([7, 7, 0]));
let forceGenerators = [gravity, drag, tornado, randomLaunchForce];


export function makeTornadoSystem(graphicsSystem: GraphicsSystem) {
    let tornadoSystem = new ParticleSystem(numParticles, initialStates, graphicsObject, forceGenerators, constraints, naive, graphicsObject.numVertices);
    tornadoSystem.registerGraphicsSystem(graphicsSystem);
    return tornadoSystem;
}
