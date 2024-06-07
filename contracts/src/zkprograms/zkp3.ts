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
import { getBHardcodedLines, getNegA, getB, getC } from './helpers.js';
import { VK1, ZKP1Input, ZKP1Proof, ZKP1Output, zkp1 } from './zkp1.js'
import { VK2, ZKP2Input, ZKP2Proof, ZKP2Output, zkp2 } from './zkp2.js'
import { GWitnessTracker } from './g_witness_tracker.js';
import { GAMMA_1S, NEG_GAMMA_13 } from '../towers/precomputed.js';
import fs from 'fs';

class ZKP3Input extends Struct({
    C: G1Affine
}) {}

class ZKP3Output extends Struct({
    gDigest: Field
}) {}

const zkp3 = ZkProgram({
    name: 'zkp3',
    publicInput: ZKP3Input,
    publicOutput: ZKP3Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP2Proof], // ZKP2Proof, Provable.Array(Fp12, ATE_LOOP_COUNT.length), 
        async method(
            input: ZKP3Input,
            g: Array<Fp12>,
            proof: Proof<ZKP2Input, ZKP2Output>
        ) {
            proof.verify();
            // const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            // gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_cache = new AffineCache(input.C);
            

            var gamma_lines_input = fs.readFileSync('./src/groth16/gamma_lines.json', 'utf8');
            let parsed_gamma_lines: any[] = JSON.parse(gamma_lines_input);
            const gamma_lines = parsed_gamma_lines.map(
              (g: any): G2Line => G2Line.fromJSON(g)
            );
        
            let idx = 0;
            let line_cnt = 0;
            for (let i = 1; i < 10; i++) {
                idx = i - 1;
        
                let line_b = gamma_lines[line_cnt];
                line_cnt += 1;
                // line_b.assert_is_tangent(T);
          
                g[idx] = line_b.psi(c_cache);
                // T = T.double_from_line(line_b.lambda);
          
                if (ATE_LOOP_COUNT[i] == 1) {
                  let line_b = gamma_lines[line_cnt];
                  line_cnt += 1;
                //   line_b.assert_is_line(T, B);
          
                  g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
                //   T = T.add_from_line(line_b.lambda, B);
                }
                if (ATE_LOOP_COUNT[i] == -1) {
                  let line_b = gamma_lines[line_cnt];
                  line_cnt += 1;
                //   line_b.assert_is_line(T, negB);
          
                  g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
                //   T = T.add_from_line(line_b.lambda, negB);
                }
            }

            const gDigest = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            // const gDigest = Field("1")
            return new ZKP2Output({
                gDigest,
            });
        },
      },
    },
  });


  const VK3 = (await zkp3.compile()).verificationKey;
  const ZKP3Proof = ZkProgram.Proof(zkp3);


  const bLines = getBHardcodedLines();

  let zkp1Input = new ZKP1Input({
    negA: getNegA(),
    b: getB()
  });
  
  const vk1 = (await zkp1.compile()).verificationKey;
  const proof1 = await zkp1.compute(zkp1Input, bLines.slice(0, 62));
  const validZkp1 = await verify(proof1, vk1);
  console.log('ok?', validZkp1);
  
  const gt = new GWitnessTracker();
  let g = gt.zkp1(getNegA(), bLines, getB());
  
//   console.log(Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g))
  
//   console.log('---------------------')
//   console.log(proof1.publicOutput.gDigest);
  
  const proof2 = await zkp2.compute(ZKP2Input, g, bLines.slice(62, 62 + 29), proof1, GAMMA_1S[1], GAMMA_1S[2], NEG_GAMMA_13);
  const validZkp2 = await verify(proof2, VK2);
  console.log('ok?', validZkp2);

  g = gt.zkp2(g, getNegA(), bLines.slice(62, 62 + 29), getB(), proof1.publicOutput.T);

  const zkp3Input = new ZKP3Input({
    C: getC()
  });
  console.log("compute zkp3");
  const proof3 = await  zkp3.compute(zkp3Input, g, proof2); //zkp3.compute(zkp3Input, g, proof2);
  console.log("verify zkp3");
  const validZkp3 = await verify(proof3, VK3);
  console.log('ok?', validZkp3);

  export { VK3, ZKP3Proof, ZKP3Input, ZKP3Output, zkp3 }