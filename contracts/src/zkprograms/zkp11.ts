import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';
import { ZKP10Input, ZKP10Output, ZKP10Proof } from './zkp10.js';
import { G1Affine } from '../ec/index.js';

class ZKP11Input extends Struct({
}) {}

class ZKP11Output extends Struct({
    gDigest: Field, 
    PI: G1Affine, 
    c: Fp12, 
    f: Fp12, 
}) {}

const zkp11 = ZkProgram({
    name: 'zkp11',
    publicInput: ZKP11Input,
    publicOutput: ZKP11Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP10Proof],
        async method(
            _input: ZKP11Input,
            g: Array<Fp12>,
            proof: Proof<ZKP10Input, ZKP10Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = proof.publicOutput.c.inverse();
            let f = c_inv;
        
            let idx = 0;
        
            for (let i = 31; i < 37; i++) {
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

  const ZKP11Proof = ZkProgram.Proof(zkp11);
  export { ZKP11Proof, ZKP11Input, ZKP11Output, zkp11 }