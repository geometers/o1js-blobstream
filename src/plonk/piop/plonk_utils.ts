import { FpC, FrC } from '../../towers/index.js';
import { powFr } from '../../towers/fr.js';
import { Sp1PlonkVk } from '../vk.js';
import { ForeignCurve, Provable, assert } from 'o1js';
import { bn254 } from '../../ec/g1.js';
import { HashFr } from './hash_fr.js';
import { Sp1PlonkProof } from '../proof.js';

function batch_eval_lagrange(
  z: FrC,
  zh_eval: FrC,
  domain_inv: FrC,
  w: FrC,
  num_of_lagrange_to_eval: number
): FrC[] {
  const common = zh_eval.mul(domain_inv).assertCanonical();

  if (num_of_lagrange_to_eval == 0) return [];

  const den_inv = z.sub(1).assertCanonical();
  let den = Provable.witness(FrC.provable, () =>
    den_inv.inv().assertCanonical()
  );
  // den = 1/(z - 1)
  den.mul(den_inv).assertEquals(FrC.from(1n));

  const l0 = common.mul(den).assertCanonical(); // 1/n * (z^n - 1)/(z - 1)
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
    evals.push(li_eval);

    wi = wi.mul(w).assertCanonical();
  }

  return evals;
}

// return also z^n because we will need it later
export function evalVanishing(zeta: FrC, vk: Sp1PlonkVk): [FrC, FrC] {
  const zeta_pow_n = powFr(zeta, vk.domain_size);
  return [zeta_pow_n, zeta_pow_n.sub(FrC.from(1n)).assertCanonical()];
}

// assumes pi_length >= 1
export function pi_contribution(
  pub_inputs: FrC[],
  zeta: FrC,
  zh_eval: FrC,
  domain_inv: FrC,
  w: FrC
): FrC {
  let li_evals = batch_eval_lagrange(
    zeta,
    zh_eval,
    domain_inv,
    w,
    pub_inputs.length
  );

  let pi_contribution = li_evals[0].mul(pub_inputs[0]).assertCanonical();
  for (let i = 1; i < pub_inputs.length; i++) {
    pi_contribution = pi_contribution
      .add(li_evals[i].mul(pub_inputs[i]).assertCanonical())
      .assertCanonical();
  }

  return pi_contribution;
}

export function compute_alpha_square_lagrange_0(
  zh_eval: FrC,
  zeta: FrC,
  alpha: FrC,
  vk: Sp1PlonkVk
): FrC {
  const zeta_minus_1 = zeta.sub(FrC.from(1n)).assertCanonical();
  let den = Provable.witness(FrC.provable, () =>
    zeta_minus_1.inv().assertCanonical()
  );

  zeta_minus_1.mul(den).assertEquals(FrC.from(1n));

  den = den.mul(vk.inv_domain_size).assertCanonical();

  den = den.mul(alpha).assertCanonical();
  den = den.mul(alpha).assertCanonical();
  den = den.mul(zh_eval).assertCanonical();

  return den;
}

// be careful because solidity returns negative of this point
// This function is used as a part of zkp2,
// which is more than 2^16 constraints in o1js v2.2.0
// would be better to split it into 2 parts
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
  const h0 = new bn254({ x: h0_x, y: h0_y });
  const h1 = new bn254({ x: h1_x, y: h1_y });
  const h2 = new bn254({ x: h2_x, y: h2_y });

  const zeta_pow_n_plus_2 = zeta_pow_n
    .mul(zeta)
    .assertCanonical()
    .mul(zeta)
    .assertCanonical();

  let acc = h2.scale(zeta_pow_n_plus_2);
  acc = acc.add(h1);
  acc = acc.scale(zeta_pow_n_plus_2);
  acc = acc.add(h0);
  acc = acc.scale(zh_eval);

  return [acc.x.assertCanonical(), acc.y.assertCanonical()];
}

export function fold_quotient_split_0(
  h0_x: FpC,
  h0_y: FpC,
  h1_x: FpC,
  h1_y: FpC,
  h2_x: FpC,
  h2_y: FpC,

  zeta: FrC,
  zeta_pow_n: FrC
): [FpC, FpC] {
  const h0 = new bn254({ x: h0_x, y: h0_y });
  const h1 = new bn254({ x: h1_x, y: h1_y });
  const h2 = new bn254({ x: h2_x, y: h2_y });

  const zeta_pow_n_plus_2 = zeta_pow_n
    .mul(zeta)
    .assertCanonical()
    .mul(zeta)
    .assertCanonical();

  let acc = h2.scale(zeta_pow_n_plus_2);
  acc = acc.add(h1);
  acc = acc.scale(zeta_pow_n_plus_2);
  acc = acc.add(h0);

  return [acc.x.assertCanonical(), acc.y.assertCanonical()];
}

