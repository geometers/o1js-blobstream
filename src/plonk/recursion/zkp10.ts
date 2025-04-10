import { ZkProgram, Field, Poseidon } from 'o1js';
import { Accumulator } from '../accumulator.js';
import { fold_state_2 } from '../piop/plonk_utils.js';
import { VK } from '../vk.js';

const zkp10 = ZkProgram({
  name: 'zkp10',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    compute: {
      privateInputs: [Accumulator],
      async method(input: Field, acc: Accumulator) {
        const inDigest = Poseidon.hashPacked(Accumulator, acc);
        inDigest.assertEquals(input);

        const [cm_x, cm_y] = fold_state_2(
          VK,
          acc.proof,
          acc.state.cm_x,
          acc.state.cm_y,
          acc.fs.gamma_kzg
        );
        const kzg_random = acc.fs.squeezeRandomForKzg(acc.proof, cm_x, cm_y);

        acc.state.cm_x = cm_x;
        acc.state.cm_y = cm_y;
        acc.state.kzg_random = kzg_random;

        return { publicOutput: Poseidon.hashPacked(Accumulator, acc) };
      },
    },
  },
});

const ZKP10Proof = ZkProgram.Proof(zkp10);
export { ZKP10Proof, zkp10 };
