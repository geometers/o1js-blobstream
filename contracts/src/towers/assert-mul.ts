/**
 * More efficient multiplication of sums
 */

import { AlmostForeignField, ForeignField, Gadgets, assert } from 'o1js';

export { assertMul, UnreducedSum, AlmostReducedSum };

type ForeignFieldSum = ReturnType<typeof Gadgets.ForeignField.Sum>;

// typed version of `Gadgets.ForeignField.assertMul()`

// function assertMul(
//   a: AlmostReducedSum | AlmostForeignField,
//   b: AlmostReducedSum | AlmostForeignField,
//   c: UnreducedSum | ForeignField
// ) {
//   assert(a.modulus === b.modulus && a.modulus === c.modulus);
//   Gadgets.ForeignField.assertMul(a.value, b.value, c.value, a.modulus);
// }

function assertMul(
  a: AlmostReducedSum | AlmostForeignField,
  b: AlmostReducedSum | AlmostForeignField,
  c: UnreducedSum | ForeignField
) {
  assert(a.modulus === b.modulus && a.modulus === c.modulus);
  Gadgets.ForeignField.assertMul(a.value, b.value, c.value, a.modulus);
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
}

class AlmostReducedSum {
  value: ForeignFieldSum;
  modulus: bigint;
  type: typeof ForeignField;

  constructor(input: AlmostForeignField) {
    this.value = Gadgets.ForeignField.Sum(input.value);
    this.modulus = input.modulus;
    this.type = input.Constructor;
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
