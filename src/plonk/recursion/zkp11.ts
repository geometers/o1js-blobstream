import { ZkProgram, Field, Poseidon } from 'o1js';
import { Accumulator } from '../accumulator.js';
import { preparePairing_0 } from '../piop/plonk_utils.js';
import { VK } from '../vk.js';

const zkp11 = ZkProgram({
  name: 'zkp11',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    compute: {
      privateInputs: [Accumulator],
      async method(input: Field, acc: Accumulator) {
        const inDigest = Poseidon.hashPacked(Accumulator, acc);
        inDigest.assertEquals(input);

        const [kzg_cm_x, kzg_cm_y, neg_fq_x, neg_fq_y] = preparePairing_0(
          VK,
          acc.proof,
          acc.state.kzg_random,
          acc.state.cm_x,
          acc.state.cm_y,
          acc.state.cm_opening
        );

        acc.state.kzg_cm_x = kzg_cm_x;
        acc.state.kzg_cm_y = kzg_cm_y;
        acc.state.neg_fq_x = neg_fq_x;
        acc.state.neg_fq_y = neg_fq_y;

        return { publicOutput: Poseidon.hashPacked(Accumulator, acc) };
      },
    },
  },
});

const ZKP11Proof = ZkProgram.Proof(zkp11);
export { ZKP11Proof, zkp11 };
