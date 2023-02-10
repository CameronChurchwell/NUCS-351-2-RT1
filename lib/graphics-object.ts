import { GraphicsSystem } from "./graphics-system";

export class GraphicsObject {
    vertexArray: Float32Array;
    drawType: WebGLRenderingContextStrict.DrawMode;
    floatsPerVertex: number;
    numVertices: number;
    index: number | null;
    graphicsSystem: InstanceType<typeof GraphicsSystem> | null

    constructor(vertexArray, drawType, floatsPerVertex) {
        this.vertexArray = vertexArray;
        this.drawType = drawType;
        this.floatsPerVertex = floatsPerVertex;
        this.numVertices = vertexArray.length / floatsPerVertex;
        this.index = null;
        this.graphicsSystem = null;
    }

    draw() {
        this.graphicsSystem?.draw(this.index);
    }

    clone() {
        return new GraphicsObject(new Float32Array(this.vertexArray), this.drawType, this.floatsPerVertex);
    }

    getVertexStart() {
        return this.graphicsSystem!.getVertexStart(this.index);
    }

}