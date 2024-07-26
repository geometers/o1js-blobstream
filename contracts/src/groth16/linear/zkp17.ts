import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../../towers/index.js';
import { ZKP16Input, ZKP16Output, ZKP16Proof } from './zkp16.js';
import { G1Affine } from '../../ec/index.js';

class ZKP17Input extends Struct({
}) {}

class ZKP17Output extends Struct({
    gDigest: Field, 
    PI: G1Affine, 
    c: Fp12, 
    f: Fp12, 
}) {}

const zkp17 = ZkProgram({
    name: 'zkp17',
    publicInput: ZKP17Input,
    publicOutput: ZKP17Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP16Proof],
        async method(
            _input: ZKP17Input,
            g: Array<Fp12>,
            proof: Proof<ZKP16Input, ZKP16Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = proof.publicOutput.c.inverse();
            let f = proof.publicOutput.f;
        
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

            return new ZKP17Output({
                gDigest: proof.publicOutput.gDigest,
                PI: proof.publicOutput.PI, 
                c: proof.publicOutput.c, 
                f
            });
        },
      },
    },
  });

  const ZKP17Proof = ZkProgram.Proof(zkp17);
  export { ZKP17Proof, ZKP17Input, ZKP17Output, zkp17 }