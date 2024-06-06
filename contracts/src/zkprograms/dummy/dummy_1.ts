import {
    ZkProgram,
    Field,
    DynamicProof,
    Proof,
    VerificationKey,
    Undefined,
    verify,
    Provable,
    Struct
  } from 'o1js';

class ZKP1Input extends Struct({
    x: Field,
}) {}

class ZKP1Output extends Struct({
    x: Field
}) {}

// npm run build && node --max-old-space-size=65536 build/src/zkprograms/zkp1.js
const zkp1 = ZkProgram({
    name: 'zkp1',
    publicInput: ZKP1Input,
    publicOutput: ZKP1Output,
    methods: {
      compute: {
        privateInputs: [Field],
        async method(
            input: ZKP1Input,
            a: Field
        ) {
          const out = input.x.mul(a); 
          return new ZKP1Output({
            x: out
          });
        },
      },
    },
  });


console.log('Compiling circuits...');
const VK1 = (await zkp1.compile()).verificationKey;
const ZKP1Proof = ZkProgram.Proof(zkp1);

let x = Field("10")

let zkp1Input = new ZKP1Input({
  x
});

const proof1 = await zkp1.compute(zkp1Input, Field("2"));
const validZkp1 = await verify(proof1, VK1);
console.log('ok?', validZkp1);
console.log(proof1)

export { VK1, ZKP1Proof, ZKP1Input, ZKP1Output, zkp1 }