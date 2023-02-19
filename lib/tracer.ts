import { ImageBuffer } from "./buffer";
import { Camera } from "./camera";
import { Vector3 } from "./cuon-matrix-quat03";
import { Geometry } from "./geometry";
import { CallbackMap } from "./user-input";

export class Tracer {
    camera: Camera;
    img: ImageBuffer;
    geometry: Geometry;
    gl: WebGL2RenderingContextStrict
    callbackMap: CallbackMap;
    AA: number;
    jitter: number;

    constructor(camera: Camera, img: ImageBuffer, geometry: Geometry, gl: WebGL2RenderingContextStrict, AA: number = 1, jitter: number = 0) {
        this.camera = camera;
        this.img = img;
        this.geometry = geometry;
        this.gl = gl;
        this.AA = AA;
        this.jitter = jitter;
        this.callbackMap = new Map([
            ['keyDown', this.keyDown.bind(this)]
        ]);
    }

    trace() {
        console.log('begin tracing');
        this.camera.traceGeometry(this.geometry, this.img, this.AA, this.jitter);
        this.gl.texSubImage2D(
            this.gl.TEXTURE_2D,
            0,
            0,
            0,
            this.img.width,
            this.img.height,
            this.gl.RGB,
            this.gl.UNSIGNED_BYTE,
            this.img.data
        );
        console.log('end tracing');
    }

    keyDown(kev: KeyboardEvent) {
        switch(kev.code) {
            case "KeyT":
                this.trace();
                break;
            case "KeyP":
                this.AA += 1;
                document.getElementById("AA").innerHTML = this.AA.toString();
                break;
            case "KeyO":
                this.AA -= 1;
                if (this.AA < 0) this.AA = 0;
                document.getElementById("AA").innerHTML = this.AA.toString();
                break;
            case "KeyJ":
                if (this.jitter <= 0.2) {
                    this.jitter += 0.05;
                } else {
                    this.jitter = 0;
                }
                document.getElementById("jitter").innerHTML = this.jitter.toString();
            default:
                break;
        }
    }
}