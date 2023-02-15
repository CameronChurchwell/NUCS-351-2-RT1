import { Vector3 } from "./cuon-matrix-quat03";

export class ImageBuffer {
    width: number;
    height: number;
    data: Uint8Array;

    constructor(width: number, height: number) {
        this.data = new Uint8Array(3*width*height);
        this.width = width;
        this.height = height;
    }

    calcPos(x: number, y: number) {
        return 3 * (y * this.width + x);
    }

    get(x: number, y: number): Uint8Array {
        let position = this.calcPos(x, y);
        return this.data.slice(position, position+3);
    }

    set(x: number, y: number, newVal: Uint8Array) {
        let position = this.calcPos(x, y);
        this.data[position+0] = newVal[0];
        this.data[position+1] = newVal[1];
        this.data[position+2] = newVal[2];
    }
}