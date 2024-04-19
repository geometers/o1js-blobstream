import fs from 'fs';
import { G2Line } from '../lines/index.js';
import { G1Affine, G2Affine } from '../ec/index.js';
import { ATE_LOOP_COUNT, Fp12, Fp2 } from '../towers/index.js';
import { AffineCache } from '../lines/precompute.js';
import { Field, Provable, assert } from 'o1js';

const ZERO = Fp2.zero();
const F_ONE = Field(1);

// A*B = alpha * beta + PI * gamma + C * delta
class Groth16 {
    alpha_beta: Fp12; 
    gamma_lines: Array<G2Line>; 
    delta_lines: Array<G2Line>;

    // alpha_beta: Fp12, 
    // constructor(gamma_lines_path: string, delta_lines_path: string) {
    constructor(gamma_lines: Array<G2Line>, delta_lines: Array<G2Line>) {
        this.gamma_lines = gamma_lines; 
        this.delta_lines = delta_lines;

        // this.alpha_beta = alpha_beta
        // const gamma_lines_deser = JSON.parse(fs.readFileSync(gamma_lines_path, 'utf8'))
        // this.gamma_lines = gamma_lines_deser.map((x: any) => new G2Line(Fp2.fromJson(x.lambda), Fp2.fromJson(x.neg_mu)))
        // const delta_lines_deser = JSON.parse(fs.readFileSync(delta_lines_path, 'utf8'))
        // this.delta_lines = delta_lines_deser.map((x: any) => new G2Line(Fp2.fromJson(x.lambda), Fp2.fromJson(x.neg_mu)))


        // let gamma_x_0 = FpC.from(15512671280233143720612069991584289591749188907863576513414377951116606878472n)
        // let gamma_x_1 = FpC.from(18551411094430470096460536606940536822990217226529861227533666875800903099477n)
        // let gamma_x = new Fp2({c0: gamma_x_0, c1: gamma_x_1})

        // let gamma_y_0 = FpC.from(13376798835316611669264291046140500151806347092962367781523498857425536295743n)
        // let gamma_y_1 = FpC.from(1711576522631428957817575436337311654689480489843856945284031697403898093784n)
        // let gamma_y = new Fp2({c0: gamma_y_0, c1: gamma_y_1})

        // let gamma = new G2Affine({x: gamma_x, y: gamma_y})
        // this.gamma_lines = computeLineCoeffs(gamma);

        // // delta = 14G2
        // // 2Q = 14G2
        // let delta_x_0 = FpC.from(5661669505880808244819716632315554310634743866396183042073198328850108104508n)
        // let delta_x_1 = FpC.from(15931622038192996671589371051242156072006014994949009182463955939868399309228n)
        // let delta_x = new Fp2({c0: delta_x_0, c1: delta_x_1})

        // let delta_y_0 = FpC.from(4059610048345577719683761812200139910495606568987861136624433831834429358783n)
        // let delta_y_1 = FpC.from(21571861065665377620827085164892588232073367452877114564853201018957316833140n)
        // let delta_y = new Fp2({c0: delta_y_0, c1: delta_y_1})

        // let delta = new G2Affine({x: delta_x, y: delta_y})
        // this.delta_lines = computeLineCoeffs(delta);
    }

