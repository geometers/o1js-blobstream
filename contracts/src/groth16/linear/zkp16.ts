import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../../towers/index.js';
import { ZKP15Input, ZKP15Output, ZKP15Proof } from './zkp15.js';
import { G1Affine } from '../../ec/index.js';

class ZKP16Input extends Struct({
}) {}

class ZKP16Output extends Struct({
    gDigest: Field, 
    PI: G1Affine, 
    c: Fp12, 
    f: Fp12, 
}) {}

const zkp16 = ZkProgram({
    name: 'zkp16',
    publicInput: ZKP16Input,
    publicOutput: ZKP16Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP15Proof],
        async method(
            _input: ZKP16Input,
            g: Array<Fp12>,
            proof: Proof<ZKP15Input, ZKP15Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = proof.publicOutput.c.inverse();
            let f = proof.publicOutput.f;
        
            let idx = 0;
        
            for (let i = 19; i < 25; i++) {
              idx = i - 1;
              f = f.square().mul(g[idx]);
        
              if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(c_inv);
              }
        
              if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(proof.publicOutput.c);
              }
            }

            return new ZKP16Output({
                gDigest: proof.publicOutput.gDigest,
                PI: proof.publicOutput.PI, 
                c: proof.publicOutput.c, 
                f
            });
        },
      },
    },
  });

  const ZKP16Proof = ZkProgram.Proof(zkp16);
  export { ZKP16Proof, ZKP16Input, ZKP16Output, zkp16 }