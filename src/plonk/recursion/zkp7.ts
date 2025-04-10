import { ZkProgram, Field, Poseidon } from 'o1js';
import { Accumulator } from '../accumulator.js';
import { VK } from '../vk.js';

const zkp7 = ZkProgram({
  name: 'zkp7',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    compute: {
      privateInputs: [Accumulator],
      async method(input: Field, acc: Accumulator) {
        const inDigest = Poseidon.hashPacked(Accumulator, acc);
        inDigest.assertEquals(input);

        let H = acc.fs.gammaKzgDigest_part0(
          acc.proof,
          VK,
          acc.state.lcm_x,
          acc.state.lcm_y,
          acc.state.linearized_opening
        );
        acc.state.H = H;

        return { publicOutput: Poseidon.hashPacked(Accumulator, acc) };
      },
    },
  },
});

const ZKP7Proof = ZkProgram.Proof(zkp7);
export { ZKP7Proof, zkp7 };
