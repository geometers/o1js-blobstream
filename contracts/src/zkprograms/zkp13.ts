import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';
import { ZKP12Input, ZKP12Output, ZKP12Proof } from './zkp12.js';
import { G1Affine } from '../ec/index.js';

class ZKP13Input extends Struct({
}) {}

class ZKP13Output extends Struct({
    gDigest: Field, 
    PI: G1Affine, 
    c: Fp12, 
    f: Fp12, 
}) {}

const zkp13 = ZkProgram({
    name: 'zkp13',
    publicInput: ZKP13Input,
    publicOutput: ZKP13Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP12Proof],
        async method(
            _input: ZKP13Input,
            g: Array<Fp12>,
            proof: Proof<ZKP12Input, ZKP12Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = proof.publicOutput.c.inverse();
            let f = c_inv;
        
            let idx = 0;
        
            for (let i = 42; i < 48; i++) {
              idx = i - 1;
              f = f.square().mul(g[idx]);
        
              if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(c_inv);
              }
        
              if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(proof.publicOutput.c);
              }
            }

            return new ZKP13Output({
                gDigest: proof.publicOutput.gDigest,
                PI: proof.publicOutput.PI, 
                c: proof.publicOutput.c, 
                f
            });
        },
      },
    },
  });

  const ZKP13Proof = ZkProgram.Proof(zkp13);
  export { ZKP13Proof, ZKP13Input, ZKP13Output, zkp13 }