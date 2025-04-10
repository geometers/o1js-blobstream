/**
 * More efficient multiplication of sums
 */
import {
  AlmostForeignField,
  Field,
  ForeignField,
  Gadgets,
  Provable,
  assert,
} from 'o1js';

export { assertMul, UnreducedSum, AlmostReducedSum };

type ForeignFieldSum = ReturnType<typeof Gadgets.ForeignField.Sum>;

// typed version of `Gadgets.ForeignField.assertMul()`

function assertMul(
  a: AlmostReducedSum | AlmostForeignField,
  b: AlmostReducedSum | AlmostForeignField,
  c: UnreducedSum | ForeignField
) {
  assert(a.modulus === b.modulus && a.modulus === c.modulus);
  a = AlmostReducedSum.from(a);
  b = AlmostReducedSum.from(b);
  c = UnreducedSum.from(c);

  // finish the b and c sums with a zero gate
  let bF = b.value.finishForMulInput(a.modulus);
  let cF = c.value.finish(a.modulus);

  // if not all inputs are constant, but either b or c are,
  // move them into variables first to prevent them from breaking the gate chain
  let allConstant =
    a.value.isConstant() &&
    Gadgets.Field3.isConstant(bF) &&
    Gadgets.Field3.isConstant(cF);

  if (!allConstant) {
    let [b0, b1, b2] = bF.map(toVariable);
    bF = [b0, b1, b2];
    let [c0, c1, c2] = cF.map(toVariable);
    cF = [c0, c1, c2];
  }

  Gadgets.ForeignField.assertMul(a.value, bF, cF, a.modulus);
}

// typed wrappers around `Gadgets.ForeignField.Sum`

class UnreducedSum {
  value: ForeignFieldSum;
  modulus: bigint;
  type: typeof ForeignField;

  constructor(input: ForeignField) {
    this.value = Gadgets.ForeignField.Sum(input.value);
    this.modulus = input.modulus;
    this.type = input.Constructor;
  }

  add(input: ForeignField) {
    this.value = this.value.add(input.value);
    return this;
  }
  sub(input: ForeignField) {
    this.value = this.value.sub(input.value);
    return this;
  }

  toBigint() {
    return Gadgets.Field3.toBigint(this.value.finish(this.modulus));
  }

  static from<S extends UnreducedSum>(sum: S | ForeignField): S {
    if (sum instanceof UnreducedSum) return sum;
    return new (this as any)(sum);
  }
}

class AlmostReducedSum extends UnreducedSum {
  constructor(input: AlmostForeignField) {
    super(input);
  }

  add(input: AlmostForeignField) {
    this.value = this.value.add(input.value);
    return this;
  }
  sub(input: AlmostForeignField) {
    this.value = this.value.sub(input.value);
    return this;
  }
}

function toVariable(x: Field) {
  let xv = Provable.witness(Field, () => x);
  xv.assertEquals(x);
  return xv;
}
