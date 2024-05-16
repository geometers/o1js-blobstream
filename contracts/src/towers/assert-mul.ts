/**
 * More efficient multiplication of sums
 */

import { AlmostForeignField, ForeignField, Gadgets, assert } from 'o1js';

export { assertMul, UnreducedSum, AlmostReducedSum };

type ForeignFieldSum = ReturnType<typeof Gadgets.ForeignField.Sum>;

// typed version of `Gadgets.ForeignField.assertMul()`

function assertMul(a: AlmostReducedSum, b: AlmostReducedSum, c: UnreducedSum) {
  assert(a.modulus === b.modulus && a.modulus === c.modulus);
  Gadgets.ForeignField.assertMul(a.sum, b.sum, c.sum, a.modulus);
}

// typed wrappers around `Gadgets.ForeignField.Sum`

class UnreducedSum {
  sum: ForeignFieldSum;
  modulus: bigint;

  constructor(input: ForeignField) {
    this.sum = Gadgets.ForeignField.Sum(input.value);
    this.modulus = input.modulus;
  }

  add(input: ForeignField) {
    this.sum = this.sum.add(input.value);
    return this;
  }
  sub(input: ForeignField) {
    this.sum = this.sum.sub(input.value);
    return this;
  }
}

class AlmostReducedSum {
  sum: ForeignFieldSum;
  modulus: bigint;

  constructor(input: AlmostForeignField) {
    this.sum = Gadgets.ForeignField.Sum(input.value);
    this.modulus = input.modulus;
  }

  add(input: AlmostForeignField) {
    this.sum = this.sum.add(input.value);
    return this;
  }
  sub(input: AlmostForeignField) {
    this.sum = this.sum.sub(input.value);
    return this;
  }
}