export function fold_quotient_split_1(
  fold_quotient_x: FpC,
  fold_quotient_y: FpC,
  zh_eval: FrC
): [FpC, FpC] {
  let acc = new bn254({ x: fold_quotient_x, y: fold_quotient_y });
  acc = acc.scale(zh_eval);

  return [acc.x.assertCanonical(), acc.y.assertCanonical()];
}

export function customPiLagrange(
  zeta: FrC,
  zh_eval: FrC,
  x: FpC,
  y: FpC,
  vk: Sp1PlonkVk
): FrC {
  const hashFr = new HashFr();

  const h_fr = hashFr.hash(x, y);

  const den_inv = zeta.sub(vk.omega_pow_i).assertCanonical();
  let den = Provable.witness(FrC.provable, () =>
    den_inv.inv().assertCanonical()
  );

  // den = 1/(z - w^i)
  den.mul(den_inv).assertEquals(FrC.from(1n));

  // w^i / n * (z^n - 1)/(z - w^i)
  const li = zh_eval
    .mul(vk.omega_pow_i_div_n)
    .assertCanonical()
    .mul(den)
    .assertCanonical();
  return li.mul(h_fr).assertCanonical();
}

export function opening_of_linearized_polynomial(
  proof: Sp1PlonkProof,
  alpha: FrC,
  beta: FrC,
  gamma: FrC,
  pi: FrC,
  alpha_2_lagrange_0: FrC
): FrC {
  // s1 = (l(ζ)+β*s1(ζ)+γ)
  let s1 = proof.s1_at_zeta
    .mul(beta)
    .assertCanonical()
    .add(gamma)
    .add(proof.l_at_zeta)
    .assertCanonical();

  // s2 = (r(ζ)+β*s2(ζ)+γ)
  let s2 = proof.s2_at_zeta
    .mul(beta)
    .assertCanonical()
    .add(gamma)
    .add(proof.r_at_zeta)
    .assertCanonical();

  // o = (o(ζ)+γ)
  let o = proof.o_at_zeta.add(gamma).assertCanonical();

  //  α*Z(μζ)*(l(ζ)+β*s1(ζ)+γ)*(r(ζ)+β*s2(ζ)+γ)*(o(ζ)+γ)
  let acc = alpha
    .mul(s1)
    .assertCanonical()
    .mul(proof.grand_product_at_omega_zeta)
    .assertCanonical()
    .mul(s2)
    .assertCanonical()
    .mul(o)
    .assertCanonical();

  // - [PI(ζ) - α²*L₁(ζ) + α(l(ζ)+β*s1(ζ)+γ)(r(ζ)+β*s2(ζ)+γ)(o(ζ)+γ)*z(ωζ)]
  acc = acc.add(pi).sub(alpha_2_lagrange_0).neg().assertCanonical();
  return acc;
}

