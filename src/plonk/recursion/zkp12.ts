import { ZkProgram, Field, Poseidon } from 'o1js';
import { Accumulator } from '../accumulator.js';
import { preparePairing_1 } from '../piop/plonk_utils.js';
import { VK } from '../vk.js';
import { G1Affine } from '../../ec/index.js';
import {
  ArrayListHasher,
  KzgAccumulator,
  KzgProof,
  KzgState,
} from '../../kzg/structs.js';
import { Fp12 } from '../../towers/fp12.js';

const zkp12 = ZkProgram({
  name: 'zkp12',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    compute: {
      privateInputs: [Accumulator, Field, Fp12],
      async method(
        input: Field,
        acc: Accumulator,
        shift_power: Field,
        c: Fp12
      ) {
        const inDigest = Poseidon.hashPacked(Accumulator, acc);
        inDigest.assertEquals(input);

        const [kzg_cm_x, kzg_cm_y] = preparePairing_1(
          VK,
          acc.proof,
          acc.state.kzg_random,
          acc.state.kzg_cm_x,
          acc.state.kzg_cm_y,
          acc.fs.zeta
        );

        const A = new G1Affine({ x: kzg_cm_x, y: kzg_cm_y });
        const negB = new G1Affine({
          x: acc.state.neg_fq_x,
          y: acc.state.neg_fq_y,
        });

        let c_inv = c.inverse();
        let kzgProof = new KzgProof({
          A,
          negB,
          shift_power,
          c,
          c_inv,
          pi0: acc.state.pi0,
          pi1: acc.state.pi1,
        });

        let kzgState = new KzgState({
          f: c_inv,
          lines_hashes_digest: ArrayListHasher.empty(),
        });

        let kzgAccumulator = new KzgAccumulator({
          proof: kzgProof,
          state: kzgState,
        });

        return {
          publicOutput: Poseidon.hashPacked(KzgAccumulator, kzgAccumulator),
        };
      },
    },
  },
});

const ZKP12Proof = ZkProgram.Proof(zkp12);
export { ZKP12Proof, zkp12 };
