import { Fr, FrC, powFr } from '../../towers/fr.js';
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
import { Sp1PlonkFiatShamir } from '../fiat-shamir/index.js';
import { Sp1PlonkProof, deserializeProof } from '../proof.js';
import { VK } from '../vk.js';
import { assertPointOnBn } from '../utils.js';
import { HashFr } from './hash_fr.js';

const hexProof =
  '0x801c66ac0adb18b19c32120abcaea2dfa6ebc07925a4c12abbb823ffa50aeae202c3b8910a8d533f786b3f53345442e25ec85abd1ba147574d276f2242ff7831b8bea1402648e4c4e876f53fb2d6211414fc5da6e1441484a1a7ccc599621663ad6d628621f6e3a0ded5513478fa59e788b4e06102202cb4663002b9b30467c4054aaf512ecd8e695bb68bf9500cd3de1da60d8084c3f2bf5de1d748d4b01131b9545f9e14507651644746c0952ada51abba4358bba695fcfa5162f013b044e93f486e7704d08d5ee2e0bcd5bbc01b8e6e12f0d09df5a285dc0da05840e5fc1a2f7fb6e200fdb49c7bdf737927f8f9b4f60a000baa9c4377964155caf01e701a1b35d5e92ec3ef85185eb95cb37e92cccb85a35617e7cafa2fe942d0c8a1845540ec1d4d2745400e54065f8601ff4ea8985dad2f3b8000b35e1b90e5525938d5d30157212509e6e2b6bc3b1dc0c71f04c735c431473e1776f138c8e5808e8a99cc59669916d026eafe692c6a8345c17239d6e7683a924360336ad10f948b4bfb2041226b043ad28ad6471c591ec17c09b84c591740e751c04018873ac617df8c2ffa52651b096bd46e6a04bf3e1797e903f47fbb64761a028967c5b3f748165358c8b6b027af7d77b3ca83fee575b2d39e5874128ac952016bda7aca187426bcb7a0460d0111783b814486fdf46d76d6854ed3889036126f3af5ffef96efea25d73524230c22a1f411ec42f76a07c2d5f3b78d2311550b790be1303a81c9aee96077b72a2575c5739eab16dee3e1f3fdaddfc9278814b9ffc764fd883c59fb4a0c4fd577081e07e2504b9eabfbf2962d03873f5ce9ff38ffe0f20446ae43b7abd35e84aa243c4a64ae86448e02a0728c10c8e38e226854d34bcb8ae85b19856e908ad4d01c1a70e88c77dafad62c1eca5dcd0a640558b9162b0fff944cfca3d330ba0e870b306fa22276609649e111fafd23b8eaf4571d6bc47b4d963ad28d80e2e3fcbf04ca5a5f641b32333729d102a9b4a9d26ac03c6e4f15adfedf250f506c4d79f10342a6ccde9efa0bce51fe08df09d697f07e38487f2bd7a04f4bc410eba22c2e1b3517159a47eb183a51cad319b54d3c645d56db854739bb844f8c7e49207f0807d26e1a837bdea04a774f09e64a2ff4cb852ba5f31849c8451330c4b8ab85b5261b092715702b7604202584c70431947264f339486a6222843ff99810d6fb05';
const proof = new Sp1PlonkProof(deserializeProof(hexProof));
const fs = Sp1PlonkFiatShamir.empty();

// Decoder for this is currently in solidity repo!
// const programVk = "0x0097228875a04c12dda0a76b705856f1a99fd19613c0ba69b056f4c4d18921e5";
// const publicInputBytes =
//   "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000006b850f8a2400913e58dbf3791e084b944e3859a8f3fd45a6212c1ce0fdb345936dd29000000000000000000000000000000000000000000000000000000000000008a9391e49308c85b6c50f3dbceb31e4d1d0719337a2ea4c724e9a7eba73f35432a000000000000000000000000000000000000000000000000000000000006b97c4211fff419575c75d2e880ca014c64276bccc917f0e9ea26c7a923ac78e83f32c3faaef208b30c5b2a1bec70f8b22f14099876952f7c6c1e904adae5642856e69124c226260e0798d54fda8fbae89cf0da84b1894912675c9f0552628caf3ae700000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

