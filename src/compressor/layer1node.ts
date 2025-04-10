import {
  Bool,
  Field,
  Poseidon,
  Provable,
  Undefined,
  VerificationKey,
  ZkProgram,
} from 'o1js';
import {
  NOTHING_UP_MY_SLEEVE,
  SubtreeCarry,
  ZkpProofLeft,
  ZkpProofRight,
} from '../structs.js';

/*
  When base layer of zkps is not power of 2 we extend it with dummy proofs to make it power of 2 
  Other techniques would be to dynamically add dummy proofs at higher layers when needed. For now we skip it for simplicity
*/

const layer1 = ZkProgram({
  name: 'layer1',
  publicInput: Undefined,
  publicOutput: SubtreeCarry,
  methods: {
    compute: {
      privateInputs: [
        ZkpProofLeft,
        VerificationKey,
        Bool,
        ZkpProofRight,
        VerificationKey,
        Bool,
      ],
      async method(
        piLeft: ZkpProofLeft,
        vkLeft: VerificationKey,
        verifyLeft: Bool,
        piRight: ZkpProofRight,
        vkRight: VerificationKey,
        verifyRight: Bool
      ) {
        piLeft.verifyIf(vkLeft, verifyLeft);
        piRight.verifyIf(vkRight, verifyRight);

        piLeft.publicOutput.assertEquals(piRight.publicInput);

        const leftVkHash = Provable.if(
          verifyLeft,
          vkLeft.hash,
          NOTHING_UP_MY_SLEEVE
        );
        const rightVkHash = Provable.if(
          verifyRight,
          vkRight.hash,
          NOTHING_UP_MY_SLEEVE
        );

        const subtreeVkDigest = Poseidon.hash([
          leftVkHash,
          rightVkHash,
          Field(1), // layer
        ]);

        /*return new SubtreeCarry({
                leftIn: piLeft.publicInput, 
                rightOut: piRight.publicOutput, 
                subtreeVkDigest: subtreeVkDigest
          });*/

        return {
          publicOutput: new SubtreeCarry({
            leftIn: piLeft.publicInput,
            rightOut: piRight.publicOutput,
            subtreeVkDigest: subtreeVkDigest,
          }),
        };
      },
    },
  },
});

export { layer1 };
