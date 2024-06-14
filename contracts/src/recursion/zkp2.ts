import {
    ZkProgram,
    Provable,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT } from '../towers/index.js';
import { AffineCache } from '../lines/precompute.js';
import { G2Line } from '../lines/index.js';
import { CZkpIn, CZkpOut, toDefaultOutput } from '../structs.js';
import { Groth16Data } from './data.js';


const zkp2 = ZkProgram({
    name: 'zkp2',
    publicInput: CZkpIn,
    publicOutput: CZkpOut,
    methods: {
      compute: {
        privateInputs: [Groth16Data, Provable.Array(G2Line, 25)],
        async method(
            input: CZkpIn,
            wIn: Groth16Data, 
            b_lines: Array<G2Line>,
        ) {        
            const inDigest = Poseidon.hashPacked(Groth16Data, wIn);
            inDigest.assertEquals(input.digest);

            const a_cache = new AffineCache(wIn.negA);

            const B = wIn.B;
            let T = wIn.T;
            const negB = B.neg();
            let g = wIn.g;
        
            let idx = 0;
            let line_cnt = 0;
        
            for (let i = ATE_LOOP_COUNT.length - 45; i < ATE_LOOP_COUNT.length - 26; i++) {
              idx = i - 1;
        
              let line_b = b_lines[line_cnt];
              line_cnt += 1;
              line_b.assert_is_tangent(T);
        
              // we can do this instead of g*= because we know that g is initialize to all `1s`
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

            // let gamma_1s_input = fs.readFileSync('./src/towers/gamma_1s.json', 'utf8');
            // let parsed_gamma_1s: any[] = JSON.parse(gamma_1s_input);
            // let gamma_1s = parsed_gamma_1s.map(
            //   (g: any): Fp2 => Fp2.fromJSON(g)
            // );

            // g1.assert_equals(gamma_1s[1]);
            // g2.assert_equals(gamma_1s[2]);

            // let neg_gamma_input = fs.readFileSync('./src/towers/neg_gamma.json', 'utf8');
            // let neg_gamma = Fp2.fromJSON(JSON.parse(neg_gamma_input));

            // g3.assert_equals(neg_gamma);
            
            // // GAMMA_1S[1], GAMMA_1S[2], NEG_GAMMA_13
            // const piB = B.frobFromInputs(g1, g2);
            // let line_b;

            // line_b = b_lines[line_cnt];
            // line_cnt += 1;
            // line_b.assert_is_line(T, piB);

            // idx += 1;
            // g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
            // T = T.add_from_line(line_b.lambda, piB);

            // let pi_2_B = piB.negFrobFromInputs(g1, g3);
            // line_b = b_lines[line_cnt];
            // line_b.assert_is_line(T, pi_2_B);

            // // idx += 1;
            // g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
                          
            const output =  new Groth16Data({
                negA: wIn.negA, 
                B, 
                C: wIn.C, 
                PI: wIn.PI,
                g,
                T,
                c: wIn.c, 
                w27: wIn.w27
            });

            return toDefaultOutput(Poseidon.hashPacked(Groth16Data, output));
        },
      },
    },
  });

const ZKP2Proof = ZkProgram.Proof(zkp2);
export { ZKP2Proof, zkp2 }