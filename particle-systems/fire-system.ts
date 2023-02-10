import { ConstraintKill } from "../lib/constraint";
import { Vector3 } from "../lib/cuon-matrix-quat03";
import { ColorChangeGenerator, ForceGeneratorParametric, ForceGeneratorTime, MassChangeGenerator } from "../lib/change-generator";
import { GraphicsObject } from "../lib/graphics-object";
import { GraphicsSystem } from "../lib/graphics-system";
import { ParticleAttributes } from "../lib/particle-attributes";
import { ParticleSystem } from "../lib/particle-system";
import { breeze, drag, floor, gravity, naive } from "./common-definitions";
import { makeMiniCube } from "../vertex-objects/minicube-vertices";
import { boxGraphicsObject } from "../graphics-objects";


let numParticles = 1000;

let maxRadius = 0.75;
let centeringConstant = 0.0;
let brightnessConstant = 0.8;

// let graphicsObject = new GraphicsObject(new Float32Array([0, 0, 0, 1.0, 1.0, 1.0, 1.0]), 0x0000, 7);
let cubeScaleFactor = 0.025;
let graphicsObject = new GraphicsObject(makeMiniCube(new Vector3([-cubeScaleFactor, -cubeScaleFactor, -cubeScaleFactor]), new Vector3([cubeScaleFactor, cubeScaleFactor, cubeScaleFactor])), WebGLRenderingContext.TRIANGLES, 7);

let killBox = new ConstraintKill(new Vector3([-1, -1, -1]), new Vector3([1, 1, 1]));
let constraints = [floor, killBox];

let initialStates: ParticleAttributes[] = [];
for (let i = 0; i < numParticles; i++) {
    let initialRadius = maxRadius * (Math.pow(Math.random()-centeringConstant, 2)+centeringConstant);
    let initialAngle = 2 * Math.random() * Math.PI;
    let initialX = initialRadius * Math.cos(initialAngle);
    let initialY = initialRadius * Math.sin(initialAngle);
    let initialPosition = new Vector3([initialX, initialY, -1]);
    let initialColor = new Vector3([1.0, 0.9, 0.25]);
    initialColor.scaleInPlace((maxRadius-initialRadius)/maxRadius+brightnessConstant);
    initialColor.clampInPlace(0, 1);
    initialStates.push(new ParticleAttributes(initialPosition, null, 0.13, initialColor));
}

let maxLaunchForce = new Vector3([0.5, 0.5, 7]);
function randomLaunch(v: Vector3) {
    if (v.elements[2] < 0) {
        let u = Vector3.random();
        u.elements[0] *= maxLaunchForce.elements[0];
        u.elements[1] *= maxLaunchForce.elements[1];
        u.elements[2] *= maxLaunchForce.elements[2];
        return u;
    } else {
        return new Vector3([0, 0, 0]);
    }
}
let randomLaunchForce = new ForceGeneratorParametric(randomLaunch, new Vector3([0, 0, 0]));

let massLoss = new MassChangeGenerator(-0.005);

let colorDarkening = new ColorChangeGenerator(new Vector3([-.2, -1, -.3]));

let changeGenerators = [randomLaunchForce, gravity, breeze, massLoss, colorDarkening, drag];

export function makeFireSystem(graphicsSystem: GraphicsSystem) {
    let fireSystem = new ParticleSystem(numParticles, initialStates, graphicsObject, changeGenerators, constraints, naive, graphicsObject.numVertices);
    fireSystem.registerGraphicsSystem(graphicsSystem);
    return fireSystem;
}