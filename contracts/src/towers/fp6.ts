import { Field, Struct, assert } from 'o1js';
import { FpC } from './fp.js';
import { Fp2 } from './fp2.js';
import { fp2_non_residue } from './precomputed.js';

// Fp^2[v]/(v^3 - u)
class Fp6 extends Struct({ c0: Fp2, c1: Fp2, c2: Fp2 }) {
  // c0: Fp2
  // c1: Fp2
  // c2: Fp2

  // constructor(c0: Fp2, c1: Fp2, c2: Fp2) {
  //     this.c0 = c0
  //     this.c1 = c1
  //     this.c2 = c2
  // }

  static zero() {
    return new Fp6({ c0: Fp2.zero(), c1: Fp2.zero(), c2: Fp2.zero() });
  }

  static one() {
    return new Fp6({ c0: Fp2.one(), c1: Fp2.zero(), c2: Fp2.zero() });
  }

  assert_equals(rhs: Fp6) {
    this.c0.assert_equals(rhs.c0);
    this.c1.assert_equals(rhs.c1);
    this.c2.assert_equals(rhs.c2);
  }

  neg(): Fp6 {
    return new Fp6({ c0: this.c0.neg(), c1: this.c1.neg(), c2: this.c2.neg() });
  }

  inverse(): Fp6 {
    const t0 = this.c0.mul(this.c0);
    const t1 = this.c1.mul(this.c1);
    const t2 = this.c2.mul(this.c2);

    const t3 = this.c0.mul(this.c1);
    const t4 = this.c0.mul(this.c2);
    const t5 = this.c1.mul(this.c2);

    let c0 = t0.sub(t5.mul_by_non_residue());
    let c1 = t2.mul_by_non_residue().sub(t3);
    let c2 = t1.sub(t4);

    let t6 = this.c0.mul(c0);
    t6 = t6.add(this.c2.mul(c1).mul_by_non_residue());
    t6 = t6.add(this.c1.mul(c2).mul_by_non_residue());
    t6 = t6.inverse();

    c0 = c0.mul(t6);
    c1 = c1.mul(t6);
    c2 = c2.mul(t6);

    return new Fp6({ c0, c1, c2 });
  }

  add(rhs: Fp6): Fp6 {
    const c0 = this.c0.add(rhs.c0);
    const c1 = this.c1.add(rhs.c1);
    const c2 = this.c2.add(rhs.c2);

    return new Fp6({ c0, c1, c2 });
  }

  sub(rhs: Fp6): Fp6 {
    const c0 = this.c0.sub(rhs.c0);
    const c1 = this.c1.sub(rhs.c1);
    const c2 = this.c2.sub(rhs.c2);

    return new Fp6({ c0, c1, c2 });
  }

  // Fp^2[v]/(v^3 - eta), eta = 9 + u
  mul_by_v(): Fp6 {
    const c0 = this.c2.mul(fp2_non_residue);
    return new Fp6({ c0, c1: this.c0, c2: this.c1 });
  }

  mul_by_fp(rhs: FpC): Fp6 {
    const c0 = this.c0.mul_by_fp(rhs);
    const c1 = this.c1.mul_by_fp(rhs);
    const c2 = this.c2.mul_by_fp(rhs);

    return new Fp6({ c0, c1, c2 });
  }

  mul(rhs: Fp6): Fp6 {
    const t0 = this.c0.mul(rhs.c0);
    const t1 = this.c1.mul(rhs.c1);
    const t2 = this.c2.mul(rhs.c2);

    const a1_a2 = this.c1.add(this.c2);
    const a0_a1 = this.c0.add(this.c1);
    const a0_a2 = this.c0.add(this.c2);

    const b1_b2 = rhs.c1.add(rhs.c2);
    const b0_b1 = rhs.c0.add(rhs.c1);
    const b0_b2 = rhs.c0.add(rhs.c2);

    let c0 = Fp2.sum([a1_a2.mul(b1_b2), t1, t2], [-1, -1])
      .mul(fp2_non_residue)
      .add(t0);
    let c1 = Fp2.sum(
      [a0_a1.mul(b0_b1), t0, t1, t2.mul(fp2_non_residue)],
      [-1, -1, 1]
    );
    let c2 = Fp2.sum([a0_a2.mul(b0_b2), t0, t2, t1], [-1, -1, 1]);

    return new Fp6({ c0, c1, c2 });
  }

  mul_by_fp2(rhs: Fp2): Fp6 {
    const c0 = this.c0.mul(rhs);
    const c1 = this.c1.mul(rhs);
    const c2 = this.c2.mul(rhs);

    return new Fp6({ c0, c1, c2 });
  }

  // rhs = c0 + c1v + 0v^2
  mul_by_sparse_fp6(rhs: Fp6) {
    const t0 = this.c0.mul(rhs.c0);
    const t1 = this.c1.mul(rhs.c1);

    let c0 = this.c2.mul(rhs.c1).mul(fp2_non_residue);
    c0 = c0.add(t0);

    const a0_a1 = this.c0.add(this.c1);
    const b0_b1 = rhs.c0.add(rhs.c1);
    let c1 = a0_a1.mul(b0_b1);
    c1 = c1.sub(t0).sub(t1);

    const c2 = this.c2.mul(rhs.c0).add(t1);

    return new Fp6({ c0, c1, c2 });
  }
}

export { Fp6 };

// function main() {
//     // TODO: add all of this in unit tests
//     const g00 = FpC.from(-10n);
//     const g01 = FpC.from(-11n);
//     const g0 = new Fp2({c0: g00, c1: g01});

//     const g10 = FpC.from(-12n);
//     const g11 = FpC.from(-13n);
//     const g1 = new Fp2({c0: g10, c1: g11});

//     const g20 = FpC.from(-14n);
//     const g21 = FpC.from(-15n);
//     const g2 = new Fp2({c0: g20, c1: g21});

//     const g = new Fp6({c0: g0, c1: g1, c2: g2});

//     const h00 = FpC.from(-16n);
//     const h01 = FpC.from(-17n);
//     const h0 = new Fp2({c0: h00, c1: h01});

//     const h10 = FpC.from(-18n);
//     const h11 = FpC.from(-19n);
//     const h1 = new Fp2({c0: h10, c1: h11});

//     const h20 = FpC.from(-20n);
//     const h21 = FpC.from(-21n);
//     const h2 = new Fp2({c0: h20, c1: h21});

//     const h = new Fp6({c0: h0, c1: h1, c2: h2});

//     const gh = g.mul(h);
//     const g_inv = g.inverse();

//     // from arkworks when doing g * h
//     // a00
//     console.log(gh.c0.c0.toBigInt().toString() == '21888242871839275222246405745257275088696311157297823662689037894645226206914');
//     // a01
//     console.log(gh.c0.c1.toBigInt().toString() == '9712');
//     // a10
//     console.log(gh.c1.c0.toBigInt().toString() == '21888242871839275222246405745257275088696311157297823662689037894645226207616');
//     // a11
//     console.log(gh.c1.c1.toBigInt().toString() == '6111');
//     // a20
//     console.log(gh.c2.c0.toBigInt().toString() == '21888242871839275222246405745257275088696311157297823662689037894645226208490');
//     // a21
//     console.log(gh.c2.c1.toBigInt().toString() == '1370');
// }

// main();
