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
import { VK1, ZKP1Input, ZKP1Proof, ZKP1Output, zkp1 } from './dummy_1.js'

class ZKP2Input extends Struct({
}) {}

class ZKP2Output extends Struct({
    x: Field
}) {}

const zkp2 = ZkProgram({
    name: 'zkp2',
    publicInput: ZKP2Input,
    publicOutput: ZKP2Output,
    methods: {
      compute: {
        privateInputs: [Field, ZKP1Proof],
        async method(
            _input: ZKP2Input,
            a: Field,
            proof: Proof<ZKP1Input, ZKP1Output>, 
        ) {
            proof.verify();
            const out = proof.publicOutput.x.mul(a); 
            
            return new ZKP2Output({
                x: out
            });
        },
      },
    },
  });



const VK2 = (await zkp2.compile()).verificationKey;
const ZKP2Proof = ZkProgram.Proof(zkp2);

let x = Field("10")

let zkp1Input = new ZKP1Input({
  x
});

const proof1 = await zkp1.compute(zkp1Input, Field("2"));
const validZkp1 = await verify(proof1, VK1);
console.log('ok?', validZkp1);
console.log(proof1)

const proof2 = await zkp2.compute(ZKP2Input, Field("3"), proof1);
const validZkp2 = await verify(proof2, VK2);
console.log('ok?', validZkp2);

export { VK2, ZKP2Proof, ZKP2Input, ZKP2Output, zkp2 }