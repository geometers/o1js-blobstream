import { Field, Struct } from 'o1js';
import { FpC, FpU, FpA } from './fp.js';

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

  add_fp(rhs: FpC) {
    const c0 = this.c0.add(rhs);
    return new Fp2({ c0: c0.assertAlmostReduced(), c1: this.c1 });
  }

  sub(rhs: Fp2): Fp2 {
    const c0 = this.c0.sub(rhs.c0);
    const c1 = this.c1.sub(rhs.c1);

    return Fp2.fromUnreduced({ c0, c1 });
  }

  mul_by_fp(rhs: FpC) {
    const c0 = this.c0.mul(rhs);
    const c1 = this.c1.mul(rhs);

    return Fp2.fromUnreduced({ c0, c1 });
  }

  mul_by_non_residue(): Fp2 {
    return this.mul(new Fp2({ c0: FpC.from(9n), c1: FpC.from(1n) }));
  }

  // uses the fact that we work over modulus: X^2 + 1
  mul(rhs: Fp2): Fp2 {
    // QN: this two assertCanonical calls can probably me omitted
    const a0b0 = this.c0.mul(rhs.c0).assertCanonical();
    const a1b1 = this.c1.mul(rhs.c1).assertCanonical();

    const c0 = a0b0.sub(a1b1);

    const xx = this.c0.add(this.c1);
    const yy = rhs.c0.add(rhs.c1);
    let { c0: xxA, c1: yyA } = Fp2.fromUnreduced({ c0: xx, c1: yy });

    const c1 = xxA.mul(yyA).sub(a0b0).sub(a1b1);

    return Fp2.fromUnreduced({ c0, c1 });
  }

  square(): Fp2 {
    return this.mul(this);
  }

  inverse(): Fp2 {
    let t0 = this.c0.mul(this.c0).assertCanonical();
    let t1 = this.c1.mul(this.c1).assertCanonical();

    // beta = -1
    t0 = t0.add(t1).assertCanonical();
    t1 = FpC.from(1n).div(t0).assertCanonical();

    const c0 = this.c0.mul(t1).assertCanonical();
    const c1 = this.c1.mul(t1).neg().assertCanonical();

    return new Fp2({ c0, c1 });
  }

  static fromJson(json: any): Fp2 {
    return new Fp2({
      c0: FpC.provable.fromJSON(json.c0.value),
      c1: FpC.provable.fromJSON(json.c1.value),
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
