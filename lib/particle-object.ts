import { Vector3, Vector4 } from "./cuon-matrix-quat03";
import { GraphicsObject } from "./graphics-object";
import { ParticleAttributes } from "./particle-attributes";

export class ParticleObject {
    currentState: ParticleAttributes;
    nextState: ParticleAttributes;
    initialState: ParticleAttributes;
    graphicsObject: GraphicsObject;
    forceAccumulator: Vector3;
    colorChangeAccumulator: Vector3;
    massChangeAccumulator: number;
    derivative: ParticleAttributes;

    constructor(graphicsObject: GraphicsObject, initialState: ParticleAttributes) {
        this.graphicsObject = graphicsObject;
        this.initialState = initialState;

        this.nextState = new ParticleAttributes();
        this.initialState = initialState;
        this.forceAccumulator = new Vector3([0.0, 0.0, 0.0]);
        this.massChangeAccumulator = 0;
        this.colorChangeAccumulator = new Vector3([0.0, 0.0, 0.0]);

        this.currentState = new ParticleAttributes();
        this.currentState.copyFrom(initialState);

        this.derivative = new ParticleAttributes();
    }

    applyForce(force: Vector3) {
        this.forceAccumulator.addInPlace(force);
    }

    applyColorChange(color: Vector3) {
        this.colorChangeAccumulator.addInPlace(color);
    }

    applyMassChange(mass: number) {
        this.massChangeAccumulator += mass;
    }

    clear() {
        this.clearForces();
        this.clearColorChange();
        this.clearMassChange();
    }

    clearMassChange() {
        this.massChangeAccumulator = 0;
    }

    clearForces() {
        this.forceAccumulator.zeroOut();
    }

    clearColorChange() {
        this.colorChangeAccumulator.zeroOut();
    }

    getDerivative() {
        return this.currentState.differentiate(this.forceAccumulator);
    }

    differentiate() {
        this.derivative.position.copyFrom(this.currentState.velocity);
        this.derivative.velocity.copyFrom(this.forceAccumulator).scaleInPlace(1/this.currentState.mass);
        this.derivative.color.copyFrom(this.colorChangeAccumulator);
        this.derivative.mass = this.massChangeAccumulator;
    }

    solveEuler() {
        //copy current state into next state
        this.nextState.copyFrom(this.currentState);

        //get derivative
        let derivative = this.getDerivative();

        //run solver
        this.nextState.solveEuler(derivative);
    }

    solveNaive() {
        //copy current state into next state
        this.nextState.copyFrom(this.currentState);

        //get derivative
        // let derivative = this.getDerivative();
        this.differentiate();

        //run solver
        this.nextState.solveNaive(this.derivative);
    }

    draw() {
        //write uniforms from nextState
        let gl_object = this.graphicsObject.graphicsSystem.gl_object;
        let nextPos = this.nextState.position.elements
        gl_object.bufferSubData(gl_object.ARRAY_BUFFER, 0, new Float32Array([
            nextPos[0], nextPos[1], nextPos[2], 1.0,
        ]))
        //draw
        this.graphicsObject.draw();
    }

    step() {
        this.currentState.copyFrom(this.nextState);
    }

    reset() {
        this.currentState.copyFrom(this.initialState);
        this.nextState.copyFrom(this.initialState);
        this.clear();
    }
}