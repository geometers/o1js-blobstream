/*
 Accumulate lines to utilize sparse multiplications: 
 - It checks if lines are correct (if point is not fixed) and evaluates them with sparse mul 
*/

import { Poseidon, Provable } from 'o1js';
import { G1Affine, G2Affine } from '../ec/index.js';
import { G2Line } from '../lines';
import { AffineCache } from '../lines/precompute.js';
import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';

class Groth16LineAccumulator {
  static accumulate(
    b_lines: Array<G2Line>,
    gamma_lines: Array<G2Line>,
    delta_lines: Array<G2Line>,
    B: G2Affine,
    negA: G1Affine,
    PI: G1Affine,
    C: G1Affine
  ): Array<Fp12> {
    const a_cache = new AffineCache(negA);

    // handle pair (A, B) as first point
    const g: Array<Fp12> = [];

    let T = new G2Affine({ x: B.x, y: B.y });
    const negB = B.neg();

    let idx = 0;
    let line_cnt = 0;

    for (let i = 1; i < ATE_LOOP_COUNT.length; i++) {
      idx = i - 1;

      let line_b = b_lines[line_cnt];
      line_cnt += 1;
      line_b.assert_is_tangent(T);

      g.push(line_b.psi(a_cache));
      T = T.double_from_line(line_b.lambda);

      if (ATE_LOOP_COUNT[i] == 1) {
        let line_b = b_lines[line_cnt];
        line_cnt += 1;
        line_b.assert_is_line(T, B);

        g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
        T = T.add_from_line(line_b.lambda, B);
      }
      if (ATE_LOOP_COUNT[i] == -1) {
        let line_b = b_lines[line_cnt];
        line_cnt += 1;
        line_b.assert_is_line(T, negB);

        g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
        T = T.add_from_line(line_b.lambda, negB);
      }
    }

    let piB = B.frobenius();
    let line_b;

    line_b = b_lines[line_cnt];
    line_cnt += 1;
    line_b.assert_is_line(T, piB);

    g.push(line_b.psi(a_cache));
    T = T.add_from_line(line_b.lambda, piB);

    let pi_2_B = piB.negative_frobenius();
    line_b = b_lines[line_cnt];
    line_b.assert_is_line(T, pi_2_B);

    // g.push(line_b.psi(a_cache));
    g[g.length - 1] = g[g.length - 1].mul(line_b.psi(a_cache));

    // DELTA
    const c_cache = new AffineCache(C);

    // reset counters
    idx = 0;
    line_cnt = 0;

    for (let i = 1; i < ATE_LOOP_COUNT.length; i++) {
      idx = i - 1;

      let line = delta_lines[line_cnt];
      line_cnt += 1;

      g[idx] = g[idx].sparse_mul(line.psi(c_cache));

      if (ATE_LOOP_COUNT[i] == 1) {
        let line = delta_lines[line_cnt];
        line_cnt += 1;

        g[idx] = g[idx].sparse_mul(line.psi(c_cache));
      }
      if (ATE_LOOP_COUNT[i] == -1) {
        let line = delta_lines[line_cnt];
        line_cnt += 1;

        g[idx] = g[idx].sparse_mul(line.psi(c_cache));
      }
    }

    let line_delta;

    line_delta = delta_lines[line_cnt];
    line_cnt += 1;

    idx += 1;
    g[idx] = g[idx].sparse_mul(line_delta.psi(c_cache));
    // idx += 1;

    line_delta = delta_lines[line_cnt];
    g[idx] = g[idx].sparse_mul(line_delta.psi(c_cache));

    // GAMMA
    const pi_cache = new AffineCache(PI);

    // reset counters
    idx = 0;
    line_cnt = 0;

    for (let i = 1; i < ATE_LOOP_COUNT.length; i++) {
      idx = i - 1;

      let line = gamma_lines[line_cnt];
      line_cnt += 1;

      g[idx] = g[idx].sparse_mul(line.psi(pi_cache));

      if (ATE_LOOP_COUNT[i] == 1) {
        let line = gamma_lines[line_cnt];
        line_cnt += 1;

        g[idx] = g[idx].sparse_mul(line.psi(pi_cache));
      }
      if (ATE_LOOP_COUNT[i] == -1) {
        let line = gamma_lines[line_cnt];
        line_cnt += 1;

        g[idx] = g[idx].sparse_mul(line.psi(pi_cache));
      }
    }

    let line_gamma;

    line_gamma = gamma_lines[line_cnt];
    line_cnt += 1;

    idx += 1;
    g[idx] = g[idx].sparse_mul(line_gamma.psi(pi_cache));
    // idx += 1;

    line_gamma = gamma_lines[line_cnt];
    g[idx] = g[idx].sparse_mul(line_gamma.psi(pi_cache));

    return g;
  }
}

export { Groth16LineAccumulator };
