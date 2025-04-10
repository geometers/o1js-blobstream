import { ZkProgram, Field, Poseidon } from 'o1js';
import { Accumulator } from '../accumulator.js';
import { fold_state_0 } from '../piop/plonk_utils.js';

const zkp8 = ZkProgram({
  name: 'zkp8',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    compute: {
      privateInputs: [Accumulator],
      async method(input: Field, acc: Accumulator) {
        const inDigest = Poseidon.hashPacked(Accumulator, acc);
        inDigest.assertEquals(input);

        acc.fs.gammaKzgDigest_part1(acc.proof, acc.state.H);
        acc.fs.squeezeGammaKzgFromDigest();

        const [cm_x, cm_y, cm_opening] = fold_state_0(
          acc.proof,
          acc.state.lcm_x,
          acc.state.lcm_y,
          acc.state.linearized_opening,
          acc.fs.gamma_kzg
        );

        acc.state.cm_x = cm_x;
        acc.state.cm_y = cm_y;
        acc.state.cm_opening = cm_opening;

        return { publicOutput: Poseidon.hashPacked(Accumulator, acc) };
      },
    },
  },
});

const ZKP8Proof = ZkProgram.Proof(zkp8);
export { ZKP8Proof, zkp8 };
