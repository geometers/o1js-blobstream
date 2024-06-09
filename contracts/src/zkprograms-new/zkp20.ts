import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';
import { ZKP19Input, ZKP19Output, ZKP19Proof } from './zkp19.js';
import { G1Affine } from '../ec/index.js';

class ZKP20Input extends Struct({
}) {}

class ZKP20Output extends Struct({
    gDigest: Field, 
    PI: G1Affine, 
    c: Fp12, 
    f: Fp12, 
}) {}

const zkp20 = ZkProgram({
    name: 'zkp20',
    publicInput: ZKP20Input,
    publicOutput: ZKP20Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP19Proof],
        async method(
            _input: ZKP20Input,
            g: Array<Fp12>,
            proof: Proof<ZKP19Input, ZKP19Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = proof.publicOutput.c.inverse();
            let f = proof.publicOutput.f;
        
            let idx = 0;
        
            for (let i = 43; i < 49; i++) {
              idx = i - 1;
              f = f.square().mul(g[idx]);
        
              if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(c_inv);
              }
        
              if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(proof.publicOutput.c);
              }
            }

            return new ZKP20Output({
                gDigest: proof.publicOutput.gDigest,
                PI: proof.publicOutput.PI, 
                c: proof.publicOutput.c, 
                f
            });
        },
      },
    },
  });

  const ZKP20Proof = ZkProgram.Proof(zkp20);
  export { ZKP20Proof, ZKP20Input, ZKP20Output, zkp20 }