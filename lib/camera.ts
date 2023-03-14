import { Matrix4, Vector3 } from "./cuon-matrix-quat03";
import { Geometry, Intersection } from "./geometry";
import { CallbackMap } from "./user-input";
import { ImageBuffer } from './buffer';
import { Perspective } from "./perspective";
import { Light } from "./light";
import { Material } from "./material";

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
    reusableRay: Vector3;
    numBounces: number;

    constructor(position: Vector3, upDirection: Vector3, lookDirection: Vector3, perspective: Perspective) {
        this.position = position;
        this.upDirection = upDirection;
        this.lookDirection = lookDirection;
        this.perspective = perspective;
        this.strafeDirection = new Vector3();
        lookDirection.cross(upDirection, this.strafeDirection);
        // this.strafeDirection = lookDirection.cross(upDirection);

        this.velocity = new Vector3([0, 0, 0]);
        this.rotationalVelocity = new Matrix4();
        //Note we need to bind for the ballbacks to be able to access 'this'
        this.callbackMap = new Map([
            ['keyDown', this.keyDown.bind(this)],
            ['keyUp', this.keyUp.bind(this)]
        ]);

        this.reusableRay = new Vector3([0, 0, 0]);
    }

    solve(timestep: number = 1) {
        this.position.addScaledInPlace(this.lookDirection, this.velocity.elements[0] * timestep);
        this.position.addScaledInPlace(this.strafeDirection, this.velocity.elements[1] * timestep);

        this.reusableRay.copyFrom(this.lookDirection);
        //TODO add rotation scaling by timestep
        //update look direction
        this.lookDirection = this.rotationalVelocity.multiplyVector3(this.lookDirection);
        this.lookDirection.normalize();

        //update up direction
        this.upDirection = this.rotationalVelocity.multiplyVector3(this.upDirection);
        this.upDirection.normalize();

        //update strafe direction
        this.lookDirection.cross(this.upDirection, this.strafeDirection);
        this.strafeDirection.normalize();

        //TODO make this constraint optional/tunable?
        let cos = this.lookDirection.dot(trueUpVec);
        if (cos > 0.9 || cos < -0.9) {
            this.lookDirection.copyFrom(this.reusableRay);
        }
    }

    applyTo(mvpMat: Matrix4) {
        mvpMat = this.perspective.setMatrix(mvpMat);
        return mvpMat.lookAtVecs(this.position, this.lookDirection, this.upDirection);
    }

    makeRayFunction(centerVec: Vector3, dx: number, dy: number, jitter: number = 0) {
        return (x: number, y: number) => {
            // let ray = new Vector3(centerVec);
            let ray = this.reusableRay;
            ray.copyFrom(centerVec);
            //assumes that strafe and up are unit vectors
            ray.addScaledInPlace(this.strafeDirection, dx*x);
            ray.addScaledInPlace(this.upDirection, dy*y);
            if (jitter) {
                let xJitter = (Math.random()*2 - 1)*dx*jitter/2;
                let yJitter = (Math.random()*2 - 1)*dy*jitter/2;
                ray.addScaledInPlace(this.strafeDirection, xJitter);
                ray.addScaledInPlace(this.upDirection, yJitter);
            }
            return ray;
        }
    }

    *makeRayGenerator(xCount: number, yCount: number, AA: number = 1, jitter: number = 0, centerVec?: Vector3, dimensions?: [width: number, height: number]) {
        let [width, height] = dimensions ?? this.perspective.getFrustumSize();
        centerVec = centerVec ?? this.lookDirection;
        let dx = width/(xCount-1);
        let dy = height/(yCount-1);
        let rayFunction = this.makeRayFunction(centerVec, dx, dy, jitter);
        if (AA == 1) {
            for (let j=yCount/2; j>-yCount/2; j--) {
                for (let i=xCount/2; i>-xCount/2; i--) {
                    yield* [rayFunction(i, j)];
                }
            }
        } else {
            for (let j=yCount/2; j>-yCount/2; j--) {
                for (let i=xCount/2; i>-xCount/2; i--) {
                    yield* this.makeRayGenerator(AA, AA, 1, jitter, rayFunction(i, j), [dx, dy]);
                }
            }
        }
    }

    traceGeometry(geomObject: Geometry, img: ImageBuffer, AA: number = 1, jitter: number = 0, numReflections: number = 1, lights: Light[]) {
        let rayGen = this.makeRayGenerator(img.width, img.height, AA, jitter);
        let AANumSquares = AA * AA;
        let average = new Uint8Array([0, 0, 0]);
        let color = new Uint8Array([0, 0, 0]);
        let material: Material
        let blank = new Uint8Array([0, 0, 0]);
        
        let reflection: Vector3 = new Vector3();
        let lightVec: Vector3 = new Vector3();
        let normal: Vector3 = new Vector3();
        let mirrorReflection: Vector3 = new Vector3();
        let otherColor = new Uint8Array(3);
        let otherMaterial: Material = new Material();
        let epsilon = 1e-3;
        let mixingConstant = 0;

        for (let j=img.height-1; j>=0; j--) {
            for (let i=img.width-1; i>=0; i--) {
                average[0] = 0;
                average[1] = 0;
                average[2] = 0;
                for (let k=0; k<AANumSquares; k++) {
                    let ray = rayGen.next().value as Vector3;
                    let intersect = geomObject.intersect(this.position, ray);
                    if (intersect) { //ray hit something
                        color.set(blank); //color is blank until lit
                        material = intersect[1].hit(intersect);
                        for (let light of lights) { //iterate lights
                            //get light vector
                            lightVec.copyFrom(light.position);
                            lightVec.subtractInPlace(intersect[0]);
                            let lightDistance = lightVec.magnitude();
                            lightVec.normalize();
    
                            //detect light blocking intersections
                            reflection.copyFrom(intersect[0]);
                            reflection.addScaledInPlace(lightVec, epsilon);
                            let lightIntersect = geomObject.intersect(reflection, lightVec);
                            if (lightIntersect && lightIntersect[0].distanceFrom(reflection) < lightDistance) {
                                continue; //light is blocked, continue to next light
                            }
    
                            //compute reflection vector
                            normal.copyFrom(intersect[1].surfaceNormal(intersect[0]));
                            reflection.copyFrom(normal);
                            reflection.scaleInPlace(2*normal.dot(lightVec));
                            reflection.subtractInPlace(lightVec);
    
                            //compute phong lighting constants
                            let nDotL = Math.max(lightVec.dot(normal), 0);
                            let rDotV = Math.min(reflection.dot(this.lookDirection), 0);
                            let specular = Math.pow(rDotV, material.shiny);

                            //update color based on material properties, lighting values, and phong computed phong constants.
                            material.addPhong(light, nDotL, specular, color);
                        }

                        //compute mirror intersection
                        mixingConstant = material.mirror;
                        
                        lightVec.copyFrom(ray); //get incoming
                        lightVec.scaleInPlace(-1); //flip incoming
                        mirrorReflection.copyFrom(normal); //start with normal
                        mirrorReflection.scaleInPlace(2*normal.dot(lightVec)); //get reflection of incoming
                        mirrorReflection.subtractInPlace(lightVec); //finish getting reflection
                        otherColor.set([0, 0, 0]); //other color is blank until lit
                        for (let i=numReflections; i>=1; i--) { //iterate bounces
                            //compute bounce intersect
                            normal.copyFrom(intersect[0]); //get current position
                            normal.addScaledInPlace(mirrorReflection, epsilon); //add a tiny bit so no self intersection
                            intersect = geomObject.intersect(normal, mirrorReflection); //cast out ray
                            if (intersect) {
                                otherMaterial = intersect[1].hit(intersect);
                                for (let light of lights) {
                                    //get light vec
                                    lightVec.copyFrom(light.position); //get light position
                                    lightVec.subtractInPlace(intersect[0]); //get vector pointing at ight
                                    let lightDistance = lightVec.magnitude(); //get distance to light
                                    lightVec.normalize();

                                    //detect light blocking intersections
                                    reflection.copyFrom(intersect[0]); //get current position
                                    reflection.addScaledInPlace(lightVec, epsilon); //add a tiny bit so no self intersection
                                    let lightIntersect = geomObject.intersect(reflection, lightVec); // get intersect
                                    if (lightIntersect && lightIntersect[0].distanceFrom(reflection) < lightDistance) {
                                        //we hit something, go to next light.
                                        continue;
                                    }

                                    //compute light reflection vector
                                    normal.copyFrom(intersect[1].surfaceNormal(intersect[0]));
                                    reflection.copyFrom(normal);
                                    reflection.scaleInPlace(2*normal.dot(lightVec));
                                    reflection.subtractInPlace(lightVec);

                                    //compute phong lighting constants
                                    let nDotL = Math.max(lightVec.dot(normal), 0);
                                    let rDotV = Math.min(reflection.dot(this.lookDirection), 0);
                                    let specular = Math.pow(rDotV, otherMaterial.shiny);
                                    otherMaterial.addPhong(light, nDotL, specular, otherColor);
                                }
                            lightVec.copyFrom(mirrorReflection);
                            lightVec.scaleInPlace(-1);
                            normal.copyFrom(intersect[1].surfaceNormal(intersect[0]));
                            mirrorReflection.copyFrom(normal);
                            mirrorReflection.scaleInPlace(2*normal.dot(lightVec));
                            mirrorReflection.subtractInPlace(lightVec);
                            } else { //no more bounces
                                i = 0; //finish up
                            }

                            //now that we know reflection (otherColor), add to color
                            color[0] = (1-mixingConstant) * color[0] + mixingConstant * otherColor[0];
                            color[1] = (1-mixingConstant) * color[1] + mixingConstant * otherColor[1];
                            color[2] = (1-mixingConstant) * color[2] + mixingConstant * otherColor[2];

                            //setup next
                            mixingConstant = mixingConstant * otherMaterial.mirror;
                        } //end mirror reflection
                    } else {
                        color.set(blank);
                    }

                    average[0] += color[0]/AANumSquares;
                    average[1] += color[1]/AANumSquares;
                    average[2] += color[2]/AANumSquares;
                }
                img.set(i, j, average);
            }
            if (j % Math.floor(img.height / 10) == 0) {
                console.log(j/img.height);
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