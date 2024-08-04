import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../../towers/index.js';
import { ZKP17Input, ZKP17Output, ZKP17Proof } from './zkp17.js';
import { G1Affine } from '../../ec/index.js';

class ZKP18Input extends Struct({
}) {}

class ZKP18Output extends Struct({
    gDigest: Field, 
    PI: G1Affine, 
    c: Fp12, 
    f: Fp12, 
}) {}

const zkp18 = ZkProgram({
    name: 'zkp18',
    publicInput: ZKP18Input,
    publicOutput: ZKP18Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP17Proof],
        async method(
            _input: ZKP18Input,
            g: Array<Fp12>,
            proof: Proof<ZKP17Input, ZKP17Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = proof.publicOutput.c.inverse();
            let f = proof.publicOutput.f;
        
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

            return new ZKP18Output({
                gDigest: proof.publicOutput.gDigest,
                PI: proof.publicOutput.PI, 
                c: proof.publicOutput.c, 
                f
            });
        },
      },
    },
  });

  const ZKP18Proof = ZkProgram.Proof(zkp18);
  export { ZKP18Proof, ZKP18Input, ZKP18Output, zkp18 }