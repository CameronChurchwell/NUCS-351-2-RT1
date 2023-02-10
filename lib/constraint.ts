import { Vector3 } from "./cuon-matrix-quat03";
import { ParticleSystem } from "./particle-system";

export class Constraint {
    min: Vector3;
    max: Vector3;

    constructor(min?: Vector3, max?: Vector3) {
        this.min = min;
        this.max = max;
    }

    applyToParticleSystem(particleSystem: ParticleSystem) {
        for (let particle of particleSystem.particleObjects) {
            let nextPos = particle.nextState.position;
            for (let i = 0; i < 3; i++) {
                if (nextPos.elements[i] < this.min.elements[i] || nextPos.elements[i] > this.max.elements[i]) {
                    let error: number;
                    if (nextPos.elements[i] < this.min.elements[i]) {
                        nextPos.elements[i] = this.min.elements[i];
                    } else {
                        nextPos.elements[i] = this.max.elements[i];
                    }
                    particle.nextState.velocity.elements[i] *= -0.85;
                }
            }
        }
    }
}

export class ConstraintFixed extends Constraint {
    particles: Array<number>;
    positions: Array<Vector3>;

    constructor(particles: Array<number>, positions: Array<Vector3>) {
        super();

        this.particles = particles;
        this.positions = positions;
    }

    applyToParticleSystem(particleSystem: ParticleSystem): void {
        for (let i=0; i<this.particles.length; i++) {
            let particle = particleSystem.particleObjects[this.particles[i]];
            let position = this.positions[i];
            particle.nextState.position.copyFrom(position);
            particle.currentState.position.copyFrom(position);
        }
    }
}

export class ConstraintKill extends Constraint{
   min: Vector3;
    max: Vector3;

    constructor(min?: Vector3, max?: Vector3) {
        super();
        this.min = min;
        this.max = max;
    }

    applyToParticleSystem(particleSystem: ParticleSystem) {
        for (let particle of particleSystem.particleObjects) {
            let nextPos = particle.nextState.position;
            for (let i = 0; i < 3; i++) {
                if (nextPos.elements[i] < this.min.elements[i] || nextPos.elements[i] > this.max.elements[i]) {
                    particle.reset();
                }
            }
        }
    }

}