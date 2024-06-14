import { Bool, DynamicProof, Field, Poseidon, Provable, Struct, VerificationKey, ZkProgram, Undefined } from "o1js";
import { CIn, COut, CZkpIn, CZkpOut, GenericProofLeft, GenericProofRight, GenericZkpLeft, GenericZkpRight, NOTHING_UP_MY_SLEEVE } from "../structs.js";

class GenericZkp extends DynamicProof<CZkpIn, CZkpOut> {
    static publicInputType = CZkpIn; 
    static publicOutputType = CZkpOut;
    static maxProofsVerified = 2 as const;
}

const dynamicWrapper = ZkProgram({
    name: 'dynamicWrapper',
    publicInput: CIn,
    publicOutput: COut,
    methods: {
      compute: {
        privateInputs: [GenericZkp, VerificationKey],
        async method(
            _input: CIn,
            pi: GenericZkp, 
            vk: VerificationKey,
        ) {
            pi.verify(vk);

            return new COut({
                leftPiInDigest: pi.publicInput.digest, 
                rightPiOutDigest: pi.publicOutput.digest,
                runningVksDigest: NOTHING_UP_MY_SLEEVE,
            });
        },
      },
    },
  });

const dynamicWrapperProof = ZkProgram.Proof(dynamicWrapper);

export { dynamicWrapperProof, dynamicWrapper, GenericZkp }