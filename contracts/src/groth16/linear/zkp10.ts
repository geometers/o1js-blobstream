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
import { ZKP9Input, ZKP9Proof, ZKP9Output } from './zkp9.js'
import fs from 'fs';

class ZKP10Input extends Struct({
}) {}

class ZKP10Output extends Struct({
    gDigest: Field, 
    PI: G1Affine
}) {}

const zkp10 = ZkProgram({
    name: 'zkp10',
    publicInput: ZKP10Input,
    publicOutput: ZKP10Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP9Proof],
        async method(
            _input: ZKP10Input,
            g: Array<Fp12>,
            proof: Proof<ZKP9Input, ZKP9Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const pi_cache = new AffineCache(proof.publicOutput.PI);
            
            let gamma_lines_input = fs.readFileSync('./src/groth16/gamma_lines.json', 'utf8');
            let parsed_gamma_lines: any[] = JSON.parse(gamma_lines_input);
            let gamma_lines = parsed_gamma_lines.map(
              (g: any): G2Line => G2Line.fromJSON(g)
            );

            gamma_lines = gamma_lines.slice(40, 59);
        
            let idx = 0;
            let line_cnt = 0;
            for (let i = ATE_LOOP_COUNT.length - 35; i < ATE_LOOP_COUNT.length - 21; i++) {
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
            return new ZKP10Output({
                gDigest,
                PI: proof.publicOutput.PI
            });
        },
      },
    },
  });

  const ZKP10Proof = ZkProgram.Proof(zkp10);
  export { ZKP10Proof, ZKP10Input, ZKP10Output, zkp10 }