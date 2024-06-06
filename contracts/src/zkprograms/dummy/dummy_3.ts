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
import { VK1, ZKP1Input, ZKP1Proof, ZKP1Output, zkp1 } from './dummy_1.js';
import { VK2, ZKP2Proof, ZKP2Input, ZKP2Output, zkp2 } from './dummy_2.js';


class ZKP3Input extends Struct({
}) {}

class ZKP3Output extends Struct({
    x: Field
}) {}

const zkp3 = ZkProgram({
    name: 'zkp3',
    publicInput: ZKP3Input,
    publicOutput: ZKP3Output,
    methods: {
      compute: {
        privateInputs: [Field, ZKP2Proof],
        async method(
            _input: ZKP3Input,
            a: Field,
            proof: Proof<ZKP2Input, ZKP2Output>, 
        ) {
            proof.verify();
            const out = proof.publicOutput.x.mul(a); 
            
            return new ZKP3Output({
                x: out
            });
        },
      },
    },
  });



const VK3 = (await zkp3.compile()).verificationKey;
const ZKP3Proof = ZkProgram.Proof(zkp3);

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

const proof3 = await zkp3.compute(ZKP3Input, Field("4"), proof2);
const validZkp3 = await verify(proof3, VK3);
console.log('ok?', validZkp3);

export { VK2, ZKP2Proof, ZKP2Input, ZKP2Output, zkp2 }