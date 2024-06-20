import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';
import { ZKP18Input, ZKP18Output, ZKP18Proof } from './zkp18.js';
import { G1Affine } from '../ec/index.js';

class ZKP19Input extends Struct({
}) {}

class ZKP19Output extends Struct({
    gDigest: Field, 
    PI: G1Affine, 
    c: Fp12, 
    f: Fp12, 
}) {}

const zkp19 = ZkProgram({
    name: 'zkp19',
    publicInput: ZKP19Input,
    publicOutput: ZKP19Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP18Proof],
        async method(
            _input: ZKP19Input,
            g: Array<Fp12>,
            proof: Proof<ZKP18Input, ZKP18Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = proof.publicOutput.c.inverse();
            let f = proof.publicOutput.f;
        
            let idx = 0;
        
            for (let i = 37; i < 43; i++) {
              idx = i - 1;
              f = f.square().mul(g[idx]);
        
              if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(c_inv);
              }
        
              if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(proof.publicOutput.c);
              }
            }

            return new ZKP19Output({
                gDigest: proof.publicOutput.gDigest,
                PI: proof.publicOutput.PI, 
                c: proof.publicOutput.c, 
                f
            });
        },
      },
    },
  });

  const ZKP19Proof = ZkProgram.Proof(zkp19);
  export { ZKP19Proof, ZKP19Input, ZKP19Output, zkp19 }