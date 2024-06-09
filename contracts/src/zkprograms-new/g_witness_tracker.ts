import { Poseidon, Provable } from "o1js";
import { G1Affine, G2Affine } from "../ec/index.js";
import { G2Line } from "../lines/index.js";
import { AffineCache } from "../lines/precompute.js";
import { ATE_LOOP_COUNT, Fp12 } from "../towers/index.js";
import { getB, getBHardcodedLines, getC, getNegA, getPI } from "./helpers.js";
import fs from 'fs';

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
    
          g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
          T = T.double_from_line(line_b.lambda);
    
          if (ATE_LOOP_COUNT[i] == 1) {
            let line_b = b_lines[line_cnt];
            line_cnt += 1;
    
            g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
            T = T.add_from_line(line_b.lambda, B);
          }
          if (ATE_LOOP_COUNT[i] == -1) {
            let line_b = b_lines[line_cnt];
            line_cnt += 1;
    
            g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
            T = T.add_from_line(line_b.lambda, negB);
          }
        }

        return g
    }

    zkp2(g: Array<Fp12>, negA: G1Affine, b_lines: Array<G2Line>, B: G2Affine): Array<Fp12> {
        const a_cache = new AffineCache(negA);
        const negB = B.neg();
    
        let idx = 0;
        let line_cnt = 0;
    
        for (let i = ATE_LOOP_COUNT.length - 19; i < ATE_LOOP_COUNT.length; i++) {
          idx = i - 1;
    
          let line_b = b_lines[line_cnt];
          line_cnt += 1;
        //   line_b.assert_is_tangent(T);
    
          g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
    
          if (ATE_LOOP_COUNT[i] == 1) {
            let line_b = b_lines[line_cnt];
            line_cnt += 1;
            // line_b.assert_is_line(T, B);
    
            g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
          }
          if (ATE_LOOP_COUNT[i] == -1) {
            let line_b = b_lines[line_cnt];
            line_cnt += 1;
            // line_b.assert_is_line(T, negB);
    
            g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
          }
        }

        const piB = B.frobenius();
        let line_b;

        line_b = b_lines[line_cnt];
        line_cnt += 1;
        // line_b.assert_is_line(T, piB);

        idx += 1;
        g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));

        // let pi_2_B = piB.negative_frobenius();
        line_b = b_lines[line_cnt];
        // line_b.assert_is_line(T, pi_2_B);

        // idx += 1;
        g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));

        return g
    }

    zkp3(g: Array<Fp12>, C: G1Affine, delta_lines: Array<G2Line>): Array<Fp12> {
        const c_cache = new AffineCache(C);

        let idx = 0;
        let line_cnt = 0;
        for (let i = 1; i < ATE_LOOP_COUNT.length - 50; i++) {
            idx = i - 1;
    
            let line_b = delta_lines[line_cnt];
            line_cnt += 1;
      
            g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
      
            if (ATE_LOOP_COUNT[i] == 1) {
              let line_b = delta_lines[line_cnt];
              line_cnt += 1;
      
              g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
            }

            if (ATE_LOOP_COUNT[i] == -1) {
              let line_b = delta_lines[line_cnt];
              line_cnt += 1;
      
              g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
            }
        }

        return g
    }

    zkp4(g: Array<Fp12>, C: G1Affine, delta_lines: Array<G2Line>): Array<Fp12> {
      const c_cache = new AffineCache(C);

      let idx = 0;
      let line_cnt = 0;
      for (let i = ATE_LOOP_COUNT.length - 50; i < ATE_LOOP_COUNT.length - 35; i++) {
          idx = i - 1;
  
          let line_b = delta_lines[line_cnt];
          line_cnt += 1;
    
          g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
    
          if (ATE_LOOP_COUNT[i] == 1) {
            let line_b = delta_lines[line_cnt];
            line_cnt += 1;
    
            g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
          }

          if (ATE_LOOP_COUNT[i] == -1) {
            let line_b = delta_lines[line_cnt];
            line_cnt += 1;
    
            g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
          }
      }

      return g
    }

    zkp5(g: Array<Fp12>, C: G1Affine, delta_lines: Array<G2Line>): Array<Fp12> {
      const c_cache = new AffineCache(C);

      let idx = 0;
      let line_cnt = 0;
      for (let i = ATE_LOOP_COUNT.length - 35; i < ATE_LOOP_COUNT.length - 21; i++) {
          idx = i - 1;
  
          let line_b = delta_lines[line_cnt];
          line_cnt += 1;
    
          g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
    
          if (ATE_LOOP_COUNT[i] == 1) {
            let line_b = delta_lines[line_cnt];
            line_cnt += 1;
    
            g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
          }

          if (ATE_LOOP_COUNT[i] == -1) {
            let line_b = delta_lines[line_cnt];
            line_cnt += 1;
    
            g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
          }
      }

      return g
    }
    zkp6(g: Array<Fp12>, C: G1Affine, delta_lines: Array<G2Line>): Array<Fp12> {
      const c_cache = new AffineCache(C);

      let idx = 0;
      let line_cnt = 0;
      for (let i = ATE_LOOP_COUNT.length - 21; i < ATE_LOOP_COUNT.length - 8; i++) {
          idx = i - 1;
  
          let line_b = delta_lines[line_cnt];
          line_cnt += 1;
    
          g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
    
          if (ATE_LOOP_COUNT[i] == 1) {
            let line_b = delta_lines[line_cnt];
            line_cnt += 1;
    
            g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
          }

          if (ATE_LOOP_COUNT[i] == -1) {
            let line_b = delta_lines[line_cnt];
            line_cnt += 1;
    
            g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
          }
      }

      return g
    }

    zkp7(g: Array<Fp12>, C: G1Affine, delta_lines: Array<G2Line>): Array<Fp12> {
      const c_cache = new AffineCache(C);

      let idx = 0;
      let line_cnt = 0;
      for (let i = ATE_LOOP_COUNT.length - 8; i < ATE_LOOP_COUNT.length; i++) {
          idx = i - 1;
  
          let line_b = delta_lines[line_cnt];
          line_cnt += 1;
    
          g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
    
          if (ATE_LOOP_COUNT[i] == 1) {
            let line_b = delta_lines[line_cnt];
            line_cnt += 1;
    
            g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
          }

          if (ATE_LOOP_COUNT[i] == -1) {
            let line_b = delta_lines[line_cnt];
            line_cnt += 1;
    
            g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
          }
      }

      let line_delta;

      line_delta = delta_lines[line_cnt];
      line_cnt += 1;
  
      idx += 1;
      g[idx] = g[idx].sparse_mul(line_delta.psi(c_cache));

      line_delta = delta_lines[line_cnt];
      g[idx] = g[idx].sparse_mul(line_delta.psi(c_cache));

      return g
    }

    zkp8(g: Array<Fp12>, PI: G1Affine, gamma_lines: Array<G2Line>): Array<Fp12> {
      const pi_cache = new AffineCache(PI);

      let idx = 0;
      let line_cnt = 0;
      for (let i = 1; i < ATE_LOOP_COUNT.length - 50; i++) {
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

      return g
  }

  zkp9(g: Array<Fp12>, PI: G1Affine, gamma_lines: Array<G2Line>): Array<Fp12> {
    const pi_cache = new AffineCache(PI);

    let idx = 0;
    let line_cnt = 0;
    for (let i = ATE_LOOP_COUNT.length - 50; i < ATE_LOOP_COUNT.length - 35; i++) {
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

    return g
  }

  zkp10(g: Array<Fp12>, PI: G1Affine, gamma_lines: Array<G2Line>): Array<Fp12> {
    const pi_cache = new AffineCache(PI);

    let idx = 0;
    let line_cnt = 0;
    for (let i = ATE_LOOP_COUNT.length - 35; i < ATE_LOOP_COUNT.length - 21; i++) {
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

    return g
  }

  zkp11(g: Array<Fp12>, PI: G1Affine, gamma_lines: Array<G2Line>): Array<Fp12> {
    const pi_cache = new AffineCache(PI);

    let idx = 0;
    let line_cnt = 0;
    for (let i = ATE_LOOP_COUNT.length - 21; i < ATE_LOOP_COUNT.length - 8; i++) {
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

    return g
  }

  zkp12(g: Array<Fp12>, PI: G1Affine, gamma_lines: Array<G2Line>): Array<Fp12> {
    const pi_cache = new AffineCache(PI);

    let idx = 0;
    let line_cnt = 0;
    for (let i = ATE_LOOP_COUNT.length - 8; i < ATE_LOOP_COUNT.length; i++) {
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

    return g
  }
}

const bLines = getBHardcodedLines();
let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
const delta_lines = parsed_delta_lines.map(
  (g: any): G2Line => G2Line.fromJSON(g)
);

let gamma_lines_input = fs.readFileSync('./src/groth16/gamma_lines.json', 'utf8');
let parsed_gamma_lines: any[] = JSON.parse(gamma_lines_input);
const gamma_lines = parsed_gamma_lines.map(
  (g: any): G2Line => G2Line.fromJSON(g)
);

const gt = new GWitnessTracker();
let g = gt.zkp1(getNegA(), bLines, getB());
g = gt.zkp2(g, getNegA(), bLines.slice(62, 62 + 29), getB());
g = gt.zkp3(g, getC(), delta_lines);
g = gt.zkp4(g, getC(), delta_lines.slice(20, 40));
g = gt.zkp5(g, getC(), delta_lines.slice(40, 59));
g = gt.zkp6(g, getC(), delta_lines.slice(59, 78));
g = gt.zkp7(g, getC(), delta_lines.slice(78, 91));
g = gt.zkp8(g, getPI(), gamma_lines.slice(0, 20));
g = gt.zkp9(g, getPI(), gamma_lines.slice(20, 40));
g = gt.zkp10(g, getPI(), gamma_lines.slice(40, 59));
g = gt.zkp11(g, getPI(), gamma_lines.slice(59, 78));
g = gt.zkp12(g, getPI(), gamma_lines.slice(78, 91));

const gDigest = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
console.log(gDigest);

export { GWitnessTracker }