export function compute_commitment_linearized_polynomial(
  vk: Sp1PlonkVk,
  proof: Sp1PlonkProof,
  alpha: FrC,
  beta: FrC,
  gamma: FrC,
  zeta: FrC,
  alpha_2_lagrange_0: FrC,
  fold_quotient_x: FpC,
  fold_quotient_y: FpC
): [FpC, FpC] {
  // s₁ = α*Z(μζ)(l(ζ)+β*s₁(ζ)+γ)*(r(ζ)+β*s₂(ζ)+γ)*β
  // s₂ = -α*(l(ζ)+β*ζ+γ)*(r(ζ)+β*u*ζ+γ)*(o(ζ)+β*u²*ζ+γ) + α²*L₁(ζ)

  // (l(ζ)+β*s₁(ζ)+γ)
  let p1 = proof.s1_at_zeta
    .mul(beta)
    .assertCanonical()
    .add(gamma)
    .add(proof.l_at_zeta)
    .assertCanonical();

  // (r(ζ)+β*s2(ζ)+γ)
  let p2 = proof.s2_at_zeta
    .mul(beta)
    .assertCanonical()
    .add(gamma)
    .add(proof.r_at_zeta)
    .assertCanonical();

  let s1 = p1
    .mul(p2)
    .assertCanonical()
    .mul(beta)
    .assertCanonical()
    .mul(alpha)
    .assertCanonical()
    .mul(proof.grand_product_at_omega_zeta)
    .assertCanonical();

  // (l(ζ)+β*ζ+γ)
  let r1 = zeta
    .mul(beta)
    .assertCanonical()
    .add(proof.l_at_zeta)
    .add(gamma)
    .assertCanonical();

  // (r(ζ)+β*u*ζ+γ)
  let r2 = beta
    .mul(vk.coset_shift)
    .assertCanonical()
    .mul(zeta)
    .assertCanonical()
    .add(proof.r_at_zeta)
    .add(gamma)
    .assertCanonical();

  // (o(ζ)+β*u²*ζ+γ)
  let r3 = beta
    .mul(vk.coset_shift)
    .assertCanonical()
    .mul(vk.coset_shift)
    .assertCanonical()
    .mul(zeta)
    .assertCanonical()
    .add(proof.o_at_zeta)
    .add(gamma)
    .assertCanonical();

  let s2 = alpha
    .mul(r1)
    .assertCanonical()
    .mul(r2)
    .assertCanonical()
    .mul(r3)
    .neg()
    .add(alpha_2_lagrange_0)
    .assertCanonical();

  return compute_commitment_linearized_polynomial_ec(
    proof,
    vk,
    s1,
    s2,
    fold_quotient_x,
    fold_quotient_y
  );
}

function compute_commitment_linearized_polynomial_ec(
  proof: Sp1PlonkProof,
  vk: Sp1PlonkVk,
  s1: FrC,
  s2: FrC,
  fold_quotient_x: FpC,
  fold_quotient_y: FpC
): [FpC, FpC] {
  const ql = new bn254({ x: vk.ql_x, y: vk.ql_y });
  const qr = new bn254({ x: vk.qr_x, y: vk.qr_y });
  const qm = new bn254({ x: vk.qm_x, y: vk.qm_y });
  const qo = new bn254({ x: vk.qo_x, y: vk.qo_y });
  const qk = new bn254({ x: vk.qk_x, y: vk.qk_y });

  let linearized_cm = ql.scale(proof.l_at_zeta);
  linearized_cm = linearized_cm.add(qr.scale(proof.r_at_zeta));

  const rl = proof.l_at_zeta.mul(proof.r_at_zeta).assertCanonical();
  linearized_cm = linearized_cm.add(qm.scale(rl));

  linearized_cm = linearized_cm.add(qo.scale(proof.o_at_zeta));

  linearized_cm = linearized_cm.add(qk);

  const qcp_0 = new bn254({ x: proof.qcp_0_wire_x, y: proof.qcp_0_wire_y });
  linearized_cm = linearized_cm.add(qcp_0.scale(proof.qcp_0_at_zeta));

  const s3 = new bn254({ x: vk.qs3_x, y: vk.qs3_y });
  linearized_cm = linearized_cm.add(s3.scale(s1));

  const grand_product = new bn254({
    x: proof.grand_product_x,
    y: proof.grand_product_y,
  });
  linearized_cm = linearized_cm.add(grand_product.scale(s2));

  const neg_folded_q = new bn254({
    x: fold_quotient_x,
    y: fold_quotient_y,
  }).negate();
  linearized_cm = linearized_cm.add(neg_folded_q);

  return [linearized_cm.x.assertCanonical(), linearized_cm.y.assertCanonical()];
}

// NOW split compute_commitment_linearized_polynomial_ec

// 56296 constraints
export function compute_commitment_linearized_polynomial_split_0(
  proof: Sp1PlonkProof,
  vk: Sp1PlonkVk
): [FpC, FpC] {
  const ql = new bn254({ x: vk.ql_x, y: vk.ql_y });
  const qr = new bn254({ x: vk.qr_x, y: vk.qr_y });
  const qm = new bn254({ x: vk.qm_x, y: vk.qm_y });

  let linearized_cm = ql.scale(proof.l_at_zeta);
  linearized_cm = linearized_cm.add(qr.scale(proof.r_at_zeta));

  const rl = proof.l_at_zeta.mul(proof.r_at_zeta).assertCanonical();
  linearized_cm = linearized_cm.add(qm.scale(rl));

  return [linearized_cm.x.assertCanonical(), linearized_cm.y.assertCanonical()];
}

