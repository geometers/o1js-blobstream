import { FpC, FrC } from "../towers/index.js";
import { powFr } from "../towers/fr.js";
import { Sp1PlonkVk } from "./vk.js";
import { ForeignCurve, Provable, assert } from "o1js";
import { bn254 } from "../ec/g1.js";
import { HashFr } from "./hash_fr.js";
import { Sp1PlonkProof } from "./proof.js";

function batch_eval_lagrange(z: FrC, zh_eval: FrC, domain_inv: FrC, w: FrC, num_of_lagrange_to_eval: number): FrC[] {
    const common = zh_eval.mul(domain_inv).assertCanonical(); 

    if (num_of_lagrange_to_eval == 0) return []

    const den_inv = z.sub(1).assertCanonical();
    let den = Provable.witness(FrC.provable, () =>
        den_inv.inv().assertCanonical()
    ); 
    // den = 1/(z - 1)
    den.mul(den_inv).assertEquals(FrC.from(1n));

    const l0 = common.mul(den).assertCanonical() // 1/n * (z^n - 1)/(z - 1)
    const evals = [l0];

    let wi = FrC.from(w).assertCanonical(); 
    for (let i = 1; i < num_of_lagrange_to_eval; i++) {
        const nom = wi.mul(common).assertCanonical();

        const den_inv = z.sub(wi).assertCanonical();
        let den = Provable.witness(FrC.provable, () =>
            den_inv.inv().assertCanonical()
        ); 
        // den = 1/(z - w^i)
        den.mul(den_inv).assertEquals(FrC.from(1n));

        const li_eval = nom.mul(den).assertCanonical();
        evals.push(li_eval)

        wi = wi.mul(w).assertCanonical()
    }

    return evals
}

// return also z^n because we will need it later
export function evalVanishing(zeta: FrC, vk: Sp1PlonkVk): [FrC, FrC] {
    const zeta_pow_n = powFr(zeta, vk.domain_size)
    return [zeta_pow_n, zeta_pow_n.sub(FrC.from(1n)).assertCanonical()]
}

// assumes pi_length >= 1
export function pi_contribution(pub_inputs: FrC[], zeta: FrC, zh_eval: FrC, domain_inv: FrC, w: FrC): FrC {
    let li_evals = batch_eval_lagrange(zeta, zh_eval, domain_inv, w, pub_inputs.length); 

    let pi_contribution = li_evals[0].mul(pub_inputs[0]).assertCanonical();
    for (let i = 1; i < pub_inputs.length; i++) {
        pi_contribution = pi_contribution.add(li_evals[i].mul(pub_inputs[i]).assertCanonical()).assertCanonical()
    }

    return pi_contribution
}

export function compute_alpha_square_lagrange_0(zh_eval: FrC, zeta: FrC, alpha: FrC, vk: Sp1PlonkVk): FrC {
    const zeta_minus_1 = zeta.sub(FrC.from(1n)).assertCanonical();
    let den = Provable.witness(FrC.provable, () =>
        zeta_minus_1.inv().assertCanonical()
    );

    zeta_minus_1.mul(den).assertEquals(FrC.from(1n));

    den = den.mul(vk.inv_domain_size).assertCanonical(); 

    den = den.mul(alpha).assertCanonical(); 
    den = den.mul(alpha).assertCanonical(); 
    den = den.mul(zh_eval).assertCanonical();

    return den
}

// be careful because solidity returns negative of this point
export function fold_quotient(
    h0_x: FpC, 
    h0_y: FpC,
    h1_x: FpC,
    h1_y: FpC,
    h2_x: FpC,
    h2_y: FpC,

    zeta: FrC,
    zeta_pow_n: FrC,

    zh_eval: FrC
): [FpC, FpC] {
    const h0 = new bn254({x: h0_x, y: h0_y});
    const h1 = new bn254({x: h1_x, y: h1_y});
    const h2 = new bn254({x: h2_x, y: h2_y});

    const zeta_pow_n_plus_2 = zeta_pow_n.mul(zeta).assertCanonical().mul(zeta).assertCanonical();

    let acc = h2.scale(zeta_pow_n_plus_2); 
    acc = acc.add(h1); 
    acc = acc.scale(zeta_pow_n_plus_2); 
    acc = acc.add(h0)
    acc = acc.scale(zh_eval)

    return [acc.x.assertCanonical(), acc.y.assertCanonical()]
}

export function customPiLagrange(zeta: FrC, zh_eval: FrC, x: FpC, y: FpC, vk: Sp1PlonkVk): FrC {
    const hashFr = new HashFr() 

    const h_fr = hashFr.hash(x, y); 

    const den_inv = zeta.sub(vk.omega_pow_i).assertCanonical();
    let den = Provable.witness(FrC.provable, () =>
        den_inv.inv().assertCanonical()
    ); 

    // den = 1/(z - w^i)
    den.mul(den_inv).assertEquals(FrC.from(1n));

    // w^i / n * (z^n - 1)/(z - w^i)
    const li = zh_eval.mul(vk.omega_pow_i_div_n).assertCanonical().mul(den).assertCanonical()
    return li.mul(h_fr).assertCanonical()
}

