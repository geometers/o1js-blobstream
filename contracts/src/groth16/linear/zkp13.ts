import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../../towers/index.js';
import { ZKP12Input, ZKP12Output, ZKP12Proof } from './zkp12.js';
import { G1Affine } from '../../ec/index.js';

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
        privateInputs: [Fp12, Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP12Proof],
        async method(
            _input: ZKP13Input,
            c: Fp12, 
            g: Array<Fp12>,
            proof: Proof<ZKP12Input, ZKP12Output>
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = c.inverse();
            let f = c_inv;
        
            let idx = 0;
        
            for (let i = 1; i < 7; i++) {
                idx = i - 1;
                f = f.square().mul(g[idx]);
            
                if (ATE_LOOP_COUNT[i] == 1) {
                    f = f.mul(c_inv);
                }
            
                if (ATE_LOOP_COUNT[i] == -1) {
                    f = f.mul(c);
                }
            }

            return new ZKP13Output({
                gDigest: proof.publicOutput.gDigest,
                PI: proof.publicOutput.PI, 
                c: c, 
                f
            });
        },
      },
    },
  });

  const ZKP13Proof = ZkProgram.Proof(zkp13);
  export { ZKP13Proof, ZKP13Input, ZKP13Output, zkp13 }