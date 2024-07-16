import {
    ZkProgram,
    Field,
    Poseidon,
    Provable,
  } from 'o1js';
import { ArrayListHasher, KzgAccumulator } from '../../kzg/structs.js';
import { Fp12 } from '../../towers/fp12.js';
import { ATE_LOOP_COUNT } from '../../towers/consts.js';
import { AffineCache } from '../../lines/precompute.js';

const zkp17 = ZkProgram({
    name: 'zkp17',
    publicInput: Field,
    publicOutput: Field,
    methods: {
      compute: {
        privateInputs: [KzgAccumulator, Provable.Array(Field, ATE_LOOP_COUNT.length)],
        async method(
            input: Field,
            acc: KzgAccumulator, 
            lines_hashes: Array<Field>
        ) {
            const inDigest = Poseidon.hashPacked(KzgAccumulator, acc);
            inDigest.assertEquals(input);

            const lines_digest = ArrayListHasher.hash(lines_hashes);
            acc.state.lines_hashes_digest.assertEquals(lines_digest);

            let new_lines_hashes_digest = ArrayListHasher.hash(lines_hashes);
            acc.state.lines_hashes_digest = new_lines_hashes_digest;

            return Poseidon.hashPacked(KzgAccumulator, acc);
        },
      },
    },
});


const ZKP17Proof = ZkProgram.Proof(zkp17);
export { ZKP17Proof, zkp17 }