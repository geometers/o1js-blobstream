import {
    ZkProgram,
    Field,
    DynamicProof,
    Proof,
    VerificationKey,
    Undefined,
    verify,
    Provable,
    Struct,
    Poseidon,
    CanonicalForeignField
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12, Fp2, FpC } from '../towers/index.js';
import { G1Affine, G2Affine } from '../ec/index.js';
import { AffineCache } from '../lines/precompute.js';
import { G2Line } from '../lines/index.js';
import { Groth16Data } from './data.js';
import { Fp } from '../towers/fp.js';

// npm run build && node --max-old-space-size=65536 build/src/zkprograms/zkp0.js
const zkp0 = ZkProgram({
    name: 'zkp0',
    publicInput: Field,
    publicOutput: Field,
    methods: {
      compute: {
        privateInputs: [Provable.Array(G2Line, 27), Groth16Data],
        async method(
            input: Field,
            b_lines: Array<G2Line>, 
            wIn: Groth16Data, 
        ) {
            const inDigest = Poseidon.hashPacked(Groth16Data, wIn);
            inDigest.assertEquals(input);

            const negA = wIn.negA; 
            const a_cache = new AffineCache(negA);
            let g = wIn.g;

            // handle pair (A, B) as first point
        
            const B = wIn.B;
            let T = new G2Affine({ x: B.x, y: B.y });
            const negB = B.neg();
        
            let idx = 0;
            let line_cnt = 0;
        
            for (let i = 1; i < ATE_LOOP_COUNT.length - 45; i++) {
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
                negA, 
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

// class CustomStruct extends Struct({
//   a: Fp12, 
//   b: Field
// }) {};

// const zkp1 = ZkProgram({
//   name: 'zkp1',
//   publicInput: Field,
//   publicOutput: Field,
//   methods: {
//     compute: {
//       privateInputs: [Field, FpC.provable],
//       async method(publicInput: Field, privateInput: Field, c: FpC) {
//         // return publicInput.mul(privateInput).mul(Poseidon.hashPacked(FpC, cs));
//         // const fields = await c.toFields();
//         return publicInput.mul(privateInput);
//       },
//     },
//   },
// });


const ZKP0Proof = ZkProgram.Proof(zkp0);
export { ZKP0Proof, zkp0 }