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
import { ZKP3Input, ZKP3Proof, ZKP3Output } from './zkp3.js'
import fs from 'fs';

class ZKP4Input extends Struct({
}) {}

class ZKP4Output extends Struct({
    gDigest: Field, 
    C: G1Affine,
}) {}

const zkp4 = ZkProgram({
    name: 'zkp4',
    publicInput: ZKP4Input,
    publicOutput: ZKP4Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP3Proof],
        async method(
            _input: ZKP4Input,
            g: Array<Fp12>,
            proof: Proof<ZKP3Input, ZKP3Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_cache = new AffineCache(proof.publicInput.C);
            
            let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
            let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
            let delta_lines = parsed_delta_lines.map(
              (g: any): G2Line => G2Line.fromJSON(g)
            );

            delta_lines = delta_lines.slice(20, 40);
        
            let idx = 0;
            let line_cnt = 0;
            for (let i = ATE_LOOP_COUNT.length - 50; i < ATE_LOOP_COUNT.length - 35; i++) {
                idx = i - 1;
        
                let line_b = delta_lines[line_cnt];
                line_cnt += 1;
          
                g[idx] = g[idx].sparse_mul(line_b.psi(c_cache));
          
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
            return new ZKP4Output({
                gDigest,
                C: proof.publicInput.C,
            });
        },
      },
    },
  });

  const ZKP4Proof = ZkProgram.Proof(zkp4);
  export { ZKP4Proof, ZKP4Input, ZKP4Output, zkp4 }