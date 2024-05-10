import fs from 'fs';
import { G2Line } from '../lines/index.js';
import { G1Affine, G2Affine } from '../ec/index.js';
import { ATE_LOOP_COUNT, Fp12, Fp2, Fp6 } from '../towers/index.js';
import { AffineCache } from '../lines/precompute.js';
import { Provable } from 'o1js';

class Groth16 {
    alpha_beta: Fp12; 
    gamma_lines: Array<G2Line>; 
    delta_lines: Array<G2Line>;
    w27: Array<Fp12>;

    constructor(gamma_lines: Array<G2Line>, delta_lines: Array<G2Line>, alpha_beta: Fp12, w27: Fp12, w27_square: Fp12) {
        this.gamma_lines = gamma_lines; 
        this.delta_lines = delta_lines;
        this.alpha_beta = alpha_beta;
        this.w27 = [Fp12.one(), w27, w27_square];
    }

    withSparseLines(negA: G1Affine, B: G2Affine, PI: G1Affine, C: G1Affine, b_lines: Array<G2Line>, shift_power: number, c: Fp12) {
        let g = Groth16LineAccumulator.accumulate(b_lines, this.gamma_lines, this.delta_lines, B, negA, PI, C);

        const c_inv = c.inverse();
        let f = c_inv;

        let idx = 0;

        for (let i = 1; i < ATE_LOOP_COUNT.length; i++) {
            idx = i - 1;
            f = f.square().mul(g[idx]);

            if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(c_inv);
            }

            if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(c);
            }
        }

        idx += 1;
        f = f.mul(g[idx]);
        idx += 1; 
        f = f.mul(g[idx]);

        f = f.mul(c_inv.frobenius_pow_p()).mul(c.frobenius_pow_p_squared()).mul(c_inv.frobenius_pow_p_cubed()).mul(this.alpha_beta);

        const shift = this.w27[shift_power];
        f = f.mul(shift);

        // f.display("f");

        f.assert_equals(Fp12.one());

    }

    // A*B = alpha * beta + PI * gamma + C * delta
    // 0 = (-A)*B + alpha * beta + PI * gamma + C * delta
    multiMillerLoop(negA: G1Affine, B: G2Affine, PI: G1Affine, C: G1Affine, b_lines: Array<G2Line>, shift_power: number, c: Fp12) {
        const a_cache = new AffineCache(negA);
        const pi_cache = new AffineCache(PI);
        const c_cache = new AffineCache(C);

        const negB = B.neg();
        const c_inv = c.inverse();

        let f = c_inv;
        let bAcc = new G2Affine({x: B.x, y: B.y}); 
 
        let line_cnt = 0

        for (let i = 1; i < ATE_LOOP_COUNT.length; i++) {
            let line_b = b_lines[line_cnt];
            let line_gamma = this.gamma_lines[line_cnt];
            let line_delta = this.delta_lines[line_cnt];

            line_cnt += 1
            line_b.assert_is_tangent(bAcc)

            let ba_eval = line_b.psi(a_cache)
            let gamma_pi_eval = line_gamma.psi(pi_cache)
            let delta_c_eval = line_delta.psi(c_cache)

            f = f.square()

            f = f.mul(ba_eval).mul(gamma_pi_eval).mul(delta_c_eval);
            bAcc = bAcc.double_from_line(line_b.lambda);
    
            if (ATE_LOOP_COUNT[i] == 1) {
                let line_b = b_lines[line_cnt];
                let line_gamma = this.gamma_lines[line_cnt];
                let line_delta = this.delta_lines[line_cnt];
                line_cnt += 1

                line_b.assert_is_line(bAcc, B)

                let ba_eval = line_b.psi(a_cache)
                let gamma_pi_eval = line_gamma.psi(pi_cache)
                let delta_c_eval = line_delta.psi(c_cache)
                f = f.mul(ba_eval).mul(gamma_pi_eval).mul(delta_c_eval).mul(c_inv);
        
                bAcc = bAcc.add_from_line(line_b.lambda, B);
            } else if (ATE_LOOP_COUNT[i] == -1) {
                let line_b = b_lines[line_cnt];
                let line_gamma = this.gamma_lines[line_cnt];
                let line_delta = this.delta_lines[line_cnt];
                line_cnt += 1

                line_b.assert_is_line(bAcc, negB)

                let ba_eval = line_b.psi(a_cache)
                let gamma_pi_eval = line_gamma.psi(pi_cache)
                let delta_c_eval = line_delta.psi(c_cache)
                f = f.sparse_mul(ba_eval).mul(gamma_pi_eval).mul(delta_c_eval).mul(c);
        
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

        line_b.assert_is_line(bAcc, piB)

        let ba_eval = line_b.psi(a_cache)
        let gamma_pi_eval = line_gamma.psi(pi_cache)
        let delta_c_eval = line_delta.psi(c_cache)
        f = f.mul(ba_eval).mul(gamma_pi_eval).mul(delta_c_eval);

        bAcc = bAcc.add_from_line(line_b.lambda, piB);

        let pi_2_B = piB.negative_frobenius();

        line_b = b_lines[line_cnt];
        line_gamma = this.gamma_lines[line_cnt];
        line_delta = this.delta_lines[line_cnt];

        line_b.assert_is_line(bAcc, pi_2_B)

        ba_eval = line_b.psi(a_cache)
        gamma_pi_eval = line_gamma.psi(pi_cache)
        delta_c_eval = line_delta.psi(c_cache)
        f = f.mul(ba_eval).mul(gamma_pi_eval).mul(delta_c_eval).mul(this.alpha_beta);
        f = f.mul(c_inv.frobenius_pow_p()).mul(c.frobenius_pow_p_squared()).mul(c_inv.frobenius_pow_p_cubed());

        const shift = this.w27[shift_power];
        f = f.mul(shift);

        f.display("f");

        f.assert_equals(Fp12.one());
    }
}

import { FpC } from '../towers/index.js';
import { computeLineCoeffs } from '../lines/index.js';

const make_w27 = () => {
    const g00 = FpC.from(0n);
    const g01 = FpC.from(0n);
    const g0 = new Fp2({c0: g00, c1: g01});

    const g10 = FpC.from(0n);
    const g11 = FpC.from(0n);
    const g1 = new Fp2({c0: g10, c1: g11});

    const g20 = FpC.from(8204864362109909869166472767738877274689483185363591877943943203703805152849n);
    const g21 = FpC.from(17912368812864921115467448876996876278487602260484145953989158612875588124088n);
    const g2 = new Fp2({c0: g20, c1: g21});

    const g = new Fp6({c0: g0, c1: g1, c2: g2});

    const h00 = FpC.from(0n);
    const h01 = FpC.from(0n);
    const h0 = new Fp2({c0: h00, c1: h01});

    const h10 = FpC.from(0n);
    const h11 = FpC.from(0n);
    const h1 = new Fp2({c0: h10, c1: h11});

    const h20 = FpC.from(0n);
    const h21 = FpC.from(0n);
    const h2 = new Fp2({c0: h20, c1: h21});

    const h = new Fp6({c0: h0, c1: h1, c2: h2});

    return new Fp12({c0: g, c1: h});
}

const make_c = () => {
    const g00 = FpC.from(8897423645001056939056268519231815325467656837342852882451087287537275473804n);
    const g01 = FpC.from(18138139272559567939518097482985718014906685667120368514277181390096172923024n);
    const g0 = new Fp2({c0: g00, c1: g01});

    const g10 = FpC.from(890682786386207419990401269408877867055365238513127066872467761270125110890n);
    const g11 = FpC.from(4750321666726336751205035517601280287609855317476938700678826930426843064773n);
    const g1 = new Fp2({c0: g10, c1: g11});

    const g20 = FpC.from(14953000407776584730421940156750752760443598970594431156013040878221356476707n);
    const g21 = FpC.from(6946591669033202601688125790035809701439099296024168416231992724982469545916n);
    const g2 = new Fp2({c0: g20, c1: g21});

    const g = new Fp6({c0: g0, c1: g1, c2: g2});

    const h00 = FpC.from(16547839259872247812199200552840319554753470001240188786695026128107318278780n);
    const h01 = FpC.from(6986228249436824240579247638359343971029877154439482835588533029426127968008n);
    const h0 = new Fp2({c0: h00, c1: h01});

    const h10 = FpC.from(16374047592147651661889250799806620149277779368240268725094717916293235563222n);
    const h11 = FpC.from(217057155512489562238842102396389203095220456084723260332959485276833336678n);
    const h1 = new Fp2({c0: h10, c1: h11});

    const h20 = FpC.from(12992454955650978638035141566990652346837801465571809702823130195607152254938n);
    const h21 = FpC.from(12841826423360331447630860607932783436371936581969657268937606435533635857034n);
    const h2 = new Fp2({c0: h20, c1: h21});

    const h = new Fp6({c0: h0, c1: h1, c2: h2});

    return new Fp12({c0: g, c1: h});
}

const g00 = FpC.from(15236026366081115775189008268827279188460509767791412223002071516712230243136n);
const g01 = FpC.from(6215440416257879771835798894462272911584362693554071507387333170022915968459n);
const g0 = new Fp2({c0: g00, c1: g01});

const g10 = FpC.from(327103057455241435067667443479313476231822605363483269492284441153947736163n);
const g11 = FpC.from(21407491999181370110335727005627502700263477893657601253120262494381745798609n);
const g1 = new Fp2({c0: g10, c1: g11});

const g20 = FpC.from(525552180734769320146546775716359936285417910747929441332388181393396138352n);
const g21 = FpC.from(21839895985146908497205908141525701798812735906666117163465035659757713220218n);
const g2 = new Fp2({c0: g20, c1: g21});

const g = new Fp6({c0: g0, c1: g1, c2: g2});

const h00 = FpC.from(3412291023425229121559615912222884028117294810598010176384323265610784774414n);
const h01 = FpC.from(5950684622229973500866478431516135192754943733316958101749273043553811422450n);
const h0 = new Fp2({c0: h00, c1: h01});

const h10 = FpC.from(21615021913054200784401842387888144272574260691304757679221043470900768699496n);
const h11 = FpC.from(7174236496269853539658238539172004552147343051569083162686377767746463697606n);
const h1 = new Fp2({c0: h10, c1: h11});

const h20 = FpC.from(18952846741600723806547666744734397713181953677964385696143456321504215601481n);
const h21 = FpC.from(10053629471188292207905180123447562562427005580494322676492107379963220942539n);
const h2 = new Fp2({c0: h20, c1: h21});

const h = new Fp6({c0: h0, c1: h1, c2: h2});

const alpha_beta = new Fp12({c0: g, c1: h});


// gamma = 9G2
let gamma_x_0 = FpC.from(13193736976255674115506271204866518055492249136949196233486205080643750676277n)
let gamma_x_1 = FpC.from(4821341333500639427117806840255663771228880693152568023710381392280915109763n)
let gamma_x = new Fp2({c0: gamma_x_0, c1: gamma_x_1})

let gamma_y_0 = FpC.from(18281872490245496509379794148214936771631698359916681711594256455596877716636n)
let gamma_y_1 = FpC.from(5830427496645529367349790160167113194176899755997018131088404969293864912751n)
let gamma_y = new Fp2({c0: gamma_y_0, c1: gamma_y_1})

let gamma = new G2Affine({x: gamma_x, y: gamma_y})
let gamma_lines = computeLineCoeffs(gamma);

// delta = 10G2
let delta_x_0 = FpC.from(14502447760486387799059318541209757040844770937862468921929310682431317530875n)
let delta_x_1 = FpC.from(2443430939986969712743682923434644543094899517010817087050769422599268135103n)
let delta_x = new Fp2({c0: delta_x_0, c1: delta_x_1})

let delta_y_0 = FpC.from(11721331165636005533649329538372312212753336165656329339895621434122061690013n)
let delta_y_1 = FpC.from(4704672529862198727079301732358554332963871698433558481208245291096060730807n)
let delta_y = new Fp2({c0: delta_y_0, c1: delta_y_1})

let delta = new G2Affine({x: delta_x, y: delta_y})
let delta_lines = computeLineCoeffs(delta);

// -a = 4G1
let ax = FpC.from(3010198690406615200373504922352659861758983907867017329644089018310584441462n)
let ay = FpC.from(17861058253836152797273815394432013122766662423622084931972383889279925210507n)
let A = new G1Affine({x: ax, y: ay});

// PI = 4G1
let px = FpC.from(3010198690406615200373504922352659861758983907867017329644089018310584441462n)
let py = FpC.from(4027184618003122424972590350825261965929648733675738730716654005365300998076n)
let PI = new G1Affine({x: px, y: py});

// B = 3G2
let qx_0 = FpC.from(2725019753478801796453339367788033689375851816420509565303521482350756874229n)
let qx_1 = FpC.from(7273165102799931111715871471550377909735733521218303035754523677688038059653n)
let qx = new Fp2({c0: qx_0, c1: qx_1})

let qy_0 = FpC.from(2512659008974376214222774206987427162027254181373325676825515531566330959255n)
let qy_1 = FpC.from(957874124722006818841961785324909313781880061366718538693995380805373202866n)
let qy = new Fp2({c0: qy_0, c1: qy_1})

let B = new G2Affine({x: qx, y: qy});
const bLines = computeLineCoeffs(B);

// C = -3G1
let cx = FpC.from(3353031288059533942658390886683067124040920775575537747144343083137631628272n)
let cy = FpC.from(2566709105286906361299853307776759647279481117519912024775619069693558446822n)
let C = new G1Affine({x: cx, y: cy});

const w27 = make_w27(); 
const w27_square = w27.mul(w27);

const g16 = new Groth16(gamma_lines, delta_lines, alpha_beta, w27, w27_square);

function main() {
    // g16.multiMillerLoop(A, B, PI, C, bLines, 2, make_c());
    g16.withSparseLines(A, B, PI, C, bLines, 2, make_c());

}

// npm run build && node --max-old-space-size=65536 build/src/groth16/multi_miller.js
import v8 from 'v8';
import { Groth16LineAccumulator } from './accumulate_lines.js';
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