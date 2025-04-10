import { ZkProgram, Field, Poseidon, Provable } from 'o1js';
import { ArrayListHasher, KzgAccumulator } from '../../kzg/structs.js';
import { Fp12 } from '../../towers/fp12.js';
import { ATE_LOOP_COUNT } from '../../towers/consts.js';

const zkp17 = ZkProgram({
  name: 'zkp17',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    compute: {
      privateInputs: [
        KzgAccumulator,
        Provable.Array(Fp12, 9),
        Provable.Array(Field, ATE_LOOP_COUNT.length - 9),
      ],
      async method(
        input: Field,
        acc: KzgAccumulator,
        g_chunk: Array<Fp12>,
        rhs_lines_hashes: Array<Field>
      ) {
        const inDigest = Poseidon.hashPacked(KzgAccumulator, acc);
        inDigest.assertEquals(input);

        const opening = ArrayListHasher.open([], g_chunk, rhs_lines_hashes);
        acc.state.lines_hashes_digest.assertEquals(opening);

        let f = acc.state.f;

        let idx = 0;
        for (let i = 1; i < 10; i++) {
          f = f.square().mul(g_chunk[idx]);

          if (ATE_LOOP_COUNT[i] == 1) {
            f = f.mul(acc.proof.c_inv);
          }

          if (ATE_LOOP_COUNT[i] == -1) {
            f = f.mul(acc.proof.c);
          }

          idx += 1;
        }

        acc.state.f = f;

        return { publicOutput: Poseidon.hashPacked(KzgAccumulator, acc) };
      },
    },
  },
});

const ZKP17Proof = ZkProgram.Proof(zkp17);
export { ZKP17Proof, zkp17 };
