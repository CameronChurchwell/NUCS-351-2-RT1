import { Vector3 } from "./cuon-matrix-quat03";

export type Intersection = [Vector3, Geometry] | null

export abstract class Geometry {
    intersect(raySourcePosition: Vector3, rayDirection: Vector3): Intersection {
        throw new Error("Not implemented!");
    };

    hit(intersection: Intersection): Uint8Array {
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

    intersect(raySourcePosition: Vector3, rayDirection: Vector3): Intersection {
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
                rayDirection.scaleInPlace(t);
                rayDirection.addInPlace(raySourcePosition);
                return [rayDirection, this];
            }
        }
    }

    hit(intersection: Intersection): Uint8Array {
        return this.color;
    }
}

const lineWidth = 0.05;
const backgroundColor = new Uint8Array([0, 0, 0]);
export class GridPlaneGeometry extends PlaneGeometry {
    hit(intersection: Intersection): Uint8Array {
        let [x, y] = intersection[0].elements.slice(0, 2);
        x = Math.abs(x)+0.5;
        y = Math.abs(y)+0.5;
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