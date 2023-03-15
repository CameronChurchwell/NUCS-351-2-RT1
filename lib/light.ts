import { Vector3 } from "./cuon-matrix-quat03";
import { Intersection } from "./geometry";
import { Material } from "./material";

export class Light {
    position: Vector3;
    ambient: Float32Array;
    diffuse: Float32Array;
    specular: Float32Array;
    enabled: boolean;
    // reflection: Vector3;

    constructor(position: Vector3, ambient: Float32Array, diffuse: Float32Array, specular: Float32Array) {
        this.position = position;
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.enabled = true;
        // this.reflection = new Vector3();
    }
}