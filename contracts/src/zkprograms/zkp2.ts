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
import { ATE_LOOP_COUNT, Fp12, Fp2, FpC } from '../towers/index.js';
import { G1Affine, G2Affine } from '../ec/index.js';
import { AffineCache } from '../lines/precompute.js';
import { G2Line } from '../lines/index.js';
import { getBHardcodedLines, getNegA, getB } from './helpers.js';
import { VK1, ZKP1Input, ZKP1Proof, ZKP1Output, zkp1 } from './zkp1.js'
import { GWitnessTracker } from './g_witness_tracker.js';
import { GAMMA_1S, GAMMA_2S, NEG_GAMMA_13 } from '../towers/precomputed.js';

class ZKP2Input extends Struct({
}) {}

class ZKP2Output extends Struct({
    negA: G1Affine,
    b: G2Affine,
    gDigest: Field,
    T: G2Affine,
}) {}

const zkp2 = ZkProgram({
    name: 'zkp2',
    publicInput: ZKP2Input,
    publicOutput: ZKP2Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length + 1), Provable.Array(G2Line, 29), ZKP1Proof, Fp2, Fp2, Fp2],
        async method(
            _input: ZKP2Input,
            g: Array<Fp12>,
            b_lines: Array<G2Line>,
            proof: Proof<ZKP1Input, ZKP1Output>, 
            // values that we use for frobenius, we have to hardcode those into circuit
            g1: Fp2, 
            g2: Fp2,
            g3: Fp2
        ) {
            proof.verify();
            const negA = proof.publicInput.negA;
            const a_cache = new AffineCache(negA);

            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length + 1), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);
        
            const B = proof.publicInput.b;
            let T = proof.publicOutput.T;
            const negB = B.neg();
        
            let idx = 0;
            let line_cnt = 0;
        
            for (let i = ATE_LOOP_COUNT.length - 19; i < ATE_LOOP_COUNT.length; i++) {
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
            
            const piB = B.frobFromInputs(g1, g2);
            let line_b;

            line_b = b_lines[line_cnt];
            line_cnt += 1;
            line_b.assert_is_line(T, piB);

            idx += 1;
            g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
            T = T.add_from_line(line_b.lambda, piB);

            let pi_2_B = piB.negFrobFromInputs(g1, g3);
            line_b = b_lines[line_cnt];
            line_b.assert_is_line(T, pi_2_B);

            idx += 1;
            g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
            
            const gDigest = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length + 1), g);
            return new ZKP2Output({
                negA,
                b: B,
                gDigest,
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
const proof1 = await zkp1.compute(zkp1Input, bLines.slice(0, 62));
const validZkp1 = await verify(proof1, vk1);
console.log('ok?', validZkp1);
// console.log(proof1)

const gt = new GWitnessTracker();
const g = gt.zkp1(getNegA(), bLines, getB());

console.log(Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length + 1), g))

console.log('---------------------')
console.log(proof1.publicOutput.gDigest);

const proof2 = await zkp2.compute(ZKP2Input, g, bLines.slice(62, 62 + 29), proof1, GAMMA_1S[1], GAMMA_1S[2], NEG_GAMMA_13);
const validZkp2 = await verify(proof2, VK2);
console.log('ok?', validZkp2);

export { VK2, ZKP2Proof, ZKP2Input, ZKP2Output, zkp2 }