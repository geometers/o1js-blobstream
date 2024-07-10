import { FpC, FrC } from "../towers/index.js";
import { powFr } from "../towers/fr.js";
import { Sp1PlonkVk } from "./vk.js";
import { ForeignCurve, Provable, assert } from "o1js";
import { bn254 } from "../ec/g1.js";

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