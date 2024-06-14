import { Field, Provable, Struct } from 'o1js';
import { FpC, FpU, FpA } from './fp.js';
import { AlmostReducedSum, UnreducedSum, assertMul } from './assert-mul.js';

class Fp2 extends Struct({ c0: FpC.provable, c1: FpC.provable }) {
  static zero(): Fp2 {
    return new Fp2({ c0: FpC.from(0n), c1: FpC.from(0n) });
  }

  static one(): Fp2 {
    return new Fp2({ c0: FpC.from(1n), c1: FpC.from(0n) });
  }

  assert_equals(rhs: Fp2) {
    this.c0.assertEquals(rhs.c0);
    this.c1.assertEquals(rhs.c1);
  }

  canonical() {
    return { c0: this.c0.assertCanonical(), c1: this.c1.assertCanonical() };
  }

  static fromUnreduced({ c0, c1 }: { c0: FpU; c1: FpU }): Fp2 {
    return new Fp2({ c0: c0.assertCanonical(), c1: c1.assertCanonical() });
  }

  equals(rhs: Fp2): Field {
    let a = this.canonical();
    let b = rhs.canonical();
    return a.c0.equals(b.c0).and(a.c1.equals(b.c1)).toField();
  }

  neg(): Fp2 {
    return new Fp2({ c0: this.c0.neg().assertCanonical(), c1: this.c1.neg().assertCanonical() });
  }

  conjugate(): Fp2 {
    return new Fp2({ c0: this.c0, c1: this.c1.neg().assertCanonical() });
  }

  add(rhs: Fp2): Fp2 {
    const c0 = this.c0.add(rhs.c0);
    const c1 = this.c1.add(rhs.c1);

    return Fp2.fromUnreduced({ c0, c1 });
  }

  add_fp(rhs: FpA) {
    const c0 = this.c0.add(rhs);
    return new Fp2({ c0: c0.assertCanonical(), c1: this.c1 });
  }

  sub(rhs: Fp2): Fp2 {
    const c0 = this.c0.sub(rhs.c0);
    const c1 = this.c1.sub(rhs.c1);

    return Fp2.fromUnreduced({ c0, c1 });
  }

  static sum(inputs: Fp2[], operators: (-1 | 1)[]): Fp2 {
    let c0 = FpA.sum(
      inputs.map((x) => x.c0),
      operators
    );
    let c1 = FpA.sum(
      inputs.map((x) => x.c1),
      operators
    );
    return Fp2.fromUnreduced({ c0, c1 });
  }

  mul_by_fp(rhs: FpA) {
    const c0 = this.c0.mul(rhs);
    const c1 = this.c1.mul(rhs);

    return Fp2.fromUnreduced({ c0, c1 });
  }

  mul_by_non_residue(): Fp2 {
    return this.mul(new Fp2({ c0: FpC.from(9n), c1: FpC.from(1n) }));
  }

  // uses the fact that we work over modulus: X^2 + 1
  mul(rhs: Fp2): Fp2 {
    // c0 = a0*b0 - a1*b1
    const a0b0 = this.c0.mul(rhs.c0);
    const a1b1 = this.c1.mul(rhs.c1);
    const c0 = a0b0.sub(a1b1);

    // c1 = a0*b1 + a1*b0
    //    = (a0 + a1)*(b0 + b1) - a0*b0 - a1*b1
    // <=>
    // (a0 + a1)*(b0 + b1) = c1 + a0*b0 + a1*b1

    // strategy: witness c1 and prove the equation above with `assertMul()`
    // this saves range checks on a0 + a1, b0 + b1 and c1
    let c1 = Provable.witness(FpU.provable, (): FpU => {
      let [a0, a1] = [this.c0.toBigInt(), this.c1.toBigInt()];
      let [b0, b1] = [rhs.c0.toBigInt(), rhs.c1.toBigInt()];
      return FpU.from(a0 * b1 + a1 * b0);
    });

    // let sum_a0_a1 = new AlmostReducedSum(this.c0).add(this.c1);
    let sum_a0_a1 = this.c0.add(this.c1).assertCanonical();
    // let sum_b0_b1 = new AlmostReducedSum(rhs.c0).add(rhs.c1);
    let sum_b0_b1 = rhs.c0.add(rhs.c1).assertCanonical();
    // let sum_c1_a0b0_a1b1 = new UnreducedSum(c1).add(a0b0).add(a1b1);
    let sum_c1_a0b0_a1b1 = c1.add(a0b0).add(a1b1).assertCanonical();
    assertMul(sum_a0_a1, sum_b0_b1, sum_c1_a0b0_a1b1);

    return Fp2.fromUnreduced({ c0, c1 });
  }

  square(): Fp2 {
    // c0 = a0^2 - a1^2 = (a0 + a1)(a0 - a1)
    // c1 = 2*a0*a1 = (a0 + a0)*a1

    let [c0, c1] = Provable.witness(
      Provable.Array(FpU.provable, 2),
      (): FpU[] => {
        let [a0, a1] = [this.c0.toBigInt(), this.c1.toBigInt()];
        return [FpU.from(a0 * a0 - a1 * a1), FpU.from(2n * a0 * a1)];
      }
    );

    // let sum_a0_a1 = new AlmostReducedSum(this.c0).add(this.c1);
    let sum_a0_a1 = this.c0.add(this.c1).assertCanonical();
    // let diff_a0_a1 = new AlmostReducedSum(this.c0).sub(this.c1);
    let diff_a0_a1 = this.c0.sub(this.c1).assertCanonical();
    assertMul(sum_a0_a1, diff_a0_a1, c0);

    // let sum_a0_a0 = new AlmostReducedSum(this.c0).add(this.c0);
    let sum_a0_a0 = this.c0.add(this.c0).assertCanonical();
    assertMul(sum_a0_a0, this.c1, c1);

    return Fp2.fromUnreduced({ c0, c1 });
  }

  inverse(): Fp2 {
    let t0 = this.c0.mul(this.c0);
    let t1 = this.c1.mul(this.c1);

    // beta = -1
    t0 = t0.add(t1);
    // TODO this should be doable with 1 assertAlmostReduced + assertMul
    // let t1A = t0.assertAlmostReduced().inv().assertAlmostReduced();
    let t1A = t0.assertCanonical().inv().assertCanonical();

    const c0 = this.c0.mul(t1A);
    const c1 = this.c1.mul(t1A).neg();

    return Fp2.fromUnreduced({ c0, c1 });
  }

  // static fromJson(json: any): Fp2 {
  //   let value = super.fromJSON(json);
  //   return new Fp2({
  //     c0: FpC.provable.fromJSON(value.c0),
  //     c1: FpC.provable.fromJSON(value.c1),
  //   });
  // }

  static fromJSON(json: any): Fp2 {
    let value = super.fromJSON(json);
    return new Fp2({
        c0: FpC.provable.fromValue(value.c0), 
        c1: FpC.provable.fromValue(value.c1)
    })
  }
}

export { Fp2 };
