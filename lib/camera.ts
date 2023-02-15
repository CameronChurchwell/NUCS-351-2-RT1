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

    *makeRayGenerator(xCount: number, yCount: number) {
        let [width, height] = this.perspective.getFrustumSize();
        let dx = width/(xCount-1);
        let dy = height/(yCount-1);
        for (let j=yCount/2; j>-yCount/2; j--) {
            for (let i=xCount/2; i>-xCount/2; i--) {
                let ray = new Vector3([0, 0, 0]);
                ray.copyFrom(this.lookDirection);
                ray.addInPlace(this.strafeDirection.normScale(dx*i));
                ray.addInPlace(this.upDirection.normScale(dy*j));
                yield ray;
            }
        }
    }

    traceGeometry(geomObject: Geometry, img: ImageBuffer) {
        let rayGen = this.makeRayGenerator(img.width, img.height);
        for (let j=img.height-1; j>=0; j--) {
            for (let i=img.width-1; i>=0; i--) {
                let ray = rayGen.next().value as Vector3;
                let intersect = geomObject.intersect(this.position, ray);
                if (intersect) {
                    // console.log(ray.elements, intersect.elements);
                    img.set(i, j, geomObject.hit(intersect));
                } else {
                    img.set(i, j, new Uint8Array([0, 0, 0]));
                }
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