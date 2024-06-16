import { G1Affine, G2Affine } from "../ec/index.js";
import { ATE_LOOP_COUNT, Fp12, Fp2 } from "../towers/index.js";
import { Groth16Data } from "./data.js";
import { G2Line } from "../lines/index.js";
import { AffineCache } from "../lines/precompute.js";
import { getBHardcodedLines, getBSlice } from "./helpers.js";

class WitnessTracker {
    init(negA: G1Affine, B: G2Affine, C: G1Affine, PI: G1Affine, c: Fp12, w27: Fp12): Groth16Data {
        const g: Array<Fp12> = []; 
        for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
            g.push(Fp12.zero());
        }

        return new Groth16Data({
            negA, 
            B, 
            PI, 
            C, 
            c, 
            w27, 
            g, 
            T: new G2Affine({ x: Fp2.zero(), y: Fp2.zero() })
        })
    }

    zkp0(input: Groth16Data): Groth16Data {
        const negA = input.negA; 
        const B = input.B; 
        const g = input.g;

        let b_lines = getBSlice(0);

        const a_cache = new AffineCache(negA);
    
        let T = new G2Affine({ x: B.x, y: B.y });
        const negB = B.neg();
    
        let idx = 0;
        let line_cnt = 0;
    
        for (let i = 1; i < ATE_LOOP_COUNT.length - 45; i++) {
          idx = i - 1;
    
          let line_b = b_lines[line_cnt];
          line_cnt += 1;
          line_b.assert_is_tangent(T);

          g[idx] = line_b.psi(a_cache);
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

        return new Groth16Data({
            negA, 
            B: input.B, 
            C: input.C, 
            PI: input.PI,
            g,
            T,
            c: input.c, 
            w27: input.w27
        });
    }

    zkp1(input: Groth16Data) {
        const negA = input.negA; 
        const B = input.B; 
        const g = input.g;

        const a_cache = new AffineCache(negA);

        let b_lines = getBSlice(1);

        let T = input.T;
        const negB = B.neg();
    
        let idx = 0;
        let line_cnt = 0;
    
        for (let i = ATE_LOOP_COUNT.length - 45; i < ATE_LOOP_COUNT.length - 26; i++) {
          idx = i - 1;
    
          let line_b = b_lines[line_cnt];
          line_b.assert_is_tangent(T);
          line_cnt += 1;
    
          g[idx] = line_b.psi(a_cache);
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

        return new Groth16Data({
            negA, 
            B: input.B, 
            C: input.C, 
            PI: input.PI,
            g,
            T,
            c: input.c, 
            w27: input.w27
        });
    }

    zkp2(input: Groth16Data) {
        const negA = input.negA; 
        const B = input.B; 
        const g = input.g;

        const a_cache = new AffineCache(negA);

        let b_lines = getBSlice(2);


        let T = input.T;
        const negB = B.neg();
    
        let idx = 0;
        let line_cnt = 0;
    
        for (let i = ATE_LOOP_COUNT.length - 26; i < ATE_LOOP_COUNT.length - 7; i++) {
          idx = i - 1;
    
          let line_b = b_lines[line_cnt];
          line_b.assert_is_tangent(T);
          line_cnt += 1;
    
          g[idx] = line_b.psi(a_cache);
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

        return new Groth16Data({
            negA, 
            B: input.B, 
            C: input.C, 
            PI: input.PI,
            g,
            T,
            c: input.c, 
            w27: input.w27
        });
    }
    
    zkp3(input: Groth16Data) {
        const negA = input.negA; 
        const B = input.B; 
        const g = input.g;

        const a_cache = new AffineCache(negA);

        let b_lines = getBSlice(3);


        let T = input.T;
        const negB = B.neg();
    
        let idx = 0;
        let line_cnt = 0;
    
        for (let i = ATE_LOOP_COUNT.length - 7; i < ATE_LOOP_COUNT.length; i++) {
          idx = i - 1;
    
          let line_b = b_lines[line_cnt];
          line_b.assert_is_tangent(T);
          line_cnt += 1;
    
          g[idx] = line_b.psi(a_cache);
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

        return new Groth16Data({
            negA, 
            B: input.B, 
            C: input.C, 
            PI: input.PI,
            g,
            T,
            c: input.c, 
            w27: input.w27
        });
    }
}

export { WitnessTracker }