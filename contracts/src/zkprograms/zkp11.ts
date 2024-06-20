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
import { ZKP10Input, ZKP10Proof, ZKP10Output } from './zkp10.js'
import fs from 'fs';

class ZKP11Input extends Struct({
}) {}

class ZKP11Output extends Struct({
    gDigest: Field, 
    PI: G1Affine
}) {}

const zkp11 = ZkProgram({
    name: 'zkp11',
    publicInput: ZKP11Input,
    publicOutput: ZKP11Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP10Proof],
        async method(
            _input: ZKP11Input,
            g: Array<Fp12>,
            proof: Proof<ZKP10Input, ZKP10Output>
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

            gamma_lines = gamma_lines.slice(59, 78);
        
            let idx = 0;
            let line_cnt = 0;
            for (let i = ATE_LOOP_COUNT.length - 21; i < ATE_LOOP_COUNT.length - 8; i++) {
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
            return new ZKP11Output({
                gDigest,
                PI: proof.publicOutput.PI
            });
        },
      },
    },
  });

  const ZKP11Proof = ZkProgram.Proof(zkp11);
  export { ZKP11Proof, ZKP11Input, ZKP11Output, zkp11 }