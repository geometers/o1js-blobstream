import { Field } from "o1js";
import { ArrayListHasher, KzgAccumulator, KzgProof, KzgState } from "../../kzg/structs.js";
import { Accumulator } from "../accumulator.js"
import { compute_alpha_square_lagrange_0, compute_commitment_linearized_polynomial_split_0, compute_commitment_linearized_polynomial_split_1, compute_commitment_linearized_polynomial_split_2, customPiLagrange, evalVanishing, fold_quotient, fold_state_0, fold_state_1, fold_state_2, opening_of_linearized_polynomial, pi_contribution, preparePairing_0, preparePairing_1 } from "../piop/plonk_utils.js";
import { VK } from "../vk.js";
import { G1Affine } from "../../ec/index.js";
import { Fp12 } from "../../towers/fp12.js";

class WitnessTracker {
    acc: Accumulator
    kzg: KzgAccumulator
    line_hashes: Array<Field> 

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

    zkp7(): Accumulator {
        let H = this.acc.fs.gammaKzgDigest_part0(this.acc.proof, VK, this.acc.state.lcm_x, this.acc.state.lcm_y, this.acc.state.linearized_opening);
        this.acc.state.H = H;

        return this.acc.deepClone(); 
    }

    zkp8(): Accumulator {
        this.acc.fs.gammaKzgDigest_part1(this.acc.proof, this.acc.state.H);
        this.acc.fs.squeezeGammaKzgFromDigest()

        const [cm_x, cm_y, cm_opening] = fold_state_0(this.acc.proof, this.acc.state.lcm_x, this.acc.state.lcm_y, this.acc.state.linearized_opening, this.acc.fs.gamma_kzg);

        this.acc.state.cm_x = cm_x; 
        this.acc.state.cm_y = cm_y;
        this.acc.state.cm_opening = cm_opening;

        return this.acc.deepClone(); 
    }

    zkp9(): Accumulator {
        const [cm_x, cm_y] = fold_state_1(VK, this.acc.proof, this.acc.state.cm_x, this.acc.state.cm_y, this.acc.fs.gamma_kzg);

        this.acc.state.cm_x = cm_x; 
        this.acc.state.cm_y = cm_y;

        return this.acc.deepClone(); 
    }

    zkp10(): Accumulator {
        const [cm_x, cm_y] = fold_state_2(VK, this.acc.proof, this.acc.state.cm_x, this.acc.state.cm_y, this.acc.fs.gamma_kzg);
        const kzg_random = this.acc.fs.squeezeRandomForKzg(this.acc.proof, cm_x, cm_y)

        this.acc.state.cm_x = cm_x; 
        this.acc.state.cm_y = cm_y;
        this.acc.state.kzg_random = kzg_random;

        return this.acc.deepClone(); 
    }

    zkp11(): Accumulator {
        const [kzg_cm_x, kzg_cm_y, neg_fq_x, neg_fq_y] = preparePairing_0(
            VK, 
            this.acc.proof, 
            this.acc.state.kzg_random, 
            this.acc.state.cm_x, 
            this.acc.state.cm_y, 
            this.acc.state.cm_opening
        )

        this.acc.state.kzg_cm_x = kzg_cm_x; 
        this.acc.state.kzg_cm_y = kzg_cm_y; 
        this.acc.state.neg_fq_x = neg_fq_x; 
        this.acc.state.neg_fq_y = neg_fq_y;

        return this.acc.deepClone(); 
    }

    zkp12(shift_power: Field, c: Fp12): [KzgAccumulator, Array<Field>] {
        const [kzg_cm_x, kzg_cm_y] = preparePairing_1(
            VK, 
            this.acc.proof, 
            this.acc.state.kzg_random, 
            this.acc.state.kzg_cm_x, 
            this.acc.state.kzg_cm_y, 
            this.acc.fs.zeta
        )

        this.acc.state.kzg_cm_x = kzg_cm_x; 
        this.acc.state.kzg_cm_y = kzg_cm_y;

        const A = new G1Affine({ x: kzg_cm_x, y: kzg_cm_y });
        const negB = new G1Affine({ x: this.acc.state.neg_fq_x, y: this.acc.state.neg_fq_y });

        let kzgProof = new KzgProof({
            A, 
            negB, 
            shift_power, 
            c
        })

        let kzgState = new KzgState({
            f: c.inverse(), 
            lines_hashes_digest: ArrayListHasher.empty()
        })

        let kzgAccumulator = new KzgAccumulator({
            proof: kzgProof, 
            state: kzgState
        });

        this.line_hashes = new Array(ArrayListHasher.n).fill(Field(0n))
        this.kzg = kzgAccumulator.deepClone();
        return [this.kzg.deepClone(), [...this.line_hashes]]; 
    }
}

export { WitnessTracker }