import { Field, Struct } from "o1js";
import { FpC, Fp2, Fp6, Fp12 } from "../towers/index.js"
import { GAMMA_1S, NEG_GAMMA_13 } from "../towers/precomputed.js";

class G2Affine extends Struct({x: Fp2, y: Fp2}) {
    // x: Fp2 
    // y: Fp2

    // constructor(x: Fp2, y: Fp2) {
    //     this.x = x; 
    //     this.y = y;
    // }

    equals(rhs: G2Affine): Field {
        let same_x: Field = this.x.equals(rhs.x); 
        let same_y: Field = this.y.equals(rhs.y); 

        return same_x.mul(same_y)
    }

    neg() {
        return new G2Affine({x: this.x, y: this.y.neg()});
    }

    // a = 0 for bn 
    computeLambdaSame(): Fp2 {
        // λ = 3x^2 / 2y
        let num = this.x.square().mul_by_fp(FpC.from(3n));
        let denom = this.y.mul_by_fp(FpC.from(2n)).inverse(); 

        return num.mul(denom)
    }

    computeLambdaDiff(rhs: G2Affine): Fp2 {
        // λ = (y2 - y1) / (x2 - x1)
        let num = rhs.y.sub(this.y); 
        let denom = rhs.x.sub(this.x).inverse(); 
        
        return num.mul(denom)
    }

    computeMu(lambda: Fp2) {
        return this.y.sub(this.x.mul(lambda));
    }

    // assumes that this and rhs are not 0 points
    add(rhs: G2Affine): G2Affine {
        const eq = this.equals(rhs); 

        let lambda; 
        if (eq.toBigInt() === 1n) {
            lambda = this.computeLambdaSame()
        } else {
            lambda = this.computeLambdaDiff(rhs)
        }

        const x_3 = lambda.square().sub(this.x).sub(rhs.x);
        const y_3 = lambda.mul(this.x.sub(x_3)).sub(this.y);

        return new G2Affine({x: x_3, y: y_3})
    }

    double_from_line(lambda: Fp2) {
        const x_3 = lambda.square().sub(this.x).sub(this.x); // x_3 = λ^2 - 2x_1
        const y_3 = lambda.mul(this.x.sub(x_3)).sub(this.y); // y_3 = λ(x_1 - x_3) - y_1 

        return new G2Affine({x: x_3, y: y_3})
    }

    add_from_line(lambda: Fp2, rhs: G2Affine) {
        const x_3 = lambda.square().sub(this.x).sub(rhs.x); // x_3 = λ^2 - x_1 - x_2
        const y_3 = lambda.mul(this.x.sub(x_3)).sub(this.y); // y_3 = λ(x_1 - x_3) - y_1 

        return new G2Affine({x: x_3, y: y_3})
    }

    frobenius() {
        const x = this.x.conjugate().mul(GAMMA_1S[1]);
        const y = this.y.conjugate().mul(GAMMA_1S[2]);

        return new G2Affine({x, y});
    }

    negative_frobenius() {
        const x = this.x.conjugate().mul(GAMMA_1S[1]);
        const y = this.y.conjugate().mul(NEG_GAMMA_13);

        return new G2Affine({x, y});
    }

    // g + hw = g0 + h0W + g1W^2 + h1W^3 + g2W^4 + h2W^5
    // PSI: (x, y) -> (w^2x, w^3y)
    hom(): [Fp12, Fp12] {
        const x_g = new Fp6({c0: Fp2.zero(), c1: this.x, c2: Fp2.zero()});
        const x_h = Fp6.zero(); 
        const x = new Fp12({c0: x_g, c1: x_h});

        const y_g = Fp6.zero(); 
        const y_h = new Fp6({c0: Fp2.zero(), c1: this.y, c2: Fp2.zero()});
        const y = new Fp12({c0: y_g, c1: y_h});

        return [x, y]
    }
}

export { G2Affine }

// p = 5G1 
// q = 7G2

// let px = FpC.from(10744596414106452074759370245733544594153395043370666422502510773307029471145n)
// let py = FpC.from(848677436511517736191562425154572367705380862894644942948681172815252343932n)
// let p = new G1(px, py);

// let qx_0 = FpC.from(15512671280233143720612069991584289591749188907863576513414377951116606878472n)
// let qx_1 = FpC.from(18551411094430470096460536606940536822990217226529861227533666875800903099477n)
// let qx = new Fp2(qx_0, qx_1)

// let qy_0 = FpC.from(13376798835316611669264291046140500151806347092962367781523498857425536295743n)
// let qy_1 = FpC.from(1711576522631428957817575436337311654689480489843856945284031697403898093784n)
// let qy = new Fp2(qy_0, qy_1)

// let qz_0 = FpC.from(1n)
// let qz_1 = FpC.from(0n)
// let qz = new Fp2(qz_0, qz_1)

// const q = new G2Affine(qx, qy)
// const q_cp = new G2Affine(qx, qy)

// const qq_line = q.line(q_cp);

// let e = qq_line.evaluate(q);
// console.log(e.c0.toBigInt())
// console.log(e.c1.toBigInt())

// e = qq_line.evaluate_in_g1(p);
// console.log(e.c0.toBigInt())
// console.log(e.c1.toBigInt())

// Don't forget to explore -mu precomputation
