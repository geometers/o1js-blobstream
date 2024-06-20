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
import { ZKP7Input, ZKP7Proof, ZKP7Output } from './zkp7.js'
import fs from 'fs';

class ZKP8Input extends Struct({
    PI: G1Affine
}) {}

class ZKP8Output extends Struct({
    gDigest: Field
}) {}

const zkp8 = ZkProgram({
    name: 'zkp8',
    publicInput: ZKP8Input,
    publicOutput: ZKP8Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP7Proof],
        async method(
            input: ZKP8Input,
            g: Array<Fp12>,
            proof: Proof<ZKP7Input, ZKP7Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const pi_cache = new AffineCache(input.PI);
            
            let gamma_lines_input = fs.readFileSync('./src/groth16/gamma_lines.json', 'utf8');
            let parsed_gamma_lines: any[] = JSON.parse(gamma_lines_input);
            const gamma_lines = parsed_gamma_lines.map(
              (g: any): G2Line => G2Line.fromJSON(g)
            );
        
            let idx = 0;
            let line_cnt = 0;
            for (let i = 1; i < ATE_LOOP_COUNT.length - 50; i++) {
                idx = i - 1;
        
                let line = gamma_lines[line_cnt];
                line_cnt += 1;
          
                g[idx] = g[idx].sparse_mul(line.psi(pi_cache));
          
                if (ATE_LOOP_COUNT[i] == 1) {
                  let line = gamma_lines[line_cnt];
                  line_cnt += 1;
          
                  g[idx] = g[idx].sparse_mul(line.psi(pi_cache));
                }

                if (ATE_LOOP_COUNT[i] == -1) {
                  let line = gamma_lines[line_cnt];
                  line_cnt += 1;
          
                  g[idx] = g[idx].sparse_mul(line.psi(pi_cache));
                }
            }

            const gDigest = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            return new ZKP8Output({
                gDigest,
            });
        },
      },
    },
  });

  const ZKP8Proof = ZkProgram.Proof(zkp8);
  export { ZKP8Proof, ZKP8Input, ZKP8Output, zkp8 }