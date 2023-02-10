import { Vector3 } from "./cuon-matrix-quat03";
import { ParticleObject } from "./particle-object";
import { ParticleSystem } from "./particle-system";

export abstract class ChangeGenerator {

    constructor() {
    }

    applyToParticleSystem(particleSystem: ParticleSystem) {}

}


export class ForceGenerator extends ChangeGenerator {
    force: Vector3;

    constructor(force?: Vector3) {
        super();
        this.force = force ?? new Vector3([0, 0, 0]);
    }
    
    applyToParticleSystem(particleSystem: ParticleSystem) {
        for (let particle of particleSystem.particleObjects) {
            particle.applyForce(this.force.scale(particle.currentState.mass));
        }
    }
}

export class ForceGeneratorDrag extends ForceGenerator {
    factor: number;

    constructor(factor: number) {
        super();
        this.factor = factor;
    }

    applyToParticleSystem(particleSystem: ParticleSystem): void {
        for (let particle of particleSystem.particleObjects) {
            let drag = particle.currentState.velocity.scale(-this.factor); //TODO add mass
            particle.applyForce(drag);
        }
    }
}

export class ForceGeneratorSpring extends ForceGenerator {
    strength: number;
    length: number;

    constructor(strength: number, length: number) {
        super();
        this.strength = strength;
        this.length = length;
    }

    applyToParticleSystem(particleSystem: ParticleSystem): void {
        for (let i=0; i < particleSystem.particleObjects.length; i++) {
            for (let j=0; j<i; j++) {
                let particle0 = particleSystem.particleObjects[i];
                let position0 = particle0.currentState.position;
                let particle1 = particleSystem.particleObjects[j];
                let position1 = particle1.currentState.position;

                let differenceVector = position0.add(position1.scale(-1)); //v0-v1
                let displacement = differenceVector.magnitude() - this.length;
                let forceMagnitude = this.strength * displacement;

                particle0.applyForce(differenceVector.normScale(-forceMagnitude));
                particle1.applyForce(differenceVector.normScale(forceMagnitude));
            }
        }
    }
}

export class ForceGeneratorSpringDamped extends ForceGenerator {
    strength: number;
    length: number;
    damping: number;
    chain: boolean;

    constructor(strength: number, length: number, damping: number, chain: boolean = false) {
        super();
        this.strength = strength;
        this.length = length;
        this.damping = damping;
        this.chain = chain;
    }

    applyToTwoParticles(particle0: ParticleObject, particle1: ParticleObject) {
        let position0 = particle0.currentState.position;
        let velocity0 = particle0.currentState.velocity;

        let position1 = particle1.currentState.position;
        let velocity1 = particle1.currentState.velocity;

        let differenceVector = position0.add(position1.scale(-1)); //v0-v1
        let displacement = differenceVector.magnitude() - this.length;
        
        let forceMagnitude = this.strength * displacement

        let force0 = differenceVector.normScale(-forceMagnitude);
        let force1 = differenceVector.normScale(forceMagnitude);

        particle0.applyForce(force0);
        particle1.applyForce(force1);

        let netVelocity = velocity1.add(velocity0.scale(-1));

        let magnitude = netVelocity.dot(differenceVector) * this.damping;

        force0 = differenceVector.normScale(magnitude);
        force1 = differenceVector.normScale(-magnitude);

        particle0.applyForce(force0);
        particle1.applyForce(force1);
    }

    applyToParticleSystem(particleSystem: ParticleSystem): void {
        if (this.chain) {
            for (let i=0; i < particleSystem.particleObjects.length - 1; i++) {
                this.applyToTwoParticles(particleSystem.particleObjects[i], particleSystem.particleObjects[i+1]);
            }
        } else {
            for (let i=0; i < particleSystem.particleObjects.length; i++) {
                for (let j=0; j<i; j++) {
                    this.applyToTwoParticles(particleSystem.particleObjects[i], particleSystem.particleObjects[j]);
                }
            }
        }
    }
}

type TimeParametric3D = (v: Vector3, t: number) => Vector3;
type Parametric3D = (v: Vector3) => Vector3;
type Parametric1D = (x: number) => number;

export class ForceGeneratorParametric extends ForceGenerator {
    curve: Parametric3D;
    center: Vector3;

    constructor(curve: Parametric3D, center: Vector3) {
        super();
        this.curve = curve;
        this.center = center;
    }

    static from1DCurves(fOfX: Parametric1D, fOfY: Parametric1D, fOfZ: Parametric1D, center: Vector3) {
        return new ForceGeneratorParametric((v: Vector3) => {
            return new Vector3([
                fOfX(v.elements[0]),
                fOfY(v.elements[1]),
                fOfZ(v.elements[2])
            ]);
        },
            center
        );
    }

