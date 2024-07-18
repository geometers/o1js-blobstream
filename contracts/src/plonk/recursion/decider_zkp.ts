import { Field, Poseidon, Provable, Struct, VerificationKey, ZkProgram } from "o1js";
import { NodeProofLeft } from "../../structs.js";
import { FrC } from "../../towers/index.js";

class DeciderInput extends Struct({
    pi0: FrC.provable, 
    pi1: FrC.provable, 
    root_hash: Field
}) {}

const node = ZkProgram({
    name: 'node',
    publicInput: DeciderInput,
    publicOutput: Field,
    methods: {
      compute: {
        privateInputs: [VerificationKey, NodeProofLeft],
        async method(
            input: DeciderInput,
            rootVk: VerificationKey, 
            rootProof: NodeProofLeft, 
        ) {
            rootProof.verify(rootVk) 
            rootProof.publicOutput.subtreeVkDigest.assertEquals(input.root_hash)

            const piDigest = Poseidon.hashPacked(Provable.Array(FrC.provable, 2), [input.pi0, input.pi1])
            piDigest.assertEquals(rootProof.publicOutput.rightOut)

            return Field.from(1n)
        },
      },
    },
});

export { node }