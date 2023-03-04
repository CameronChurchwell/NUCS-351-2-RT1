import { Light } from "./light";

let full = new Uint8Array([255, 255, 255]);

export class Material {
    ambient: Uint8Array;
    diffuse: Uint8Array;
    specular: Uint8Array;
    shiny: number;
    mirror: number;

    constructor(
        ambient: Uint8Array = full,
        diffuse: Uint8Array = full,
        specular: Uint8Array = full,
        shiny: number = 10, //TODO investigate
        mirror: number = 0.25
    ) {
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.shiny = shiny;
        this.mirror = mirror;
    }

    addPhong(light: Light, nDotL: number, specular: number, color: Uint8Array) {
        color[0] = Math.min(color[0] + this.ambient[0] * light.ambient[0] + this.diffuse[0] * light.diffuse[0] * nDotL + this.specular[0] * light.specular[0] * specular, 255);
        color[1] = Math.min(color[1] + this.ambient[1] * light.ambient[1] + this.diffuse[1] * light.diffuse[1] * nDotL + this.specular[1] * light.specular[1] * specular, 255);
        color[2] = Math.min(color[2] + this.ambient[2] * light.ambient[2] + this.diffuse[2] * light.diffuse[2] * nDotL + this.specular[2] * light.specular[2] * specular, 255);
    }
}