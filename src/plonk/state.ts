import { Provable, Struct, UInt32 } from 'o1js';
import { ATE_LOOP_COUNT, Fp12, FpC, FrC } from '../towers/index.js';

class StateUntilPairing extends Struct({
  pi0: FrC.provable,
  pi1: FrC.provable,

  zeta_pow_n: FrC.provable,
  zh_eval: FrC.provable,

  alpha_2_l0: FrC.provable,

  hx: FpC.provable,
  hy: FpC.provable,

  pi: FrC.provable, // public inputs contribution

  linearized_opening: FrC.provable,

  lcm_x: FpC.provable,
  lcm_y: FpC.provable,

  cm_x: FpC.provable,
  cm_y: FpC.provable,

  cm_opening: FrC.provable,

  kzg_random: FrC.provable,

  kzg_cm_x: FpC.provable,
  kzg_cm_y: FpC.provable,
  neg_fq_x: FpC.provable,
  neg_fq_y: FpC.provable,

  // in pairing:
  // g: Provable.Array(Fp12, ATE_LOOP_COUNT.length),
  // f: Fp12

  H: Provable.Array(UInt32, 8),
}) {
  deepClone() {
    return new StateUntilPairing({
      pi0: FrC.from(this.pi0.toBigInt()),
      pi1: FrC.from(this.pi1.toBigInt()),

      zeta_pow_n: FrC.from(this.zeta_pow_n.toBigInt()),
      zh_eval: FrC.from(this.zh_eval.toBigInt()),

      alpha_2_l0: FrC.from(this.alpha_2_l0.toBigInt()),

      hx: FpC.from(this.hx.toBigInt()),
      hy: FpC.from(this.hy.toBigInt()),

      pi: FrC.from(this.pi.toBigInt()), // public inputs contribution

      linearized_opening: FrC.from(this.linearized_opening.toBigInt()),

      lcm_x: FpC.from(this.lcm_x.toBigInt()),
      lcm_y: FpC.from(this.lcm_y.toBigInt()),

      cm_x: FpC.from(this.cm_x.toBigInt()),
      cm_y: FpC.from(this.cm_y.toBigInt()),

      cm_opening: FrC.from(this.cm_opening.toBigInt()),

      kzg_random: FrC.from(this.kzg_random.toBigInt()),

      kzg_cm_x: FpC.from(this.kzg_cm_x.toBigInt()),
      kzg_cm_y: FpC.from(this.kzg_cm_y.toBigInt()),
      neg_fq_x: FpC.from(this.neg_fq_x.toBigInt()),
      neg_fq_y: FpC.from(this.neg_fq_y.toBigInt()),

      H: [...this.H],
    });
  }
}

type StateUntilPairingType = {
  pi0: FrC;
  pi1: FrC;

  zeta_pow_n: FrC;
  zh_eval: FrC;

  alpha_2_l0: FrC;

  hx: FpC;
  hy: FpC;

  pi: FrC; // public inputs contribution

  linearized_opening: FrC;

  lcm_x: FpC;
  lcm_y: FpC;

  cm_x: FpC;
  cm_y: FpC;

  cm_opening: FrC;

  kzg_random: FrC;

  kzg_cm_x: FpC;
  kzg_cm_y: FpC;
  neg_fq_x: FpC;
  neg_fq_y: FpC;

  // in pairing:
  // g: Array<Fp12>,
  // f: Fp12
  H: Array<UInt32>;
};

function empty(pi0: FrC, pi1: FrC): StateUntilPairingType {
  return {
    pi0,
    pi1,

    zeta_pow_n: FrC.from(0n),
    zh_eval: FrC.from(0n),

    alpha_2_l0: FrC.from(0n),

    hx: FpC.from(0n),
    hy: FpC.from(0n),

    pi: FrC.from(0n), // public inputs contribution

    linearized_opening: FrC.from(0n),

    lcm_x: FpC.from(0n),
    lcm_y: FpC.from(0n),

    cm_x: FpC.from(0n),
    cm_y: FpC.from(0n),

    cm_opening: FrC.from(0n),

    kzg_random: FrC.from(0n),

    kzg_cm_x: FpC.from(0n),
    kzg_cm_y: FpC.from(0n),
    neg_fq_x: FpC.from(0n),
    neg_fq_y: FpC.from(0n),

    // in pairing:
    // g: new Array(ATE_LOOP_COUNT.length).fill(Fp12.zero()),
    // f: Fp12.zero()
    H: new Array(8).fill(UInt32.from(0n)),
  };
}

export { StateUntilPairingType, StateUntilPairing, empty };
