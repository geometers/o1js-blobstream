import { ZkProgram, Field, Poseidon, Provable } from 'o1js';
import { ArrayListHasher, KzgAccumulator } from '../../kzg/structs.js';
import { Fp12 } from '../../towers/fp12.js';
import { ATE_LOOP_COUNT } from '../../towers/consts.js';
import { make_w27 } from '../helpers.js';
import { FrC } from '../../towers/fr.js';

const w27 = make_w27();
const w27_sq = w27.square();

const zkp23 = ZkProgram({
  name: 'zkp23',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    compute: {
      privateInputs: [
        KzgAccumulator,
        Provable.Array(Field, 64),
        Provable.Array(Fp12, 1),
      ],
      async method(
        input: Field,
        acc: KzgAccumulator,
        lhs_line_hashes: Array<Field>,
        g_chunk: Array<Fp12>
      ) {
        const inDigest = Poseidon.hashPacked(KzgAccumulator, acc);
        inDigest.assertEquals(input);

        const opening = ArrayListHasher.open(lhs_line_hashes, g_chunk, []);
        acc.state.lines_hashes_digest.assertEquals(opening);

        let f = acc.state.f;
        f = f.mul(g_chunk[0]);

        f = f
          .mul(acc.proof.c_inv.frobenius_pow_p())
          .mul(acc.proof.c.frobenius_pow_p_squared())
          .mul(acc.proof.c_inv.frobenius_pow_p_cubed());

        const shift = Provable.switch(
          [
            acc.proof.shift_power.equals(Field(0)),
            acc.proof.shift_power.equals(Field(1)),
            acc.proof.shift_power.equals(Field(2)),
          ],
          Fp12,
          [Fp12.one(), w27, w27_sq]
        );
        f = f.mul(shift);

        f.assert_equals(Fp12.one());

        acc.state.f = f;

        return {
          publicOutput: Poseidon.hashPacked(Provable.Array(FrC.provable, 2), [
            acc.proof.pi0,
            acc.proof.pi1,
          ]),
        };
      },
    },
  },
});

const ZKP23Proof = ZkProgram.Proof(zkp23);
export { ZKP23Proof, zkp23 };
