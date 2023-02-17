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
        this.normalVector = normalVector.normalize();
        this.color = color;
    }

    intersect(raySourcePosition: Vector3, rayDirection: Vector3): Intersection {
        let totalOffset = this.offsetVector.subtract(raySourcePosition);
        let numerator = totalOffset.dot(this.normalVector);
        let denominator = rayDirection.dot(this.normalVector);
        if (numerator == 0) {
            return [this.normalVector.scale(this.normalVector.dot(this.offsetVector)), this]
        }
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
export class GridPlaneGeometry extends PlaneGeometry {

    intersect(raySourcePosition: Vector3, rayDirection: Vector3): Intersection {
        let intersection = super.intersect(raySourcePosition, rayDirection);
        if (intersection) {
            let [x, y] = intersection[0].elements.slice(0, 2);
            x = Math.abs(x)+0.5;
            y = Math.abs(y)+0.5;
            if (x%1 < lineWidth || y%1 < lineWidth) {
                return intersection;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    // hit(intersection: Intersection): Uint8Array {
    //     let [x, y] = intersection[0].elements.slice(0, 2);
    //     x = Math.abs(x)+0.5;
    //     y = Math.abs(y)+0.5;
    //     if (x%1 < lineWidth || y%1 < lineWidth) {
    //         return this.color;
    //     }
    //     return backgroundColor;
    // }
}

export class DiscGeometry extends Geometry {
    center: Vector3;
    radius: number;
    testPlane: PlaneGeometry;
    color: Uint8Array;

    constructor(center: Vector3, normalVector: Vector3, radius: number, color: Uint8Array) {
        super();
        this.center = center;
        this.radius = radius;
        this.color = color;
        this.testPlane = new PlaneGeometry(center, normalVector, new Uint8Array([0, 0, 0]));
    }

    intersect(raySourcePosition: Vector3, rayDirection: Vector3): Intersection {
        // this.testPlane.normalVector.copyFrom(rayDirection).normalize(); //this is for a sphere
        let intersection = this.testPlane.intersect(raySourcePosition, rayDirection);
        if (intersection) {
            let planePosition = intersection[0];
            let difference = planePosition.subtract(this.center);
            if (difference.magnitude() < this.radius) {
                return [planePosition, this];
            }
        }
    }

    hit(intersection: [Vector3, Geometry]): Uint8Array {
        return this.color;
    }
}

// export class TriangleGoemetry extends Geometry {
//     vertex0: Vector3;
//     vertex1: Vector3;
//     vertex2: Vector3;

//     intersect(raySourcePosition: Vector3, rayDirection: Vector3): Vector3 {
//     }
// }