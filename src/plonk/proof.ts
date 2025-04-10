import { Fp12, FpC, FrC } from '../towers/index.js';
import { ethers } from 'ethers';
import { assertPointOnBn, assertInBnField, numOfUin256s } from './utils.js';
import assert from 'assert';
import { Field, Struct } from 'o1js';

const NUM_OF_UIN265s = 27;

class Sp1PlonkProof extends Struct({
  l_com_x: FpC.provable,
  l_com_y: FpC.provable,
  r_com_x: FpC.provable,
  r_com_y: FpC.provable,
  o_com_x: FpC.provable,
  o_com_y: FpC.provable,

  h0_x: FpC.provable,
  h0_y: FpC.provable,
  h1_x: FpC.provable,
  h1_y: FpC.provable,
  h2_x: FpC.provable,
  h2_y: FpC.provable,

  l_at_zeta: FrC.provable,
  r_at_zeta: FrC.provable,
  o_at_zeta: FrC.provable,

  s1_at_zeta: FrC.provable,
  s2_at_zeta: FrC.provable,

  grand_product_x: FpC.provable,
  grand_product_y: FpC.provable,

  grand_product_at_omega_zeta: FrC.provable,

  batch_opening_at_zeta_x: FpC.provable,
  batch_opening_at_zeta_y: FpC.provable,

  batch_opening_at_zeta_omega_x: FpC.provable,
  batch_opening_at_zeta_omega_y: FpC.provable,

  qcp_0_at_zeta: FrC.provable,
  qcp_0_wire_x: FpC.provable,
  qcp_0_wire_y: FpC.provable,

  // pairing aux witness
  // c: Fp12,
  // shift_power: Field
}) {
  deserialize(hexProof: string) {
    const defaultEncoder = ethers.AbiCoder.defaultAbiCoder();
    const decodingPattern = Array(27).fill('uint256');

    // skip 0x + first 2 bytes as in Sp1.Verifier
    const shifted = '0x' + hexProof.slice(10);
    const decoded = defaultEncoder.decode(decodingPattern, shifted);

    return new Sp1PlonkProof(fromDecoded(decoded));
  }
}

type ProofType = {
  l_com_x: FpC;
  l_com_y: FpC;
  r_com_x: FpC;
  r_com_y: FpC;
  o_com_x: FpC;
  o_com_y: FpC;

  h0_x: FpC;
  h0_y: FpC;
  h1_x: FpC;
  h1_y: FpC;
  h2_x: FpC;
  h2_y: FpC;

  l_at_zeta: FrC;
  r_at_zeta: FrC;
  o_at_zeta: FrC;

  s1_at_zeta: FrC;
  s2_at_zeta: FrC;

  grand_product_x: FpC;
  grand_product_y: FpC;

  grand_product_at_omega_zeta: FrC;

  batch_opening_at_zeta_x: FpC;
  batch_opening_at_zeta_y: FpC;

  batch_opening_at_zeta_omega_x: FpC;
  batch_opening_at_zeta_omega_y: FpC;

  qcp_0_at_zeta: FrC;
  qcp_0_wire_x: FpC;
  qcp_0_wire_y: FpC;

  // c: Fp12,
  // shift_power: Field
};

const isValid = (decodedProof: bigint[]) => {
  assert(decodedProof.length === NUM_OF_UIN265s);

  assertPointOnBn(decodedProof[0], decodedProof[1]); // l
  assertPointOnBn(decodedProof[2], decodedProof[3]); // r
  assertPointOnBn(decodedProof[4], decodedProof[5]); // o

  assertPointOnBn(decodedProof[6], decodedProof[7]); // h0
  assertPointOnBn(decodedProof[8], decodedProof[9]); // h1
  assertPointOnBn(decodedProof[10], decodedProof[11]); // h2

  assertInBnField(decodedProof[12]); // l(z)
  assertInBnField(decodedProof[13]); // r(z)
  assertInBnField(decodedProof[14]); // o(z)

  assertInBnField(decodedProof[15]); // s1(z)
  assertInBnField(decodedProof[16]); // s2(z)

  assertPointOnBn(decodedProof[17], decodedProof[18]); // grand_product,
  assertInBnField(decodedProof[19]); // grand_product(w*z)

  assertPointOnBn(decodedProof[20], decodedProof[21]); // batch_opening_at_zeta
  assertPointOnBn(decodedProof[22], decodedProof[23]); // batch_opening_at_zeta_omega

  assertInBnField(decodedProof[24]); // qcp_0(zeta)

  assertPointOnBn(decodedProof[25], decodedProof[26]); // qcp_0_wire
};

const fromDecoded = (decodedProof: bigint[]): ProofType => {
  isValid(decodedProof);

  return {
    l_com_x: FpC.from(decodedProof[0]),
    l_com_y: FpC.from(decodedProof[1]),
    r_com_x: FpC.from(decodedProof[2]),
    r_com_y: FpC.from(decodedProof[3]),
    o_com_x: FpC.from(decodedProof[4]),
    o_com_y: FpC.from(decodedProof[5]),
    h0_x: FpC.from(decodedProof[6]),
    h0_y: FpC.from(decodedProof[7]),
    h1_x: FpC.from(decodedProof[8]),
    h1_y: FpC.from(decodedProof[9]),
    h2_x: FpC.from(decodedProof[10]),
    h2_y: FpC.from(decodedProof[11]),
    l_at_zeta: FrC.from(decodedProof[12]),
    r_at_zeta: FrC.from(decodedProof[13]),
    o_at_zeta: FrC.from(decodedProof[14]),
    s1_at_zeta: FrC.from(decodedProof[15]),
    s2_at_zeta: FrC.from(decodedProof[16]),
    grand_product_x: FpC.from(decodedProof[17]),
    grand_product_y: FpC.from(decodedProof[18]),
    grand_product_at_omega_zeta: FrC.from(decodedProof[19]),
    batch_opening_at_zeta_x: FpC.from(decodedProof[20]),
    batch_opening_at_zeta_y: FpC.from(decodedProof[21]),
    batch_opening_at_zeta_omega_x: FpC.from(decodedProof[22]),
    batch_opening_at_zeta_omega_y: FpC.from(decodedProof[23]),
    qcp_0_at_zeta: FrC.from(decodedProof[24]),
    qcp_0_wire_x: FpC.from(decodedProof[25]),
    qcp_0_wire_y: FpC.from(decodedProof[26]),

    // pairing stuff
    // c: make_c(),
    // shift_power: get_shift_power(),
  };
};

const deserializeProof = (hexProof: string): ProofType => {
  const defaultEncoder = ethers.AbiCoder.defaultAbiCoder();
  const decodingPattern = Array(27).fill('uint256');

  // skip 0x + first 2 bytes as in Sp1.Verifier
  const shifted = '0x' + hexProof.slice(10);
  const decoded = defaultEncoder.decode(decodingPattern, shifted);

  return fromDecoded(decoded);
};

export { Sp1PlonkProof, deserializeProof };
