import { Matrix4, Vector3 } from "../lib/cuon-matrix-quat03";

let standardBasisVecs = [
    new Vector3([1, 0, 0]),
    new Vector3([0, 1, 0]),
    new Vector3([0, 0, 1])
]

let corners: Vector3[] = [];
for (let i of [-1, 1]) {
    for (let j of [-1, 1]) {
        for (let k of [-1, 1]) {
            corners.push(standardBasisVecs[0].scale(i).add(standardBasisVecs[1].scale(j)).add(standardBasisVecs[2].scale(k)));
        }
    }
}


export function makeMiniCube(min: Vector3 = new Vector3([-0.1, -0.1, -0.1]), max: Vector3 = new Vector3([0.1, 0.1, 0.1])) {

    let diff = max.add(min.scale(-1));
    let half = diff.scale(0.5);
    let center = min.add(half);
    let linearBasis = half.diag(); //Matrix4
    let affineBasis = new Matrix4();
    affineBasis.setAffine(linearBasis, center);

    let transformedCorners: Vector3[] = [];
    for (let corner of corners) {
        transformedCorners.push(affineBasis.multiplyVector3(corner))
    }



    let indices = [
        0, 1, 2,
        1, 2, 3,
        0, 4, 5,
        0, 1, 5,
        5, 6, 7,
        4, 5, 6,
        2, 7, 6,
        2, 3, 7,
    ]

    let cubeVerts = new Float32Array(7*indices.length);
    cubeVerts.fill(1.0);

    for (let i=0; i< indices.length; i++) {
        cubeVerts.set(transformedCorners[indices[i]].elements, 7*i);
    }

    return cubeVerts;
}