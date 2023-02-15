export class Viewport {
    xOffset: number;
    yOffset: number;
    width: number;
    height: number;

    constructor(xOffset: number, yOffset: number, width: number, height: number) {
        this.xOffset = xOffset;
        this.yOffset = yOffset;
        this.width = width;
        this.height = height;
    }

    focusWithContext(gl: WebGL2RenderingContextStrict) {
        gl.viewport(this.xOffset, this.yOffset, this.width, this.height);
    }
}