import { FrC } from "../towers/index.js";
import { powFr } from "../towers/fr.js";
import { Sp1PlonkVk } from "./vk.js";

export function evalVanishing(zeta: FrC, vk: Sp1PlonkVk): FrC {
    const zeta_pow_n = powFr(zeta, vk.domain_size)
    return zeta_pow_n.sub(FrC.from(1n)).assertCanonical()
}