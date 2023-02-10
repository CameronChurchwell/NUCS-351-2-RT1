import { Constraint } from "../lib/constraint";
import { Vector3 } from "../lib/cuon-matrix-quat03";
import { ForceGenerator, ForceGeneratorDrag, ForceGeneratorTime } from "../lib/change-generator";
import { SolverBackward, SolverEuler, SolverForwardMidpoint, SolverNaive } from "../lib/solver";

export let gravity = new ForceGenerator(new Vector3([0, 0, -9.81]));
export let drag = new ForceGeneratorDrag(0.1);

let windVec = new Vector3([1, 2.5, 0])
function windCurve(v: Vector3, t: number) {
    return windVec.scale(Math.sin(t/250)*(v.elements[2]+1));
}
export let wind = new ForceGeneratorTime(windCurve, new Vector3([0, 0, 0]));

let breezeVec = new Vector3([1, 0.25, 0.05]);
function breezeCurve(v: Vector3, t: number) {
    return breezeVec.scale(Math.sin(t/50));
}
export let breeze = new ForceGeneratorTime(breezeCurve, new Vector3([0, 0, 0]));

export let floor = new Constraint(new Vector3([-Infinity, -Infinity, -1]), new Vector3([Infinity, Infinity, Infinity]));

let lightBreezeVec = new Vector3([0.002, 0.02, 0.005]);
function lightBreezeCurve(v: Vector3, t: number) {
    return lightBreezeVec.scale(Math.sin(t/100));
}
export let lightBreeze = new ForceGeneratorTime(lightBreezeCurve, new Vector3([0, 0, 0]));

export let naive = new SolverNaive();
export let euler = new SolverEuler();
export let fmid = new SolverForwardMidpoint();
export let backward = new SolverBackward();