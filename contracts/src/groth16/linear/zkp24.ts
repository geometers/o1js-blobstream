import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12, Fp2 } from '../../towers/index.js';
import { ZKP23Input, ZKP23Output, ZKP23Proof } from './zkp23.js';
import { G1Affine } from '../../ec/index.js';

class ZKP24Input extends Struct({
  alpha_beta: Fp12
}) {}

class ZKP24Output extends Struct({
    PI: G1Affine, 
}) {}

const zkp24 = ZkProgram({
    name: 'zkp24',
    publicInput: ZKP24Input,
    publicOutput: ZKP24Output,
    methods: {
      compute: {
        privateInputs: [
            Provable.Array(Fp2, 5), 
            Provable.Array(Fp2, 5), 
            Provable.Array(Fp2, 5), 
            Provable.Array(Fp12, ATE_LOOP_COUNT.length), 
            ZKP23Proof, Provable.Array(Fp12, 3), 
            Field
        ],
        async method(
            input: ZKP24Input,
            gamma_1s: Array<Fp2>,
            gamma_2s: Array<Fp2>,
            gamma_3s: Array<Fp2>,
            g: Array<Fp12>,
            proof: Proof<ZKP23Input, ZKP23Output>,
            w27: Array<Fp12>, // TODO: HARDCODE THESE IN THE CIRCUIT
            shift_power: Field,
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = proof.publicOutput.c.inverse();
            let f = proof.publicOutput.f;
        
            f = f
              .mul(c_inv.frobenius_pow_p_with_gammas(gamma_1s))
              .mul(proof.publicOutput.c.frobenius_pow_p_squared_with_gammas(gamma_2s))
              .mul(c_inv.frobenius_pow_p_cubed_with_gammas(gamma_3s))
              .mul(input.alpha_beta);
        
            const shift = Provable.switch([shift_power.equals(Field(0)), shift_power.equals(Field(1)), shift_power.equals(Field(2))], Fp12, [w27[0], w27[1], w27[2]]);
            f = f.mul(shift);
        
            f.assert_equals(Fp12.one());

            return new ZKP24Output({
                PI: proof.publicOutput.PI, 
            });
        },
      },
    },
  });

  const ZKP24Proof = ZkProgram.Proof(zkp24);
  export { ZKP24Proof, ZKP24Input, ZKP24Output, zkp24 }