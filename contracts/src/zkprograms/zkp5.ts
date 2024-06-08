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
import { ZKP4Input, ZKP4Output, ZKP4Proof } from './zkp4.js';
import { G1Affine } from '../ec/index.js';

class ZKP5Input extends Struct({
}) {}

class ZKP5Output extends Struct({
    gDigest: Field, 
    PI: G1Affine
}) {}

const zkp5 = ZkProgram({
    name: 'zkp5',
    publicInput: ZKP5Input,
    publicOutput: ZKP5Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP4Proof],
        async method(
            input: ZKP5Input,
            g: Array<Fp12>,
            proof: Proof<ZKP4Input, ZKP4Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            let gamma_lines_input = fs.readFileSync('./src/groth16/gamma_lines.json', 'utf8');
            let parsed_gamma_lines: any[] = JSON.parse(gamma_lines_input);
            let gamma_lines = parsed_gamma_lines.map(
              (g: any): G2Line => G2Line.fromJSON(g)
            );

            // 46 lines needed until step cnt-31, 
            // then we need 43 more lines to finish the m loop 
            // 2 more lines for frobenius
            gamma_lines = gamma_lines.slice(46, 46 + 43 + 2);

            const pi_cache = new AffineCache(proof.publicOutput.PI);

            let idx = 0;
            let line_cnt = 0;
            for (let i = ATE_LOOP_COUNT.length - 31; i < ATE_LOOP_COUNT.length; i++) {
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

            let line_gamma;

            line_gamma = gamma_lines[line_cnt];
            line_cnt += 1;
        
            idx += 1;
            g[idx] = g[idx].sparse_mul(line_gamma.psi(pi_cache));
            // idx += 1;
        
            line_gamma = gamma_lines[line_cnt];
            g[idx] = g[idx].sparse_mul(line_gamma.psi(pi_cache));

            const gDigest = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            return new ZKP5Output({
                gDigest,
                PI: proof.publicOutput.PI
            });
        },
      },
    },
  });

  const ZKP5Proof = ZkProgram.Proof(zkp5);
  export { ZKP5Proof, ZKP5Input, ZKP5Output, zkp5 }