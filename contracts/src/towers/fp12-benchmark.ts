import { Provable } from 'o1js';
import { Fp12 } from './fp12.js';

function main() {
  let a = Provable.witness(Fp12, () => Fp12.one());
  let b = Provable.witness(Fp12, () => Fp12.one());
  a.mul(b);
}

let cs = await Provable.constraintSystem(main);
console.log(cs.summary());
