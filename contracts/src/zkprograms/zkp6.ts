import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';
import { ZKP5Input, ZKP5Output, ZKP5Proof } from './zkp5.js';
import { G1Affine } from '../ec/index.js';

class ZKP6Input extends Struct({
    c: Fp12
}) {}

class ZKP6Output extends Struct({
    gDigest: Field, 
    PI: G1Affine, 
    c: Fp12, 
    f: Fp12, 
}) {}

const zkp6 = ZkProgram({
    name: 'zkp6',
    publicInput: ZKP6Input,
    publicOutput: ZKP6Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP5Proof],
        async method(
            input: ZKP6Input,
            g: Array<Fp12>,
            proof: Proof<ZKP5Input, ZKP5Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = input.c.inverse();
            let f = c_inv;
        
            let idx = 0;
        
            for (let i = 1; i < 7; i++) {
                idx = i - 1;
                f = f.square().mul(g[idx]);
            
                if (ATE_LOOP_COUNT[i] == 1) {
                    f = f.mul(c_inv);
                }
            
                if (ATE_LOOP_COUNT[i] == -1) {
                    f = f.mul(input.c);
                }
            }

            return new ZKP6Output({
                gDigest: proof.publicOutput.gDigest,
                PI: proof.publicOutput.PI, 
                c: input.c, 
                f
            });
        },
      },
    },
  });

  const ZKP6Proof = ZkProgram.Proof(zkp6);
  export { ZKP6Proof, ZKP6Input, ZKP6Output, zkp6 }