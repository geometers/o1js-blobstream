import { Field, assert } from "o1js";
import { G1Affine, G2Affine } from "./ec/index.js";
import { G2Line, computeLineCoeffs } from "./lines/index.js";
import { AffineCache } from "./lines/precompute.js";
import { ATE_LOOP_COUNT, Fp12, Fp2 } from "./towers/index.js";

const ZERO = Fp2.zero();
const F_ONE = Field(1);

class MillerLoop {

    static loop(Q: G2Affine, P: G1Affine): Fp12 {
        /*
            Here we cache and precompute lines
            This should be correctly handled with witnessing 
        */
       const cache = new AffineCache(P); 
       const lines = computeLineCoeffs(Q);

       const negQ = Q.neg();

       let f = Fp12.one();
       let T = new G2Affine({x: Q.x, y: Q.y}); 

       let e
       let line
       let line_cnt = 0
       let l

       for (let i = 1; i < ATE_LOOP_COUNT.length; i++) {
            line = lines[line_cnt];
            line_cnt += 1
        
            e = line.evaluate(T)
            assert(e.equals(ZERO).equals(F_ONE))

            l = line.psi(cache)

            // 1^2 = 1
            if (i !== 1) {
                f = f.square();
            }

            f = f.mul(l);
        
            T = T.double_from_line(line.lambda);
    
            if (ATE_LOOP_COUNT[i] == 1) {
                line = lines[line_cnt];
                line_cnt += 1
        
                e = line.evaluate(T)
                assert(e.equals(ZERO).equals(F_ONE))
        
                e = line.evaluate(Q)
                assert(e.equals(ZERO).equals(F_ONE))

                l = line.psi(cache)
                f = f.mul(l)
        
                T = T.add_from_line(line.lambda, Q);
            } else if (ATE_LOOP_COUNT[i] == -1) {
                line = lines[line_cnt];
                line_cnt += 1
        
                e = line.evaluate(T)
                assert(e.equals(ZERO).equals(F_ONE))
        
                e = line.evaluate(negQ)
                assert(e.equals(ZERO).equals(F_ONE))

                l = line.psi(cache)
                f = f.mul(l)
        
                T = T.add_from_line(line.lambda, negQ);
            }
        }

        // after loop T = [6x + 2]Q
        // console.log("T.x.c0", T.x.c0.toBigInt());
        // console.log("T.x.c1", T.x.c1.toBigInt());
        // console.log("T.y.c0", T.y.c0.toBigInt());
        // console.log("T.y.c1", T.y.c1.toBigInt());


        let Q1 = Q.frobenius();
        let Q2 = Q1.negative_frobenius();

        /*
            Again we should make sure to just witness l1 and l2
        */

       let l1 = G2Line.fromPoints(T, Q1); 

        // now make sure that lines are correct 
        e = l1.evaluate(T)
        assert(e.equals(ZERO).equals(F_ONE))

        e = l1.evaluate(Q1)
        assert(e.equals(ZERO).equals(F_ONE))

        f = f.mul(l1.psi(cache));
        T = T.add_from_line(l1.lambda, Q1);

        let l2 = G2Line.fromPoints(T, Q2); 

        e = l2.evaluate(T)
        assert(e.equals(ZERO).equals(F_ONE))

        e = l2.evaluate(Q2)
        assert(e.equals(ZERO).equals(F_ONE))

        f = f.mul(l2.psi(cache));

        return f
    }
}

import { FpC } from "./towers/index.js";

// mlo(2Q, P)^h = mlo(Q, 2P)^h

// P = 5G1 
// Q = 7G2


// P = 5G1
let px = FpC.from(10744596414106452074759370245733544594153395043370666422502510773307029471145n)
let py = FpC.from(848677436511517736191562425154572367705380862894644942948681172815252343932n)
let P = new G1Affine({x: px, y: py});

// 2P = 10G1
px = FpC.from(4444740815889402603535294170722302758225367627362056425101568584910268024244n)
py = FpC.from(10537263096529483164618820017164668921386457028564663708352735080900270541420n)
let twoP = new G1Affine({x: px, y: py});

// Q = 7G2
let qx_0 = FpC.from(15512671280233143720612069991584289591749188907863576513414377951116606878472n)
let qx_1 = FpC.from(18551411094430470096460536606940536822990217226529861227533666875800903099477n)
let qx = new Fp2({c0: qx_0, c1: qx_1})

let qy_0 = FpC.from(13376798835316611669264291046140500151806347092962367781523498857425536295743n)
let qy_1 = FpC.from(1711576522631428957817575436337311654689480489843856945284031697403898093784n)
let qy = new Fp2({c0: qy_0, c1: qy_1})

let Q = new G2Affine({x: qx, y: qy});

// 2Q = 14G2
qx_0 = FpC.from(5661669505880808244819716632315554310634743866396183042073198328850108104508n)
qx_1 = FpC.from(15931622038192996671589371051242156072006014994949009182463955939868399309228n)
qx = new Fp2({c0: qx_0, c1: qx_1})

qy_0 = FpC.from(4059610048345577719683761812200139910495606568987861136624433831834429358783n)
qy_1 = FpC.from(21571861065665377620827085164892588232073367452877114564853201018957316833140n)
qy = new Fp2({c0: qy_0, c1: qy_1})

let twoQ = new G2Affine({x: qx, y: qy});

let mlo1 = MillerLoop.loop(Q, twoP)
mlo1.display("mlo1")

console.log("==========")

let mlo2 = MillerLoop.loop(twoQ, P)
mlo2.display("mlo2")