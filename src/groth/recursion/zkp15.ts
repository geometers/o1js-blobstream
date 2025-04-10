import { Field, Poseidon, Provable, ZkProgram } from 'o1js';
import { Accumulator } from './data.js';
import { Fp12, FrC } from '../../towers/index.js';
import { ArrayListHasher } from '../../array_list_hasher.js';
import { VK } from '../vk_from_env.js';
import { G1Affine } from '../../ec/index.js';
import { bn254 } from '../../ec/g1.js';

const zkp15 = ZkProgram({
  name: 'zkp15',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    compute: {
      privateInputs: [G1Affine, G1Affine, Provable.Array(FrC.provable, 5)],
      async method(input: Field, PI: G1Affine, acc: G1Affine, pis: Array<FrC>) {
        const pi_hash = Poseidon.hashPacked(G1Affine, PI);
        const pis_hash = Poseidon.hashPacked(
          Provable.Array(FrC.provable, 5),
          pis
        );
        const acc_hash = Poseidon.hashPacked(G1Affine, acc);
        input.assertEquals(
          Poseidon.hashPacked(Provable.Array(Field, 3), [
            pi_hash,
            pis_hash,
            acc_hash,
          ])
        );

        let accBn = new bn254({ x: acc.x, y: acc.y });
        accBn = accBn.add(VK.ic4.scale(pis[3]));
        accBn = accBn.add(VK.ic5.scale(pis[4]));

        accBn.x.assertCanonical().assertEquals(PI.x);
        accBn.y.assertCanonical().assertEquals(PI.y);

        return { publicOutput: pis_hash };
      },
    },
  },
});

const ZKP15Proof = ZkProgram.Proof(zkp15);
export { ZKP15Proof, zkp15 };
