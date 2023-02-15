import { ImageBuffer } from "./buffer";
import { Camera } from "./camera";
import { Geometry } from "./geometry";
import { CallbackMap } from "./user-input";

export class Tracer {
    camera: Camera;
    img: ImageBuffer;
    geometry: Geometry;
    gl: WebGL2RenderingContextStrict
    callbackMap: CallbackMap;

    constructor(camera: Camera, img: ImageBuffer, geometry: Geometry, gl: WebGL2RenderingContextStrict) {
        this.camera = camera;
        this.img = img;
        this.geometry = geometry;
        this.gl = gl;
        this.callbackMap = new Map([
            ['keyDown', this.keyDown.bind(this)]
        ]);
    }

    trace() {
        this.camera.traceGeometry(this.geometry, this.img);
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
    }

    keyDown(kev: KeyboardEvent) {
        switch(kev.code) {
            case "KeyT":
                this.trace();
                break;
            default:
                break;
        }
    }
}