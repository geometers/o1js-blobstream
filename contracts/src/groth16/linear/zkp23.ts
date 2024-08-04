import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../../towers/index.js';
import { ZKP22Input, ZKP22Output, ZKP22Proof } from './zkp22.js';
import { G1Affine } from '../../ec/index.js';

class ZKP23Input extends Struct({
  alpha_beta: Fp12
}) {}

class ZKP23Output extends Struct({
    gDigest: Field, 
    PI: G1Affine, 
    c: Fp12, 
    f: Fp12, 
}) {}

const zkp23 = ZkProgram({
    name: 'zkp23',
    publicInput: ZKP23Input,
    publicOutput: ZKP23Output,
    methods: {
      compute: {
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP22Proof, Provable.Array(Fp12, 3), Field],
        async method(
            input: ZKP23Input,
            g: Array<Fp12>,
            proof: Proof<ZKP22Input, ZKP22Output>,
            w27: Array<Fp12>, // TODO: HARDCODE THESE IN THE CIRCUIT
            shift_power: Field,
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = proof.publicOutput.c.inverse();
            let f = proof.publicOutput.f;

            let idx = 0;
        
            for (let i = 61; i < ATE_LOOP_COUNT.length; i++) {
              idx = i - 1;
              f = f.square().mul(g[idx]);
        
              if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(c_inv);
              }
        
              if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(proof.publicOutput.c);
              }
            }
        
            f = f.mul(g[ATE_LOOP_COUNT.length - 1]);
        
            // f = f
            //   .mul(c_inv.frobenius_pow_p())
            //   .mul(proof.publicOutput.c.frobenius_pow_p_squared())
            //   .mul(c_inv.frobenius_pow_p_cubed())
            //   .mul(input.alpha_beta);
        
            // const shift = Provable.switch([shift_power.equals(Field(0)), shift_power.equals(Field(1)), shift_power.equals(Field(2))], Fp12, [w27[0], w27[1], w27[2]]);
            // f = f.mul(shift);
        
            // f.assert_equals(Fp12.one());

            return new ZKP23Output({
                gDigest: proof.publicOutput.gDigest,
                PI: proof.publicOutput.PI, 
                c: proof.publicOutput.c, 
                f
            });
        },
      },
    },
  });

  const ZKP23Proof = ZkProgram.Proof(zkp23);
  export { ZKP23Proof, ZKP23Input, ZKP23Output, zkp23 }