// 58489 constraints
export function compute_commitment_linearized_polynomial_split_1(
  lcm_x: FpC,
  lcm_y: FpC,
  proof: Sp1PlonkProof,
  vk: Sp1PlonkVk,
  beta: FrC,
  gamma: FrC,
  alpha: FrC
): [FpC, FpC] {
  let linearized_cm = new bn254({ x: lcm_x, y: lcm_y });
  const qo = new bn254({ x: vk.qo_x, y: vk.qo_y });
  const qk = new bn254({ x: vk.qk_x, y: vk.qk_y });

  linearized_cm = linearized_cm.add(qo.scale(proof.o_at_zeta));
  linearized_cm = linearized_cm.add(qk);

  const qcp_0 = new bn254({ x: proof.qcp_0_wire_x, y: proof.qcp_0_wire_y });
  linearized_cm = linearized_cm.add(qcp_0.scale(proof.qcp_0_at_zeta));

  // s₁ = α*Z(μζ)(l(ζ)+β*s₁(ζ)+γ)*(r(ζ)+β*s₂(ζ)+γ)*β
  // (l(ζ)+β*s₁(ζ)+γ)
  let p1 = proof.s1_at_zeta
    .mul(beta)
    .assertCanonical()
    .add(gamma)
    .add(proof.l_at_zeta)
    .assertCanonical();
  // (r(ζ)+β*s2(ζ)+γ)
  let p2 = proof.s2_at_zeta
    .mul(beta)
    .assertCanonical()
    .add(gamma)
    .add(proof.r_at_zeta)
    .assertCanonical();
  let s1 = p1
    .mul(p2)
    .assertCanonical()
    .mul(beta)
    .assertCanonical()
    .mul(alpha)
    .assertCanonical()
    .mul(proof.grand_product_at_omega_zeta)
    .assertCanonical();

  const s3 = new bn254({ x: vk.qs3_x, y: vk.qs3_y });
  linearized_cm = linearized_cm.add(s3.scale(s1));

  return [linearized_cm.x.assertCanonical(), linearized_cm.y.assertCanonical()];
}

// 21285 constraints
export function compute_commitment_linearized_polynomial_split_2(
  lcm_x: FpC,
  lcm_y: FpC,
  proof: Sp1PlonkProof,
  vk: Sp1PlonkVk,
  beta: FrC,
  gamma: FrC,
  alpha: FrC,
  zeta: FrC,
  alpha_2_lagrange_0: FrC,
  fold_quotient_x: FpC,
  fold_quotient_y: FpC
): [FpC, FpC] {
  let linearized_cm = new bn254({ x: lcm_x, y: lcm_y });

  // s₁ = α*Z(μζ)(l(ζ)+β*s₁(ζ)+γ)*(r(ζ)+β*s₂(ζ)+γ)*β
  // (l(ζ)+β*ζ+γ)
  let r1 = zeta
    .mul(beta)
    .assertCanonical()
    .add(proof.l_at_zeta)
    .add(gamma)
    .assertCanonical();
  // (r(ζ)+β*u*ζ+γ)
  let r2 = beta
    .mul(vk.coset_shift)
    .assertCanonical()
    .mul(zeta)
    .assertCanonical()
    .add(proof.r_at_zeta)
    .add(gamma)
    .assertCanonical();
  // (o(ζ)+β*u²*ζ+γ)
  let r3 = beta
    .mul(vk.coset_shift)
    .assertCanonical()
    .mul(vk.coset_shift)
    .assertCanonical()
    .mul(zeta)
    .assertCanonical()
    .add(proof.o_at_zeta)
    .add(gamma)
    .assertCanonical();
  let s2 = alpha
    .mul(r1)
    .assertCanonical()
    .mul(r2)
    .assertCanonical()
    .mul(r3)
    .neg()
    .add(alpha_2_lagrange_0)
    .assertCanonical();

  const grand_product = new bn254({
    x: proof.grand_product_x,
    y: proof.grand_product_y,
  });
  linearized_cm = linearized_cm.add(grand_product.scale(s2));

  const neg_folded_q = new bn254({
    x: fold_quotient_x,
    y: fold_quotient_y,
  }).negate();
  linearized_cm = linearized_cm.add(neg_folded_q);

  return [linearized_cm.x.assertCanonical(), linearized_cm.y.assertCanonical()];
}

