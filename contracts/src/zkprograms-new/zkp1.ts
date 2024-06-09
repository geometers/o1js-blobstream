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
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';
import { G1Affine, G2Affine } from '../ec/index.js';
import { AffineCache } from '../lines/precompute.js';
import { G2Line } from '../lines/index.js';
import { getBHardcodedLines, getNegA, getB } from './helpers.js';
import fs from 'fs';

class ZKP1Input extends Struct({
    negA: G1Affine,
    b: G2Affine,
}) {}

class ZKP1Output extends Struct({
    gDigest: Field,
    T: G2Affine,
}) {}

// npm run build && node --max-old-space-size=65536 build/src/zkprograms/zkp1.js
const zkp1 = ZkProgram({
    name: 'zkp1',
    publicInput: ZKP1Input,
    publicOutput: ZKP1Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(G2Line, 62)],
        async method(
            input: ZKP1Input,
            b_lines: Array<G2Line>
        ) {
            const negA = input.negA; 
            const a_cache = new AffineCache(negA);

            // handle pair (A, B) as first point
            const g: Array<Fp12> = []; 
            for (let i = 0; i < ATE_LOOP_COUNT.length; i++) {
                g.push(Fp12.one());
            }
        
            const B = input.b;
            let T = new G2Affine({ x: B.x, y: B.y });
            const negB = B.neg();
        
            let idx = 0;
            let line_cnt = 0;
        
            for (let i = 1; i < ATE_LOOP_COUNT.length - 19; i++) {
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
            
            const gDigest = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            return new ZKP1Output({
                gDigest,
                T,
              });
        },
      },
    },
  });

const ZKP1Proof = ZkProgram.Proof(zkp1);
export { ZKP1Proof, ZKP1Input, ZKP1Output, zkp1 }