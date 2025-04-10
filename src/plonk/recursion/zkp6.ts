import { ZkProgram, Field, Poseidon } from 'o1js';
import { Accumulator } from '../accumulator.js';
import {
  compute_commitment_linearized_polynomial_split_0,
  compute_commitment_linearized_polynomial_split_1,
  compute_commitment_linearized_polynomial_split_2,
  customPiLagrange,
  opening_of_linearized_polynomial,
  pi_contribution,
} from '../piop/plonk_utils.js';
import { VK } from '../vk.js';

const zkp6 = ZkProgram({
  name: 'zkp6',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    compute: {
      privateInputs: [Accumulator],
      async method(input: Field, acc: Accumulator) {
        const inDigest = Poseidon.hashPacked(Accumulator, acc);
        inDigest.assertEquals(input);

        const [lcm_x, lcm_y] = compute_commitment_linearized_polynomial_split_2(
          acc.state.lcm_x,
          acc.state.lcm_y,
          acc.proof,
          VK,
          acc.fs.beta,
          acc.fs.gamma,
          acc.fs.alpha,
          acc.fs.zeta,
          acc.state.alpha_2_l0,
          acc.state.hx,
          acc.state.hy
        );

        acc.state.lcm_x = lcm_x;
        acc.state.lcm_y = lcm_y;

        return { publicOutput: Poseidon.hashPacked(Accumulator, acc) };
      },
    },
  },
});

const ZKP6Proof = ZkProgram.Proof(zkp6);
export { ZKP6Proof, zkp6 };
