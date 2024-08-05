/*
 Accumulate lines to utilize sparse multiplications: 
 - It checks if lines are correct (if point is not fixed) and evaluates them with sparse mul 
*/

import { G1Affine, G2Affine } from "../ec/index.js";
import { G2Line } from "../lines/index.js";
import { AffineCache } from "../lines/precompute.js";
import { ATE_LOOP_COUNT, Fp12 } from "../towers/index.js";


class LineAccumulator {
  static accumulate(
    b_lines: Array<G2Line>,
    gamma_lines: Array<G2Line>,
    delta_lines: Array<G2Line>,
    B: G2Affine,
    negA: G1Affine,
    PI: G1Affine,
    C: G1Affine
  ): Array<Fp12> {
    const g: Array<Fp12> = [];

    const a_cache = new AffineCache(negA);
    const c_cache = new AffineCache(C);
    const pi_cache = new AffineCache(PI);

    let T = new G2Affine({ x: B.x, y: B.y });
    const negB = B.neg();

    let idx = 0;
    let line_cnt = 0;
    for (let i = 1; i < ATE_LOOP_COUNT.length; i++) {
        idx = i - 1; 

        const b_line = b_lines[line_cnt]; 
        const delta_line = delta_lines[line_cnt]; 
        const gamma_line = gamma_lines[line_cnt];
        line_cnt += 1; 

        b_line.assert_is_tangent(T);

        g.push(b_line.psi(a_cache));
        g[idx] = g[idx].sparse_mul(delta_line.psi(c_cache));
        g[idx] = g[idx].sparse_mul(gamma_line.psi(pi_cache));

        T = T.double_from_line(b_line.lambda);

        if (ATE_LOOP_COUNT[i] == 1 || ATE_LOOP_COUNT[i] == -1) {
            const b_line = b_lines[line_cnt]; 
            const delta_line = delta_lines[line_cnt]; 
            const gamma_line = gamma_lines[line_cnt];
            line_cnt += 1; 

            if(ATE_LOOP_COUNT[i] == 1) {
                b_line.assert_is_line(T, B);
                T = T.add_from_line(b_line.lambda, B);
            } else {
                b_line.assert_is_line(T, negB); 
                T = T.add_from_line(b_line.lambda, negB);
            }

            g[idx] = g[idx].sparse_mul(b_line.psi(a_cache));
            g[idx] = g[idx].sparse_mul(delta_line.psi(c_cache));
            g[idx] = g[idx].sparse_mul(gamma_line.psi(pi_cache));
        }
    }

    let b_line = b_lines[line_cnt]; 
    let delta_line = delta_lines[line_cnt]; 
    let gamma_line = gamma_lines[line_cnt];
    line_cnt += 1;
    idx += 1;

    g.push(b_line.psi(a_cache));
    g[idx] = g[idx].sparse_mul(delta_line.psi(c_cache));
    g[idx] = g[idx].sparse_mul(gamma_line.psi(pi_cache));

    let piB = B.frobenius();
    b_line.assert_is_line(T, piB);
    T = T.add_from_line(b_line.lambda, piB);

    b_line = b_lines[line_cnt]; 
    delta_line = delta_lines[line_cnt]; 
    gamma_line = gamma_lines[line_cnt];
    line_cnt += 1;

    g[idx] = g[idx].sparse_mul(b_line.psi(a_cache));
    g[idx] = g[idx].sparse_mul(delta_line.psi(c_cache));
    g[idx] = g[idx].sparse_mul(gamma_line.psi(pi_cache));

    let pi_2_B = piB.negative_frobenius();
    b_line.assert_is_line(T, pi_2_B);

    return g;
  }
}

export { LineAccumulator };
