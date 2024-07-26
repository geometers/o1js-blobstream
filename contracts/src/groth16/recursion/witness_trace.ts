import { G1Affine, G2Affine } from "../../ec/index.js";
import { ATE_LOOP_COUNT, Fp12, Fp2 } from "../../towers/index.js";
import { Groth16Data } from "./data.js";
import { G2Line } from "../../lines/index.js";
import { AffineCache } from "../../lines/precompute.js";
import { getBHardcodedLines, getBSlice, get_alpha_beta, make_w27, make_w27_sq } from "./helpers.js";
import fs from "fs";
import { Field, Poseidon, Provable } from "o1js";

class WitnessTracker {
    init(negA: G1Affine, B: G2Affine, C: G1Affine, PI: G1Affine, c: Fp12, f: Fp12, shift: Field): Groth16Data {
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
            f, 
            g, 
            T: new G2Affine({ x: Fp2.zero(), y: Fp2.zero() }), 
            shift,
        })
    }

    zkp0(input: Groth16Data): Groth16Data {
        const negA = input.negA; 
        const B = input.B; 

        const g: Array<Fp12> = []; 
        for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
          g.push(input.g[i]);
        }

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
            f: input.f, 
            shift: input.shift
        });
    }

    zkp1(input: Groth16Data) {
        const negA = input.negA; 
        const B = input.B; 

        const g: Array<Fp12> = []; 
        for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
          g.push(input.g[i]);
        }

        const a_cache = new AffineCache(negA);

        let b_lines = getBSlice(1);

        // let T = input.T;
        let T = new G2Affine({ x: input.T.x, y: input.T.y });
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
            f: input.f, 
            shift: input.shift
        });
    }

    zkp2(input: Groth16Data) {
        const negA = input.negA; 
        const g: Array<Fp12> = []; 
        for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
          g.push(input.g[i]);
        }

        const a_cache = new AffineCache(negA);

        let b_lines = getBSlice(2);

        let T = new G2Affine({ x: input.T.x, y: input.T.y });

        let line_cnt = 0;
        let line_b;

        line_b = b_lines[line_cnt];
        line_cnt += 1;

        let idx = ATE_LOOP_COUNT.length - 1;
        g[idx] = line_b.psi(a_cache);

        // do this in order to keep hashes consistent
        const piB = input.B.frobenius();
        T = T.add_from_line(line_b.lambda, piB);

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
            f: input.f, 
            shift: input.shift
        });
    }
    
    zkp3(input: Groth16Data) {
      const c_cache = new AffineCache(input.C);
      const g: Array<Fp12> = []; 
      for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
        g.push(input.g[i]);
      }

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
          f: input.f, 
          shift: input.shift
      });
    }

    zkp4(input: Groth16Data) {
      const c_cache = new AffineCache(input.C);
      const g: Array<Fp12> = []; 
      for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
        g.push(input.g[i]);
      }

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
          f: input.f, 
          shift: input.shift
      });
    }

    zkp5(input: Groth16Data) {
      const c_cache = new AffineCache(input.C);
      const g: Array<Fp12> = []; 
      for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
        g.push(input.g[i]);
      }

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
          f: input.f, 
          shift: input.shift
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

      const g: Array<Fp12> = []; 
      for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
        g.push(input.g[i]);
      }
  
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
          f: input.f, 
          shift: input.shift
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

      const g: Array<Fp12> = []; 
      for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
        g.push(input.g[i]);
      }
  
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
          f: input.f, 
          shift: input.shift
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

      const g: Array<Fp12> = []; 
      for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
        g.push(input.g[i]);
      }
  
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
          f: input.f, 
          shift: input.shift
      });
    }

    zkp9(input: Groth16Data) {
      const g: Array<Fp12> = []; 
      for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
        g.push(input.g[i]);
      }

      const c = input.c;
      const c_inv = c.inverse();
      let f = new Fp12({ c0: c_inv.c0, c1: c_inv.c1 });
  
      let idx = 0;
  
      for (let i = 1; i < ATE_LOOP_COUNT.length - 57; i++) {
        idx = i - 1;
        f = f.square().mul(g[idx]);
  
        if (ATE_LOOP_COUNT[i] == 1) {
          f = f.mul(c_inv);
        }
  
        if (ATE_LOOP_COUNT[i] == -1) {
          f = f.mul(c);
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
        f, 
        shift: input.shift
      });
    }

    zkp10(input: Groth16Data) {
      const g: Array<Fp12> = []; 
      for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
        g.push(input.g[i]);
      }
      
      const c = input.c;
      const c_inv = c.inverse();

      let f = new Fp12({ c0: input.f.c0, c1: input.f.c1 });
  
      let idx = 0;
  
      for (let i = ATE_LOOP_COUNT.length - 57; i < ATE_LOOP_COUNT.length - 50; i++) {
        idx = i - 1;
        f = f.square().mul(g[idx]);
  
        if (ATE_LOOP_COUNT[i] == 1) {
          f = f.mul(c_inv);
        }
  
        if (ATE_LOOP_COUNT[i] == -1) {
          f = f.mul(c);
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
        f, 
        shift: input.shift
      });
    }

    zkp11(input: Groth16Data) {
      const g: Array<Fp12> = []; 
      for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
        g.push(input.g[i]);
      }

      const c = input.c;
      const c_inv = c.inverse();
      let f = new Fp12({ c0: input.f.c0, c1: input.f.c1 });
  
      let idx = 0;
  
      for (let i = ATE_LOOP_COUNT.length - 50; i < ATE_LOOP_COUNT.length - 43; i++) {
        idx = i - 1;
        f = f.square().mul(g[idx]);
  
        if (ATE_LOOP_COUNT[i] == 1) {
          f = f.mul(c_inv);
        }
  
        if (ATE_LOOP_COUNT[i] == -1) {
          f = f.mul(c);
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
        f, 
        shift: input.shift
      });
    }

    zkp12(input: Groth16Data) {
      const g: Array<Fp12> = []; 
      for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
        g.push(input.g[i]);
      }

      const c = input.c;
      const c_inv = c.inverse();
      let f = new Fp12({ c0: input.f.c0, c1: input.f.c1 });
  
      let idx = 0;
  
      for (let i = ATE_LOOP_COUNT.length - 43; i < ATE_LOOP_COUNT.length - 36; i++) {
        idx = i - 1;
        f = f.square().mul(g[idx]);
  
        if (ATE_LOOP_COUNT[i] == 1) {
          f = f.mul(c_inv);
        }
  
        if (ATE_LOOP_COUNT[i] == -1) {
          f = f.mul(c);
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
        f, 
        shift: input.shift
      });
    }

    zkp13(input: Groth16Data) {
      const g: Array<Fp12> = []; 
      for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
        g.push(input.g[i]);
      }

      const c = input.c;
      const c_inv = c.inverse();
      let f = new Fp12({ c0: input.f.c0, c1: input.f.c1 });
  
      let idx = 0;
  
      for (let i = ATE_LOOP_COUNT.length - 36; i < ATE_LOOP_COUNT.length - 30; i++) {
        idx = i - 1;
        f = f.square().mul(g[idx]);
  
        if (ATE_LOOP_COUNT[i] == 1) {
          f = f.mul(c_inv);
        }
  
        if (ATE_LOOP_COUNT[i] == -1) {
          f = f.mul(c);
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
        f, 
        shift: input.shift
      });
    }

    zkp14(input: Groth16Data) {
      const g: Array<Fp12> = []; 
      for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
        g.push(input.g[i]);
      }

      const c = input.c;
      const c_inv = c.inverse();
      let f = new Fp12({ c0: input.f.c0, c1: input.f.c1 });
  
      let idx = 0;
  
      for (let i = ATE_LOOP_COUNT.length - 30; i < ATE_LOOP_COUNT.length - 23; i++) {
        idx = i - 1;
        f = f.square().mul(g[idx]);
  
        if (ATE_LOOP_COUNT[i] == 1) {
          f = f.mul(c_inv);
        }
  
        if (ATE_LOOP_COUNT[i] == -1) {
          f = f.mul(c);
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
        f, 
        shift: input.shift
      });
    }

    zkp15(input: Groth16Data) {
      const g: Array<Fp12> = []; 
      for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
        g.push(input.g[i]);
      }

      const c = input.c;
      const c_inv = c.inverse();
      let f = new Fp12({ c0: input.f.c0, c1: input.f.c1 });
  
      let idx = 0;
  
      for (let i = ATE_LOOP_COUNT.length - 23; i < ATE_LOOP_COUNT.length - 16; i++) {
        idx = i - 1;
        f = f.square().mul(g[idx]);
  
        if (ATE_LOOP_COUNT[i] == 1) {
          f = f.mul(c_inv);
        }
  
        if (ATE_LOOP_COUNT[i] == -1) {
          f = f.mul(c);
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
        f, 
        shift: input.shift
      });
    }

    zkp16(input: Groth16Data) {
      const g: Array<Fp12> = []; 
      for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
        g.push(input.g[i]);
      }

      const c = input.c;
      const c_inv = c.inverse();
      let f = new Fp12({ c0: input.f.c0, c1: input.f.c1 });
  
      let idx = 0;
  
      for (let i = ATE_LOOP_COUNT.length - 16; i < ATE_LOOP_COUNT.length - 9; i++) {
        idx = i - 1;
        f = f.square().mul(g[idx]);
  
        if (ATE_LOOP_COUNT[i] == 1) {
          f = f.mul(c_inv);
        }
  
        if (ATE_LOOP_COUNT[i] == -1) {
          f = f.mul(c);
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
        f, 
        shift: input.shift
      });
    }

    zkp17(input: Groth16Data) {
      const g: Array<Fp12> = []; 
      for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
        g.push(input.g[i]);
      }

      const c = input.c;
      const c_inv = c.inverse();
      let f = new Fp12({ c0: input.f.c0, c1: input.f.c1 });
  
      let idx = 0;
  
      for (let i = ATE_LOOP_COUNT.length - 9; i < ATE_LOOP_COUNT.length - 2; i++) {
        idx = i - 1;
        f = f.square().mul(g[idx]);
  
        if (ATE_LOOP_COUNT[i] == 1) {
          f = f.mul(c_inv);
        }
  
        if (ATE_LOOP_COUNT[i] == -1) {
          f = f.mul(c);
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
        f, 
        shift: input.shift
      });
    }

    zkp18(input: Groth16Data) {
      const g: Array<Fp12> = []; 
      for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
        g.push(input.g[i]);
      }

      const c = input.c;
      const c_inv = c.inverse();
      let f = new Fp12({ c0: input.f.c0, c1: input.f.c1 });
  
      let idx = 0;
  
      for (let i = ATE_LOOP_COUNT.length - 2; i < ATE_LOOP_COUNT.length; i++) {
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

      let gamma_1s_input = fs.readFileSync('./src/towers/gamma_1s.json', 'utf8');
      let parsed_gamma_1s: any[] = JSON.parse(gamma_1s_input);
      let gamma_1s = parsed_gamma_1s.map(
        (g: any): Fp2 => Fp2.loadFromJson(g)
      );

      let gamma_2s_input = fs.readFileSync('./src/towers/gamma_2s.json', 'utf8');
      let parsed_gamma_2s: any[] = JSON.parse(gamma_2s_input);
      let gamma_2s = parsed_gamma_2s.map(
        (g: any): Fp2 => Fp2.loadFromJson(g)
      );

      let gamma_3s_input = fs.readFileSync('./src/towers/gamma_3s.json', 'utf8');
      let parsed_gamma_3s: any[] = JSON.parse(gamma_3s_input);
      let gamma_3s = parsed_gamma_3s.map(
        (g: any): Fp2 => Fp2.loadFromJson(g)
      );

      f = f
      .mul(c_inv.frobenius_pow_p_with_gammas(gamma_1s))
      .mul(input.c.frobenius_pow_p_squared_with_gammas(gamma_2s))
      .mul(c_inv.frobenius_pow_p_cubed_with_gammas(gamma_3s))
      .mul(get_alpha_beta());

      let shift; 
      const shift_power = input.shift;

      if (shift_power.equals(Field(0)).toBoolean()) {
        shift = Fp12.one();
      } else if (shift_power.equals(Field(1)).toBoolean()) {
        shift = make_w27();
      } else if (shift_power.equals(Field(2)).toBoolean()) {
        shift = make_w27_sq();
      } else {
        process.exit(1)
      }

      f = f.mul(shift);
      f.assert_equals(Fp12.one());
    }
}

export { WitnessTracker }