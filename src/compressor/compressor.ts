import { Field, Poseidon, Undefined, VerificationKey, ZkProgram } from 'o1js';
import { NodeProofLeft, NodeProofRight, SubtreeCarry } from '../structs.js';

const node = ZkProgram({
  name: 'node',
  publicInput: Undefined,
  publicOutput: SubtreeCarry,
  methods: {
    compute: {
      privateInputs: [
        NodeProofLeft,
        VerificationKey,
        NodeProofRight,
        VerificationKey,
        Field,
      ],
      async method(
        piLeft: NodeProofLeft,
        vkLeft: VerificationKey,
        piRight: NodeProofRight,
        vkRight: VerificationKey,
        layer: Field
      ) {
        piLeft.verify(vkLeft);
        piRight.verify(vkRight);

        piLeft.publicOutput.rightOut.assertEquals(piRight.publicOutput.leftIn);

        const subtreeVkDigest = Poseidon.hash([
          vkLeft.hash,
          vkRight.hash,
          piLeft.publicOutput.subtreeVkDigest,
          piRight.publicOutput.subtreeVkDigest,
          layer,
        ]);

        /*return new SubtreeCarry({
                leftIn: piLeft.publicOutput.leftIn, 
                rightOut: piRight.publicOutput.rightOut,
                subtreeVkDigest
            });*/

        return {
          publicOutput: new SubtreeCarry({
            leftIn: piLeft.publicOutput.leftIn,
            rightOut: piRight.publicOutput.rightOut,
            subtreeVkDigest,
          }),
        };
      },
    },
  },
});

export { node };
