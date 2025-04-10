import { FpC, FrC } from '../../towers/index.js';
import { Sp1PlonkFiatShamir } from '../fiat-shamir/index.js';
import { Sp1PlonkProof } from '../proof.js';
import { Sp1PlonkVk } from '../vk.js';
import {
  compute_alpha_square_lagrange_0,
  compute_commitment_linearized_polynomial,
  customPiLagrange,
  evalVanishing,
  fold_quotient,
  fold_state,
  opening_of_linearized_polynomial,
  pi_contribution,
  preparePairing,
} from './plonk_utils.js';

// expects only two public inputs as in Sp1 Plonk verifier

class PlonkVerifierPIOP {
  VK: Sp1PlonkVk;
  constructor(VK: Sp1PlonkVk) {
    this.VK = VK;
  }

  piop(proof: Sp1PlonkProof, pi0: FrC, pi1: FrC): [FpC, FpC, FpC, FpC] {
    const fs = Sp1PlonkFiatShamir.empty();

    fs.squeezeGamma(proof, pi0, pi1, this.VK);
    fs.squeezeBeta();
    fs.squeezeAlpha(proof);
    fs.squeezeZeta(proof);

    const [zeta_pow_n, zh_eval] = evalVanishing(fs.zeta, this.VK);

    const alpha_2_l0 = compute_alpha_square_lagrange_0(
      zh_eval,
      fs.zeta,
      fs.alpha,
      this.VK
    );

    const [hx, hy] = fold_quotient(
      proof.h0_x,
      proof.h0_y,
      proof.h1_x,
      proof.h1_y,
      proof.h2_x,
      proof.h2_y,
      fs.zeta,
      zeta_pow_n,
      zh_eval
    );

    const pis = pi_contribution(
      [pi0, pi1],
      fs.zeta,
      zh_eval,
      this.VK.inv_domain_size,
      this.VK.omega
    );
    const l_pi_commit = customPiLagrange(
      fs.zeta,
      zh_eval,
      proof.qcp_0_wire_x,
      proof.qcp_0_wire_y,
      this.VK
    );
    const pi = pis.add(l_pi_commit).assertCanonical();

    const linearized_opening = opening_of_linearized_polynomial(
      proof,
      fs.alpha,
      fs.beta,
      fs.gamma,
      pi,
      alpha_2_l0
    );

    const [lcm_x, lcm_y] = compute_commitment_linearized_polynomial(
      this.VK,
      proof,
      fs.alpha,
      fs.beta,
      fs.gamma,
      fs.zeta,
      alpha_2_l0,
      hx,
      hy
    );

    fs.squeezeGammaKzg(proof, this.VK, lcm_x, lcm_y, linearized_opening);

    const [cm_x, cm_y, cm_opening] = fold_state(
      this.VK,
      proof,
      lcm_x,
      lcm_y,
      linearized_opening,
      fs.gamma_kzg
    );

    const random = fs.squeezeRandomForKzg(proof, cm_x, cm_y);

    const [kzg_cm_x, kzg_cm_y, neg_fq_x, neg_fq_y] = preparePairing(
      this.VK,
      proof,
      random,
      cm_x,
      cm_y,
      cm_opening,
      fs.zeta
    );

    return [kzg_cm_x, kzg_cm_y, neg_fq_x, neg_fq_y];
  }
}

export { PlonkVerifierPIOP };