export function opening_of_linearized_polynomial(proof: Sp1PlonkProof, alpha: FrC, beta: FrC, gamma: FrC, pi: FrC, alpha_2_lagrange_0: FrC): FrC {
    // s1 = (l(ζ)+β*s1(ζ)+γ)
    let s1 = proof.s1_at_zeta.mul(beta).assertCanonical().add(gamma).add(proof.l_at_zeta).assertCanonical(); 

    // s2 = (r(ζ)+β*s2(ζ)+γ)
    let s2 = proof.s2_at_zeta.mul(beta).assertCanonical().add(gamma).add(proof.r_at_zeta).assertCanonical(); 

    // o = (o(ζ)+γ)
    let o = proof.o_at_zeta.add(gamma).assertCanonical(); 

    //  α*Z(μζ)*(l(ζ)+β*s1(ζ)+γ)*(r(ζ)+β*s2(ζ)+γ)*(o(ζ)+γ)
    let acc = alpha.mul(s1).assertCanonical().mul(proof.grand_product_at_omega_zeta).assertCanonical().mul(s2).assertCanonical().mul(o).assertCanonical();

    // - [PI(ζ) - α²*L₁(ζ) + α(l(ζ)+β*s1(ζ)+γ)(r(ζ)+β*s2(ζ)+γ)(o(ζ)+γ)*z(ωζ)]
    acc = acc.add(pi).sub(alpha_2_lagrange_0).neg().assertCanonical(); 
    return acc
}

export function compute_commitment_linearized_polynomial(vk: Sp1PlonkVk, proof: Sp1PlonkProof, alpha: FrC, beta: FrC, gamma: FrC, zeta: FrC, alpha_2_lagrange_0: FrC, fold_quotient_x: FpC, fold_quotient_y: FpC): ForeignCurve {
    // s₁ = α*Z(μζ)(l(ζ)+β*s₁(ζ)+γ)*(r(ζ)+β*s₂(ζ)+γ)*β
    // s₂ = -α*(l(ζ)+β*ζ+γ)*(r(ζ)+β*u*ζ+γ)*(o(ζ)+β*u²*ζ+γ) + α²*L₁(ζ)

    // (l(ζ)+β*s₁(ζ)+γ)
    let p1 = proof.s1_at_zeta.mul(beta).assertCanonical().add(gamma).add(proof.l_at_zeta).assertCanonical(); 

    // (r(ζ)+β*s2(ζ)+γ)
    let p2 = proof.s2_at_zeta.mul(beta).assertCanonical().add(gamma).add(proof.r_at_zeta).assertCanonical(); 

    let s1 = p1.mul(p2).assertCanonical().mul(beta).assertCanonical().mul(alpha).assertCanonical().mul(proof.grand_product_at_omega_zeta).assertCanonical(); 

    // (l(ζ)+β*ζ+γ)
    let r1 = zeta.mul(beta).assertCanonical().add(proof.l_at_zeta).add(gamma).assertCanonical(); 

    // (r(ζ)+β*u*ζ+γ)
    let r2 = beta.mul(vk.coset_shift).assertCanonical().mul(zeta).assertCanonical().add(proof.r_at_zeta).add(gamma).assertCanonical();

    // (o(ζ)+β*u²*ζ+γ)
    let r3 = beta.mul(vk.coset_shift).assertCanonical().mul(vk.coset_shift).assertCanonical().mul(zeta).assertCanonical().add(proof.o_at_zeta).add(gamma).assertCanonical();

    let s2 = alpha.mul(r1).assertCanonical().mul(r2).assertCanonical().mul(r3).neg().add(alpha_2_lagrange_0).assertCanonical(); 

    return compute_commitment_linearized_polynomial_ec(proof, vk, s1, s2, fold_quotient_x, fold_quotient_y)
}

function compute_commitment_linearized_polynomial_ec(proof: Sp1PlonkProof, vk: Sp1PlonkVk, s1: FrC, s2: FrC, fold_quotient_x: FpC, fold_quotient_y: FpC): ForeignCurve {
    const ql = new bn254({x: vk.ql_x, y: vk.ql_y});
    const qr = new bn254({x: vk.qr_x, y: vk.qr_y});
    const qm = new bn254({x: vk.qm_x, y: vk.qm_y});
    const qo = new bn254({x: vk.qo_x, y: vk.qo_y});
    const qk = new bn254({x: vk.qk_x, y: vk.qk_y});

    let linearized_cm = ql.scale(proof.l_at_zeta);
    linearized_cm = linearized_cm.add(qr.scale(proof.r_at_zeta));

    const rl = proof.l_at_zeta.mul(proof.r_at_zeta).assertCanonical(); 
    linearized_cm = linearized_cm.add(qm.scale(rl));

    linearized_cm = linearized_cm.add(qo.scale(proof.o_at_zeta));

    linearized_cm = linearized_cm.add(qk);

    const qcp_0 = new bn254({x: proof.qcp_0_wire_x, y: proof.qcp_0_wire_y});
    linearized_cm = linearized_cm.add(qcp_0.scale(proof.qcp_0_at_zeta));

    const s3 = new bn254({x: vk.qs3_x, y: vk.qs3_y});
    linearized_cm = linearized_cm.add(s3.scale(s1));

    const grand_product = new bn254({x: proof.grand_product_x, y: proof.grand_product_y}); 
    linearized_cm = linearized_cm.add(grand_product.scale(s2));

    const neg_folded_q = new bn254({x: fold_quotient_x, y: fold_quotient_y}).negate();
    linearized_cm = linearized_cm.add(neg_folded_q)

    return linearized_cm
}