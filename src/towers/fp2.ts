import { Field, Provable, Struct } from 'o1js';
import { FpC, FpU, FpA } from './fp.js';
import { AlmostReducedSum, UnreducedSum, assertMul } from './assert-mul.js';

class Fp2 extends Struct({ c0: FpA.provable, c1: FpA.provable }) {
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
    let [c0A, c0B] = FpA.assertAlmostReduced(c0, c1);
    return new Fp2({ c0: c0A, c1: c0B });
  }

  equals(rhs: Fp2): Field {
    let a = this.canonical();
    let b = rhs.canonical();
    return a.c0.equals(b.c0).and(a.c1.equals(b.c1)).toField();
  }

  neg(): Fp2 {
    return new Fp2({ c0: this.c0.neg(), c1: this.c1.neg() });
  }

  conjugate(): Fp2 {
    return new Fp2({ c0: this.c0, c1: this.c1.neg() });
  }

  add(rhs: Fp2): Fp2 {
    const c0 = this.c0.add(rhs.c0);
    const c1 = this.c1.add(rhs.c1);

    return Fp2.fromUnreduced({ c0, c1 });
  }

  add_fp(rhs: FpA) {
    const c0 = this.c0.add(rhs);
    return new Fp2({ c0: c0.assertAlmostReduced(), c1: this.c1 });
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

    let sum_a0_a1 = new AlmostReducedSum(this.c0).add(this.c1);
    let sum_b0_b1 = new AlmostReducedSum(rhs.c0).add(rhs.c1);
    let sum_c1_a0b0_a1b1 = new UnreducedSum(c1).add(a0b0).add(a1b1);
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

    let sum_a0_a1 = new AlmostReducedSum(this.c0).add(this.c1);
    let diff_a0_a1 = new AlmostReducedSum(this.c0).sub(this.c1);
    assertMul(sum_a0_a1, diff_a0_a1, c0);

    let sum_a0_a0 = new AlmostReducedSum(this.c0).add(this.c0);
    assertMul(sum_a0_a0, this.c1, c1);

    return Fp2.fromUnreduced({ c0, c1 });
  }

  inverse(): Fp2 {
    let t0 = this.c0.mul(this.c0);
    let t1 = this.c1.mul(this.c1);

    // beta = -1
    t0 = t0.add(t1);
    // TODO this should be doable with 1 assertAlmostReduced + assertMul
    let t1A = t0.assertAlmostReduced().inv().assertAlmostReduced();

    const c0 = this.c0.mul(t1A);
    const c1 = this.c1.mul(t1A).neg();

    return Fp2.fromUnreduced({ c0, c1 });
  }

  static loadFromJson(json: any): Fp2 {
    const c0: FpC = FpC.provable.fromJSON(json.c0);
    const c1: FpC = FpC.provable.fromJSON(json.c1);
    return new Fp2({
      c0,
      c1,
    });
  }
}

// function main() {
//     let c0 = Provable.witness(
//       FpC.provable,
//       () => FpC.from(21888242871839275222246405745257275088696357297823662689037894645226208581n)
//     );
//     let c1 = Provable.witness(
//         FpC.provable,
//         () => FpC.from(21888242871839275246405745257275088696311157297823662689037894645226208581n)
//     );
//     let fp2 = new Fp2({c0, c1});
//     let s = fp2.square();
//     let sinv = Provable.witness(Fp2, () => s.inverse());
//     sinv.mul(s).assertEquals(Fp2.one());
// }

// (async () => {
//     console.time('running Fp2 constant version');
//     await main();
//     console.timeEnd('running Fp2 constant version');

//     console.time('running Fp2 witness generation & checks');
//     await Provable.runAndCheck(main);
//     console.timeEnd('running Fp2 witness generation & checks');

//     console.time('creating Fp2 constraint system');
//     let cs = await Provable.constraintSystem(main);
//     console.timeEnd('creating Fp2 constraint system');

//     console.log(cs.summary());
// })();

export { Fp2 };