export function fold_state(
  vk: Sp1PlonkVk,
  proof: Sp1PlonkProof,
  lcm_x: FpC,
  lcm_y: FpC,
  lcm_opening: FrC,
  gamma_kzg: FrC
): [FpC, FpC, FrC] {
  // cm = [Linearised_polynomial]+γ[L] + γ²[R] + γ³[O] + γ⁴[S₁] +γ⁵[S₂] + ∑ᵢγ⁵⁺ⁱ[Pi_{i}]
  // opening = Linearised_polynomial(ζ)+γ²L(ζ) + γ³R(ζ)+ γ⁴O(ζ) + γ⁵S₁(ζ) +γ⁶S₂(ζ) + ∑ᵢγ⁶⁺ⁱPi_{i}(ζ)

  const gamma_2 = gamma_kzg.mul(gamma_kzg).assertCanonical();
  const gamma_3 = gamma_kzg.mul(gamma_2).assertCanonical();
  const gamma_4 = gamma_kzg.mul(gamma_3).assertCanonical();
  const gamma_5 = gamma_kzg.mul(gamma_4).assertCanonical();
  const gamma_6 = gamma_kzg.mul(gamma_5).assertCanonical();

  const l = new bn254({ x: proof.l_com_x, y: proof.l_com_y });
  const r = new bn254({ x: proof.r_com_x, y: proof.r_com_y });
  const o = new bn254({ x: proof.o_com_x, y: proof.o_com_y });
  const s1 = new bn254({ x: vk.qs1_x, y: vk.qs1_y });
  const s2 = new bn254({ x: vk.qs2_x, y: vk.qs2_y });
  const qcp_0 = new bn254({ x: vk.qcp_0_x, y: vk.qcp_0_y });

  let cm = new bn254({ x: lcm_x, y: lcm_y });
  let opening = FrC.from(lcm_opening).assertCanonical();

  cm = cm.add(l.scale(gamma_kzg));
  cm = cm.add(r.scale(gamma_2));
  cm = cm.add(o.scale(gamma_3));
  cm = cm.add(s1.scale(gamma_4));
  cm = cm.add(s2.scale(gamma_5));
  cm = cm.add(qcp_0.scale(gamma_6));

  opening = proof.l_at_zeta.mul(gamma_kzg).add(opening).assertCanonical();
  opening = proof.r_at_zeta.mul(gamma_2).add(opening).assertCanonical();
  opening = proof.o_at_zeta.mul(gamma_3).add(opening).assertCanonical();
  opening = proof.s1_at_zeta.mul(gamma_4).add(opening).assertCanonical();
  opening = proof.s2_at_zeta.mul(gamma_5).add(opening).assertCanonical();
  opening = proof.qcp_0_at_zeta.mul(gamma_6).add(opening).assertCanonical();

  return [cm.x.assertCanonical(), cm.y.assertCanonical(), opening];
}

// NOW SPLIT FOLD STATE
export function fold_state_0(
  proof: Sp1PlonkProof,
  lcm_x: FpC,
  lcm_y: FpC,
  lcm_opening: FrC,
  gamma_kzg: FrC
): [FpC, FpC, FrC] {
  const gamma_2 = gamma_kzg.mul(gamma_kzg).assertCanonical();
  const gamma_3 = gamma_kzg.mul(gamma_2).assertCanonical();
  const gamma_4 = gamma_kzg.mul(gamma_3).assertCanonical();
  const gamma_5 = gamma_kzg.mul(gamma_4).assertCanonical();
  const gamma_6 = gamma_kzg.mul(gamma_5).assertCanonical();

  const l = new bn254({ x: proof.l_com_x, y: proof.l_com_y });
  const r = new bn254({ x: proof.r_com_x, y: proof.r_com_y });

  let cm = new bn254({ x: lcm_x, y: lcm_y });
  let opening = FrC.from(lcm_opening).assertCanonical();

  cm = cm.add(l.scale(gamma_kzg));
  cm = cm.add(r.scale(gamma_2));

  opening = proof.l_at_zeta.mul(gamma_kzg).add(opening).assertCanonical();
  opening = proof.r_at_zeta.mul(gamma_2).add(opening).assertCanonical();
  opening = proof.o_at_zeta.mul(gamma_3).add(opening).assertCanonical();
  opening = proof.s1_at_zeta.mul(gamma_4).add(opening).assertCanonical();
  opening = proof.s2_at_zeta.mul(gamma_5).add(opening).assertCanonical();
  opening = proof.qcp_0_at_zeta.mul(gamma_6).add(opening).assertCanonical();

  return [cm.x.assertCanonical(), cm.y.assertCanonical(), opening];
}

