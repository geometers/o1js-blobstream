import { G2Affine } from "../ec/g2.js";
import { G2Line, computeLineCoeffs } from "../lines/index.js";
import { Fp12Type } from "../towers/fp12";
import { Fp12, Fp2, FpC } from "../towers/index.js";
import fs from "fs";
import { bn254 } from "../ec/g1.js";
import { ForeignCurve } from "o1js";

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
    w27: Fp12Type,

    // points for PI
    ic0: {
        x: string, 
        y: string,
    },
    ic1: {
        x: string, 
        y: string,
    },
    ic2: {
        x: string, 
        y: string,
    },
    ic3: {
        x: string, 
        y: string,
    },
    ic4: {
        x: string, 
        y: string,
    },
    ic5: {
        x: string, 
        y: string,
    },
}

class GrothVk {
    delta_lines: Array<G2Line>;
    gamma_lines: Array<G2Line>;
    alpha_beta: Fp12;
    w27: Fp12;
    w27_square: Fp12;
    ic0: ForeignCurve;
    ic1: ForeignCurve;
    ic2: ForeignCurve;
    ic3: ForeignCurve;
    ic4: ForeignCurve;
    ic5: ForeignCurve;

    constructor(
        alpha_beta: Fp12, 
        w27: Fp12, 
        delta: G2Affine, 
        gamma: G2Affine, 
        ic0: ForeignCurve,
        ic1: ForeignCurve,
        ic2: ForeignCurve,
        ic3: ForeignCurve,
        ic4: ForeignCurve,
        ic5: ForeignCurve
    ) {
        this.delta_lines = computeLineCoeffs(delta);
        this.gamma_lines = computeLineCoeffs(gamma);
        this.alpha_beta = alpha_beta;
        this.w27 = w27;
        this.w27_square = w27.mul(w27);
        this.ic0 = ic0;
        this.ic1 = ic1;
        this.ic2 = ic2;
        this.ic3 = ic3;
        this.ic4 = ic4;
        this.ic5 = ic5;
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

        const ic0 = new bn254({x: FpC.from(obj.ic0.x), y: FpC.from(obj.ic0.y) });
        const ic1 = new bn254({x: FpC.from(obj.ic1.x), y: FpC.from(obj.ic1.y) });
        const ic2 = new bn254({x: FpC.from(obj.ic2.x), y: FpC.from(obj.ic2.y) });
        const ic3 = new bn254({x: FpC.from(obj.ic3.x), y: FpC.from(obj.ic3.y) });
        const ic4 = new bn254({x: FpC.from(obj.ic4.x), y: FpC.from(obj.ic4.y) });
        const ic5 = new bn254({x: FpC.from(obj.ic5.x), y: FpC.from(obj.ic5.y) });

        return new GrothVk(alpha_beta, w27, delta, gamma, ic0, ic1, ic2, ic3, ic4, ic5);
    }
}

export { GrothVk }