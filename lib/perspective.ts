import { Matrix4 } from "./cuon-matrix-quat03";

export class Perspective {
    horizontalFOV: number;
    aspect: number;
    near: number;
    far: number;

    constructor(horizontalFOV: number, aspect: number, near: number, far: number) {
        this.horizontalFOV = horizontalFOV;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
    }

    setMatrix(mvpMat: Matrix4) {
        return mvpMat.setPerspective(this.horizontalFOV, this.aspect, this.near, this.far);
    }

    getFrustumSize() {
        let halfAngle = this.horizontalFOV/2;
        let halfWidth = Math.tan(halfAngle/360*2*Math.PI);
        let width = halfWidth * 2;
        let height = width / this.aspect;
        return [width, height];
    }
}