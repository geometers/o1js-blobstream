import { Field, Struct, assert } from 'o1js';
import { G1Affine, G2Affine } from '../ec/index.js';
import { FpC, Fp2, Fp6, Fp12 } from '../towers/index.js';
import { computeLineCoeffs } from './coeffs.js';
import { AffineCache } from './precompute.js';

const F_ONE = Field(1);
const ZERO = Fp2.zero();

class G2Line extends Struct({ lambda: Fp2, neg_mu: Fp2 }) {
  constructor(lambda: Fp2, neg_mu: Fp2) {
    super({ lambda, neg_mu });
  }

  static fromJSON(json: any): G2Line {
    let value = super.fromJSON(json);
    return new G2Line(value.lambda, value.neg_mu);
  }

  static fromPoints(lhs: G2Affine, rhs: G2Affine): G2Line {
    const eq = lhs.equals(rhs);

    let lambda: Fp2;
    if (eq.toBigInt() === 1n) {
      lambda = lhs.computeLambdaSame();
    } else {
      lambda = lhs.computeLambdaDiff(rhs);
    }

    return new G2Line(lambda, lhs.computeMu(lambda).neg());
  }

  // g + hw = g0 + h0W + g1W^2 + h1W^3 + g2W^4 + h2W^5
  psi(cache: AffineCache): Fp12 {
    const g0 = new Fp2({ c0: FpC.from(1n), c1: FpC.from(0) });
    const h0 = this.lambda.mul_by_fp(cache.xp_prime);
    const g1 = Fp2.zero();
    const h1 = this.neg_mu.mul_by_fp(cache.yp_prime);
    const g2 = Fp2.zero();
    const h2 = Fp2.zero();

    const c0 = new Fp6({ c0: g0, c1: g1, c2: g2 });
    const c1 = new Fp6({ c0: h0, c1: h1, c2: h2 });

    return new Fp12({ c0, c1 });
  }

  // L, T : Y − (λX + µ) = 0
  evaluate(p: G2Affine): Fp2 {
    let t = this.lambda.mul(p.x);
    t = t.neg();
    t = t.add(this.neg_mu);
    return t.add(p.y);
  }

  // L, T : Y − (λX + µ) = 0
  assert_is_line(t: G2Affine, q: G2Affine) {
    let e1 = this.evaluate(t);
    let e2 = this.evaluate(q);

    e1.assert_equals(ZERO);
    e2.assert_equals(ZERO);
  }

  assert_is_tangent(p: G2Affine) {
    let e = this.evaluate(p);
    e.assert_equals(ZERO);

    let dbl_lambda_y = this.lambda.add(this.lambda).mul(p.y);
    const x_square = p.x.square();
    dbl_lambda_y.assert_equals(x_square.mul_by_fp(FpC.from(3n)));
    // dbl_lambda_y.assert_equals(x_square.add(x_square).add(x_square));
  }

  // L, T : Y − (λX + µ) = 0
  evaluate_g1(p: G1Affine): Fp2 {
    let t = this.lambda.mul_by_fp(p.x);
    t = t.neg();
    t = t.add(this.neg_mu);
    return t.add_fp(p.y);
  }
}

export { G2Line, computeLineCoeffs };
