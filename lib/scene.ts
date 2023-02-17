import { Vector3 } from "./cuon-matrix-quat03";
import { Geometry, Intersection } from "./geometry";

export class Scene extends Geometry {
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
            let intersection = geometryObject.intersect(raySourcePosition, rayDirection);
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