    multiMillerLoop(A: G1Affine, B: G2Affine, PI: G1Affine, C: G1Affine, b_lines: Array<G2Line>): Fp12 {
        const a_cache = new AffineCache(A);
        const pi_cache = new AffineCache(PI);
        const c_cache = new AffineCache(C);

        const negB = B.neg();

        let f = Fp12.one();
        let bAcc = new G2Affine({x: B.x, y: B.y}); 
 
        let line_cnt = 0

        for (let i = 1; i < ATE_LOOP_COUNT.length; i++) {
            let line_b = b_lines[line_cnt];
            let line_gamma = this.gamma_lines[line_cnt];
            let line_delta = this.delta_lines[line_cnt];

            line_cnt += 1
        
            // TODO: check that line is tangent in bAcc and not that it just passes !!!!!!!
            let b_tangent = line_b.evaluate(bAcc)
            assert(b_tangent.equals(ZERO).equals(F_ONE))

            let ba_eval = line_b.psi(a_cache)
            let gamma_pi_eval = line_gamma.psi(pi_cache)
            let delta_c_eval = line_delta.psi(c_cache)

            // 1^2 = 1
            if (i !== 1) {
                f = f.square()
            }

            f = f.mul(ba_eval).mul(gamma_pi_eval).mul(delta_c_eval);
            bAcc = bAcc.double_from_line(line_b.lambda);
    
            if (ATE_LOOP_COUNT[i] == 1) {
                let line_b = b_lines[line_cnt];
                let line_gamma = this.gamma_lines[line_cnt];
                let line_delta = this.delta_lines[line_cnt];
                line_cnt += 1
        
                let b_line_b_acc = line_b.evaluate(bAcc)
                assert(b_line_b_acc.equals(ZERO).equals(F_ONE))
        
                let b_b = line_b.evaluate(B)
                assert(b_b.equals(ZERO).equals(F_ONE))

                let ba_eval = line_b.psi(a_cache)
                let gamma_pi_eval = line_gamma.psi(pi_cache)
                let delta_c_eval = line_delta.psi(c_cache)
                f = f.mul(ba_eval).mul(gamma_pi_eval).mul(delta_c_eval);
        
                bAcc = bAcc.add_from_line(line_b.lambda, B);
            } else if (ATE_LOOP_COUNT[i] == -1) {
                let line_b = b_lines[line_cnt];
                let line_gamma = this.gamma_lines[line_cnt];
                let line_delta = this.delta_lines[line_cnt];
                line_cnt += 1

                let b_line_b_acc = line_b.evaluate(bAcc)
                assert(b_line_b_acc.equals(ZERO).equals(F_ONE))
        
                let b_b = line_b.evaluate(negB)
                assert(b_b.equals(ZERO).equals(F_ONE))

                let ba_eval = line_b.psi(a_cache)
                let gamma_pi_eval = line_gamma.psi(pi_cache)
                let delta_c_eval = line_delta.psi(c_cache)
                f = f.mul(ba_eval).mul(gamma_pi_eval).mul(delta_c_eval);
        
                bAcc = bAcc.add_from_line(line_b.lambda, negB);
            }
        }

        let piB = B.frobenius(); 

        let line_b; 
        let line_gamma; 
        let line_delta;

        line_b = b_lines[line_cnt];
        line_gamma = this.gamma_lines[line_cnt];
        line_delta = this.delta_lines[line_cnt];
        line_cnt += 1

        let b_line_b_acc = line_b.evaluate(bAcc)
        assert(b_line_b_acc.equals(ZERO).equals(F_ONE))

        let b_piB = line_b.evaluate(piB)
        assert(b_piB.equals(ZERO).equals(F_ONE))

        let ba_eval = line_b.psi(a_cache)
        let gamma_pi_eval = line_gamma.psi(pi_cache)
        let delta_c_eval = line_delta.psi(c_cache)
        f = f.mul(ba_eval).mul(gamma_pi_eval).mul(delta_c_eval);

        bAcc = bAcc.add_from_line(line_b.lambda, piB);

        let pi_2_B = piB.negative_frobenius();

        line_b = b_lines[line_cnt];
        line_gamma = this.gamma_lines[line_cnt];
        line_delta = this.delta_lines[line_cnt];

        b_line_b_acc = line_b.evaluate(bAcc)
        assert(b_line_b_acc.equals(ZERO).equals(F_ONE))

        let b_pi_2_B = line_b.evaluate(pi_2_B)
        assert(b_pi_2_B.equals(ZERO).equals(F_ONE))

        ba_eval = line_b.psi(a_cache)
        gamma_pi_eval = line_gamma.psi(pi_cache)
        delta_c_eval = line_delta.psi(c_cache)
        f = f.mul(ba_eval).mul(gamma_pi_eval).mul(delta_c_eval);

        // return f.mul(this.alpha_beta)
        return f
    }
}

import { FpC } from '../towers/index.js';
import { computeLineCoeffs } from '../lines/index.js';

