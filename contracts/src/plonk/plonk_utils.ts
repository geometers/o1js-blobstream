import { FpC, FrC } from "../towers/index.js";
import { powFr } from "../towers/fr.js";
import { Sp1PlonkVk } from "./vk.js";
import { ForeignCurve, Provable, assert } from "o1js";
import { bn254 } from "../ec/g1.js";

// return also z^n because we will need it later
export function evalVanishing(zeta: FrC, vk: Sp1PlonkVk): [FrC, FrC] {
    const zeta_pow_n = powFr(zeta, vk.domain_size)
    return [zeta_pow_n, zeta_pow_n.sub(FrC.from(1n)).assertCanonical()]
}

export function compute_alpha_square_lagrange_0(zh_eval: FrC, zeta: FrC, alpha: FrC, vk: Sp1PlonkVk): FrC {
    const zeta_minus_1_inv = zeta.sub(FrC.from(1n)).assertCanonical();
    let den = Provable.witness(FrC.provable, () =>
        zeta_minus_1_inv.inv().assertCanonical()
    );

    zeta_minus_1_inv.mul(den).assertEquals(FrC.from(1n));

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