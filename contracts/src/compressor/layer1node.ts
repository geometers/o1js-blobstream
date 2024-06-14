import { Bool, DynamicProof, Field, Poseidon, Provable, Struct, VerificationKey, ZkProgram, Undefined } from "o1js";
import { CIn, COut, GenericProofLeft, GenericProofRight, GenericZkpLeft, GenericZkpRight, NOTHING_UP_MY_SLEEVE } from "../structs.js";

const nodeLayer1 = ZkProgram({
    name: 'nodeLayer1',
    publicInput: Undefined,
    publicOutput: COut,
    methods: {
      compute: {
        privateInputs: [Bool, GenericZkpLeft, VerificationKey, Bool, GenericZkpRight, VerificationKey],
        async method(
            verifyPiLeft: Bool,
            piLeft: GenericZkpLeft, 
            vkLeft: VerificationKey,
            verifyPiRight: Bool,
            piRight: GenericZkpRight, 
            vkRight: VerificationKey,
        ) {
            piLeft.verifyIf(vkLeft, verifyPiLeft);
            piRight.verifyIf(vkRight, verifyPiRight);

            // piLeft.publicOutput.digest.assertEquals(piRight.publicInput.digest);

            // maybe there is a better way to do this hash
            // TODO: add node index here also
            const runningVksDigest = Poseidon.hashPacked(
                Provable.Array(Field, 5), 
                [
                    verifyPiLeft.toField(),
                    vkLeft.hash, 
                    verifyPiRight.toField(),
                    vkRight.hash, 
                    
                    Field(1)
                ]);

            return new COut({
                leftPiInDigest: piLeft.publicInput.digest, 
                rightPiOutDigest: piRight.publicOutput.digest,
                runningVksDigest,
            });
        },
      },
    },
  });

const nodeLayer1Proof = ZkProgram.Proof(nodeLayer1);

export { nodeLayer1Proof, nodeLayer1 }