import { Vector3 } from "./cuon-matrix-quat03";

export class Light {
    position: Vector3;
    ambient: Float32Array;
    diffuse: Float32Array;

    constructor(position: Vector3, ambient: Float32Array, diffuse: Float32Array) {
        this.position = position;
        this.ambient = ambient;
        this.diffuse = diffuse;
    }
}