import {
    ZkProgram,
    Field,
    Proof,
    Provable,
    Struct,
    Poseidon
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';
import { ZKP16Input, ZKP16Output, ZKP16Proof } from './zkp16.js';
import { G1Affine } from '../ec/index.js';

class ZKP17Input extends Struct({
  alpha_beta: Fp12
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
        privateInputs: [Provable.Array(Fp12, ATE_LOOP_COUNT.length), ZKP16Proof, Provable.Array(Fp12, 3), Field],
        async method(
            input: ZKP17Input,
            g: Array<Fp12>,
            proof: Proof<ZKP16Input, ZKP16Output>,
            w27: Array<Fp12>, // TODO: HARDCODE THESE IN THE CIRCUIT
            shift_power: Field,
        ) {
            proof.verify();
            const gDigestOk = Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g);
            gDigestOk.assertEquals(proof.publicOutput.gDigest);

            const c_inv = proof.publicOutput.c.inverse();
            let f = c_inv;
        
            // idx += 1;
            f = f.mul(g[ATE_LOOP_COUNT.length - 1]);
            // idx += 1;
            // f = f.mul(g[idx]);
        
            f = f
              .mul(c_inv.frobenius_pow_p())
              .mul(proof.publicOutput.c.frobenius_pow_p_squared())
              .mul(c_inv.frobenius_pow_p_cubed())
              .mul(input.alpha_beta);
        
            const shift = Provable.switch([shift_power.equals(Field(0)), shift_power.equals(Field(1)), shift_power.equals(Field(2))], Fp12, [w27[0], w27[1], w27[2]]);
            f = f.mul(shift);
        
            f.assert_equals(Fp12.one());

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