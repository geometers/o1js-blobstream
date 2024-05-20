import { Struct } from 'o1js';
import { ATE_LOOP_COUNT, atc } from './consts.js';
import { FpC } from './fp.js';
import { Fp2 } from './fp2.js';
import { Fp6 } from './fp6.js';
import { GAMMA_1S, GAMMA_2S, GAMMA_3S } from './precomputed.js';

// Fp6^2[w]/(w^2 - v)
class Fp12 extends Struct({ c0: Fp6, c1: Fp6 }) {
  static zero(): Fp12 {
    return new Fp12({ c0: Fp6.zero(), c1: Fp6.zero() });
  }

  static one(): Fp12 {
    return new Fp12({ c0: Fp6.one(), c1: Fp6.zero() });
  }

  neg(): Fp12 {
    return new Fp12({ c0: this.c0.neg(), c1: this.c1.neg() });
  }

  conjugate(): Fp12 {
    return new Fp12({ c0: this.c0, c1: this.c1.neg() });
  }

  assert_equals(rhs: Fp12) {
    this.c0.assert_equals(rhs.c0);
    this.c1.assert_equals(rhs.c1);
  }

  inverse() {
    let t0 = this.c0.mul(this.c0);
    let t1 = this.c1.mul(this.c1);

    t0 = t0.sub(t1.mul_by_v());
    t1 = t0.inverse();

    const c0 = this.c0.mul(t1);
    const c1 = this.c1.neg().mul(t1);

    return new Fp12({ c0, c1 });
  }

  mul(rhs: Fp12): Fp12 {
    const t0 = this.c0.mul(rhs.c0);
    const t1 = this.c1.mul(rhs.c1);

    const c0 = t1.mul_by_v().add(t0);

    const a0_a1 = this.c0.add(this.c1);
    const b0_b1 = rhs.c0.add(rhs.c1);

    const c1 = a0_a1.mul(b0_b1).sub(t0).sub(t1);

    return new Fp12({ c0, c1 });
  }

  // rhs.c0 b00 + 0v + 0v^2
  // rhs.c1 b10 + b11v + 0v^2
  sparse_mul(rhs: Fp12): Fp12 {
    const t0 = this.c0.mul_by_fp2(rhs.c0.c0);
    const t1 = this.c1.mul_by_sparse_fp6(rhs.c1);

    const c0 = t0.add(t1.mul_by_v());

    const t2 = new Fp6({
      c0: rhs.c0.c0.add(rhs.c1.c0),
      c1: rhs.c1.c1,
      c2: Fp2.zero(),
    });
    let c1 = this.c0.add(this.c1).mul_by_sparse_fp6(t2);
    c1 = c1.sub(t0).sub(t1);

    return new Fp12({ c0, c1 });
  }

  square(): Fp12 {
    let c0 = this.c0.sub(this.c1);
    let c3 = this.c0.sub(this.c1.mul_by_v());
    let c2 = this.c0.mul(this.c1);

    c0 = c0.mul(c3).add(c2);
    const c1 = c2.mul_by_fp(FpC.from(2n));

    c2 = c2.mul_by_v();
    c0 = c0.add(c2);

    return new Fp12({ c0, c1 });
  }

  frobenius_pow_p(): Fp12 {
    const t1 = this.c0.c0.conjugate();
    let t2 = this.c1.c0.conjugate();
    let t3 = this.c0.c1.conjugate();
    let t4 = this.c1.c1.conjugate();
    let t5 = this.c0.c2.conjugate();
    let t6 = this.c1.c2.conjugate();

    t2 = t2.mul(GAMMA_1S[0]);
    t3 = t3.mul(GAMMA_1S[1]);
    t4 = t4.mul(GAMMA_1S[2]);
    t5 = t5.mul(GAMMA_1S[3]);
    t6 = t6.mul(GAMMA_1S[4]);

    const c0 = new Fp6({ c0: t1, c1: t3, c2: t5 });
    const c1 = new Fp6({ c0: t2, c1: t4, c2: t6 });

    return new Fp12({ c0, c1 });
  }

  frobenius_pow_p_squared(): Fp12 {
    const t1 = this.c0.c0;
    const t2 = this.c1.c0.mul(GAMMA_2S[0]);
    const t3 = this.c0.c1.mul(GAMMA_2S[1]);
    const t4 = this.c1.c1.mul(GAMMA_2S[2]);
    const t5 = this.c0.c2.mul(GAMMA_2S[3]);
    const t6 = this.c1.c2.mul(GAMMA_2S[4]);

    const c0 = new Fp6({ c0: t1, c1: t3, c2: t5 });
    const c1 = new Fp6({ c0: t2, c1: t4, c2: t6 });

    return new Fp12({ c0, c1 });
  }

  frobenius_pow_p_cubed(): Fp12 {
    const t1 = this.c0.c0.conjugate();
    let t2 = this.c1.c0.conjugate();
    let t3 = this.c0.c1.conjugate();
    let t4 = this.c1.c1.conjugate();
    let t5 = this.c0.c2.conjugate();
    let t6 = this.c1.c2.conjugate();

    t2 = t2.mul(GAMMA_3S[0]);
    t3 = t3.mul(GAMMA_3S[1]);
    t4 = t4.mul(GAMMA_3S[2]);
    t5 = t5.mul(GAMMA_3S[3]);
    t6 = t6.mul(GAMMA_3S[4]);

    const c0 = new Fp6({ c0: t1, c1: t3, c2: t5 });
    const c1 = new Fp6({ c0: t2, c1: t4, c2: t6 });

    return new Fp12({ c0, c1 });
  }

  // when this is not in cyclotomic group (i.e. x^(p^6 + 1) not 1 )
  pow(expBeWnaf: Array<number>): Fp12 {
    let inv = this.inverse();
    let c = new Fp12({ c0: this.c0, c1: this.c1 });

    const n = expBeWnaf.length;
    for (let i = 1; i < n; i++) {
      c = c.square();

      if (expBeWnaf[i] == 1) {
        c = c.mul(this);
      } else if (expBeWnaf[i] == -1) {
        c = c.mul(inv);
      }
    }

    return c;
  }

  // e = 6x + 2 + p - p^2 + p^3
  exp_e(): Fp12 {
    const c0 = this.pow(ATE_LOOP_COUNT);
    const c1 = this.frobenius_pow_p();
    const c2 = this.frobenius_pow_p_squared().inverse();
    const c3 = this.frobenius_pow_p_cubed();

    return c0.mul(c1).mul(c2).mul(c3);
  }

  display(name: string) {
    console.log(`${name}.g00: `, this.c0.c0.c0.toBigInt());
    console.log(`${name}.g01: `, this.c0.c0.c1.toBigInt());
    console.log(`${name}.g10: `, this.c0.c1.c0.toBigInt());
    console.log(`${name}.g11: `, this.c0.c1.c1.toBigInt());
    console.log(`${name}.g20: `, this.c0.c2.c0.toBigInt());
    console.log(`${name}.g21: `, this.c0.c2.c1.toBigInt());

    console.log(`${name}.h00: `, this.c1.c0.c0.toBigInt());
    console.log(`${name}.h01: `, this.c1.c0.c1.toBigInt());
    console.log(`${name}.h10: `, this.c1.c1.c0.toBigInt());
    console.log(`${name}.h11: `, this.c1.c1.c1.toBigInt());
    console.log(`${name}.h20: `, this.c1.c2.c0.toBigInt());
    console.log(`${name}.h21: `, this.c1.c2.c1.toBigInt());
  }
}

export { Fp12 };