export function fold_state_1(
  vk: Sp1PlonkVk,
  proof: Sp1PlonkProof,
  cm_x: FpC,
  cm_y: FpC,
  gamma_kzg: FrC
): [FpC, FpC] {
  const gamma_2 = gamma_kzg.mul(gamma_kzg).assertCanonical();
  const gamma_3 = gamma_kzg.mul(gamma_2).assertCanonical();
  const gamma_4 = gamma_kzg.mul(gamma_3).assertCanonical();
  const gamma_5 = gamma_kzg.mul(gamma_4).assertCanonical();

  const o = new bn254({ x: proof.o_com_x, y: proof.o_com_y });
  const s1 = new bn254({ x: vk.qs1_x, y: vk.qs1_y });
  const s2 = new bn254({ x: vk.qs2_x, y: vk.qs2_y });

  let cm = new bn254({ x: cm_x, y: cm_y });

  cm = cm.add(o.scale(gamma_3));
  cm = cm.add(s1.scale(gamma_4));
  cm = cm.add(s2.scale(gamma_5));

  return [cm.x.assertCanonical(), cm.y.assertCanonical()];
}

export function fold_state_2(
  vk: Sp1PlonkVk,
  proof: Sp1PlonkProof,
  cm_x: FpC,
  cm_y: FpC,
  gamma_kzg: FrC
): [FpC, FpC] {
  const gamma_2 = gamma_kzg.mul(gamma_kzg).assertCanonical();
  const gamma_3 = gamma_kzg.mul(gamma_2).assertCanonical();
  const gamma_4 = gamma_kzg.mul(gamma_3).assertCanonical();
  const gamma_5 = gamma_kzg.mul(gamma_4).assertCanonical();
  const gamma_6 = gamma_kzg.mul(gamma_5).assertCanonical();

  // const s2 = new bn254({x: vk.qs2_x, y: vk.qs2_y});
  const qcp_0 = new bn254({ x: vk.qcp_0_x, y: vk.qcp_0_y });

  let cm = new bn254({ x: cm_x, y: cm_y });

  // cm = cm.add(s2.scale(gamma_5))
  cm = cm.add(qcp_0.scale(gamma_6));

  return [cm.x.assertCanonical(), cm.y.assertCanonical()];
}

export function preparePairing(
  vk: Sp1PlonkVk,
  proof: Sp1PlonkProof,
  random: FrC,
  cm_x: FpC,
  cm_y: FpC,
  cm_opening: FrC,
  zeta: FrC
): [FpC, FpC, FpC, FpC] {
  // quotients part
  let batch_shifted = new bn254({
    x: proof.batch_opening_at_zeta_omega_x,
    y: proof.batch_opening_at_zeta_omega_y,
  });
  let folded_quotients = new bn254({
    x: proof.batch_opening_at_zeta_x,
    y: proof.batch_opening_at_zeta_y,
  });
  folded_quotients = folded_quotients.add(batch_shifted.scale(random));

  const neg_folded_q = folded_quotients.negate();

  // commitment part
  const gp = new bn254({ x: proof.grand_product_x, y: proof.grand_product_y });

  let folded_commitments = new bn254({ x: cm_x, y: cm_y });
  folded_commitments = folded_commitments.add(gp.scale(random));

  // evals part
  const gen = new bn254({ x: vk.g1_gen_x, y: vk.g1_gen_y });
  let folded_evals = proof.grand_product_at_omega_zeta
    .mul(random)
    .add(cm_opening)
    .assertCanonical();
  const neg_folded_evals_on_curve = gen.scale(folded_evals).negate();

  folded_commitments = folded_commitments.add(neg_folded_evals_on_curve);

  // quotients g1
  const batch_opening_z = new bn254({
    x: proof.batch_opening_at_zeta_x,
    y: proof.batch_opening_at_zeta_y,
  });
  const batch_opening_omega_z = new bn254({
    x: proof.batch_opening_at_zeta_omega_x,
    y: proof.batch_opening_at_zeta_omega_y,
  });

  const zeta_omega = vk.omega.mul(zeta).assertCanonical();
  const random_zeta_omega = random.mul(zeta_omega).assertCanonical();

  let quotients_g1 = batch_opening_z.scale(zeta);
  quotients_g1 = quotients_g1.add(
    batch_opening_omega_z.scale(random_zeta_omega)
  );

  folded_commitments = folded_commitments.add(quotients_g1);

  return [
    folded_commitments.x.assertCanonical(),
    folded_commitments.y.assertCanonical(),
    neg_folded_q.x.assertCanonical(),
    neg_folded_q.y.assertCanonical(),
  ];
}

