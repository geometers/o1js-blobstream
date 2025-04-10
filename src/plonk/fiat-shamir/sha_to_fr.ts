import { Bool, Bytes, Provable } from 'o1js';
import { FrC, FrU } from '../../towers/index.js';

export function shaToFr(hashDigest: Bytes): FrC {
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

  const res: FrC = x.add(a).add(b).assertCanonical();
  return res;
}
