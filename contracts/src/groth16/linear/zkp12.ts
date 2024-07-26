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
import { ZKP11Input, ZKP11Proof, ZKP11Output } from './zkp11.js'
import fs from 'fs';

class ZKP12Input extends Struct({
}) {}

class ZKP12Output extends Struct({
    gDigest: Field, 
    PI: G1Affine
}) {}

const zkp12 = ZkProgram({
    name: 'zkp12',
    publicInput: ZKP12Input,
    publicOutput: ZKP12Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP11Proof],
        async method(
            _input: ZKP12Input,
            g: Array<Fp12>,
            proof: Proof<ZKP11Input, ZKP11Output>
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

            gamma_lines = gamma_lines.slice(78, 91);
        
            let idx = 0;
            let line_cnt = 0;
            for (let i = ATE_LOOP_COUNT.length - 8; i < ATE_LOOP_COUNT.length; i++) {
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
            return new ZKP12Output({
                gDigest,
                PI: proof.publicOutput.PI
            });
        },
      },
    },
  });

  const ZKP12Proof = ZkProgram.Proof(zkp12);
  export { ZKP12Proof, ZKP12Input, ZKP12Output, zkp12 }