const pi0 = FrC.from(
  '0x0097228875a04c12dda0a76b705856f1a99fd19613c0ba69b056f4c4d18921e5'
);
const pi1 = FrC.from(
  '0x048e48f4b209e2dc6d92839ecba0e9321e83ea61ecb6430fc737b1e94c3fabbb'
);

// ~110K - so we can probably split them into two circuits
fs.squeezeGamma(proof, pi0, pi1, VK);
fs.squeezeBeta();
fs.squeezeAlpha(proof);
fs.squeezeZeta(proof);

console.log('challenge gamma: ', fs.gamma.toBigInt());
console.log('challenge beta: ', fs.beta.toBigInt());
console.log('challenge alpha: ', fs.alpha.toBigInt());
console.log('challenge zeta: ', fs.zeta.toBigInt());

// very cheap
const [zeta_pow_n, zh_eval] = evalVanishing(fs.zeta, VK);
console.log('zh eval: ', zh_eval.toBigInt());

// very cheap
const alpha_2_l0 = compute_alpha_square_lagrange_0(
  zh_eval,
  fs.zeta,
  fs.alpha,
  VK
);
console.log('alpha_squared_l0', alpha_2_l0.toBigInt());

// ~60k
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
console.log('folded quotient x: ', hx.toBigInt());
console.log('folded quotient y: ', hy.toBigInt());
assertPointOnBn(hx.toBigInt(), hy.toBigInt());

// very cheap
const pis = pi_contribution(
  [pi0, pi1],
  fs.zeta,
  zh_eval,
  VK.inv_domain_size,
  VK.omega
);
console.log('pis without custom gates: ', pis.toBigInt());

// ~32k
const l_pi_commit = customPiLagrange(
  fs.zeta,
  zh_eval,
  proof.qcp_0_wire_x,
  proof.qcp_0_wire_y,
  VK
);
console.log('l_pi_commit: ', l_pi_commit.toBigInt());

const pi = pis.add(l_pi_commit).assertCanonical();
console.log('pi: ', pi.toBigInt());

// very cheap
const linearised_opening = opening_of_linearized_polynomial(
  proof,
  fs.alpha,
  fs.beta,
  fs.gamma,
  pi,
  alpha_2_l0
);
console.log('linearised_opening: ', linearised_opening.toBigInt());

// ~ 135K - we have to split this into two functions
const [lcm_x, lcm_y] = compute_commitment_linearized_polynomial(
  VK,
  proof,
  fs.alpha,
  fs.beta,
  fs.gamma,
  fs.zeta,
  alpha_2_l0,
  hx,
  hy
);
console.log('lcm x: ', lcm_x.toBigInt());
console.log('lcm y: ', lcm_y.toBigInt());
assertPointOnBn(lcm_x.toBigInt(), lcm_y.toBigInt());

// ~66K - we might need to split this
fs.squeezeGammaKzg(proof, VK, lcm_x, lcm_y, linearised_opening);
console.log('kzg gamma: ', fs.gamma_kzg.toBigInt());

// ~118K - split this also
const [cm_x, cm_y, cm_opening] = fold_state(
  VK,
  proof,
  lcm_x,
  lcm_y,
  linearised_opening,
  fs.gamma_kzg
);
console.log('kzg cm x: ', cm_x.toBigInt());
console.log('kzg cm y: ', cm_y.toBigInt());
console.log('kzg opening: ', cm_opening.toBigInt());

// ~33K
const random = fs.squeezeRandomForKzg(proof, cm_x, cm_y);
console.log('random for kzg: ', random.toBigInt());

// ~100K split this
const [kzg_cm_x, kzg_cm_y, neg_fq_x, neg_fq_y] = preparePairing(
  VK,
  proof,
  random,
  cm_x,
  cm_y,
  cm_opening,
  fs.zeta
);
console.log('kzg_cm_x: ', kzg_cm_x.toBigInt());
console.log('kzg_cm_y: ', kzg_cm_y.toBigInt());
console.log('neg fq x: ', neg_fq_x.toBigInt());
console.log('neg fq y: ', neg_fq_y.toBigInt());

// now e(kzg_cm, [1])*e(neg_fq, [x]) = 1