let gamma_x_0 = FpC.from(15512671280233143720612069991584289591749188907863576513414377951116606878472n)
let gamma_x_1 = FpC.from(18551411094430470096460536606940536822990217226529861227533666875800903099477n)
let gamma_x = new Fp2({c0: gamma_x_0, c1: gamma_x_1})

let gamma_y_0 = FpC.from(13376798835316611669264291046140500151806347092962367781523498857425536295743n)
let gamma_y_1 = FpC.from(1711576522631428957817575436337311654689480489843856945284031697403898093784n)
let gamma_y = new Fp2({c0: gamma_y_0, c1: gamma_y_1})

let gamma = new G2Affine({x: gamma_x, y: gamma_y})
let gamma_lines = computeLineCoeffs(gamma);

// delta = 14G2
// 2Q = 14G2
let delta_x_0 = FpC.from(5661669505880808244819716632315554310634743866396183042073198328850108104508n)
let delta_x_1 = FpC.from(15931622038192996671589371051242156072006014994949009182463955939868399309228n)
let delta_x = new Fp2({c0: delta_x_0, c1: delta_x_1})

let delta_y_0 = FpC.from(4059610048345577719683761812200139910495606568987861136624433831834429358783n)
let delta_y_1 = FpC.from(21571861065665377620827085164892588232073367452877114564853201018957316833140n)
let delta_y = new Fp2({c0: delta_y_0, c1: delta_y_1})

let delta = new G2Affine({x: delta_x, y: delta_y})
let delta_lines = computeLineCoeffs(delta);

let ax = FpC.from(10744596414106452074759370245733544594153395043370666422502510773307029471145n)
let ay = FpC.from(848677436511517736191562425154572367705380862894644942948681172815252343932n)
let A = new G1Affine({x: ax, y: ay});

// PI = 10G1
let px = FpC.from(4444740815889402603535294170722302758225367627362056425101568584910268024244n)
let py = FpC.from(10537263096529483164618820017164668921386457028564663708352735080900270541420n)
let PI = new G1Affine({x: px, y: py});

// B = 7G2
let qx_0 = FpC.from(15512671280233143720612069991584289591749188907863576513414377951116606878472n)
let qx_1 = FpC.from(18551411094430470096460536606940536822990217226529861227533666875800903099477n)
let qx = new Fp2({c0: qx_0, c1: qx_1})

let qy_0 = FpC.from(13376798835316611669264291046140500151806347092962367781523498857425536295743n)
let qy_1 = FpC.from(1711576522631428957817575436337311654689480489843856945284031697403898093784n)
let qy = new Fp2({c0: qy_0, c1: qy_1})

let B = new G2Affine({x: qx, y: qy});
const bLines = computeLineCoeffs(B);

// C = 5G1
let cx = FpC.from(10744596414106452074759370245733544594153395043370666422502510773307029471145n)
let cy = FpC.from(848677436511517736191562425154572367705380862894644942948681172815252343932n)
let C = new G1Affine({x: cx, y: cy});

const g16 = new Groth16(gamma_lines, delta_lines);

function main() {
    let f = g16.multiMillerLoop(A, B, PI, C, bLines);
}

// npm run build && node --max-old-space-size=65536 build/src/groth16/multi_miller.js
import v8 from 'v8';
(async () => {
    console.time('running Fp constant version');
    await main();
    console.timeEnd('running Fp constant version');

    console.time('running Fp witness generation & checks');
    await Provable.runAndCheck(main);
    console.timeEnd('running Fp witness generation & checks');

    console.time('creating Fp constraint system');
    let cs = await Provable.constraintSystem(main);
    console.timeEnd('creating Fp constraint system');

    console.log(cs.summary());
    const totalHeapSize = v8.getHeapStatistics().total_available_size;
    let totalHeapSizeinGB = (totalHeapSize /1024/1024/1024).toFixed(2);
    console.log(`Total heap size: ${totalHeapSizeinGB} GB`);

    // used_heap_size
    const usedHeapSize = v8.getHeapStatistics().used_heap_size;
    let usedHeapSizeinGB = (usedHeapSize /1024/1024/1024).toFixed(2);
    console.log(`Used heap size: ${usedHeapSizeinGB} GB`);
})();