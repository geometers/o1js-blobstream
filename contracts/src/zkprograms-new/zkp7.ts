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
import { ZKP6Input, ZKP6Proof, ZKP6Output } from './zkp6.js'
import fs from 'fs';

class ZKP7Input extends Struct({
}) {}

class ZKP7Output extends Struct({
    gDigest: Field, 
}) {}

const zkp7 = ZkProgram({
    name: 'zkp7',
    publicInput: ZKP7Input,
    publicOutput: ZKP7Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP6Proof],
        async method(
            _input: ZKP7Input,
            g: Array<Fp12>,
            proof: Proof<ZKP6Input, ZKP6Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_cache = new AffineCache(proof.publicOutput.C);
            
            let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
            let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
            let delta_lines = parsed_delta_lines.map(
              (g: any): G2Line => G2Line.fromJSON(g)
            );

            // 78 + 11 + 2(for frobenius part)
            delta_lines = delta_lines.slice(78, 91);
        
            let idx = 0;
            let line_cnt = 0;
            for (let i = ATE_LOOP_COUNT.length - 8; i < ATE_LOOP_COUNT.length; i++) {
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

            let line_delta;

            line_delta = delta_lines[line_cnt];
            line_cnt += 1;
        
            idx += 1;
            g[idx] = g[idx].sparse_mul(line_delta.psi(c_cache));

            line_delta = delta_lines[line_cnt];
            g[idx] = g[idx].sparse_mul(line_delta.psi(c_cache));

            const gDigest = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            return new ZKP7Output({
                gDigest
            });
        },
      },
    },
  });

  const ZKP7Proof = ZkProgram.Proof(zkp7);
  export { ZKP7Proof, ZKP7Input, ZKP7Output, zkp7 }