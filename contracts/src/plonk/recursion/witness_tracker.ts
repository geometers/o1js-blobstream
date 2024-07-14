import { Accumulator } from "../accumulator.js"
import { compute_alpha_square_lagrange_0, compute_commitment_linearized_polynomial_split_0, compute_commitment_linearized_polynomial_split_1, compute_commitment_linearized_polynomial_split_2, customPiLagrange, evalVanishing, fold_quotient, opening_of_linearized_polynomial, pi_contribution } from "../piop/plonk_utils.js";
import { VK } from "../vk.js";

class WitnessTracker {
    acc: Accumulator 

    constructor(acc: Accumulator) {
        this.acc = acc.deepClone(); 
    }

    zkp0(): Accumulator { 
        this.acc.fs.squeezeGamma(this.acc.proof, this.acc.state.pi0, this.acc.state.pi1, VK)
        this.acc.fs.squeezeBeta()

        return this.acc.deepClone()
    }

    zkp1(): Accumulator {
        this.acc.fs.squeezeAlpha(this.acc.proof)
        this.acc.fs.squeezeZeta(this.acc.proof)

        const [zeta_pow_n, zh_eval] = evalVanishing(this.acc.fs.zeta, VK)
        const alpha_2_l0 = compute_alpha_square_lagrange_0(zh_eval, this.acc.fs.zeta, this.acc.fs.alpha, VK); 

        this.acc.state.zeta_pow_n = zeta_pow_n; 
        this.acc.state.zh_eval = zh_eval; 
        this.acc.state.alpha_2_l0 = alpha_2_l0;

        return this.acc.deepClone()
    }

    zkp2(): Accumulator {
        const [hx, hy] = fold_quotient(
            this.acc.proof.h0_x, 
            this.acc.proof.h0_y, 
            this.acc.proof.h1_x, 
            this.acc.proof.h1_y, 
            this.acc.proof.h2_x, 
            this.acc.proof.h2_y, 
            this.acc.fs.zeta, 
            this.acc.state.zeta_pow_n, 
            this.acc.state.zh_eval
        )

        this.acc.state.hx = hx; 
        this.acc.state.hy = hy; 

        return this.acc.deepClone()
    }

    zkp3(): Accumulator {
        const pis = pi_contribution([this.acc.state.pi0, this.acc.state.pi1], this.acc.fs.zeta, this.acc.state.zh_eval, VK.inv_domain_size, VK.omega)

        // ~32k
        const l_pi_commit = customPiLagrange(this.acc.fs.zeta, this.acc.state.zh_eval, this.acc.proof.qcp_0_wire_x, this.acc.proof.qcp_0_wire_y, VK)
        const pi = pis.add(l_pi_commit).assertCanonical()

        // very cheap
        const linearized_opening = opening_of_linearized_polynomial(this.acc.proof, this.acc.fs.alpha, this.acc.fs.beta, this.acc.fs.gamma, pi, this.acc.state.alpha_2_l0)

        this.acc.state.pi = pi; 
        this.acc.state.linearized_opening = linearized_opening; 

        return this.acc.deepClone()
    }

    zkp4(): Accumulator {
        const [lcm_x, lcm_y] = compute_commitment_linearized_polynomial_split_0(this.acc.proof, VK);
        
        this.acc.state.lcm_x = lcm_x; 
        this.acc.state.lcm_y = lcm_y;

        return this.acc.deepClone()
    }

    zkp5(): Accumulator {
        const [lcm_x, lcm_y] = compute_commitment_linearized_polynomial_split_1(
            this.acc.state.lcm_x,
            this.acc.state.lcm_y, 
            this.acc.proof, 
            VK, 
            this.acc.fs.beta, 
            this.acc.fs.gamma, 
            this.acc.fs.alpha
        );

        this.acc.state.lcm_x = lcm_x;
        this.acc.state.lcm_y = lcm_y;

        return this.acc.deepClone()
    }

    zkp6(): Accumulator {
        const [lcm_x, lcm_y] = compute_commitment_linearized_polynomial_split_2(
            this.acc.state.lcm_x,
            this.acc.state.lcm_y, 
            this.acc.proof, 
            VK, 
            this.acc.fs.beta, 
            this.acc.fs.gamma, 
            this.acc.fs.alpha,
            this.acc.fs.zeta, 
            this.acc.state.alpha_2_l0, 
            this.acc.state.hx, 
            this.acc.state.hy
        );

        this.acc.state.lcm_x = lcm_x;
        this.acc.state.lcm_y = lcm_y;

        return this.acc.deepClone(); 
    }
}

export { WitnessTracker }