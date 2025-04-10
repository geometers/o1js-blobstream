// stores some of the data that can be precomputed when using affine repr:

import { Provable } from 'o1js';
import { G1Affine } from '../ec/index.js';
import { Fp2, FpC } from '../towers/index.js';

// see: https://eprint.iacr.org/2013/722.pdf
class AffineCache {
  xp_neg: FpC;
  yp_prime: FpC;
  xp_prime: FpC;

  constructor(p: G1Affine) {
    this.xp_neg = p.x.neg().assertCanonical();
    this.yp_prime = p.y.inv().assertCanonical();
    this.yp_prime = Provable.witness(FpC.provable, () =>
      p.y.inv().assertCanonical()
    );
    this.yp_prime.mul(p.y).assertEquals(FpC.from(1n));
    this.xp_prime = this.xp_neg.mul(this.yp_prime).assertCanonical();
  }
}

export { AffineCache };
