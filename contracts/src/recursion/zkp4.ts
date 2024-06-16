import {
    ZkProgram,
    Field,
    DynamicProof,
    Proof,
    VerificationKey,
    Undefined,
    verify,
    Provable,
    Struct,
    Poseidon,
    CanonicalForeignField
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12, Fp2, FpC } from '../towers/index.js';
import { G1Affine, G2Affine } from '../ec/index.js';
import { AffineCache } from '../lines/precompute.js';
import { G2Line } from '../lines/index.js';
import { Groth16Data } from './data.js';
import { Fp } from '../towers/fp.js';
import fs from "fs";

const zkp4 = ZkProgram({
    name: 'zkp4',
    publicInput: Field,
    publicOutput: Field,
    methods: {
      compute: {
        privateInputs: [Groth16Data],
        async method(
            input: Field,
            wIn: Groth16Data, 
        ) {
            const inDigest = Poseidon.hashPacked(Groth16Data, wIn);
            inDigest.assertEquals(input);

            const c_cache = new AffineCache(wIn.C);
            let g = wIn.g;

            let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
            let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
            let delta_lines = parsed_delta_lines.map(
              (g: any): G2Line => G2Line.fromJSON(g)
            );
        
            delta_lines = delta_lines.slice(25 + 27, 91);
        
            let idx = 0;
            let line_cnt = 0;
        
            for (let i = ATE_LOOP_COUNT.length - 26; i < ATE_LOOP_COUNT.length - 8; i++) {
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
                          
            const output =  new Groth16Data({
                negA: wIn.negA, 
                B: wIn.B, 
                C: wIn.C, 
                PI: wIn.PI,
                g,
                T: wIn.T,
                c: wIn.c, 
                w27: wIn.w27
            });

            return Poseidon.hashPacked(Groth16Data, output);
        },
      },
    },
  });



const ZKP4Proof = ZkProgram.Proof(zkp4);
export { ZKP4Proof, zkp4 }