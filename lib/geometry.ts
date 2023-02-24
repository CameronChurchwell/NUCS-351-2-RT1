import { Vector3 } from "./cuon-matrix-quat03";
import { GraphicsObject } from "./graphics-object";

export type Intersection = [Vector3, Geometry] | null

var abs = Math.abs;

export abstract class Geometry {
    reusableVector: Vector3;

    constructor() {
        this.reusableVector = new Vector3([0, 0, 0]);
    }

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
        // this.reusableVector.copyFrom(this.offsetVector);
        let numerator = this.normalVector.dotWithDifference(this.offsetVector, raySourcePosition);
        let denominator = rayDirection.dot(this.normalVector);
        if (numerator == 0) {
            this.reusableVector.copyFrom(this.normalVector);
            this.reusableVector.scaleInPlace(this.normalVector.dot(this.offsetVector));
            return [this.reusableVector, this];
        }
        if (denominator == 0) {
            return null;
        } else {
            let t = numerator/denominator;
            if (t < 0) {
                return null;
            } else {
                this.reusableVector.copyFrom(rayDirection);
                this.reusableVector.scaleInPlace(t);
                this.reusableVector.addInPlace(raySourcePosition);
                return [this.reusableVector, this];
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
            x = abs(x)+0.5;
            y = abs(y)+0.5;
            if (x%1 < lineWidth || y%1 < lineWidth) {
                return intersection;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }
}

export class DiscGeometry extends PlaneGeometry {
    radius: number;

    constructor(center: Vector3, normalVector: Vector3, radius: number, color: Uint8Array) {
        super(center, normalVector, color);
        this.radius = radius;
    }

    intersect(raySourcePosition: Vector3, rayDirection: Vector3): Intersection {
        // this.testPlane.normalVector.copyFrom(rayDirection).normalize(); //this is for a sphere
        let intersection = super.intersect(raySourcePosition, rayDirection);
        if (intersection) {
            let planePosition = intersection[0];
            if (planePosition.distanceFrom(this.offsetVector) < this.radius) {
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
        // const side0 = vertex1.subtract(vertex0);
        let side0 = new Vector3(vertex1);
        side0.subtractInPlace(vertex0);
        // const side1 = vertex2.subtract(vertex0);
        let side1 = new Vector3(vertex2);
        side1.subtractInPlace(vertex0);
        let normalVector = new Vector3(side0);
        normalVector.cross(side1);
        // super(vertex0, side0.cross(side1), color);
        super(vertex0, normalVector, color)
        this.side0 = side0;
        this.side1 = side1;
        this.magSq0 = side0.dot(side0);
        this.magSq1 = side1.dot(side1);
        this.angle = side0.dot(side1);
        this.regularizer = 1/(this.magSq0*this.magSq1-this.angle*this.angle);
    }

    intersect(raySourcePosition: Vector3, rayDirection: Vector3): Intersection {
        let reusableVector = this.reusableVector;
        const intersection = super.intersect(raySourcePosition, rayDirection);
        if (intersection) {
            const p = intersection[0];

            reusableVector.copyFrom(p);
            reusableVector.subtractInPlace(this.offsetVector);
            // let difference = this.reusableVector;
            // const difference = p.subtract(this.offsetVector);
            const angle0 = reusableVector.dot(this.side0);
            const angle1 = reusableVector.dot(this.side1);

            const regularizer = this.regularizer;
            const angle = this.angle;
            const u = (this.magSq0*angle1 - angle*angle0) * regularizer;
            const v = (this.magSq1*angle0 - angle*angle1) * regularizer;

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
        let closestIntersection: Intersection = null;
        let geometryObjects = this.geometryObjects;
        let length = geometryObjects.length;
        let geometryObject: Geometry = null;
        for (let i=0; i<length; i++) {
            geometryObject = geometryObjects[i];
            // let intersection = geometryObject.intersect(new Vector3(raySourcePosition), new Vector3(rayDirection));
            let intersection = geometryObject.intersect(raySourcePosition, rayDirection);
            if (intersection && intersection[0].magnitude() < minDistance) {
                minDistance = intersection[0].magnitude();
                closestIntersection = intersection;
            }
        }
        return closestIntersection;
    }

    hit(intersection: Intersection): Uint8Array {
        return intersection[1].hit(intersection);
    }
}

export class MeshGeometry extends CompositeGeometry {
    boundingSphere: BoundingSphereGeometry;

    constructor(vertexArray: Float32Array, floatsPerVertex: number, offsetVector: Vector3, chunkSize: number = Infinity) {
        let numVertices = vertexArray.length / floatsPerVertex;
        if (chunkSize == Infinity) {
            let triangles: TriangleGoemetry[] = [];
            // let center = new Vector3(offsetVector); //TODO optimize?
            let center = new Vector3([0, 0, 0]);
            let maxDistance = 0;
            let regularizer = 1/numVertices;
            for (let i=0; i< numVertices; i++) {
                let vertex = new Vector3(vertexArray.slice(i*floatsPerVertex, i*floatsPerVertex+3));
                vertex.scaleInPlace(regularizer);
                center.addInPlace(vertex);
            }
            for (let i=0; i< numVertices; i++) {
                let vertex = new Vector3(vertexArray.slice(i*floatsPerVertex, i*floatsPerVertex+3));
                let distanceFromCenter = vertex.distanceFrom(center);
                if (distanceFromCenter > maxDistance) {
                    maxDistance = distanceFromCenter;
                }
            }
            center.addInPlace(offsetVector);
            for (let i=0; i< numVertices; i+=3) {
                const start = floatsPerVertex*i;
                const vertex0 = new Vector3(vertexArray.slice(start, start+3));
                const vertex1 = new Vector3(vertexArray.slice(start+floatsPerVertex, start+floatsPerVertex+3));
                const vertex2 = new Vector3(vertexArray.slice(start+floatsPerVertex*2, start+2*floatsPerVertex+3));

                vertex0.addInPlace(offsetVector);
                vertex1.addInPlace(offsetVector);
                vertex2.addInPlace(offsetVector);

                triangles.push(new TriangleGoemetry(
                    // vertex0.add(offsetVector),
                    // vertex1.add(offsetVector),
                    // vertex2.add(offsetVector),
                    vertex0,
                    vertex1,
                    vertex2,
                    new Uint8Array([0xFF, 0xFF, 0xFF])
                ));
            }
            // maxDistance += 0.1;
            super(triangles);
            this.boundingSphere = new BoundingSphereGeometry(center, maxDistance);
        } else if (chunkSize > 0) {
            let subMeshes: MeshGeometry[] = [];
            let boundingSpheres: BoundingSphereGeometry[] = [];
            let numTriangles = numVertices / 3;
            // console.log("numVertices:", numVertices);
            // console.log("numTriangles:", numTriangles);
            // console.log("chunkSize:", chunkSize);
            for (let i=0; i < numTriangles; i += chunkSize) {
                // console.log(i);
                let start = i*floatsPerVertex*3;
                let count = floatsPerVertex*chunkSize*3;
                // console.log("start, count:", start, count);
                let vertices = vertexArray.slice(start, start+count);
                subMeshes.push(new MeshGeometry(vertices, floatsPerVertex, offsetVector, chunkSize/2 > 10 ? chunkSize/10 : Infinity));
                boundingSpheres.push(subMeshes[subMeshes.length-1].boundingSphere);
            }
            super(subMeshes);
            this.boundingSphere = BoundingSphereGeometry.fromBoundingSpheres(boundingSpheres);
        } else {
            throw new Error("chunkSize must be positive");
        }
    }

    intersect(raySourcePosition: Vector3, rayDirection: Vector3): [Vector3, Geometry] {
        if (this.boundingSphere.intersect(raySourcePosition, rayDirection)) {
            return super.intersect(raySourcePosition, rayDirection);
        }
    }
}

export class SphereGeometry extends DiscGeometry {

    constructor(center: Vector3, radius: number, color: Uint8Array) {
        super(center, new Vector3([0, 0, 0]), radius, color);
    }

    intersect(raySourcePosition: Vector3, rayDirection: Vector3): Intersection {
        this.normalVector = rayDirection;
        let intersection = super.intersect(raySourcePosition, rayDirection);
        if (intersection) {
            let position = intersection[0];
            let distanceFromCenter = position.distanceFrom(this.offsetVector);
            // let distanceFromCenter = position.subtract(this.offsetVector).magnitude();
            //negative here is because normal vector points away from camera
            let height = Math.sqrt(Math.pow(this.radius, 2) - Math.pow(distanceFromCenter, 2));
            position.addScaledInPlace(this.normalVector, -height)
            return [position, this];
        }
    }
}

export class BoundingSphereGeometry extends DiscGeometry {
    constructor(center: Vector3, radius: number) {
        super(center, new Vector3([0, 0, 0]), radius, null);
    }

    intersect(raySourcePosition: Vector3, rayDirection: Vector3): [Vector3, Geometry] {
        this.normalVector = rayDirection;
        return super.intersect(raySourcePosition, rayDirection);
    }

    static fromBoundingSpheres(spheres: BoundingSphereGeometry[]): BoundingSphereGeometry {
        let center = new Vector3([0, 0, 0]);
        let regularizer = 1/spheres.length;
        for (let sphere of spheres) {
            center.addScaledInPlace(sphere.offsetVector, regularizer);
        }
        let maxDistance = 0;
        for (let sphere of spheres) {
            let distance = sphere.offsetVector.distanceFrom(center) + sphere.radius;
            if (distance > maxDistance) {
                maxDistance = distance;
            }
        }
        return new BoundingSphereGeometry(center, maxDistance);
    }

    hit(intersection: [Vector3, Geometry]): Uint8Array {
        throw new Error("No hits should be called on bounding geometry");
    }
}