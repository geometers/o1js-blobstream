/*
 Accumulate lines to utilize sparse multiplications: 
 - It checks if lines are correct (if point is not fixed) and evaluates them with sparse mul 
*/

import { G1Affine, G2Affine } from '../../ec/index.js';
import { G2Line } from '../../lines/index.js';
import { AffineCache } from '../../lines/precompute.js';
import { ATE_LOOP_COUNT } from '../../towers/consts.js';
import { Fp12 } from '../../towers/fp12.js';

class KZGLineAccumulator {
  static accumulate(
    g2_lines: Array<G2Line>,
    tau_lines: Array<G2Line>,
    A: G1Affine,
    negB: G1Affine
  ): Array<Fp12> {
    const g: Array<Fp12> = [];

    const a_cache = new AffineCache(A);
    const negB_cache = new AffineCache(negB);

    let idx = 0;
    let line_cnt = 0;
    for (let i = 1; i < ATE_LOOP_COUNT.length; i++) {
      idx = i - 1;

      let g2_line = g2_lines[line_cnt];
      let tau_line = tau_lines[line_cnt];
      line_cnt += 1;

      g.push(g2_line.psi(a_cache));
      g[idx] = g[idx].sparse_mul(tau_line.psi(negB_cache));

      if (ATE_LOOP_COUNT[i] == 1 || ATE_LOOP_COUNT[i] == -1) {
        let g2_line = g2_lines[line_cnt];
        let tau_line = tau_lines[line_cnt];
        line_cnt += 1;

        g[idx] = g[idx].sparse_mul(g2_line.psi(a_cache));
        g[idx] = g[idx].sparse_mul(tau_line.psi(negB_cache));
      }
    }

    let g2_line = g2_lines[line_cnt];
    let tau_line = tau_lines[line_cnt];
    line_cnt += 1;
    idx += 1;

    g.push(g2_line.psi(a_cache));
    g[idx] = g[idx].sparse_mul(tau_line.psi(negB_cache));

    g2_line = g2_lines[line_cnt];
    tau_line = tau_lines[line_cnt];
    g[idx] = g[idx].sparse_mul(g2_line.psi(a_cache));
    g[idx] = g[idx].sparse_mul(tau_line.psi(negB_cache));

    return g;
  }
}

export { KZGLineAccumulator };
