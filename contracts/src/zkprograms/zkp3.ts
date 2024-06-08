import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';
import { G1Affine } from '../ec/index.js';
import { AffineCache } from '../lines/precompute.js';
import { G2Line } from '../lines/index.js';
import { ZKP2Input, ZKP2Proof, ZKP2Output, zkp2 } from './zkp2.js'
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
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP2Proof],
        async method(
            input: ZKP3Input,
            g: Array<Fp12>,
            proof: Proof<ZKP2Input, ZKP2Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_cache = new AffineCache(input.C);
            
            let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
            let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
            const delta_lines = parsed_delta_lines.map(
              (g: any): G2Line => G2Line.fromJSON(g)
            );
        
            let idx = 0;
            let line_cnt = 0;
            for (let i = 1; i < ATE_LOOP_COUNT.length - 12; i++) {
                idx = i - 1;
        
                let line_b = delta_lines[line_cnt];
                line_cnt += 1;
          
                g[idx] = line_b.psi(c_cache);
          
                if (ATE_LOOP_COUNT[i] == 1) {
                  let line_b = delta_lines[line_cnt];
                  line_cnt += 1;
          
                  g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
                }

                if (ATE_LOOP_COUNT[i] == -1) {
                  let line_b = delta_lines[line_cnt];
                  line_cnt += 1;
          
                  g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
                }
            }

            const gDigest = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            return new ZKP3Output({
                gDigest,
            });
        },
      },
    },
  });

  const ZKP3Proof = ZkProgram.Proof(zkp3);
  export { ZKP3Proof, ZKP3Input, ZKP3Output, zkp3 }