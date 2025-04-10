import { ZkProgram, Field, Poseidon } from 'o1js';
import { Accumulator } from '../accumulator.js';
import { fold_state_0, fold_state_1 } from '../piop/plonk_utils.js';
import { VK } from '../vk.js';

const zkp9 = ZkProgram({
  name: 'zkp9',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    compute: {
      privateInputs: [Accumulator],
      async method(input: Field, acc: Accumulator) {
        const inDigest = Poseidon.hashPacked(Accumulator, acc);
        inDigest.assertEquals(input);

        const [cm_x, cm_y] = fold_state_1(
          VK,
          acc.proof,
          acc.state.cm_x,
          acc.state.cm_y,
          acc.fs.gamma_kzg
        );

        acc.state.cm_x = cm_x;
        acc.state.cm_y = cm_y;

        return { publicOutput: Poseidon.hashPacked(Accumulator, acc) };
      },
    },
  },
});

const ZKP9Proof = ZkProgram.Proof(zkp9);
export { ZKP9Proof, zkp9 };
