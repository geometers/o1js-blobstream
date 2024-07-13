import {
    ZkProgram,
    Field,
    Poseidon,
  } from 'o1js';
import { Accumulator } from '../accumulator.js';

const zkp1 = ZkProgram({
    name: 'zkp1',
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

            acc.fs.squeezeAlpha(acc.proof)
            acc.fs.squeezeZeta(acc.proof)

            return Poseidon.hashPacked(Accumulator, acc);
        },
      },
    },
});


const ZKP1Proof = ZkProgram.Proof(zkp1);
export { ZKP1Proof, zkp1 }