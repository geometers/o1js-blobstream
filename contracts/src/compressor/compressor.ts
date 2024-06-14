import { Bool, Field, Poseidon, Proof, Provable, VerificationKey, ZkProgram } from "o1js";
import { CIn, COut, GenericProofLeft, GenericProofRight, NOTHING_UP_MY_SLEEVE } from "../structs.js";
import { dynamicWrapperProof } from "./dynamic_wrapper.js";

const node = ZkProgram({
    name: 'node',
    publicInput: CIn,
    publicOutput: COut,
    methods: {
      compute: {
        privateInputs: [dynamicWrapperProof],
        async method(
            input: CIn,
            piLeft: Proof<CIn, COut>, 
        ) {
            // input.digest.assertEquals(NOTHING_UP_MY_SLEEVE);

            // piLeft.verify(vkLeft); 
            // piRight.verify(vkRight); 

            piLeft.verify();
            // piRight.verifyIf(vkRight, br);


            // const leftInput = piLeft.publicOutput.leftPiInDigest; 
            // const leftOutput = piLeft.publicOutput.rightPiOutDigest; 

            // const rightInput = piRight.publicOutput.leftPiInDigest; 
            // const rightOutput = piRight.publicOutput.rightPiOutDigest;

            // leftOutput.assertEquals(rightInput);

            // maybe there is a better way to do this hash
            // TODO: add node index here also
            // const runningVksDigest = Poseidon.hashPacked(
            //     Provable.Array(Field, 5), 
            //     [
            //         vkLeft.hash, 
            //         vkRight.hash, 
            //         // piLeft.publicOutput.runningVksDigest, 
            //         // piRight.publicOutput.runningVksDigest, 
            //         layer
            //     ]);

            return new COut({
                leftPiInDigest: Field(0), // leftInput, 
                rightPiOutDigest: Field(0), // rightOutput,
                runningVksDigest: Field(0),
            });
        },
      },
    },
  });

const nodeProof = ZkProgram.Proof(node);

export { nodeProof, node }