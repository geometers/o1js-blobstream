import { ZkProgram, Field, Poseidon } from 'o1js';
import { Accumulator } from '../accumulator.js';
import {
  compute_commitment_linearized_polynomial_split_0,
  customPiLagrange,
  opening_of_linearized_polynomial,
  pi_contribution,
} from '../piop/plonk_utils.js';
import { VK } from '../vk.js';

const zkp4 = ZkProgram({
  name: 'zkp4',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    compute: {
      privateInputs: [Accumulator],
      async method(input: Field, acc: Accumulator) {
        const inDigest = Poseidon.hashPacked(Accumulator, acc);
        inDigest.assertEquals(input);

        const [lcm_x, lcm_y] = compute_commitment_linearized_polynomial_split_0(
          acc.proof,
          VK
        );

        acc.state.lcm_x = lcm_x;
        acc.state.lcm_y = lcm_y;

        return { publicOutput: Poseidon.hashPacked(Accumulator, acc) };
      },
    },
  },
});

const ZKP4Proof = ZkProgram.Proof(zkp4);
export { ZKP4Proof, zkp4 };
