import { Vector3 } from "./cuon-matrix-quat03";

export class ParticleAttributes {
    position: Vector3;
    velocity: Vector3;
    mass: number;
    color: Vector3;
    scaleFactor: number;

    constructor(
        position?: Vector3, 
        velocity?: Vector3,
        mass?: number,
        color?: Vector3,
        scaleFactor?: number
    ) {
        this.position = position ?? new Vector3([0.0, 0.0, 0.0]);
        this.velocity = velocity ?? new Vector3([0.0, 0.0, 0.0]);
        this.mass = mass ?? 1.0;
        this.color = color ?? new Vector3([1.0, 1.0, 1.0]);
        this.scaleFactor = scaleFactor ?? 1.0;
    }

    differentiate(netForce: Vector3) { //TODO this is likely very slow
        let output = new ParticleAttributes(
            new Vector3(this.velocity),
            netForce.scale(this.mass),
        );
        return output;
    }

    copyFrom(other: ParticleAttributes) {
        this.position.elements.set(other.position.elements);
        this.velocity.elements.set(other.velocity.elements);
        this.mass = other.mass;
        this.color.elements.set(other.color.elements);
        this.scaleFactor = other.scaleFactor;
    }

    solveEuler(derivative: ParticleAttributes, timeDelta: number = 1000.0/60.0) {
        //Position then velocity
        this.position.addInPlace(derivative.position.scale(timeDelta/1000));
        this.velocity.addInPlace(derivative.velocity.scale(timeDelta/1000));
        //TODO add other attributes
    }
    
    solveNaive(derivative: ParticleAttributes, timeDelta: number = 1000.0/60.0) {
        //Velocity then position
        this.velocity.addInPlace(derivative.velocity.scale(timeDelta/1000));
        //disregard position derivative in favor of updated velocity
        this.position.addInPlace(this.velocity.scale(timeDelta/1000));
        this.color.addInPlace(derivative.color.scale(timeDelta/1000));
        this.color.clampInPlace(0.0, 1.0);
        this.mass += derivative.mass;
        //TODO add other attributes
    }
}