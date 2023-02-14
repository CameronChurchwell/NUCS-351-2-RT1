import { createProgram } from "./cuon-utils";

export class ShaderProgram {
    vertex: string;
    fragment: string;
    program: WebGLProgram;

    constructor(vertex: string, fragment: string) {
        this.vertex = vertex;
        this.fragment = fragment;
    }

    createInContext(gl: WebGL2RenderingContextStrict) {
        let program = createProgram(gl, this.vertex, this.fragment);
        if (!program) {
            throw 'Failed to create program!';
        }
        this.program = program;
        return program;
    }

    useWithContext(gl: WebGL2RenderingContextStrict) {
        gl.useProgram(this.program);
    }

    getAttributeLocationInContext(gl: WebGL2RenderingContextStrict, attribute: string) {
        let location = gl.getAttribLocation(this.program, attribute);
        if (location < 0) {
            //TODO have a way to tell which program? or is call stack sufficient?
            throw new Error(`Failed to get location of ${attribute} in shader!`);
        }
        return location;
    }
    
    getUniformLocationInContext(gl: WebGL2RenderingContextStrict, uniform: string) {
        let location = gl.getUniformLocation(this.program, uniform);
        if (!location) {
            //TODO have a way to tell which program? or is call stack sufficient?
            throw new Error(`Failed to get location of ${uniform} in shader!`);
        }
        return location;
    }
}
