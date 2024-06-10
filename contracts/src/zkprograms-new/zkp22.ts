import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';
import { ZKP21Input, ZKP21Output, ZKP21Proof } from './zkp21.js';
import { G1Affine } from '../ec/index.js';

class ZKP22Input extends Struct({
}) {}

class ZKP22Output extends Struct({
    gDigest: Field, 
    PI: G1Affine, 
    c: Fp12, 
    f: Fp12, 
}) {}

const zkp22 = ZkProgram({
    name: 'zkp22',
    publicInput: ZKP22Input,
    publicOutput: ZKP22Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP21Proof],
        async method(
            _input: ZKP22Input,
            g: Array<Fp12>,
            proof: Proof<ZKP21Input, ZKP21Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = proof.publicOutput.c.inverse();
            let f = proof.publicOutput.f;
        
            let idx = 0;
        
            for (let i = 55; i < 61; i++) {
              idx = i - 1;
              f = f.square().mul(g[idx]);
        
              if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(c_inv);
              }
        
              if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(proof.publicOutput.c);
              }
            }

            return new ZKP22Output({
                gDigest: proof.publicOutput.gDigest,
                PI: proof.publicOutput.PI, 
                c: proof.publicOutput.c, 
                f
            });
        },
      },
    },
  });

  const ZKP22Proof = ZkProgram.Proof(zkp22);
  export { ZKP22Proof, ZKP22Input, ZKP22Output, zkp22 }