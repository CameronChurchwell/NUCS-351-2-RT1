import { Vector3 } from "./cuon-matrix-quat03";
import { GraphicsObject } from "./graphics-object";

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

export class TriangleGoemetry extends PlaneGeometry {
    side0: Vector3;
    side1: Vector3;
    magSq0: number;
    magSq1: number;
    angle: number;
    regularizer: number;

    constructor(vertex0: Vector3, vertex1: Vector3, vertex2: Vector3, color: Uint8Array) {
        const side0 = vertex1.subtract(vertex0);
        const side1 = vertex2.subtract(vertex0);
        super(vertex0, side0.cross(side1), color);
        this.side0 = side0;
        this.side1 = side1;
        this.magSq0 = side0.dot(side0);
        this.magSq1 = side1.dot(side1);
        this.angle = side0.dot(side1);
        this.regularizer = 1/(this.magSq0*this.magSq1-this.angle*this.angle);
    }

    intersect(raySourcePosition: Vector3, rayDirection: Vector3): Intersection {
        const intersection = super.intersect(raySourcePosition, rayDirection);
        if (intersection) {
            const p = intersection[0];

            const difference = p.subtract(this.offsetVector);
            const angle0 = difference.dot(this.side0);
            const angle1 = difference.dot(this.side1);

            const u = (this.magSq0*angle1 - this.angle*angle0) * this.regularizer;
            const v = (this.magSq1*angle0 - this.angle*angle1) * this.regularizer;

            if (u >= 0 && v >= 0 && u + v <= 1) {
                return intersection;
            }
        }
    }
}

export class CompositeGeometry extends Geometry {
    geometryObjects: Geometry[];
    
    constructor(geometryObjects: Geometry[]) {
        super();
        this.geometryObjects = geometryObjects;
    }

    intersect(raySourcePosition: Vector3, rayDirection: Vector3): Intersection {
        let minDistance = Infinity;
        let closestGeometry: Geometry = null;
        let intersectVector: Vector3 = null;
        for (let geometryObject of this.geometryObjects) {
            let intersection = geometryObject.intersect(new Vector3(raySourcePosition), new Vector3(rayDirection));
            if (intersection && intersection[0].magnitude() < minDistance) {
                closestGeometry = intersection[1];
                minDistance = intersection[0].magnitude();
                intersectVector = intersection[0];
            }
        }
        if (closestGeometry)
            return [intersectVector, closestGeometry];
        else {
            return null;
        }
    }

    hit(intersection: Intersection): Uint8Array {
        return intersection[1].hit(intersection);
    }
}

export class MeshGeometry extends CompositeGeometry {

    constructor(graphicsObject: GraphicsObject, offsetVector: Vector3,) {
        
        const fpv = graphicsObject.floatsPerVertex;
        let triangles: TriangleGoemetry[] = [];
        for (let i=0; i< graphicsObject.numVertices; i+=3) {
            const start = fpv*i;
            const vertex0 = new Vector3(graphicsObject.vertexArray.slice(start, start+3));
            const vertex1 = new Vector3(graphicsObject.vertexArray.slice(start+fpv, start+fpv+3));
            const vertex2 = new Vector3(graphicsObject.vertexArray.slice(start+fpv*2, start+2*fpv+3));
            triangles.push(new TriangleGoemetry(
                vertex0.add(offsetVector),
                vertex1.add(offsetVector),
                vertex2.add(offsetVector),
                new Uint8Array([0xFF, 0xFF, 0xFF])
            ));
        }
        super(triangles);
    }
}