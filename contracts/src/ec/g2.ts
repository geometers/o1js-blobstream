import { Field, Struct } from 'o1js';
import { FpC, Fp2, Fp6, Fp12 } from '../towers/index.js';
import { GAMMA_1S, NEG_GAMMA_13 } from '../towers/precomputed.js';

class G2Affine extends Struct({ x: Fp2, y: Fp2 }) {
  equals(rhs: G2Affine): Field {
    let same_x: Field = this.x.equals(rhs.x);
    let same_y: Field = this.y.equals(rhs.y);

    return same_x.mul(same_y);
  }

  neg() {
    return new G2Affine({ x: this.x, y: this.y.neg() });
  }

  // a = 0 for bn
  computeLambdaSame(): Fp2 {
    // λ = 3x^2 / 2y
    let num = this.x.square().mul_by_fp(FpC.from(3n));
    let denom = this.y.mul_by_fp(FpC.from(2n)).inverse();

    return num.mul(denom);
  }

  computeLambdaDiff(rhs: G2Affine): Fp2 {
    // λ = (y2 - y1) / (x2 - x1)
    let num = rhs.y.sub(this.y);
    let denom = rhs.x.sub(this.x).inverse();

    return num.mul(denom);
  }

  computeMu(lambda: Fp2) {
    return this.y.sub(this.x.mul(lambda));
  }

  // assumes that this and rhs are not 0 points
  add(rhs: G2Affine): G2Affine {
    const eq = this.equals(rhs);

    let lambda;
    if (eq.toBigInt() === 1n) {
      lambda = this.computeLambdaSame();
    } else {
      lambda = this.computeLambdaDiff(rhs);
    }

    const x_3 = lambda.square().sub(this.x).sub(rhs.x);
    const y_3 = lambda.mul(this.x.sub(x_3)).sub(this.y);

    return new G2Affine({ x: x_3, y: y_3 });
  }

  double_from_line(lambda: Fp2) {
    const x_3 = lambda.square().sub(this.x).sub(this.x); // x_3 = λ^2 - 2x_1
    const y_3 = lambda.mul(this.x.sub(x_3)).sub(this.y); // y_3 = λ(x_1 - x_3) - y_1

    return new G2Affine({ x: x_3, y: y_3 });
  }

  add_from_line(lambda: Fp2, rhs: G2Affine) {
    const x_3 = lambda.square().sub(this.x).sub(rhs.x); // x_3 = λ^2 - x_1 - x_2
    const y_3 = lambda.mul(this.x.sub(x_3)).sub(this.y); // y_3 = λ(x_1 - x_3) - y_1

    return new G2Affine({ x: x_3, y: y_3 });
  }

  frobenius() {
    const x = this.x.conjugate().mul(GAMMA_1S[1]);
    const y = this.y.conjugate().mul(GAMMA_1S[2]);

    return new G2Affine({ x, y });
  }

  frobFromInputs(g1: Fp2, g2: Fp2) {
    const x = this.x.conjugate().mul(g1);
    const y = this.y.conjugate().mul(g2);

    return new G2Affine({ x, y });
  }

  negative_frobenius() {
    const x = this.x.conjugate().mul(GAMMA_1S[1]);
    const y = this.y.conjugate().mul(NEG_GAMMA_13);

    return new G2Affine({ x, y });
  }

  negFrobFromInputs(g1: Fp2, g2: Fp2) {
    const x = this.x.conjugate().mul(g1);
    const y = this.y.conjugate().mul(g2);

    return new G2Affine({ x, y });
  }

  // g + hw = g0 + h0W + g1W^2 + h1W^3 + g2W^4 + h2W^5
  // PSI: (x, y) -> (w^2x, w^3y)
  hom(): [Fp12, Fp12] {
    const x_g = new Fp6({ c0: Fp2.zero(), c1: this.x, c2: Fp2.zero() });
    const x_h = Fp6.zero();
    const x = new Fp12({ c0: x_g, c1: x_h });

    const y_g = Fp6.zero();
    const y_h = new Fp6({ c0: Fp2.zero(), c1: this.y, c2: Fp2.zero() });
    const y = new Fp12({ c0: y_g, c1: y_h });

    return [x, y];
  }
}

export { G2Affine };
