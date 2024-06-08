import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';
import { ZKP7Input, ZKP7Output, ZKP7Proof } from './zkp7.js';
import { G1Affine } from '../ec/index.js';

class ZKP8Input extends Struct({
}) {}

class ZKP8Output extends Struct({
    gDigest: Field, 
    PI: G1Affine, 
    c: Fp12, 
    f: Fp12, 
}) {}

const zkp8 = ZkProgram({
    name: 'zkp8',
    publicInput: ZKP8Input,
    publicOutput: ZKP8Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP7Proof],
        async method(
            _input: ZKP8Input,
            g: Array<Fp12>,
            proof: Proof<ZKP7Input, ZKP7Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = proof.publicOutput.c.inverse();
            let f = c_inv;
        
            let idx = 0;
        
            for (let i = 13; i < 19; i++) {
              idx = i - 1;
              f = f.square().mul(g[idx]);
        
              if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(c_inv);
              }
        
              if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(proof.publicOutput.c);
              }
            }

            return new ZKP8Output({
                gDigest: proof.publicOutput.gDigest,
                PI: proof.publicOutput.PI, 
                c: proof.publicOutput.c, 
                f
            });
        },
      },
    },
  });

  const ZKP8Proof = ZkProgram.Proof(zkp8);
  export { ZKP8Proof, ZKP8Input, ZKP8Output, zkp8 }