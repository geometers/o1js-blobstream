// import { Bool, DynamicProof, Field, Poseidon, Provable, Struct, VerificationKey, ZkProgram, Undefined, Proof } from "o1js";
// import { CIn, COut, CZkpIn, CZkpOut, GenericProofLeft, GenericProofRight, GenericZkpLeft, GenericZkpRight, NOTHING_UP_MY_SLEEVE } from "../structs.js";
// import { DynamicWrapperProof } from "./dynamic_wrapper.js";

// const concreteWrapper = ZkProgram({
//     name: 'concreteWrapper',
//     publicInput: CIn,
//     publicOutput: COut,
//     methods: {
//       compute: {
//         privateInputs: [dynamicWrapperProof, VerificationKey],
//         async method(
//             _input: CIn,
//             pi: dynamicWrapperProof, 
//             vk: VerificationKey,
//         ) {
//             pi.verify(vk);

//             return new COut({
//                 leftPiInDigest: pi.publicInput.digest, 
//                 rightPiOutDigest: pi.publicOutput.digest,
//                 runningVksDigest: NOTHING_UP_MY_SLEEVE,
//             });
//         },
//       },
//     },
//   });

// const concreteWrapperProof = ZkProgram.Proof(concreteWrapper);

// export { concreteWrapperProof, concreteWrapper }