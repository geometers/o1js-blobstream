import { Field, Struct, assert } from "o1js";
import { G1Affine, G2Affine } from "../ec/index.js";
import { FpC, Fp2, Fp6, Fp12 } from "../towers/index.js";
import { computeLineCoeffs } from "./coeffs.js";
import { AffineCache } from "./precompute.js";

const F_ONE = Field(1);

// We actually store -µ and reuse it when computing psi(g2(P))
class G2Line extends Struct({lambda: Fp2, neg_mu: Fp2}) {
    // lambda: Fp2
    // neg_mu: Fp2

    constructor(lambda: Fp2, neg_mu: Fp2) {
        super({lambda, neg_mu})
    }

    // for now skip vertical lines
    static fromPoints(lhs: G2Affine, rhs: G2Affine): G2Line {
        const eq = lhs.equals(rhs); 

        let lambda: Fp2; 
        if (eq.toBigInt() === 1n) {
            lambda = lhs.computeLambdaSame();
        } else {
            lambda = lhs.computeLambdaDiff(rhs);
        }

        // this.neg_mu = lhs.computeMu(lambda).neg();
        // this.lambda = lambda;
        return new G2Line(lambda, lhs.computeMu(lambda).neg())
    }

    // g + hw = g0 + h0W + g1W^2 + h1W^3 + g2W^4 + h2W^5
    psi(cache: AffineCache): Fp12 {
        const g0 = new Fp2({c0: FpC.from(1n), c1: FpC.from(0)});
        const h0 = this.lambda.mul_by_fp(cache.xp_prime);
        const g1 = Fp2.zero();
        const h1 = this.neg_mu.mul_by_fp(cache.yp_prime);
        const g2 = Fp2.zero();
        const h2 = Fp2.zero();

        const c0 = new Fp6({c0: g0, c1: g1, c2: g2}); 
        const c1 = new Fp6({c0: h0, c1: h1, c2: h2});

        return new Fp12({c0, c1});
    }

    // L, T : Y − (λX + µ) = 0
    evaluate(p: G2Affine): Fp2 {
        let t = this.lambda.mul(p.x); 
        t = t.neg(); 
        t = t.add(this.neg_mu); 
        return t.add(p.y);
    }

    // L, T : Y − (λX + µ) = 0
    evaluate_g1(p: G1Affine): Fp2 {
        let t = this.lambda.mul_by_fp(p.x); 
        t = t.neg(); 
        t = t.add(this.neg_mu); 
        return t.add_fp(p.y)
    }
}

// class LineEvaluator {

//     static pointDouble(q: G2, p: G1): [G2, Fp12] {
//         const z_square = q.z.square();

//         let tmp0 = q.x.square();
//         let tmp1 = q.y.square();
//         let tmp2 = tmp1.square();
//         let tmp3 = ((tmp1.add(q.x)).square()).sub(tmp0).sub(tmp2);
//         tmp3 = tmp3.mul_by_fp(FpC.from(2n));
//         let tmp4 = tmp0.mul_by_fp(FpC.from(3n));
//         let tmp6 = q.x.add(tmp4);
//         let tmp5 = tmp4.square();

//         const xt = tmp5.sub(tmp3.mul_by_fp(FpC.from(2n)));
//         const zt = ((q.y.add(q.z)).square()).sub(tmp1).sub(z_square);
//         const yt = (tmp3.sub(xt)).mul(tmp4).sub(tmp2.mul_by_fp(FpC.from(8n)));

//         tmp3 = tmp4.mul(z_square).mul_by_fp(FpC.from(2n)).neg();
//         tmp3 = tmp3.mul_by_fp(p.x);

//         tmp6 = tmp6.square().sub(tmp0).sub(tmp5).sub(tmp1.mul_by_fp(FpC.from(4n)));
//         tmp0 = zt.mul(z_square).mul_by_fp(FpC.from(2n));
//         tmp0 = tmp0.mul_by_fp(p.y);

//         const c0 = new Fp6(tmp0, Fp2.zero(), Fp2.zero());
//         const c1 = new Fp6(tmp3, tmp6, Fp2.zero());

//         const T = new G2(xt, yt, zt);
//         const l = new Fp12(c0, c1);

//         return [T, l]
//     }

//     static pointAdd(q: G2, r: G2, p: G1) {

//     }
// }

export { G2Line, computeLineCoeffs }

// p = 5G1 
// q = 7G2

// let px = FpC.from(10744596414106452074759370245733544594153395043370666422502510773307029471145n)
// let py = FpC.from(848677436511517736191562425154572367705380862894644942948681172815252343932n)
// let P = new G1(px, py);

// let qx_0 = FpC.from(15512671280233143720612069991584289591749188907863576513414377951116606878472n)
// let qx_1 = FpC.from(18551411094430470096460536606940536822990217226529861227533666875800903099477n)
// let qx = new Fp2(qx_0, qx_1)

// let qy_0 = FpC.from(13376798835316611669264291046140500151806347092962367781523498857425536295743n)
// let qy_1 = FpC.from(1711576522631428957817575436337311654689480489843856945284031697403898093784n)
// let qy = new Fp2(qy_0, qy_1)

// let Q = new G2Affine(qx, qy);

// let [x, y] = Q.hom()

// this is treated as a point of E(Fp12) so when we negate it, we negate just y_coord (res_1)
// let res_0 = x.frobenius_pow_p()
// let res_1 = y.frobenius_pow_p().neg()

// res_0.display("res_0")
// res_1.display("res_1")


// let Qf = Q.negative_frobenius()
// let [xf, yf] = Qf.hom()

// xf.display("xf")
// yf.display("yf")

// SANITY for LINES
// import { ATE_LOOP_COUNT } from "../towers";
// const lines = compute_line_coeffs(Q);
// assert(lines.length == 89)

// const ZERO = Fp2.zero();

// const negQ = Q.neg();

// let T = new G2Affine(Q.x, Q.y);

// let line_cnt = 0
// let line
// let E

// for (let i = 1; i < ATE_LOOP_COUNT.length; i++) {
//     line = lines[line_cnt];
//     line_cnt += 1

//     E = line.evaluate(T)
//     assert(E.equals(ZERO).equals(F_ONE))

//     T = T.double_from_line(line.lambda);

//     if (ATE_LOOP_COUNT[i] == 1) {
//         line = lines[line_cnt];
//         line_cnt += 1

//         E = line.evaluate(T)
//         assert(E.equals(ZERO).equals(F_ONE))

//         E = line.evaluate(Q)
//         assert(E.equals(ZERO).equals(F_ONE))

//         T = T.add_from_line(line.lambda, Q);
//     } else if (ATE_LOOP_COUNT[i] == -1) {
//         line = lines[line_cnt];
//         line_cnt += 1

//         E = line.evaluate(T)
//         assert(E.equals(ZERO).equals(F_ONE))

//         E = line.evaluate(negQ)
//         assert(E.equals(ZERO).equals(F_ONE))

//         T = T.add_from_line(line.lambda, negQ);
//     }

// }
