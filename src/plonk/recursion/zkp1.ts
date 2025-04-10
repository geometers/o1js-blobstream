import { ZkProgram, Field, Poseidon, Provable } from 'o1js';
import { Accumulator } from '../accumulator.js';
import {
  compute_alpha_square_lagrange_0,
  evalVanishing,
} from '../piop/plonk_utils.js';
import { VK } from '../vk.js';

// ~ 59601
const zkp1 = ZkProgram({
  name: 'zkp1',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    compute: {
      privateInputs: [Accumulator],
      async method(input: Field, acc: Accumulator) {
        const inDigest = Poseidon.hashPacked(Accumulator, acc);
        inDigest.assertEquals(input);

        acc.fs.squeezeAlpha(acc.proof);
        acc.fs.squeezeZeta(acc.proof);

        const [zeta_pow_n, zh_eval] = evalVanishing(acc.fs.zeta, VK);
        const alpha_2_l0 = compute_alpha_square_lagrange_0(
          zh_eval,
          acc.fs.zeta,
          acc.fs.alpha,
          VK
        );

        acc.state.zeta_pow_n = zeta_pow_n;
        acc.state.zh_eval = zh_eval;
        acc.state.alpha_2_l0 = alpha_2_l0;

        return { publicOutput: Poseidon.hashPacked(Accumulator, acc) };
      },
    },
  },
});

const ZKP1Proof = ZkProgram.Proof(zkp1);
export { ZKP1Proof, zkp1 };
