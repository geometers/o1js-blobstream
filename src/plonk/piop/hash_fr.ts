import { Bool, Bytes, Gadgets, Hash, Provable, Struct, UInt8 } from 'o1js';
import { FpC, FrC, FrU } from '../../towers/index.js';
import { provableBn254BaseFieldToBytes } from '../../sha/utils.js';

class Bytes32 extends Bytes(32) {}
class Bytes64 extends Bytes(64) {}
class Bytes3 extends Bytes(3) {}
class Bytes1 extends Bytes(1) {}
class Bytes11 extends Bytes(11) {}

class BytesB0 extends Bytes(64 + 32 + 32 + 3 + 11 + 1) {} // 0 || 0 || x || y || HASH_FR_LEN_IN_BYTES || PLONK || HASH_FR_SIZE_DOMAIN
class BytesB1 extends Bytes(32 + 1 + 11 + 1) {} // b0_digest || 1 || PLONK || HASH_FR_SIZE_DOMAIN
class BytesB2 extends Bytes(32 + 1 + 11 + 1) {} // b0_digest ^ b1_digest || 2 || PLONK || HASH_FR_SIZE_DOMAIN

// assumes that lhs and rhs are Bytes32
function xorShaOutputs(lhs: Bytes, rhs: Bytes): UInt8[] {
  let xff = lhs.toFields();
  let yff = rhs.toFields();

  let xoredFields = [];

  for (let i = 0; i < 32; i++) {
    const x = Gadgets.xor(xff[i], yff[i], 8);
    xoredFields.push(UInt8.Unsafe.fromField(x));
  }

  return xoredFields;
}

function shr128(hashDigest: Bytes): FrC {
  let fields = hashDigest.toFields();

  const shaBitRepr: Bool[] = [];

  for (let i = 15; i >= 0; i--) {
    const bits = fields[i].toBits();
    for (let j = 0; j < 8; j++) {
      shaBitRepr.push(bits[j]);
    }
  }

  return FrC.fromBits(shaBitRepr).assertCanonical();
}

function shl_123_modR(hashDigest: Bytes) {
  let fields = hashDigest.toFields();

  const shaBitRepr: Bool[] = [];
  let bit255 = Bool(false);
  let bit256 = Bool(false);

  for (let i = 31; i >= 0; i--) {
    const bits = fields[i].toBits();
    for (let j = 0; j < 8; j++) {
      // we skip last 2 bits
      if (i == 0 && j == 6) {
        bit255 = bits[j];
      } else if (i == 0 && j == 7) {
        bit256 = bits[j];
      } else {
        shaBitRepr.push(bits[j]);
      }
    }
  }

  const sh254 =
    FrC.from(
      7059779437489773633646340506914701874769131765994106666166191815402473914367n
    ); // 2^254 % r
  const sh255 =
    FrC.from(
      14119558874979547267292681013829403749538263531988213332332383630804947828734n
    ); // 2^255 % r

  let x = FrU.fromBits(shaBitRepr);

  const a = Provable.if(
    bit255.equals(Bool(true)),
    FrC.provable,
    sh254,
    FrC.from(0n)
  );
  const b = Provable.if(
    bit256.equals(Bool(true)),
    FrC.provable,
    sh255,
    FrC.from(0n)
  );

  const SH = FrC.from(340282366920938463463374607431768211456n); // 2^128

  let res = x.mul(SH).assertCanonical();
  res = res.add(a.mul(SH).assertCanonical()).assertCanonical();
  res = res.add(b.mul(SH).assertCanonical()).assertCanonical();

  return res;
}

class HashFr extends Struct({
  ZERO_UINT_2: Bytes64.provable,
  HASH_FR_LEN_IN_BYTES: Bytes3.provable,
  HASH_FR_SIZE_DOMAIN: Bytes1.provable,

  BSB22_Plonk: Bytes11.provable,
}) {
  constructor() {
    super({
      ZERO_UINT_2: new Bytes64(
        Array.from({ length: 64 }, () => UInt8.from(0n))
      ),
      HASH_FR_LEN_IN_BYTES: new Bytes3([
        UInt8.from(0n),
        UInt8.from(48n),
        UInt8.from(0n),
      ]),
      HASH_FR_SIZE_DOMAIN: new Bytes1([UInt8.from(11n)]),
      BSB22_Plonk: new Bytes11([
        UInt8.from(0x42n),
        UInt8.from(0x53n),
        UInt8.from(0x42n),
        UInt8.from(0x32n),
        UInt8.from(0x32n),
        UInt8.from(0x2dn),
        UInt8.from(0x50n),
        UInt8.from(0x6cn),
        UInt8.from(0x6fn),
        UInt8.from(0x6en),
        UInt8.from(0x6bn),
      ]),
    });
  }

  hash(x: FpC, y: FpC): FrC {
    let bytes: UInt8[] = Array.from({ length: 64 }, () => UInt8.from(0n));

    bytes = bytes.concat(provableBn254BaseFieldToBytes(x));
    bytes = bytes.concat(provableBn254BaseFieldToBytes(y));

    bytes = bytes.concat(this.HASH_FR_LEN_IN_BYTES.bytes);
    bytes = bytes.concat(this.BSB22_Plonk.bytes);

    bytes = bytes.concat(this.HASH_FR_SIZE_DOMAIN.bytes);

    const b0 = Hash.SHA2_256.hash(new BytesB0(bytes));

    // reset
    bytes = [];
    bytes = bytes.concat(b0.bytes);

    bytes = bytes.concat([UInt8.from(1n)]);
    bytes = bytes.concat(this.BSB22_Plonk.bytes);

    bytes = bytes.concat(this.HASH_FR_SIZE_DOMAIN.bytes);

    const b1 = Hash.SHA2_256.hash(new BytesB1(bytes));

    // reset again
    bytes = xorShaOutputs(b0, b1);

    bytes = bytes.concat([UInt8.from(2n)]);
    bytes = bytes.concat(this.BSB22_Plonk.bytes);

    bytes = bytes.concat(this.HASH_FR_SIZE_DOMAIN.bytes);

    const b2 = Hash.SHA2_256.hash(new BytesB2(bytes));

    let res = shl_123_modR(b1);
    const low = shr128(b2);
    res = res.add(low).assertCanonical();
    return res;
  }
}

export { HashFr };
