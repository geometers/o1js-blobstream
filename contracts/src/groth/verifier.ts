import { Field, Provable } from "o1js";
import { G2Line } from "../lines/index.js";
import { ATE_LOOP_COUNT, Fp12 } from "../towers/index.js";
import { LineAccumulator } from "./accumulate_lines.js";
import { GrothVk } from "./vk.js";
import { Proof } from "./proof.js";
import { AuXWitness } from "../aux_witness.js";

class Groth16Verifier {
    vk: GrothVk;
    
    constructor(
        path_to_vk: string
    ) {
        this.vk = GrothVk.parse(path_to_vk);
    }

    multiMillerLoop(
        proof: Proof,
    ) {
        let g = LineAccumulator.accumulate(
            proof.b_lines,
            this.vk.gamma_lines,
            this.vk.delta_lines,
            proof.B,
            proof.negA,
            proof.PI,
            proof.C
        );

        let mlo = Fp12.one();
        let mlo_idx = 0; 
        for (let i = 1; i < ATE_LOOP_COUNT.length; i++) {
                mlo_idx = i - 1;
                mlo = mlo.square().mul(g[mlo_idx]);
        }

        mlo_idx += 1;
        mlo = mlo.mul(g[mlo_idx]);
        mlo = mlo.mul(this.vk.alpha_beta)

        return mlo
    }

    verify(
        proof: Proof,
        aux_witness: AuXWitness,
    ) {
        let g = LineAccumulator.accumulate(
            proof.b_lines,
            this.vk.gamma_lines,
            this.vk.delta_lines,
            proof.B,
            proof.negA,
            proof.PI,
            proof.C
        );

        const { c, shift_power } = aux_witness; 
        const c_inv = c.inverse();
        let f = c_inv;
      
        let idx = 0;
      
        for (let i = 1; i < ATE_LOOP_COUNT.length; i++) {
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
      
        f = f
            .mul(c_inv.frobenius_pow_p())
            .mul(c.frobenius_pow_p_squared())
            .mul(c_inv.frobenius_pow_p_cubed())
            .mul(this.vk.alpha_beta);
      
        const shift = Provable.switch([shift_power.equals(Field(0)), shift_power.equals(Field(1)), shift_power.equals(Field(2))], Fp12, [Fp12.one(), this.vk.w27, this.vk.w27_square]);
        f = f.mul(shift);
      
        f.assert_equals(Fp12.one());
    }
}

export { Groth16Verifier }