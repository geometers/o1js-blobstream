import { G1Affine, G2Affine } from "../ec/index.js";
import { ATE_LOOP_COUNT, Fp12, Fp2 } from "../towers/index.js";
import { Groth16Data } from "./data.js";
import { G2Line } from "../lines/index.js";
import { AffineCache } from "../lines/precompute.js";
import { getBHardcodedLines, getBSlice } from "./helpers.js";
import fs from "fs";

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
    
        for (let i = 1; i < ATE_LOOP_COUNT.length - 32; i++) {
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
    
        for (let i = ATE_LOOP_COUNT.length - 32; i < ATE_LOOP_COUNT.length; i++) {
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

        let line_cnt = 0;
        let line_b;

        line_b = b_lines[line_cnt];
        line_cnt += 1;

        let idx = ATE_LOOP_COUNT.length - 1;
        g[idx] = line_b.psi(a_cache);

        line_b = b_lines[line_cnt];
        g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));


        // start (C, delta)
        const c_cache = new AffineCache(input.C);

        let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
        let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
        let delta_lines = parsed_delta_lines.map(
          (g: any): G2Line => G2Line.fromJSON(g)
        );

        // delta_lines = delta_lines.slice(0, 25);
        
        idx = 0;
        line_cnt = 0;

        for (let i = 1; i < ATE_LOOP_COUNT.length - 47; i++) {
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
      const c_cache = new AffineCache(input.C);
      let g = input.g;

      let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
      let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
      let delta_lines = parsed_delta_lines.map(
        (g: any): G2Line => G2Line.fromJSON(g)
      );
  
      delta_lines = delta_lines.slice(25, 91);
  
      let idx = 0;
      let line_cnt = 0;
  
      for (let i = ATE_LOOP_COUNT.length - 47; i < ATE_LOOP_COUNT.length - 26; i++) {
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

      return new Groth16Data({
          negA: input.negA, 
          B: input.B, 
          C: input.C, 
          PI: input.PI,
          g,
          T: input.T,
          c: input.c, 
          w27: input.w27
      });
    }

    zkp4(input: Groth16Data) {
      const c_cache = new AffineCache(input.C);
      let g = input.g;

      let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
      let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
      let delta_lines = parsed_delta_lines.map(
        (g: any): G2Line => G2Line.fromJSON(g)
      );
  
      delta_lines = delta_lines.slice(25 + 27, 91);
  
      let idx = 0;
      let line_cnt = 0;
  
      for (let i = ATE_LOOP_COUNT.length - 26; i < ATE_LOOP_COUNT.length - 8; i++) {
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

      return new Groth16Data({
          negA: input.negA, 
          B: input.B, 
          C: input.C, 
          PI: input.PI,
          g,
          T: input.T,
          c: input.c, 
          w27: input.w27
      });
    }

    zkp5(input: Groth16Data) {
      const c_cache = new AffineCache(input.C);
      let g = input.g;

      let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
      let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
      let delta_lines = parsed_delta_lines.map(
        (g: any): G2Line => G2Line.fromJSON(g)
      );
  
      delta_lines = delta_lines.slice(25 + 27 + 26, 91);
  
      let idx = 0;
      let line_cnt = 0;
  
      for (let i = ATE_LOOP_COUNT.length - 8; i < ATE_LOOP_COUNT.length; i++) {
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

      line_delta = delta_lines[line_cnt];
      g[idx] = g[idx].sparse_mul(line_delta.psi(c_cache));

      // START (PI, gamma)

      const pi_cache = new AffineCache(input.PI);

      let gamma_lines_input = fs.readFileSync('./src/groth16/gamma_lines.json', 'utf8');
      let parsed_gamma_lines: any[] = JSON.parse(gamma_lines_input);
      const gamma_lines = parsed_gamma_lines.map(
        (g: any): G2Line => G2Line.fromJSON(g)
      );
  
      idx = 0;
      line_cnt = 0;
      for (let i = 1; i < ATE_LOOP_COUNT.length - 55; i++) {
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

      return new Groth16Data({
          negA: input.negA, 
          B: input.B, 
          C: input.C, 
          PI: input.PI,
          g,
          T: input.T,
          c: input.c, 
          w27: input.w27
      });
    }

    zkp6(input: Groth16Data) {
      const pi_cache = new AffineCache(input.PI);

      let gamma_lines_input = fs.readFileSync('./src/groth16/gamma_lines.json', 'utf8');
      let parsed_gamma_lines: any[] = JSON.parse(gamma_lines_input);
      let gamma_lines = parsed_gamma_lines.map(
        (g: any): G2Line => G2Line.fromJSON(g)
      );
      gamma_lines = gamma_lines.slice(14, 91);

      const g = input.g;
  
      let idx = 0;
      let line_cnt = 0;
      for (let i = ATE_LOOP_COUNT.length - 55; i < ATE_LOOP_COUNT.length - 34; i++) {
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
                    

      return new Groth16Data({
          negA: input.negA, 
          B: input.B, 
          C: input.C, 
          PI: input.PI,
          g,
          T: input.T,
          c: input.c, 
          w27: input.w27
      });
    }

    zkp7(input: Groth16Data) {
      const pi_cache = new AffineCache(input.PI);

      let gamma_lines_input = fs.readFileSync('./src/groth16/gamma_lines.json', 'utf8');
      let parsed_gamma_lines: any[] = JSON.parse(gamma_lines_input);
      let gamma_lines = parsed_gamma_lines.map(
        (g: any): G2Line => G2Line.fromJSON(g)
      );
      gamma_lines = gamma_lines.slice(14 + 27, 91);

      const g = input.g;
  
      let idx = 0;
      let line_cnt = 0;
      for (let i = ATE_LOOP_COUNT.length - 34; i < ATE_LOOP_COUNT.length - 15; i++) {
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
                    

      return new Groth16Data({
          negA: input.negA, 
          B: input.B, 
          C: input.C, 
          PI: input.PI,
          g,
          T: input.T,
          c: input.c, 
          w27: input.w27
      });
    }

    zkp8(input: Groth16Data) {
      const pi_cache = new AffineCache(input.PI);

      let gamma_lines_input = fs.readFileSync('./src/groth16/gamma_lines.json', 'utf8');
      let parsed_gamma_lines: any[] = JSON.parse(gamma_lines_input);
      let gamma_lines = parsed_gamma_lines.map(
        (g: any): G2Line => G2Line.fromJSON(g)
      );
      gamma_lines = gamma_lines.slice(14 + 27 + 27, 91);

      const g = input.g;
  
      let idx = 0;
      let line_cnt = 0;
      for (let i = ATE_LOOP_COUNT.length - 15; i < ATE_LOOP_COUNT.length; i++) {
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
                    

      return new Groth16Data({
          negA: input.negA, 
          B: input.B, 
          C: input.C, 
          PI: input.PI,
          g,
          T: input.T,
          c: input.c, 
          w27: input.w27
      });
    }
}

export { WitnessTracker }