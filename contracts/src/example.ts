// import { zkp1, zkp2, zkp3, zkp4 } from "./programs/index.js";
// import { node } from "./compressor/compressor.js";
// import { Field, Poseidon, verify } from "o1js";
// import { GenericProofLeft, GenericProofRight, toDefaultInput, toDefaultOutput, toInput } from "./structs.js";
// import { buildTreeOfVks } from "./tree_of_vks.js";

// // load all vks: 

// const vk1 = (await zkp1.compile()).verificationKey; 
// const vk2 = (await zkp2.compile()).verificationKey; 
// const vk3 = (await zkp3.compile()).verificationKey; 
// const vk4 = (await zkp4.compile()).verificationKey; 

// const nodeVk = (await node.compile()).verificationKey;

// const root = buildTreeOfVks([vk1, vk2, vk3, vk4], nodeVk);

// const dummyLeft = await GenericProofLeft.dummy(toDefaultInput(), toDefaultOutput(Field(0)), 2);
// const dummyRight = await GenericProofRight.dummy(toDefaultInput(), toDefaultOutput(Field(0)), 2);

// // construct inputs

// const x = Field(2); 

// const in1 = toInput(x);
// const out1Field = Poseidon.hash([x, Field(1)]);
// // const out1Digest = Poseidon.hash([out1Field]);
// // const out1 = toDefaultOutput(out1Digest);

// const proof1 = await zkp1.compute(in1, x, dummyLeft, vk1, dummyRight, vk1);
// const valid1 = await verify(proof1, vk1);
// console.log('ok1?', valid1);

// const in2 = toInput(out1Field);
// const out2Field = Poseidon.hash([out1Field, Field(2)]);
// // const out2Digest = Poseidon.hash([out2Field]);
// // const out2 = toDefaultOutput(out2Digest);

// const proof2 = await zkp2.compute(in2, out1Field, dummyLeft, vk1, dummyRight, vk1);
// const valid2 = await verify(proof2, vk2);
// console.log('ok2?', valid2);

// const in3 = toInput(out2Field);
// const out3Field = Poseidon.hash([out2Field, Field(3)]);
// // const out3Digest = Poseidon.hash([out3Field]);
// // const out3 = toDefaultOutput(out3Digest);

// const proof3 = await zkp3.compute(in3, out2Field, dummyLeft, vk1, dummyRight, vk1);
// const valid3 = await verify(proof3, vk3);
// console.log('ok3?', valid3);

// const in4 = toInput(out3Field);
// const out4Field = Poseidon.hash([out3Field, Field(4)]);
// // // const out4Digest = Poseidon.hash([out4Field]);
// // // // const out4 = toDefaultOutput(out4Digest);

// const proof4 = await zkp4.compute(in4, out3Field, dummyLeft, vk1, dummyRight, vk1);
// const valid4 = await verify(proof4, vk4);
// console.log('ok4?', valid4);

// // out4Digest.assertEquals(proof4.publicOutput.rightPiOutDigest);

// // // Now try to run it as a tree 

// const gp1 = GenericProofLeft.fromProof(proof1);
// const gp2 = GenericProofRight.fromProof(proof2);
// const gp3 = GenericProofLeft.fromProof(proof3);
// const gp4 = GenericProofRight.fromProof(proof4);

// // layer = 1 

// const gp12 = await node.compute(toDefaultInput(), gp1, vk1, gp2, vk2, Field(1));
// let valid = await verify(gp12, nodeVk);
// console.log('ok 12?', valid);

// const gp34 = await node.compute(toDefaultInput(), gp3, vk3, gp4, vk4, Field(1));
// valid = await verify(gp34, nodeVk);
// console.log('ok 34?', valid);

// // layer = 2 

// const gp2l = GenericProofLeft.fromProof(gp12); 
// const gp2r = GenericProofRight.fromProof(gp34);

// const rootProof = await node.compute(toDefaultInput(), gp2l, nodeVk, gp2r, nodeVk, Field(2));
// valid = await verify(rootProof, nodeVk);
// console.log('valid root?', valid);

// rootProof.publicOutput.runningVksDigest.assertEquals(root);