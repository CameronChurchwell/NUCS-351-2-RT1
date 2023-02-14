import { Camera } from "./camera";
import { Matrix4 } from "./cuon-matrix-quat03";

class view {
    camera: Camera;
    startX: number;
    startY: number;
    height: number;
    width: number;

    constructor() {

    }

    applyTo(mvpMat: Matrix4) {
        
    }
}