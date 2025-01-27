/// <reference path="../node_modules/webgl-strict-types/index.d.ts" />
import { Camera } from "./camera";
import { Matrix4 } from "./cuon-matrix-quat03";
import { GraphicsObject } from "./graphics-object";

export class GraphicsSystem {
    graphicsObjectArray: Array<InstanceType<typeof GraphicsObject>>;
    gl_object: WebGL2RenderingContextStrict;
    numGraphicsObjects: number;
    offset: number;
    
    vertexArrayLengths: Array<number>;
    vertexArrayOffsets: Array<number>;
    totalVertexEntryLength: number;

    vertexBufferLoc: WebGLBuffer | null;

    constructor(gl_object, graphicsObjectArray) {
        this.graphicsObjectArray = graphicsObjectArray;
        this.gl_object = gl_object;

        this.numGraphicsObjects = graphicsObjectArray.length;

        //TODO assert same numFloatsPerVertex for all graphicsObjects
            //Or otherwise handle this edge case by padding?

        this.vertexArrayLengths = [];
        this.vertexArrayOffsets = [0];
        this.totalVertexEntryLength = 0;

        for (let i = 0; i < this.numGraphicsObjects; i++) {
            this.graphicsObjectArray[i].graphicsSystem = this
            this.graphicsObjectArray[i].index = i
            this.vertexArrayLengths.push(this.graphicsObjectArray[i].vertexArray.length);
            if (i>0) {
                this.vertexArrayOffsets.push(this.vertexArrayOffsets[i-1]+this.vertexArrayLengths[i-1]);
            }
            this.totalVertexEntryLength += this.vertexArrayLengths[i];
        }

        this.vertexBufferLoc = this.gl_object.createBuffer();
        if (!this.vertexBufferLoc) {
            console.error('Failed to create the vertex buffer object');
        }
        this.gl_object.bindBuffer(this.gl_object.ARRAY_BUFFER, this.vertexBufferLoc);
        let allVertices = new Float32Array(this.totalVertexEntryLength);
        for (let i = 0; i < this.numGraphicsObjects; i++) {
            allVertices.set(this.graphicsObjectArray[i].vertexArray, this.vertexArrayOffsets[i]);
        }
        this.gl_object.bufferData(this.gl_object.ARRAY_BUFFER, allVertices, this.gl_object.DYNAMIC_DRAW);

        this.gl_object.bindBuffer(this.gl_object.ARRAY_BUFFER, null);
        // this.gl_object.bindBuffer(this.gl_object.ARRAY_BUFFER, this.vertexBufferLoc);
    }

    initVertexBuffer() {
        this.gl_object.bindBuffer(this.gl_object.ARRAY_BUFFER, this.vertexBufferLoc);
        let allVertices = new Float32Array(this.totalVertexEntryLength);
        for (let i = 0; i < this.numGraphicsObjects; i++) {
            allVertices.set(this.graphicsObjectArray[i].vertexArray, this.vertexArrayOffsets[i]);
        }
        this.gl_object.bufferData(this.gl_object.ARRAY_BUFFER, allVertices, this.gl_object.DYNAMIC_DRAW);

        this.gl_object.bindBuffer(this.gl_object.ARRAY_BUFFER, null);
    }

    add(go: GraphicsObject) {
        let newIdx = this.numGraphicsObjects; // compute new index
        this.numGraphicsObjects++; //bump number graphics objects
        this.graphicsObjectArray.push(go) //push graphics object to array
        this.vertexArrayLengths.push(go.vertexArray.length);
        this.totalVertexEntryLength += go.vertexArray.length;
        go.graphicsSystem = this;
        go.index = newIdx;
        if (newIdx != 0) {
            this.vertexArrayOffsets.push(this.vertexArrayOffsets[newIdx-1]+this.vertexArrayLengths[newIdx-1]);
        }
    }

    getVertexStart(index) {
        return this.vertexArrayOffsets[index]/this.graphicsObjectArray[0].floatsPerVertex;
    }

    draw(index: number) {
        this.gl_object.bindBuffer(this.gl_object.ARRAY_BUFFER, this.vertexBufferLoc);
        let graphicsObject = this.graphicsObjectArray[index];
        let floatsPerVertex = graphicsObject.floatsPerVertex;
        this.gl_object.drawArrays(
            graphicsObject.drawType as any, //TODO resolve
            this.vertexArrayOffsets[index] / floatsPerVertex,
            this.vertexArrayLengths[index] / floatsPerVertex
        );
        this.gl_object.bindBuffer(this.gl_object.ARRAY_BUFFER, null);
    }

    drawAll(transformMatrixLoc?: WebGLUniformLocation, sceneMatrix?: Matrix4, camera?: Camera, modelMatrixLoc?: WebGLUniformLocation, normalMatrixLoc?: WebGLUniformLocation, cameraPosLoc?: WebGLUniformLocation, materialLocs?) {
        for (let graphicsObject of this.graphicsObjectArray) {
            graphicsObject.draw(transformMatrixLoc, sceneMatrix, camera, modelMatrixLoc, normalMatrixLoc, cameraPosLoc, materialLocs);
        }
    }

}