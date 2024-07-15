import {
    ZkProgram,
    Field,
    Poseidon,
    Provable,
  } from 'o1js';
import { Accumulator } from '../accumulator.js';
import { preparePairing_0, preparePairing_1 } from '../piop/plonk_utils.js';
import { VK } from '../vk.js';
import { G1Affine } from '../../ec/index.js';
import { ArrayListHasher, KzgAccumulator, KzgProof, KzgState } from '../../kzg/structs.js';
import { Fp12 } from '../../towers/fp12.js';
import fs from "fs";
import { ATE_LOOP_COUNT } from '../../towers/consts.js';
import { AffineCache } from '../../lines/precompute.js';
import { G2Line } from '../../lines/index.js';

const g2_lines_path = fs.readFileSync("./src/plonk/mm_loop/g2_lines.json", 'utf8');
// const tau_lines_path = fs.readFileSync("./src/plonk/mm_loop/tau_lines.json", 'utf8');

let parsed_g2_lines: any[] = JSON.parse(g2_lines_path);
const g2_lines = parsed_g2_lines.map(
  (g: any): G2Line => G2Line.fromJSON(g)
);

// let parsed_tau_lines: any[] = JSON.parse(tau_lines_path);
// const tau_lines = parsed_tau_lines.map(
//   (g: any): G2Line => G2Line.fromJSON(g)
// );

const zkp13 = ZkProgram({
    name: 'zkp13',
    publicInput: Field,
    publicOutput: Field,
    methods: {
      compute: {
        privateInputs: [KzgAccumulator, Provable.Array(Field, ATE_LOOP_COUNT.length)],
        async method(
            input: Field,
            acc: KzgAccumulator, 
            lines_hashes: Array<Field>
        ) {
            const inDigest = Poseidon.hashPacked(KzgAccumulator, acc);
            inDigest.assertEquals(input);

            const lines_digest = ArrayListHasher.hash(lines_hashes);
            acc.state.lines_hashes_digest.assertEquals(lines_digest);

            const a_cache = new AffineCache(acc.proof.A);

            let idx = 0;
            let line_cnt = 0;

            let g;
            for (let i = 1; i < ATE_LOOP_COUNT.length; i++) {
                idx = i - 1; 
        
                let line = g2_lines[line_cnt]; 
                line_cnt += 1; 
        
                // g.push(line.psi(a_cache));
                g = line.psi(a_cache);
        
                if (ATE_LOOP_COUNT[i] == 1) {
                    let line = g2_lines[line_cnt];
                    line_cnt += 1;
        
                    g = g.sparse_mul(line.psi(a_cache));
                }
        
                if (ATE_LOOP_COUNT[i] == -1) {
                    let line = g2_lines[line_cnt];
                    line_cnt += 1;
        
                    g = g.sparse_mul(line.psi(a_cache));
                }

                lines_hashes[idx] = Poseidon.hashPacked(Fp12, g);
            }

            let g2_line = g2_lines[line_cnt];
            line_cnt += 1;
            idx += 1;
        
            g = g2_line.psi(a_cache);
        
            g2_line = g2_lines[line_cnt];
            g = g.sparse_mul(g2_line.psi(a_cache));

            lines_hashes[idx] = Poseidon.hashPacked(Fp12, g);

            let new_lines_hashes_digest = ArrayListHasher.hash(lines_hashes);
            acc.state.lines_hashes_digest = new_lines_hashes_digest;

            return Poseidon.hashPacked(KzgAccumulator, acc);
        },
      },
    },
});


const ZKP13Proof = ZkProgram.Proof(zkp13);
export { ZKP13Proof, zkp13 }