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
import { ZKP5Input, ZKP5Proof, ZKP5Output } from './zkp5.js'
import fs from 'fs';

class ZKP6Input extends Struct({
}) {}

class ZKP6Output extends Struct({
    gDigest: Field, 
    C: G1Affine,
}) {}

const zkp6 = ZkProgram({
    name: 'zkp6',
    publicInput: ZKP6Input,
    publicOutput: ZKP6Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP5Proof],
        async method(
            _input: ZKP6Input,
            g: Array<Fp12>,
            proof: Proof<ZKP5Input, ZKP5Output>
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

            delta_lines = delta_lines.slice(59, 78);
        
            let idx = 0;
            let line_cnt = 0;
            for (let i = ATE_LOOP_COUNT.length - 21; i < ATE_LOOP_COUNT.length - 8; i++) {
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
            return new ZKP6Output({
                gDigest,
                C: proof.publicOutput.C,
            });
        },
      },
    },
  });

  const ZKP6Proof = ZkProgram.Proof(zkp6);
  export { ZKP6Proof, ZKP6Input, ZKP6Output, zkp6 }