    applyToParticleSystem(particleSystem: ParticleSystem): void {
        for (let particle of particleSystem.particleObjects) {
            particle.applyForce(this.curve(particle.currentState.position.add(this.center.scale(-1))));
        }
    }
}

export class ForceGeneratorNormal extends ForceGenerator {
    
}

export class ForceGeneratorTime extends ForceGenerator {
    current_time: number;
    center: Vector3;
    curve: TimeParametric3D;

    constructor(curve: TimeParametric3D, center: Vector3) {
        super();
        this.center = center
        this.curve = curve;
        this.current_time = 0;
    }

    applyToParticleSystem(particleSystem: ParticleSystem): void {
        for (let particle of particleSystem.particleObjects) {
            let force = this.curve(particle.currentState.position.add(this.center.scale(-1)), this.current_time);
            particle.applyForce(force);
        }
        this.current_time += 1;
    }
}

export class ForceGeneratorBoid extends ForceGenerator {
    range: number;
    align: number;
    cohere: number;
    sep: number;

    constructor(range: number, sep: number, align: number, cohere: number) {
        super();
        this.range = range;
        this.sep = sep;
        this.align = align;
        this.cohere = cohere;
    }

    applyToParticleSystem(particleSystem: ParticleSystem): void {
        let numParticles = particleSystem.particleObjects.length;
        let particles = particleSystem.particleObjects
        // let distances = new Float32Array(Math.pow(numParticles, 2) / 2);
        let diff = new Vector3 //more static allocation TODO optimize out further to property of class
        let netForce = new Vector3; //ditto ^
        let netHeading = new Vector3;
        let center = new Vector3
        let numNeighbors = 0;
        for (let i=0; i< numParticles; i++) {
            numNeighbors = 0;
            netForce.zeroOut();
            netHeading.zeroOut();
            center.zeroOut();
            let particle0 = particles[i]
            let position0 = particle0.currentState.position;
            for (let j=0; j<numParticles; j++) {
                if (i == j) {
                    continue;
                }
                let particle1 = particles[j];
                let position1 = particle1.currentState.position;
                // distances[i*numParticles+j] = position0.add(position1.scale(-1)).magnitude(); //TODO optimize with new function in lib

                //This should be very fast comparatively
                diff.copyFrom(position0);
                diff.subtractInPlace(position1); //this - other

                let distance = diff.magnitude();

                if (distance < this.range) {
                    numNeighbors++; //for averaging
                    //Apply forces to netForce

                    //Separation
                    //add force in this-other direction scaled
                    netForce.addInPlace(diff.scale(this.sep/(diff.magnitude()+0.001)));

                    //Alignment
                    netHeading.addInPlace(particle1.currentState.velocity);

                    //Cohesion
                    center.addInPlace(particle1.currentState.position);
                }
            }
            //Add in alignment after averaging and scaling by align factor
            netHeading.scaleInPlace(this.align/netHeading.magnitude());
            netForce.addInPlace(netHeading);

            center.scaleInPlace(this.cohere/numNeighbors);
            center.subtractInPlace(position0);
            netForce.addInPlace(center)
            particle0.applyForce(netForce);
        }
    }
}

export class ForceGeneratorEvadePlanar extends ForceGenerator {
    userPosition: () => Vector3;
    strength: number;

    constructor(userPosition: () => Vector3, strength: number) {
        super();
        this.userPosition = userPosition;
        this.strength = strength;
    }

    applyToParticleSystem(particleSystem: ParticleSystem): void {
        let diff = new Vector3();
        for (let particle of particleSystem.particleObjects) {
            let pos = particle.currentState.position;
            diff.copyFrom(pos)
            diff.subtractInPlace(this.userPosition());
            diff.elements[2] = 0;
            diff.scaleInPlace(this.strength/Math.pow(diff.magnitude()+0.001, 2));
            particle.applyForce(diff);
        }
    }
}

export class ColorChangeGenerator extends ChangeGenerator {
    color: Vector3;

    constructor(color?: Vector3) {
        super()
        this.color = color
    }

    applyToParticleSystem(particleSystem: ParticleSystem): void {
        for (let particle of particleSystem.particleObjects) {
            particle.applyColorChange(this.color);
        }
    }
}

export class MassChangeGenerator extends ChangeGenerator {
    mass: number;

    constructor(mass?: number) {
        super();
        this.mass = mass;
    }

    applyToParticleSystem(particleSystem: ParticleSystem): void {
        for (let particle of particleSystem.particleObjects) {
            particle.applyMassChange(this.mass);
        }
    }
}