import { ZkProgram, Field, Poseidon, Provable } from 'o1js';
import { ArrayListHasher, KzgAccumulator } from '../../kzg/structs.js';
import { Fp12 } from '../../towers/fp12.js';
import { ATE_LOOP_COUNT } from '../../towers/consts.js';
import { AffineCache } from '../../lines/precompute.js';
import { LineParser } from './line_parser.js';

const lineParser = LineParser.init();
const g2_lines = lineParser.parse_g2(
  ATE_LOOP_COUNT.length - 6,
  ATE_LOOP_COUNT.length
);
const tau_lines = lineParser.parse_tau(
  ATE_LOOP_COUNT.length - 6,
  ATE_LOOP_COUNT.length
);

const zkp16 = ZkProgram({
  name: 'zkp16',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    compute: {
      privateInputs: [
        KzgAccumulator,
        Provable.Array(Field, ATE_LOOP_COUNT.length),
      ],
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
        for (
          let i = ATE_LOOP_COUNT.length - 6;
          i < ATE_LOOP_COUNT.length;
          i++
        ) {
          idx = i - 1;

          let g_line = g2_lines[line_cnt];
          let tau_line = tau_lines[line_cnt];
          line_cnt += 1;

          g = g_line.psi(a_cache);
          g = g.sparse_mul(tau_line.psi(b_cache));

          if (ATE_LOOP_COUNT[i] === 1 || ATE_LOOP_COUNT[i] === -1) {
            let g_line = g2_lines[line_cnt];
            let tau_line = tau_lines[line_cnt];
            line_cnt += 1;

            g = g.sparse_mul(g_line.psi(a_cache));
            g = g.sparse_mul(tau_line.psi(b_cache));
          }

          lines_hashes[idx] = Poseidon.hashPacked(Fp12, g);
        }

        let [g2_frob_0, g2_frob_1] = lineParser.frobenius_g2_lines();
        let [tau_frob_0, tau_frob_1] = lineParser.frobenius_tau_lines();

        g = g2_frob_0.psi(a_cache);
        g = g.sparse_mul(tau_frob_0.psi(b_cache));

        g = g.sparse_mul(g2_frob_1.psi(a_cache));
        g = g.sparse_mul(tau_frob_1.psi(b_cache));

        lines_hashes[ATE_LOOP_COUNT.length - 1] = Poseidon.hashPacked(Fp12, g);

        let new_lines_hashes_digest = ArrayListHasher.hash(lines_hashes);
        acc.state.lines_hashes_digest = new_lines_hashes_digest;

        return { publicOutput: Poseidon.hashPacked(KzgAccumulator, acc) };
      },
    },
  },
});

const ZKP16Proof = ZkProgram.Proof(zkp16);
export { ZKP16Proof, zkp16 };
