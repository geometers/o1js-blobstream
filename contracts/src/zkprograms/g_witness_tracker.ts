import { G1Affine, G2Affine } from "../ec/index.js";
import { G2Line } from "../lines/index.js";
import { AffineCache } from "../lines/precompute.js";
import { ATE_LOOP_COUNT, Fp12 } from "../towers/index.js";

class GWitnessTracker {
    zkp1(negA: G1Affine, b_lines: Array<G2Line>, B: G2Affine): Array<Fp12> {
        const g: Array<Fp12> = []; 
        for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
            g.push(Fp12.one());
        }

        const a_cache = new AffineCache(negA);
    
        let T = new G2Affine({ x: B.x, y: B.y });
        const negB = B.neg();
    
        let idx = 0;
        let line_cnt = 0;
    
        for (let i = 1; i < ATE_LOOP_COUNT.length - 19; i++) {
          idx = i - 1;
    
          let line_b = b_lines[line_cnt];
          line_cnt += 1;
        //   line_b.assert_is_tangent(T);
    
          g[idx] = line_b.psi(a_cache);
          T = T.double_from_line(line_b.lambda);
    
          if (ATE_LOOP_COUNT[i] == 1) {
            let line_b = b_lines[line_cnt];
            line_cnt += 1;
            // line_b.assert_is_line(T, B);
    
            g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
            T = T.add_from_line(line_b.lambda, B);
          }
          if (ATE_LOOP_COUNT[i] == -1) {
            let line_b = b_lines[line_cnt];
            line_cnt += 1;
            // line_b.assert_is_line(T, negB);
    
            g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
            T = T.add_from_line(line_b.lambda, negB);
          }
        }

        return g
    }

    zkp2(g: Array<Fp12>, negA: G1Affine, b_lines: Array<G2Line>, B: G2Affine, T: G2Affine): Array<Fp12> {
        const a_cache = new AffineCache(negA);
        const negB = B.neg();
    
        let idx = 0;
        let line_cnt = 0;
    
        for (let i = ATE_LOOP_COUNT.length - 19; i < ATE_LOOP_COUNT.length; i++) {
          idx = i - 1;
    
          let line_b = b_lines[line_cnt];
          line_cnt += 1;
        //   line_b.assert_is_tangent(T);
    
          g[idx] = line_b.psi(a_cache);
          T = T.double_from_line(line_b.lambda);
    
          if (ATE_LOOP_COUNT[i] == 1) {
            let line_b = b_lines[line_cnt];
            line_cnt += 1;
            // line_b.assert_is_line(T, B);
    
            g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
            T = T.add_from_line(line_b.lambda, B);
          }
          if (ATE_LOOP_COUNT[i] == -1) {
            let line_b = b_lines[line_cnt];
            line_cnt += 1;
            // line_b.assert_is_line(T, negB);
    
            g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
            T = T.add_from_line(line_b.lambda, negB);
          }
        }

        const piB = B.frobenius();
        let line_b;

        line_b = b_lines[line_cnt];
        line_cnt += 1;
        // line_b.assert_is_line(T, piB);

        idx += 1;
        g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
        T = T.add_from_line(line_b.lambda, piB);

        // let pi_2_B = piB.negative_frobenius();
        line_b = b_lines[line_cnt];
        // line_b.assert_is_line(T, pi_2_B);

        // idx += 1;
        g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));

        return g
    }

    zkp3(): Array<Fp12> {
        return []
    }
}

export { GWitnessTracker }