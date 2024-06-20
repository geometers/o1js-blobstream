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
import { ZKP8Input, ZKP8Proof, ZKP8Output } from './zkp8.js'
import fs from 'fs';

class ZKP9Input extends Struct({
}) {}

class ZKP9Output extends Struct({
    gDigest: Field, 
    PI: G1Affine
}) {}

const zkp9 = ZkProgram({
    name: 'zkp9',
    publicInput: ZKP9Input,
    publicOutput: ZKP9Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP8Proof],
        async method(
            _input: ZKP9Input,
            g: Array<Fp12>,
            proof: Proof<ZKP8Input, ZKP8Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const pi_cache = new AffineCache(proof.publicInput.PI);
            
            let gamma_lines_input = fs.readFileSync('./src/groth16/gamma_lines.json', 'utf8');
            let parsed_gamma_lines: any[] = JSON.parse(gamma_lines_input);
            let gamma_lines = parsed_gamma_lines.map(
              (g: any): G2Line => G2Line.fromJSON(g)
            );

            gamma_lines = gamma_lines.slice(20, 40);
        
            let idx = 0;
            let line_cnt = 0;
            for (let i = ATE_LOOP_COUNT.length - 50; i < ATE_LOOP_COUNT.length - 35; i++) {
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
            return new ZKP9Output({
                gDigest,
                PI: proof.publicInput.PI
            });
        },
      },
    },
  });

  const ZKP9Proof = ZkProgram.Proof(zkp9);
  export { ZKP9Proof, ZKP9Input, ZKP9Output, zkp9 }