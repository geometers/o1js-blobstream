import {
    ZkProgram,
    Field,
    DynamicProof,
    Proof,
    VerificationKey,
    Undefined,
    verify,
    Provable,
    Struct,
    Poseidon,
    CanonicalForeignField
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12, Fp2, FpC } from '../../towers/index.js';
import { G1Affine, G2Affine } from '../../ec/index.js';
import { AffineCache } from '../../lines/precompute.js';
import { G2Line } from '../../lines/index.js';
import { Groth16Data } from './data.js';
import { Fp } from '../../towers/fp.js';
import fs from "fs";
import { get_alpha_beta, make_w27, make_w27_sq } from './helpers.js';

const zkp18 = ZkProgram({
    name: 'zkp18',
    publicInput: Field,
    publicOutput: Field,
    methods: {
      compute: {
        privateInputs: [Groth16Data],
        async method(
            input: Field,
            wIn: Groth16Data, 
        ) {
            const inDigest = Poseidon.hashPacked(Groth16Data, wIn);
            inDigest.assertEquals(input);

            const g = wIn.g;
            const c = wIn.c;
            const c_inv = c.inverse();
            let f = wIn.f;
        
            let idx = 0;
        
            for (let i = ATE_LOOP_COUNT.length - 2; i < ATE_LOOP_COUNT.length; i++) {
              idx = i - 1;
              f = f.square().mul(g[idx]);
        
              if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(c_inv);
              }
        
              if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(c);
              }
            }

            idx += 1;
            f = f.mul(g[idx]);

            let gamma_1s_input = fs.readFileSync('./src/towers/gamma_1s.json', 'utf8');
            let parsed_gamma_1s: any[] = JSON.parse(gamma_1s_input);
            let gamma_1s = parsed_gamma_1s.map(
              (g: any): Fp2 => Fp2.loadFromJson(g)
            );

            let gamma_2s_input = fs.readFileSync('./src/towers/gamma_2s.json', 'utf8');
            let parsed_gamma_2s: any[] = JSON.parse(gamma_2s_input);
            let gamma_2s = parsed_gamma_2s.map(
              (g: any): Fp2 => Fp2.loadFromJson(g)
            );

            let gamma_3s_input = fs.readFileSync('./src/towers/gamma_3s.json', 'utf8');
            let parsed_gamma_3s: any[] = JSON.parse(gamma_3s_input);
            let gamma_3s = parsed_gamma_3s.map(
              (g: any): Fp2 => Fp2.loadFromJson(g)
            );

            f = f
            .mul(c_inv.frobenius_pow_p_with_gammas(gamma_1s))
            .mul(wIn.c.frobenius_pow_p_squared_with_gammas(gamma_2s))
            .mul(c_inv.frobenius_pow_p_cubed_with_gammas(gamma_3s))
            .mul(get_alpha_beta());
      
            const shift_power = wIn.shift;
            const shift = Provable.switch([shift_power.equals(Field(0)), shift_power.equals(Field(1)), shift_power.equals(Field(2))], Fp12, [Fp12.one(), make_w27(), make_w27_sq()]);
            f = f.mul(shift);
        
            f.assert_equals(Fp12.one());
         
            const output =  new Groth16Data({
                negA: wIn.negA, 
                B: wIn.B, 
                C: wIn.C, 
                PI: wIn.PI,
                g,
                T: wIn.T,
                c: wIn.c, 
                f, 
                shift: wIn.shift
            });

            return Poseidon.hashPacked(Groth16Data, output);
        },
      },
    },
  });



const ZKP18Proof = ZkProgram.Proof(zkp18);
export { ZKP18Proof, zkp18 }