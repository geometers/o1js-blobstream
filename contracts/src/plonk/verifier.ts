import { G1Affine } from "../ec/index.js";
import { Fp12, FrC } from "../towers/index.js";
import { KZGPairing } from "./mm_loop/multi_miller.js";
import { PlonkVerifierPIOP } from "./piop/piop.js";
import { Sp1PlonkProof } from "./proof.js";
import { Sp1PlonkVk } from "./vk.js";

class Sp1PlonkVerifier {
    piopV: PlonkVerifierPIOP
    kzgP: KZGPairing

    constructor(
        VK: Sp1PlonkVk, 
        g2_lines: string,
        tau_lines: string,
        w27: Fp12,
        w27_square: Fp12
    ) {
        this.piopV = new PlonkVerifierPIOP(VK)
        this.kzgP = new KZGPairing(g2_lines, tau_lines, w27, w27_square)
    }

    verify(proof: Sp1PlonkProof, pi0: FrC, pi1: FrC, shift_power: number, c: Fp12) {
        const [kzg_cm_x, kzg_cm_y, neg_fq_x, neg_fq_y] = this.piopV.piop(proof, pi0, pi1)

        const A = new G1Affine({ x: kzg_cm_x, y: kzg_cm_y });
        const negB = new G1Affine({ x: neg_fq_x, y: neg_fq_y });

        this.kzgP.proveEqual(A, negB, shift_power, c);
    }
}

export { Sp1PlonkVerifier }