import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';
import { AffineCache } from '../lines/precompute.js';
import { G2Line } from '../lines/index.js';
import fs from 'fs';
import { ZKP3Input, ZKP3Output, ZKP3Proof } from './zkp3.js';
import { G1Affine } from '../ec/index.js';

class ZKP4Input extends Struct({
    PI: G1Affine
}) {}

class ZKP4Output extends Struct({
    gDigest: Field, 
    PI: G1Affine
}) {}

const zkp4 = ZkProgram({
    name: 'zkp4',
    publicInput: ZKP4Input,
    publicOutput: ZKP4Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP3Proof],
        async method(
            input: ZKP4Input,
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

            delta_lines = delta_lines.slice(72, 72 + 19);

            let idx = 0;
            let line_cnt = 0;
            for (let i = ATE_LOOP_COUNT.length - 12; i < ATE_LOOP_COUNT.length; i++) {
                idx = i - 1;
        
                let line = delta_lines[line_cnt];
                line_cnt += 1;
          
                g[idx] = g[idx].sparse_mul(line.psi(c_cache));
          
                if (ATE_LOOP_COUNT[i] == 1) {
                  let line = delta_lines[line_cnt];
                  line_cnt += 1;
          
                  g[idx] = g[idx].sparse_mul(line.psi(c_cache));
                }

                if (ATE_LOOP_COUNT[i] == -1) {
                  let line = delta_lines[line_cnt];
                  line_cnt += 1;
          
                  g[idx] = g[idx].sparse_mul(line.psi(c_cache));
                }
            }

            let line_delta;

            line_delta = delta_lines[line_cnt];
            line_cnt += 1;
        
            idx += 1;
            g[idx] = g[idx].sparse_mul(line_delta.psi(c_cache));
            // idx += 1;
        
            line_delta = delta_lines[line_cnt];
            g[idx] = g[idx].sparse_mul(line_delta.psi(c_cache));

            // start (PI, gamma)
            let gamma_lines_input = fs.readFileSync('./src/groth16/gamma_lines.json', 'utf8');
            let parsed_gamma_lines: any[] = JSON.parse(gamma_lines_input);
            let gamma_lines = parsed_gamma_lines.map(
              (g: any): G2Line => G2Line.fromJSON(g)
            );

            const pi_cache = new AffineCache(input.PI);

            idx = 0;
            line_cnt = 0;
            for (let i = 1; i < ATE_LOOP_COUNT.length - 31; i++) {
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
            return new ZKP4Output({
                gDigest,
                PI: input.PI
            });
        },
      },
    },
  });

  const ZKP4Proof = ZkProgram.Proof(zkp4);
  export { ZKP4Proof, ZKP4Input, ZKP4Output, zkp4 }