import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';
import { ZKP20Input, ZKP20Output, ZKP20Proof } from './zkp20.js';
import { G1Affine } from '../ec/index.js';

class ZKP21Input extends Struct({
}) {}

class ZKP21Output extends Struct({
    gDigest: Field, 
    PI: G1Affine, 
    c: Fp12, 
    f: Fp12, 
}) {}

const zkp21 = ZkProgram({
    name: 'zkp21',
    publicInput: ZKP21Input,
    publicOutput: ZKP21Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP20Proof],
        async method(
            _input: ZKP21Input,
            g: Array<Fp12>,
            proof: Proof<ZKP20Input, ZKP20Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = proof.publicOutput.c.inverse();
            let f = proof.publicOutput.f;
        
            let idx = 0;
        
            for (let i = 49; i < 55; i++) {
              idx = i - 1;
              f = f.square().mul(g[idx]);
        
              if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(c_inv);
              }
        
              if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(proof.publicOutput.c);
              }
            }

            return new ZKP21Output({
                gDigest: proof.publicOutput.gDigest,
                PI: proof.publicOutput.PI, 
                c: proof.publicOutput.c, 
                f
            });
        },
      },
    },
  });

  const ZKP21Proof = ZkProgram.Proof(zkp21);
  export { ZKP21Proof, ZKP21Input, ZKP21Output, zkp21 }