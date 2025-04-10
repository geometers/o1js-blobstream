import { G2Line } from '../../lines/index.js';
import { G1Affine } from '../../ec/index.js';
import { ATE_LOOP_COUNT, Fp12 } from '../../towers/index.js';
import { KZGLineAccumulator } from './accumulate_lines.js';
import { Field, Provable } from 'o1js';

class KZGPairing {
  g2_lines: Array<G2Line>;
  tau_lines: Array<G2Line>;
  w27: Array<Fp12>;

  constructor(g2_lines: string, tau_lines: string, w27: Fp12) {
    let parsed_g2_lines: any[] = JSON.parse(g2_lines);
    this.g2_lines = parsed_g2_lines.map((g: any): G2Line => G2Line.fromJSON(g));

    let parsed_tau_lines: any[] = JSON.parse(tau_lines);
    this.tau_lines = parsed_tau_lines.map(
      (g: any): G2Line => G2Line.fromJSON(g)
    );

    this.w27 = [Fp12.one(), w27, w27.mul(w27)];
  }

  multiMillerLoop(A: G1Affine, negB: G1Affine): Fp12 {
    const g = KZGLineAccumulator.accumulate(
      this.g2_lines,
      this.tau_lines,
      A,
      negB
    );

    let mlo = Fp12.one();
    let mlo_idx = 0;
    for (let i = 1; i < ATE_LOOP_COUNT.length; i++) {
      mlo_idx = i - 1;
      mlo = mlo.square().mul(g[mlo_idx]);
    }

    mlo_idx += 1;
    mlo = mlo.mul(g[mlo_idx]);

    return mlo;
  }

  proveEqual(A: G1Affine, negB: G1Affine, shift_power: Field, c: Fp12) {
    const g = KZGLineAccumulator.accumulate(
      this.g2_lines,
      this.tau_lines,
      A,
      negB
    );

    const c_inv = c.inverse();
    let f = c_inv;

    let idx = 0;

    for (let i = 1; i < ATE_LOOP_COUNT.length; i++) {
      idx = i - 1;
      f = f.square().mul(g[idx]);

      if (ATE_LOOP_COUNT[i] == 1) {
        f = f.mul(c_inv);
      }

      if (ATE_LOOP_COUNT[i] == -1) {
        f = f.mul(c);
      }
    }

    idx += 1;
    f = f.mul(g[idx]);

    f = f
      .mul(c_inv.frobenius_pow_p())
      .mul(c.frobenius_pow_p_squared())
      .mul(c_inv.frobenius_pow_p_cubed());

    const shift = Provable.switch(
      [
        shift_power.equals(Field(0)),
        shift_power.equals(Field(1)),
        shift_power.equals(Field(2)),
      ],
      Fp12,
      [Fp12.one(), this.w27[1], this.w27[2]]
    );
    f = f.mul(shift);

    f.assert_equals(Fp12.one());
  }
}

export { KZGPairing };
