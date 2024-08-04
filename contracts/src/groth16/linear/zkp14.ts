import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../../towers/index.js';
import { ZKP13Input, ZKP13Output, ZKP13Proof } from './zkp13.js';
import { G1Affine } from '../../ec/index.js';

class ZKP14Input extends Struct({
}) {}

class ZKP14Output extends Struct({
    gDigest: Field, 
    PI: G1Affine, 
    c: Fp12, 
    f: Fp12, 
}) {}

const zkp14 = ZkProgram({
    name: 'zkp14',
    publicInput: ZKP14Input,
    publicOutput: ZKP14Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP13Proof],
        async method(
            _input: ZKP14Input,
            g: Array<Fp12>,
            proof: Proof<ZKP13Input, ZKP13Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = proof.publicOutput.c.inverse();
            let f = proof.publicOutput.f;
        
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

            return new ZKP14Output({
                gDigest: proof.publicOutput.gDigest,
                PI: proof.publicOutput.PI, 
                c: proof.publicOutput.c, 
                f
            });
        },
      },
    },
  });

  const ZKP14Proof = ZkProgram.Proof(zkp14);
  export { ZKP14Proof, ZKP14Input, ZKP14Output, zkp14 }