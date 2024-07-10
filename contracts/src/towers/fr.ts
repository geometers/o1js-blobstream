import { createForeignField } from 'o1js';
class Fr extends createForeignField(21888242871839275222246405745257275088548364400416034343698204186575808495617n) {}

class FrU extends Fr.Unreduced {}
class FrA extends Fr.AlmostReduced {}
class FrC extends Fr.Canonical {}

function powFr(x: FrC, exp: Array<number>) {
    let r = Fr.from(x).assertCanonical()

    const n = exp.length;
    for (let i = 1; i < n; i++) {
      r = r.mul(r).assertCanonical();

      if (exp[i] == 1) {
        r = r.mul(x).assertCanonical();
      }

    }

    return r;
}

export { Fr, FrU, FrA, FrC, powFr };
