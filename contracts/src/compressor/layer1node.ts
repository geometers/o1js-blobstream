import { Field, Poseidon, Undefined, VerificationKey, ZkProgram } from "o1js";
import { SubtreeCarry, ZkpProofLeft, ZkpProofRight } from "../structs.js";

const layer1 = ZkProgram({
    name: 'layer1',
    publicInput: Undefined,
    publicOutput: SubtreeCarry,
    methods: {
      compute: {
        privateInputs: [ZkpProofLeft, VerificationKey, ZkpProofRight, VerificationKey],
        async method(
            piLeft: ZkpProofLeft, 
            vkLeft: VerificationKey, 
            piRight: ZkpProofRight, 
            vkRight: VerificationKey
        ) {
            
            piLeft.verify(vkLeft); 
            piRight.verify(vkRight); 

            piLeft.publicOutput.assertEquals(piRight.publicInput);

            const subtreeVkDigest = Poseidon.hash([
              vkLeft.hash, 
              vkRight.hash, 
              Field(1), // layer
            ]);

            return new SubtreeCarry({
                leftIn: piLeft.publicInput, 
                rightOut: piRight.publicOutput, 
                subtreeVkDigest: subtreeVkDigest
          });
        },
      },
    },
});

export { layer1 }