import { Field, Struct, Provable } from 'o1js';
import { FpC } from './fp.js';

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

  equals(rhs: Fp2): Field {
    return this.c0.equals(rhs.c0).and(this.c1.equals(rhs.c1)).toField();
  }

  neg(): Fp2 {
    return new Fp2({
      c0: this.c0.neg().assertCanonical(),
      c1: this.c1.neg().assertCanonical(),
    });
  }

  conjugate(): Fp2 {
    return new Fp2({ c0: this.c0, c1: this.c1.neg().assertCanonical() });
  }

  add(rhs: Fp2): Fp2 {
    const c0 = this.c0.add(rhs.c0).assertCanonical();
    const c1 = this.c1.add(rhs.c1).assertCanonical();

    return new Fp2({ c0, c1 });
  }

  add_fp(rhs: FpC) {
    const c0 = this.c0.add(rhs).assertCanonical();
    return new Fp2({ c0, c1: this.c1 });
  }

  sub(rhs: Fp2): Fp2 {
    const c0 = this.c0.sub(rhs.c0).assertCanonical();
    const c1 = this.c1.sub(rhs.c1).assertCanonical();

    return new Fp2({ c0, c1 });
  }

  mul_by_fp(rhs: FpC) {
    const c0 = this.c0.mul(rhs).assertCanonical();
    const c1 = this.c1.mul(rhs).assertCanonical();

    return new Fp2({ c0, c1 });
  }

  mul_by_non_residue(): Fp2 {
    return this.mul(new Fp2({ c0: FpC.from(9n), c1: FpC.from(1n) }));
  }

  // uses the fact that we work over modulus: X^2 + 1
  mul(rhs: Fp2): Fp2 {
    // QN: this two assertCanonical calls can probably me omitted
    const a0b0 = this.c0.mul(rhs.c0).assertCanonical();
    const a1b1 = this.c1.mul(rhs.c1).assertCanonical();

    const c0 = a0b0.sub(a1b1).assertCanonical();

    const xx = this.c0.add(this.c1).assertCanonical();
    const yy = rhs.c0.add(rhs.c1).assertCanonical();

    const c1 = xx.mul(yy).sub(a0b0).sub(a1b1).assertCanonical();

    return new Fp2({ c0, c1 });
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
