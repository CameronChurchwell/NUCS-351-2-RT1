import { Matrix4, Vector3 } from "./cuon-matrix-quat03";
import { GraphicsSystem } from "./graphics-system";

export class GraphicsObject {
    vertexArray: Float32Array;
    drawType: number; // TODO resolve
    floatsPerVertex: number;
    position: Vector3;
    transformMatrix: Matrix4;
    reusableMatrix: Matrix4;
    numVertices: number;
    index: number | null;
    graphicsSystem: InstanceType<typeof GraphicsSystem> | null

    constructor(vertexArray: Float32Array, drawType: number, floatsPerVertex: number, position?: Vector3) {
        this.vertexArray = vertexArray;
        this.drawType = drawType;
        this.floatsPerVertex = floatsPerVertex;
        this.position = position ?? new Vector3();
        this.transformMatrix = new Matrix4().setTranslate(this.position.elements[0], this.position.elements[1], this.position.elements[2]);
        this.reusableMatrix = new Matrix4();
        this.numVertices = vertexArray.length / floatsPerVertex;
        this.index = null;
        this.graphicsSystem = null;
    }

    draw(transformMatrixLoc?: WebGLUniformLocation, sceneMatrix?: Matrix4) {
        
        if (transformMatrixLoc) {
            let reusableMatrix = this.reusableMatrix;
            reusableMatrix.copyFrom(sceneMatrix);
            reusableMatrix.concat(this.transformMatrix);
            this.graphicsSystem?.gl_object.uniformMatrix4fv(transformMatrixLoc, false, reusableMatrix.elements);
        }
        
        this.graphicsSystem?.draw(this.index);
    }

    clone() {
        return new GraphicsObject(new Float32Array(this.vertexArray), this.drawType, this.floatsPerVertex, this.position);
    }

    getVertexStart() {
        return this.graphicsSystem!.getVertexStart(this.index);
    }
}