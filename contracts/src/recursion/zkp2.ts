import {
    ZkProgram,
    Provable,
    Poseidon,
    Field
  } from 'o1js';
import { ATE_LOOP_COUNT } from '../towers/index.js';
import { AffineCache } from '../lines/precompute.js';
import { G2Line } from '../lines/index.js';
import { Groth16Data } from './data.js';


const zkp2 = ZkProgram({
    name: 'zkp2',
    publicInput: Field,
    publicOutput: Field,
    methods: {
      compute: {
        privateInputs: [Groth16Data, Provable.Array(G2Line, 28)],
        async method(
            input: Field,
            wIn: Groth16Data, 
            b_lines: Array<G2Line>,
        ) {        
            const inDigest = Poseidon.hashPacked(Groth16Data, wIn);
            inDigest.assertEquals(input);

            const a_cache = new AffineCache(wIn.negA);

            const B = wIn.B;
            let T = wIn.T;
            const negB = B.neg();
            let g = wIn.g;
        
            let idx = 0;
            let line_cnt = 0;
        
            for (let i = ATE_LOOP_COUNT.length - 26; i < ATE_LOOP_COUNT.length - 7; i++) {
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

            return Poseidon.hashPacked(Groth16Data, output);
        },
      },
    },
  });

const ZKP2Proof = ZkProgram.Proof(zkp2);
export { ZKP2Proof, zkp2 }