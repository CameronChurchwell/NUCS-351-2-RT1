import { Vector3 } from "./cuon-matrix-quat03";

export abstract class Geometry {
    intersect(raySourcePosition: Vector3, rayDirection: Vector3): Vector3 | null {
        throw new Error("Not implemented!");
    };

    hit(position: Vector3): Uint8Array {
        throw new Error("Not implemented!");
    }
}

export class PlaneGeometry extends Geometry {
    offsetVector: Vector3;
    normalVector: Vector3;
    color: Uint8Array;

    constructor(offsetVector: Vector3, normalVector: Vector3, color: Uint8Array) {
        super();
        this.offsetVector = offsetVector;
        this.normalVector = normalVector;
        this.color = color;
    }

    intersect(raySourcePosition: Vector3, rayDirection: Vector3): Vector3 | null {
        let totalOffset = this.offsetVector.subtract(raySourcePosition);
        let numerator = totalOffset.dot(this.normalVector);
        let denominator = rayDirection.dot(this.normalVector);
        if (denominator == 0) {
            return null;
        } else {
            let t = numerator/denominator;
            if (t < 0) {
                return null;
            } else { 
                //TODO do we ned to add here?
                return rayDirection.scale(t).add(raySourcePosition);
            }
        }
    }

    hit(position: Vector3): Uint8Array {
        return this.color;
    }
}

const lineWidth = 0.1;
const backgroundColor = new Uint8Array([0, 0, 0]);
export class GroundPlaneGeometry extends PlaneGeometry {
    hit(position: Vector3): Uint8Array {
        let [x, y] = position.elements.slice(0, 2);
        x = Math.abs(x);
        y = Math.abs(y);
        if (x%1 < lineWidth || y%1 < lineWidth) {
            return this.color;
        }
        return backgroundColor;
    }
}

// export class TriangleGoemetry extends Geometry {
//     vertex0: Vector3;
//     vertex1: Vector3;
//     vertex2: Vector3;

//     intersect(raySourcePosition: Vector3, rayDirection: Vector3): Vector3 {
//     }
// }