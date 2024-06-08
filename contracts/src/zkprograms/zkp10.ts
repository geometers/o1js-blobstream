import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';
import { ZKP9Input, ZKP9Output, ZKP9Proof } from './zkp9.js';
import { G1Affine } from '../ec/index.js';

class ZKP10Input extends Struct({
}) {}

class ZKP10Output extends Struct({
    gDigest: Field, 
    PI: G1Affine, 
    c: Fp12, 
    f: Fp12, 
}) {}

const zkp10 = ZkProgram({
    name: 'zkp10',
    publicInput: ZKP10Input,
    publicOutput: ZKP10Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP9Proof],
        async method(
            _input: ZKP10Input,
            g: Array<Fp12>,
            proof: Proof<ZKP9Input, ZKP9Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = proof.publicOutput.c.inverse();
            let f = c_inv;
        
            let idx = 0;
        
            for (let i = 25; i < 31; i++) {
              idx = i - 1;
              f = f.square().mul(g[idx]);
        
              if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(c_inv);
              }
        
              if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(proof.publicOutput.c);
              }
            }

            return new ZKP10Output({
                gDigest: proof.publicOutput.gDigest,
                PI: proof.publicOutput.PI, 
                c: proof.publicOutput.c, 
                f
            });
        },
      },
    },
  });

  const ZKP10Proof = ZkProgram.Proof(zkp10);
  export { ZKP10Proof, ZKP10Input, ZKP10Output, zkp10 }