// NOW SPLIT PREPARE PAIRING
export function preparePairing_0(
  vk: Sp1PlonkVk,
  proof: Sp1PlonkProof,
  random: FrC,
  cm_x: FpC,
  cm_y: FpC,
  cm_opening: FrC
): [FpC, FpC, FpC, FpC] {
  // quotients part
  let batch_shifted = new bn254({
    x: proof.batch_opening_at_zeta_omega_x,
    y: proof.batch_opening_at_zeta_omega_y,
  });
  let folded_quotients = new bn254({
    x: proof.batch_opening_at_zeta_x,
    y: proof.batch_opening_at_zeta_y,
  });
  folded_quotients = folded_quotients.add(batch_shifted.scale(random));

  const neg_folded_q = folded_quotients.negate();

  // commitment part
  const gp = new bn254({ x: proof.grand_product_x, y: proof.grand_product_y });

  let folded_commitments = new bn254({ x: cm_x, y: cm_y });
  folded_commitments = folded_commitments.add(gp.scale(random));

  // evals part
  const gen = new bn254({ x: vk.g1_gen_x, y: vk.g1_gen_y });
  let folded_evals = proof.grand_product_at_omega_zeta
    .mul(random)
    .add(cm_opening)
    .assertCanonical();
  const neg_folded_evals_on_curve = gen.scale(folded_evals).negate();

  folded_commitments = folded_commitments.add(neg_folded_evals_on_curve);

  // // quotients g1
  // const batch_opening_z = new bn254({x: proof.batch_opening_at_zeta_x, y: proof.batch_opening_at_zeta_y});
  // const batch_opening_omega_z = new bn254({x: proof.batch_opening_at_zeta_omega_x, y: proof.batch_opening_at_zeta_omega_y});

  // const zeta_omega = vk.omega.mul(zeta).assertCanonical();
  // const random_zeta_omega = random.mul(zeta_omega).assertCanonical();

  // let quotients_g1 = batch_opening_z.scale(zeta);
  // quotients_g1 = quotients_g1.add(batch_opening_omega_z.scale(random_zeta_omega));

  // folded_commitments = folded_commitments.add(quotients_g1);

  return [
    folded_commitments.x.assertCanonical(),
    folded_commitments.y.assertCanonical(),
    neg_folded_q.x.assertCanonical(),
    neg_folded_q.y.assertCanonical(),
  ];
}

export function preparePairing_1(
  vk: Sp1PlonkVk,
  proof: Sp1PlonkProof,
  random: FrC,
  folded_cm_x: FpC,
  folded_cm_y: FpC,
  zeta: FrC
): [FpC, FpC] {
  let folded_commitments = new bn254({ x: folded_cm_x, y: folded_cm_y });

  // quotients g1
  const batch_opening_z = new bn254({
    x: proof.batch_opening_at_zeta_x,
    y: proof.batch_opening_at_zeta_y,
  });
  const batch_opening_omega_z = new bn254({
    x: proof.batch_opening_at_zeta_omega_x,
    y: proof.batch_opening_at_zeta_omega_y,
  });

  const zeta_omega = vk.omega.mul(zeta).assertCanonical();
  const random_zeta_omega = random.mul(zeta_omega).assertCanonical();

  let quotients_g1 = batch_opening_z.scale(zeta);
  quotients_g1 = quotients_g1.add(
    batch_opening_omega_z.scale(random_zeta_omega)
  );

  folded_commitments = folded_commitments.add(quotients_g1);

  return [
    folded_commitments.x.assertCanonical(),
    folded_commitments.y.assertCanonical(),
  ];
}
