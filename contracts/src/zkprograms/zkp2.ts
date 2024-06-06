import {
    ZkProgram,
    Field,
    DynamicProof,
    Proof,
    VerificationKey,
    Undefined,
    verify,
    Provable,
    Struct
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';
import { G1Affine, G2Affine } from '../ec/index.js';
import { AffineCache } from '../lines/precompute.js';
import { G2Line } from '../lines/index.js';
import { getBHardcodedLines, getNegA, getB } from './helpers.js';
import { VK1, ZKP1Input, ZKP1Proof, ZKP1Output, zkp1 } from './zkp1.js'

class ZKP2Input extends Struct({
}) {}

class ZKP2Output extends Struct({
    negA: G1Affine,
    b: G2Affine,
    g: Provable.Array(Fp12, ATE_LOOP_COUNT.length - 1),
    T: G2Affine,
}) {}

const zkp2 = ZkProgram({
    name: 'zkp2',
    publicInput: ZKP2Input,
    publicOutput: ZKP2Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(G2Line, 17), ZKP1Proof],
        async method(
            _input: ZKP2Input,
            b_lines: Array<G2Line>,
            proof: Proof<ZKP1Input, ZKP1Output>, 
        ) {
            proof.verify();
            const negA = proof.publicInput.negA;
            const a_cache = new AffineCache(negA);

            // handle pair (A, B) as first point
            const g = proof.publicOutput.g;
        
            const B = proof.publicInput.b;
            let T = proof.publicOutput.T;
            const negB = B.neg();
        
            let idx = 0;
            let line_cnt = 0;
        
            for (let i = ATE_LOOP_COUNT.length - 24; i < ATE_LOOP_COUNT.length - 12; i++) {
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
            
            return new ZKP2Output({
                negA,
                b: B,
                g,
                T,
            });
        },
      },
    },
  });



const VK2 = (await zkp2.compile()).verificationKey;
const ZKP2Proof = ZkProgram.Proof(zkp2);

const bLines = getBHardcodedLines();

let zkp1Input = new ZKP1Input({
  negA: getNegA(),
  b: getB()
});

const vk1 = (await zkp1.compile()).verificationKey;
const proof1 = await zkp1.compute(zkp1Input, bLines.slice(0,55));
const validZkp1 = await verify(proof1, vk1);
console.log('ok?', validZkp1);
console.log(proof1)

const proof2 = await zkp2.compute(ZKP2Input, bLines.slice(55, 55 + 17), proof1);
const validZkp2 = await verify(proof2, VK2);
console.log('ok?', validZkp2);

export { VK2, ZKP2Proof, ZKP2Input, ZKP2Output, zkp2 }