import { ZkProgram, Field, Poseidon, Provable } from 'o1js';

import { Accumulator } from './data.js';
import { Fp12 } from '../../towers/fp12.js';
import { ATE_LOOP_COUNT } from '../../towers/consts.js';
import { ArrayListHasher } from '../../array_list_hasher.js';
import { AffineCache } from '../../lines/precompute.js';
import { VK } from '../vk_from_env.js';
import { G2Line } from '../../lines/index.js';
import { LineParser } from '../../line_parser.js';

const BEGIN = ATE_LOOP_COUNT.length - 25;
const END = ATE_LOOP_COUNT.length - 15;

const delta_lines = LineParser.parse(BEGIN, END, VK.delta_lines);
const gamma_lines = LineParser.parse(BEGIN, END, VK.gamma_lines);

const zkp4 = ZkProgram({
  name: 'zkp4',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    compute: {
      privateInputs: [
        Accumulator,
        Provable.Array(Field, ATE_LOOP_COUNT.length),
        Provable.Array(G2Line, 91),
      ],
      async method(
        input: Field,
        acc: Accumulator,
        lines_hashes: Array<Field>,
        all_b_lines: Array<G2Line>
      ) {
        input.assertEquals(Poseidon.hashPacked(Accumulator, acc));
        acc.state.g_digest.assertEquals(ArrayListHasher.hash(lines_hashes));

        const a_cache = new AffineCache(acc.proof.negA);
        const c_cache = new AffineCache(acc.proof.C);
        const pi_cache = new AffineCache(acc.proof.PI);

        let T = acc.state.T;
        const negB = acc.proof.B.neg();

        const b_lines = LineParser.parse(BEGIN, END, all_b_lines);

        let idx = 0;
        let line_cnt = 0;

        let g;
        for (let i = BEGIN; i < END; i++) {
          idx = i - 1;

          const b_line = b_lines[line_cnt];
          const delta_line = delta_lines[line_cnt];
          const gamma_line = gamma_lines[line_cnt];
          line_cnt += 1;

          b_line.assert_is_tangent(T);

          g = b_line.psi(a_cache);
          g = g.sparse_mul(delta_line.psi(c_cache));
          g = g.sparse_mul(gamma_line.psi(pi_cache));

          T = T.double_from_line(b_line.lambda);

          if (ATE_LOOP_COUNT[i] == 1 || ATE_LOOP_COUNT[i] == -1) {
            const b_line = b_lines[line_cnt];
            const delta_line = delta_lines[line_cnt];
            const gamma_line = gamma_lines[line_cnt];
            line_cnt += 1;

            if (ATE_LOOP_COUNT[i] == 1) {
              b_line.assert_is_line(T, acc.proof.B);
              T = T.add_from_line(b_line.lambda, acc.proof.B);
            } else {
              b_line.assert_is_line(T, negB);
              T = T.add_from_line(b_line.lambda, negB);
            }

            g = g.sparse_mul(b_line.psi(a_cache));
            g = g.sparse_mul(delta_line.psi(c_cache));
            g = g.sparse_mul(gamma_line.psi(pi_cache));
          }

          lines_hashes[idx] = Poseidon.hashPacked(Fp12, g);
        }

        let new_g_digest = ArrayListHasher.hash(lines_hashes);
        acc.state.T = T;
        acc.state.g_digest = new_g_digest;

        return { publicOutput: Poseidon.hashPacked(Accumulator, acc) };
      },
    },
  },
});

const ZKP4Proof = ZkProgram.Proof(zkp4);
export { ZKP4Proof, zkp4 };
