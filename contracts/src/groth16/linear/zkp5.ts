import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../../towers/index.js';
import { G1Affine } from '../../ec/index.js';
import { AffineCache } from '../../lines/precompute.js';
import { G2Line } from '../../lines/index.js';
import { ZKP4Input, ZKP4Proof, ZKP4Output } from './zkp4.js'
import fs from 'fs';

class ZKP5Input extends Struct({
}) {}

class ZKP5Output extends Struct({
    gDigest: Field, 
    C: G1Affine,
}) {}

const zkp5 = ZkProgram({
    name: 'zkp5',
    publicInput: ZKP5Input,
    publicOutput: ZKP5Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP4Proof],
        async method(
            _input: ZKP5Input,
            g: Array<Fp12>,
            proof: Proof<ZKP4Input, ZKP4Output>
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

            delta_lines = delta_lines.slice(40, 40 + 19);
        
            let idx = 0;
            let line_cnt = 0;
            for (let i = ATE_LOOP_COUNT.length - 35; i < ATE_LOOP_COUNT.length - 21; i++) {
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
            return new ZKP5Output({
                gDigest,
                C: proof.publicOutput.C,
            });
        },
      },
    },
  });

  const ZKP5Proof = ZkProgram.Proof(zkp5);
  export { ZKP5Proof, ZKP5Input, ZKP5Output, zkp5 }