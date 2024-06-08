import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';
import { ZKP6Input, ZKP6Output, ZKP6Proof } from './zkp6.js';
import { G1Affine } from '../ec/index.js';

class ZKP7Input extends Struct({
}) {}

class ZKP7Output extends Struct({
    gDigest: Field, 
    PI: G1Affine, 
    c: Fp12, 
    f: Fp12, 
}) {}

const zkp7 = ZkProgram({
    name: 'zkp7',
    publicInput: ZKP7Input,
    publicOutput: ZKP7Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP6Proof],
        async method(
            _input: ZKP7Input,
            g: Array<Fp12>,
            proof: Proof<ZKP6Input, ZKP6Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = proof.publicOutput.c.inverse();
            let f = c_inv;
        
            let idx = 0;
        
            for (let i = 7; i < 13; i++) {
              idx = i - 1;
              f = f.square().mul(g[idx]);
        
              if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(c_inv);
              }
        
              if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(proof.publicOutput.c);
              }
            }

            return new ZKP7Output({
                gDigest: proof.publicOutput.gDigest,
                PI: proof.publicOutput.PI, 
                c: proof.publicOutput.c, 
                f
            });
        },
      },
    },
  });

  const ZKP7Proof = ZkProgram.Proof(zkp7);
  export { ZKP7Proof, ZKP7Input, ZKP7Output, zkp7 }