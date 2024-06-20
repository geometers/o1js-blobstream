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
import { ZKP1Input, ZKP1Proof, ZKP1Output, zkp1 } from './zkp1.js'
import { GAMMA_1S, GAMMA_2S, NEG_GAMMA_13 } from '../towers/precomputed.js';
import fs from 'fs';

class ZKP2Input extends Struct({
}) {}

class ZKP2Output extends Struct({
    gDigest: Field
}) {}

const zkp2 = ZkProgram({
    name: 'zkp2',
    publicInput: ZKP2Input,
    publicOutput: ZKP2Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), Provable.Array(G2Line, 29), ZKP1Proof, Fp2, Fp2, Fp2],
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

            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
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

            let gamma_1s_input = fs.readFileSync('./src/towers/gamma_1s.json', 'utf8');
            let parsed_gamma_1s: any[] = JSON.parse(gamma_1s_input);
            let gamma_1s = parsed_gamma_1s.map(
              (g: any): Fp2 => Fp2.loadFromJson(g)
            );

            let neg_gamma_input = fs.readFileSync('./src/towers/neg_gamma.json', 'utf8');
            let neg_gamma = Fp2.loadFromJson(JSON.parse(neg_gamma_input));
            
            // GAMMA_1S[1], GAMMA_1S[2], NEG_GAMMA_13
            const piB = B.frobFromInputs(gamma_1s[1], gamma_1s[2]);
            let line_b;

            line_b = b_lines[line_cnt];
            line_cnt += 1;
            line_b.assert_is_line(T, piB);

            idx += 1;
            g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
            T = T.add_from_line(line_b.lambda, piB);

            let pi_2_B = piB.negFrobFromInputs(gamma_1s[1], g3);
            line_b = b_lines[line_cnt];
            line_b.assert_is_line(T, pi_2_B);

            // idx += 1;
            g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
                          
            const gDigest = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            return new ZKP2Output({
                gDigest,
            });
        },
      },
    },
  });

const ZKP2Proof = ZkProgram.Proof(zkp2);
export { ZKP2Proof, ZKP2Input, ZKP2Output, zkp2 }