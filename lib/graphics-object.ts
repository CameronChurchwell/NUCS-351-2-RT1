import { Camera } from "./camera";
import { Matrix4, Vector3 } from "./cuon-matrix-quat03";
import { GraphicsSystem } from "./graphics-system";
import { Material } from "./material";

export class GraphicsObject {
    vertexArray: Float32Array;
    drawType: number; // TODO resolve
    floatsPerVertex: number;
    position: Vector3;
    transformMatrix: Matrix4;
    reusableMatrix: Matrix4;
    numVertices: number;
    index: number | null;
    material: Material;
    graphicsSystem: InstanceType<typeof GraphicsSystem> | null

    constructor(vertexArray: Float32Array, drawType: number, floatsPerVertex: number, position?: Vector3, material?: Material) {
        this.vertexArray = vertexArray;
        this.drawType = drawType;
        this.floatsPerVertex = floatsPerVertex;
        this.position = position ?? new Vector3();
        this.transformMatrix = new Matrix4().setTranslate(this.position.elements[0], this.position.elements[1], this.position.elements[2]);
        this.reusableMatrix = new Matrix4();
        this.numVertices = vertexArray.length / floatsPerVertex;
        this.index = null;
        this.graphicsSystem = null;
        this.material = material ?? new Material();
    }

    draw(transformMatrixLoc?: WebGLUniformLocation, sceneMatrix?: Matrix4, camera?: Camera, modelMatrixLoc?: WebGLUniformLocation, normalMatrixLoc?: WebGLUniformLocation, cameraPosLoc?: WebGLUniformLocation, materialLocs?) {
        let gl = this.graphicsSystem!.gl_object;
        if (materialLocs) {
            let m = this.material;
            let a = m.ambient;
            let d = m.diffuse;
            let s = m.specular;
            let sh = m.shiny;
            gl.uniform3f(materialLocs['ambient'], a[0]/255, a[1]/255, a[2]/255);
            gl.uniform3f(materialLocs['diffuse'], d[0]/255, d[1]/255, d[2]/255);
            gl.uniform3f(materialLocs['specular'], s[0]/255, s[1]/255, s[2]/255);
            gl.uniform1f(materialLocs['shiny'], sh);
        }
        if (cameraPosLoc) {
            let pos = camera.position.elements;
            this.graphicsSystem?.gl_object.uniform3f(cameraPosLoc, pos[0], pos[1], pos[2]);
        }
        if (modelMatrixLoc) {
            let reusableMatrix = this.reusableMatrix;
            reusableMatrix.copyFrom(sceneMatrix);
            reusableMatrix.concat(this.transformMatrix);
            // console.log(reusableMatrix.toString());
            this.graphicsSystem?.gl_object.uniformMatrix4fv(modelMatrixLoc, false, reusableMatrix.elements);
        }
        if (normalMatrixLoc) {
            let reusableMatrix = this.reusableMatrix;
            // reusableMatrix.setTranslate(camera.position.elements[0], camera.position.elements[1], camera.position.elements[2]);
            reusableMatrix.copyFrom(sceneMatrix);
            reusableMatrix.concat(this.transformMatrix);
            reusableMatrix.invert();
            // reusableMatrix.transpose(); //TODO use transpose at uniform step?
            // console.log(reusableMatrix.toString());
            this.graphicsSystem?.gl_object.uniformMatrix4fv(normalMatrixLoc, false, reusableMatrix.elements);
        }
        if (transformMatrixLoc) {
            let reusableMatrix = this.reusableMatrix;
            camera.applyTo(reusableMatrix);
            reusableMatrix.concat(sceneMatrix);
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