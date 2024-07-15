import {
    ZkProgram,
    Field,
    Poseidon,
    Provable,
  } from 'o1js';
import { ArrayListHasher, KzgAccumulator } from '../../kzg/structs.js';
import { Fp12 } from '../../towers/fp12.js';
import fs from "fs";
import { ATE_LOOP_COUNT } from '../../towers/consts.js';
import { AffineCache } from '../../lines/precompute.js';
import { G2Line } from '../../lines/index.js';

const g2_lines_path = fs.readFileSync("./src/plonk/mm_loop/g2_lines.json", 'utf8');
const tau_lines_path = fs.readFileSync("./src/plonk/mm_loop/tau_lines.json", 'utf8');

let parsed_g2_lines: any[] = JSON.parse(g2_lines_path);
const g2_lines = parsed_g2_lines.map(
  (g: any): G2Line => G2Line.fromJSON(g)
);

let parsed_tau_lines: any[] = JSON.parse(tau_lines_path);
const tau_lines = parsed_tau_lines.map(
  (g: any): G2Line => G2Line.fromJSON(g)
);

const zkp16 = ZkProgram({
    name: 'zkp16',
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
            const b_cache = new AffineCache(acc.proof.negB);

            let idx = 0;
            let line_cnt = 0;

            let g;
            for (let i = ATE_LOOP_COUNT.length - 6; i < ATE_LOOP_COUNT.length; i++) {
                idx = i - 1; 
        
                let g_line = g2_lines[line_cnt]; 
                let tau_line = tau_lines[line_cnt];
                line_cnt += 1; 
        
                g = g_line.psi(a_cache);
                g = g.sparse_mul(tau_line.psi(b_cache))
        
                if (ATE_LOOP_COUNT[i] === 1 || ATE_LOOP_COUNT[i] === -1) {
                    let g_line = g2_lines[line_cnt]; 
                    let tau_line = tau_lines[line_cnt];
                    line_cnt += 1;
        
                    g = g.sparse_mul(g_line.psi(a_cache));
                    g = g.sparse_mul(tau_line.psi(b_cache));
                }

                lines_hashes[idx] = Poseidon.hashPacked(Fp12, g);
            }

            let g2_line = g2_lines[line_cnt];
            let tau_line = tau_lines[line_cnt];
            line_cnt += 1;
            idx += 1;
        
            g = g2_line.psi(a_cache);
            g = g.sparse_mul(tau_line.psi(b_cache));
        
            g2_line = g2_lines[line_cnt];
            tau_line = tau_lines[line_cnt];
            g = g.sparse_mul(g2_line.psi(a_cache));
            g = g.sparse_mul(tau_line.psi(b_cache));

            lines_hashes[idx] = Poseidon.hashPacked(Fp12, g);

            let new_lines_hashes_digest = ArrayListHasher.hash(lines_hashes);
            acc.state.lines_hashes_digest = new_lines_hashes_digest;

            return Poseidon.hashPacked(KzgAccumulator, acc);
        },
      },
    },
});


const ZKP16Proof = ZkProgram.Proof(zkp16);
export { ZKP16Proof, zkp16 }