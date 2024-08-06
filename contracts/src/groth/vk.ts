import { G2Affine } from "../ec/g2.js";
import { G2Line, computeLineCoeffs } from "../lines/index.js";
import { Fp12Type } from "../towers/fp12";
import { Fp12, Fp2, FpC } from "../towers/index.js";
import fs from "fs";

type SerializedVk = {
    delta: {
        x_c0: string, 
        x_c1: string, 
        y_c0: string, 
        y_c1: string
    }, 
    gamma: {
        x_c0: string, 
        x_c1: string, 
        y_c0: string, 
        y_c1: string
    }, 
    alpha_beta: Fp12Type, 
    w27: Fp12Type
}

class GrothVk {
    delta_lines: Array<G2Line>;
    gamma_lines: Array<G2Line>;
    alpha_beta: Fp12;
    w27: Fp12;
    w27_square: Fp12;

    constructor(alpha_beta: Fp12, w27: Fp12, delta: G2Affine, gamma: G2Affine) {
        this.delta_lines = computeLineCoeffs(delta);
        this.gamma_lines = computeLineCoeffs(gamma);
        this.alpha_beta = alpha_beta;
        this.w27 = w27;
        this.w27_square = w27.mul(w27);
    }

    static parse(path: string): GrothVk {
        const data = fs.readFileSync(path, 'utf-8');
        const obj: SerializedVk = JSON.parse(data);

        const dx = new Fp2({ c0: FpC.from(obj.delta.x_c0), c1: FpC.from(obj.delta.x_c1)});
        const dy = new Fp2({ c0: FpC.from(obj.delta.y_c0), c1: FpC.from(obj.delta.y_c1)});
        const delta = new G2Affine({ x: dx, y: dy });

        const gx = new Fp2({ c0: FpC.from(obj.gamma.x_c0), c1: FpC.from(obj.gamma.x_c1)});
        const gy = new Fp2({ c0: FpC.from(obj.gamma.y_c0), c1: FpC.from(obj.gamma.y_c1)});
        const gamma = new G2Affine({ x: gx, y: gy });

        const alpha_beta = Fp12.loadFromJSON(obj.alpha_beta); 
        const w27 = Fp12.loadFromJSON(obj.w27);

        return new GrothVk(alpha_beta, w27, delta, gamma);
    }
}

export { GrothVk }