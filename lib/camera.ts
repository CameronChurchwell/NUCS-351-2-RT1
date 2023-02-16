import { Matrix4, Vector3 } from "./cuon-matrix-quat03";
import { Geometry } from "./geometry";
import { CallbackMap } from "./user-input";
import { ImageBuffer } from './buffer';
import { Perspective } from "./perspective";

let trueUpVec = new Vector3([0, 0, 1]);

export class Camera {
    position: Vector3;
    upDirection: Vector3;
    lookDirection: Vector3;
    perspective: Perspective;
    strafeDirection: Vector3;
    velocity: Vector3; //relative to look direction
    rotationalVelocity: Matrix4;
    callbackMap: CallbackMap;

    constructor(position: Vector3, upDirection: Vector3, lookDirection: Vector3, perspective: Perspective) {
        this.position = position;
        this.upDirection = upDirection;
        this.lookDirection = lookDirection;
        this.perspective = perspective;
        this.strafeDirection = lookDirection.cross(upDirection);

        this.velocity = new Vector3([0, 0, 0]);
        this.rotationalVelocity = new Matrix4();
        //Note we need to bind for the ballbacks to be able to access 'this'
        this.callbackMap = new Map([
            ['keyDown', this.keyDown.bind(this)],
            ['keyUp', this.keyUp.bind(this)]
        ]);
    }

    solve(timestep: number = 1) {
        let worldVelocity = this.lookDirection.scale(this.velocity.elements[0]);
        let strafeVec = this.lookDirection.cross(this.upDirection);
        worldVelocity.addInPlace(strafeVec.normScale(this.velocity.elements[1]));

        this.position.addInPlace(worldVelocity.scale(timestep));

        let original = new Vector3(this.lookDirection);
        //TODO add rotation scaling by timestep
        //update look direction
        this.lookDirection = this.rotationalVelocity.multiplyVector3(this.lookDirection).normalize();

        //update up direction

        this.upDirection = this.rotationalVelocity.multiplyVector3(this.upDirection).normalize();

        //update strafe direction
        this.strafeDirection = this.lookDirection.cross(this.upDirection).normalize();

        //TODO make this constraint optional/tunable?
        let cos = this.lookDirection.dot(trueUpVec);
        if (cos > 0.9 || cos < -0.9) {
            this.lookDirection.copyFrom(original);
        }
    }

    applyTo(mvpMat: Matrix4) {
        mvpMat = this.perspective.setMatrix(mvpMat);
        return mvpMat.lookAtVecs(this.position, this.lookDirection, this.upDirection);
    }

    makeRayFunction(centerVec: Vector3, dx: number, dy: number) {
        return (x: number, y: number) => {
            let ray = new Vector3(centerVec);
            ray.addScaledInPlace(this.strafeDirection, dx*x);
            ray.addScaledInPlace(this.upDirection, dy*y);
            return ray;
        }
    }

    *makeRayGenerator(xCount: number, yCount: number, AA: number = 1, centerVec?: Vector3, dimensions?: [width: number, height: number]) {
        let [width, height] = dimensions ?? this.perspective.getFrustumSize();
        centerVec = centerVec ?? this.lookDirection;
        let dx = width/(xCount-1);
        let dy = height/(yCount-1);
        let rayFunction = this.makeRayFunction(centerVec, dx, dy);
        for (let j=yCount/2; j>-yCount/2; j--) {
            for (let i=xCount/2; i>-xCount/2; i--) {
                if (AA == 1) { //TODO remove repeated conditional?
                    yield* [rayFunction(i, j)];
                } else {
                    yield* this.makeRayGenerator(AA, AA, 1, rayFunction(i, j), [dx, dy]);
                }
            }
        }
    }

    traceGeometry(geomObject: Geometry, img: ImageBuffer, AA: number = 1) {
        let rayGen = this.makeRayGenerator(img.width, img.height, AA);
        let AANumSquares = Math.pow(AA, 2);
        let average = new Uint8Array([0, 0, 0]);
        for (let j=img.height-1; j>=0; j--) {
            for (let i=img.width-1; i>=0; i--) {
                average[0] = 0;
                average[1] = 0;
                average[2] = 0;
                for (let k=0; k<AANumSquares; k++) {
                    let ray = rayGen.next().value as Vector3;
                    // console.log(ray.elements);
                    let intersect = geomObject.intersect(this.position, ray);
                    let color: Uint8Array;
                    if (intersect) {
                        // console.log(ray.elements, intersect.elements);
                        // img.set(i, j, geomObject.hit(intersect));
                        color = geomObject.hit(intersect);
                    } else {
                        // img.set(i, j, new Uint8Array([0, 0, 0]));
                        color = new Uint8Array([0, 0, 0]);
                    }

                    average[0] += color[0]/AANumSquares;
                    average[1] += color[1]/AANumSquares;
                    average[2] += color[2]/AANumSquares;
                }
                img.set(i, j, average);
            }
        }
    }

    keyDown(kev: KeyboardEvent) {
        switch(kev.code) {
            case "KeyW":
                this.velocity.elements[0] = 0.1;
                break;
            case "KeyS":
                this.velocity.elements[0] = -0.1;
                break;
            case "KeyA":
                this.velocity.elements[1] = -0.1;
                break;
            case "KeyD":
                this.velocity.elements[1] = 0.1;
                break;
            case "ArrowLeft":
                this.rotationalVelocity.setRotate(1, 0, 0, 1);
                break
            case "ArrowRight":
                this.rotationalVelocity.setRotate(1, 0, 0, -1);
                break
            case "ArrowUp":		
                this.rotationalVelocity.setRotate(1, this.strafeDirection.elements[0], this.strafeDirection.elements[1], this.strafeDirection.elements[2]);
                break;
            case "ArrowDown":
                this.rotationalVelocity.setRotate(-1, this.strafeDirection.elements[0], this.strafeDirection.elements[1], this.strafeDirection.elements[2]);
                break;
            default:
                break;
        }
    }

    keyUp(kev: KeyboardEvent) {
        switch(kev.code) {
            case "KeyW":
                this.velocity.elements[0] = 0;
                break;
            case "KeyS":
                this.velocity.elements[0] = 0;
                break;
            case "KeyA":
                this.velocity.elements[1] = 0;
                break;
            case "KeyD":
                this.velocity.elements[1] = 0;
                break;
            case "ArrowLeft":
                this.rotationalVelocity.setIdentity();
                break
            case "ArrowRight":
                this.rotationalVelocity.setIdentity();
                break
            case "ArrowUp":		
                this.rotationalVelocity.setIdentity();
                break;
            case "ArrowDown":
                this.rotationalVelocity.setIdentity();
                break;
            default:
                break;
        }
    }
}