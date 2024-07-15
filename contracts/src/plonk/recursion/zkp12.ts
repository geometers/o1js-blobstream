import {
    ZkProgram,
    Field,
    Poseidon,
  } from 'o1js';
import { Accumulator } from '../accumulator.js';
import { preparePairing_0, preparePairing_1 } from '../piop/plonk_utils.js';
import { VK } from '../vk.js';

const zkp12 = ZkProgram({
    name: 'zkp12',
    publicInput: Field,
    publicOutput: Field,
    methods: {
      compute: {
        privateInputs: [Accumulator],
        async method(
            input: Field,
            acc: Accumulator
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
            )

            acc.state.kzg_cm_x = kzg_cm_x; 
            acc.state.kzg_cm_y = kzg_cm_y; 

            return Poseidon.hashPacked(Accumulator, acc);
        },
      },
    },
});


const ZKP12Proof = ZkProgram.Proof(zkp12);
export { ZKP12Proof, zkp12 }