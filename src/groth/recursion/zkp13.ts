import { Field, Poseidon, Provable, ZkProgram } from 'o1js';
import { Accumulator } from './data.js';
import { Fp12 } from '../../towers/index.js';
import { ArrayListHasher } from '../../array_list_hasher.js';
import { VK } from '../vk_from_env.js';
import { G1Affine } from '../../ec/index.js';

const zkp13 = ZkProgram({
  name: 'zkp13',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    compute: {
      privateInputs: [
        Accumulator,
        Provable.Array(Field, 64),
        Provable.Array(Fp12, 1),
      ],
      async method(
        input: Field,
        acc: Accumulator,
        lhs_line_hashes: Array<Field>,
        g_chunk: Array<Fp12>
      ) {
        input.assertEquals(Poseidon.hashPacked(Accumulator, acc));

        const opening = ArrayListHasher.open(lhs_line_hashes, g_chunk, []);
        acc.state.g_digest.assertEquals(opening);

        let f = acc.state.f;
        f = f.mul(g_chunk[0]);

        f = f
          .mul(acc.proof.c_inv.frobenius_pow_p())
          .mul(acc.proof.c.frobenius_pow_p_squared())
          .mul(acc.proof.c_inv.frobenius_pow_p_cubed())
          .mul(VK.alpha_beta);

        const shift = Provable.switch(
          [
            acc.proof.shift_power.equals(Field(0)),
            acc.proof.shift_power.equals(Field(1)),
            acc.proof.shift_power.equals(Field(2)),
          ],
          Fp12,
          [Fp12.one(), VK.w27, VK.w27_square]
        );
        f = f.mul(shift);

        f.assert_equals(Fp12.one());

        acc.state.f = f;

        return { publicOutput: Poseidon.hashPacked(G1Affine, acc.proof.PI) };
      },
    },
  },
});

const ZKP13Proof = ZkProgram.Proof(zkp13);
export { ZKP13Proof, zkp13 };
