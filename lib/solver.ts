import { ParticleAttributes } from "./particle-attributes";
import { ParticleObject } from "./particle-object";

export abstract class Solver {
    timeScale: number

    constructor(timeScale: number = 1000) {
        this.timeScale = timeScale;
    }

    solve(particle: ParticleObject, timeDelta: number = 1000.0/60.0) {}
}

export class SolverEuler extends Solver {

    solve(particle: ParticleObject, timeDelta: number = 1000.0/60.0) {
        //Setup and get derivative
        particle.nextState.copyFrom(particle.currentState);
        particle.differentiate();
        
        let nextState = particle.nextState;
        let derivative = particle.derivative;

        //Use derivative to solve
        let timeStep = timeDelta/this.timeScale;
        nextState.position.addInPlace(derivative.position.scale(timeStep));
        nextState.velocity.addInPlace(derivative.velocity.scale(timeStep));

        nextState.color.addInPlace(derivative.color.scale(timeStep));
        nextState.color.clampInPlace(0.0, 1.0);

        nextState.mass += derivative.mass * timeStep;
    }
}

export class SolverNaive extends Solver {

    solve(particle: ParticleObject, timeDelta: number = 1000.0/60.0) {
        //Setup and get derivative
        particle.nextState.copyFrom(particle.currentState);
        particle.differentiate();

        let nextState = particle.nextState;
        let derivative = particle.derivative;

        //Use derivative to solve
        let timeStep = timeDelta/this.timeScale;
        nextState.velocity.addInPlace(derivative.velocity.scale(timeStep));
        nextState.position.addInPlace(nextState.velocity.scale(timeStep));


        nextState.color.addInPlace(derivative.color.scale(timeStep));
        nextState.color.clampInPlace(0.0, 1.0);

        nextState.mass += derivative.mass * timeStep;
    }
}

export class SolverForwardMidpoint extends Solver {
    solve(particle: ParticleObject, timeDelta: number = 1000.0/60.0) {
        //GOAL: minimize dynamic memory allocation
        //Setup and get derivative
        let nextState = particle.nextState;
        let derivative = particle.derivative;
        let currentState = particle.currentState;
        nextState.copyFrom(particle.currentState);

        let h = (timeDelta/this.timeScale);

        let s1 = new ParticleAttributes();
        let s1dot = new ParticleAttributes();
        let sMdot = new ParticleAttributes();
        let s1dot2 = new ParticleAttributes();
        let sM = new ParticleAttributes();

        s1.copyFrom(currentState);

        particle.differentiate();
        s1dot.copyFrom(derivative);

        sM.copyFrom(s1);
        sM.position.addInPlace(s1dot.position.scale(h/2));
        sM.velocity.addInPlace(s1dot.velocity.scale(h/2));

        currentState.copyFrom(sM);
        particle.differentiate();
        sMdot.copyFrom(derivative);

        s1dot2.copyFrom(sMdot);
        s1dot2.position.addInPlace(s1dot.position.scale(-1));
        s1dot2.velocity.addInPlace(s1dot.velocity.scale(-1));
        s1dot2.position.scaleInPlace(2/h); //This is probably what got messed up
        s1dot2.velocity.scaleInPlace(2/h)

        nextState.position.addInPlace(s1dot.position.scale(h));
        nextState.position.addInPlace((s1dot2.position.scale(Math.pow(h, 2)/2)));
        nextState.velocity.addInPlace(s1dot.velocity.scale(h));
        nextState.velocity.addInPlace((s1dot2.velocity.scale(Math.pow(h, 2)/2)));
    }
}

export class SolverBackward extends Solver {

    solve(particle: ParticleObject, timeDelta: number = 1000.0/60.0) {
        //GOAL: minimize dynamic memory allocation
        //Setup and get derivative
        let nextState = particle.nextState;
        let derivative = particle.derivative;
        let currentState = particle.currentState;
        
        let h = (timeDelta/this.timeScale);
        
        let s1dot = new ParticleAttributes();
        let s2 = new ParticleAttributes();
        let sErr = new ParticleAttributes();
        
        particle.differentiate();
        // particle.dervative now holds s1dot
        s1dot.copyFrom(derivative);
        
        nextState.copyFrom(currentState);
        nextState.velocity.addInPlace(derivative.velocity.scale(h));
        nextState.position.addInPlace(derivative.position.scale(h));
        s2.copyFrom(nextState);

        for (let i=0; i<20; i++) {
            currentState.copyFrom(s2);
            particle.differentiate();
            sErr.copyFrom(derivative)
            sErr.position.subtractInPlace(s1dot.position);
            sErr.velocity.subtractInPlace(s1dot.velocity);
            sErr.position.scaleInPlace(h);
            sErr.velocity.scaleInPlace(h);

            s2.position.addInPlace(sErr.position);
            s2.velocity.addInPlace(sErr.velocity);
            s1dot.copyFrom(derivative);
        }
        
        nextState.copyFrom(s2);
    }
}