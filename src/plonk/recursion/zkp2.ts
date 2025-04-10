import { ZkProgram, Field, Poseidon, Provable } from 'o1js';
import { Accumulator } from '../accumulator.js';
import { fold_quotient_split_0 } from '../piop/plonk_utils.js';
import { VK } from '../vk.js';

const zkp2 = ZkProgram({
  name: 'zkp2',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    compute: {
      privateInputs: [Accumulator],
      async method(input: Field, acc: Accumulator) {
        const inDigest = Poseidon.hashPacked(Accumulator, acc);
        inDigest.assertEquals(input);

        const [hx, hy] = fold_quotient_split_0(
          acc.proof.h0_x,
          acc.proof.h0_y,
          acc.proof.h1_x,
          acc.proof.h1_y,
          acc.proof.h2_x,
          acc.proof.h2_y,
          acc.fs.zeta,
          acc.state.zeta_pow_n
        );

        acc.state.hx = hx;
        acc.state.hy = hy;

        return { publicOutput: Poseidon.hashPacked(Accumulator, acc) };
      },
    },
  },
});

const ZKP2Proof = ZkProgram.Proof(zkp2);
export { ZKP2Proof, zkp2 };
