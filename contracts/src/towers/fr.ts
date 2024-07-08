import { createForeignField } from 'o1js';
class Fr extends createForeignField(21888242871839275222246405745257275088548364400416034343698204186575808495617n) {}

class FrU extends Fr.Unreduced {}
class FrA extends Fr.AlmostReduced {}
class FrC extends Fr.Canonical {}

export { Fr, FrU, FrA, FrC };
