import { GraphicsObject } from "./graphics-object";
import { ParticleAttributes } from "./particle-attributes";
import { ParticleObject } from "./particle-object";
import { ChangeGenerator, ForceGenerator} from "./change-generator";
import { Constraint } from "./constraint";
import { GraphicsSystem } from "./graphics-system";
import { Solver } from "./solver";

export class ParticleSystem {
    particleObjects: ParticleObject[];
    changeGenerators: ChangeGenerator[];
    constraints: Constraint[];
    vertsPerParticle: number;
    solver: Solver;

    constructor(numParticles, initial: ParticleAttributes | ParticleAttributes[], graphics: GraphicsObject | GraphicsObject[], changeGenerators: ChangeGenerator[], constraints: Constraint[], solver: Solver, vertsPerParticle: number = 1) {
        this.particleObjects = Array(numParticles)
        for (let i = 0; i < numParticles; i++) {

            let graphicsObject: GraphicsObject;
            if (graphics instanceof GraphicsObject) {
                graphicsObject = graphics.clone();
            } else {
                graphicsObject = graphics[i];
            }

            let particleAttributes: ParticleAttributes;
            if (initial instanceof ParticleAttributes) {
                particleAttributes = new ParticleAttributes();
                particleAttributes.copyFrom(initial);
            } else {
                particleAttributes = initial[i];
            }

            this.particleObjects[i] = new ParticleObject(
                graphicsObject,
                particleAttributes
            );
        }

        this.changeGenerators = changeGenerators;
        this.constraints = constraints;
        this.vertsPerParticle = vertsPerParticle;
        this.solver = solver;
    }

    registerGraphicsSystem(graphicsSystem: GraphicsSystem) {
        for (let particleObject of this.particleObjects) {
            graphicsSystem.add(particleObject.graphicsObject);
        }
    }

    draw() {
        for (var particle of this.particleObjects) {
            particle.draw();
        }
    }

    drawUniform(positions_location, vertsPerParticle_location, chunkOffset_location, colors_location, chunkSize=100) {
        let gl_object = this.particleObjects[0].graphicsObject.graphicsSystem.gl_object;
        for (let chunkStart=0; chunkStart<this.particleObjects.length; chunkStart+=chunkSize) {
            let chunkEnd = chunkStart+chunkSize < this.particleObjects.length ? chunkStart+chunkSize : this.particleObjects.length;
            let positions = new Float32Array(4*chunkSize);
            let colors = new Float32Array(3*chunkSize);
            positions.fill(1.0);
            for (let i=chunkStart; i<chunkEnd; i++) {
                positions.set(this.particleObjects[i].nextState.position.elements, (i-chunkStart)*4);
                colors.set(this.particleObjects[i].nextState.color.elements, (i-chunkStart)*3);
            }
            let vboStart = this.particleObjects[chunkStart].graphicsObject.getVertexStart();
            gl_object.uniform4fv(positions_location, positions);
            gl_object.uniform3fv(colors_location, colors);
            gl_object.uniform1i(vertsPerParticle_location, this.vertsPerParticle);
            // gl_object.uniform1i(vertsPerParticle_location, 1);
            gl_object.uniform1i(chunkOffset_location, vboStart); //TODO might be wrong for multiple vertices per particle case
            // console.log(vboStart, this.vertsPerParticle*(chunkEnd-chunkStart));
            gl_object.drawArrays(this.particleObjects[0].graphicsObject.drawType, vboStart, this.vertsPerParticle*(chunkEnd-chunkStart));
            // gl_object.drawArrays(gl_object.POINTS, vboStart, this.vertsPerParticle*(chunkEnd-chunkStart));
        }
    }

    reset() {
        for (let particle of this.particleObjects) {
            particle.reset();
        }
    }

    generateChanges() {
        for (let changeGenerator of this.changeGenerators) {
            changeGenerator.applyToParticleSystem(this);
        }
    }

    clear() {
        for (let particle of this.particleObjects) {
            particle.clear();
        }
    }

    applyConstraints() {
        for (let constraint of this.constraints) {
            constraint.applyToParticleSystem(this);
        }
    }

    doAll(positions_location, vertsPerParticle_location, chunkOffset_location, colors_location) { //This seems like it would be really expensive (it is)
        this.clear();
        this.generateChanges();
        for (let particle of this.particleObjects) {
            this.solver.solve(particle);
        }
        this.applyConstraints();
        // this.draw();
        this.drawUniform(positions_location, vertsPerParticle_location, chunkOffset_location, colors_location);
        for (let particle of this.particleObjects) {
            particle.step();
        }
    }
}