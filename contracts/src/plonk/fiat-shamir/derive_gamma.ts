import { provableBn254BaseFieldToBytes } from "../../sha/utils.js";
import { FpU } from "../../towers/fp.js";
import { FpC } from "../../towers/index.js";
import { Bool, Bytes, Field, Hash, Provable, UInt8 } from "o1js";

class BytesGamma extends Bytes(5 + 32) {}

const deriveGamma = (vx: FpC) => { 
    const gamma = FpC.from(0x67616d6d61);

    let gamma_bytes = provableBn254BaseFieldToBytes(gamma); 
    let vx_bytes = provableBn254BaseFieldToBytes(vx); 

    // gamma is 39 bits, so we leave only 40 bits (to keep it multiple of 8)
    // and we cut the rest (256 - 40) bits which is 27 bytes 
    gamma_bytes = gamma_bytes.slice(27, 32); 

    return new BytesGamma(gamma_bytes.concat(vx_bytes))
}

const vx = FpC.from(10627327753818917257580031743580923447218792977466576262416509126412843282369n)
let hash = Hash.SHA2_256.hash(deriveGamma(vx));
console.log(hash.toHex());

console.log('int: ', BigInt('0x' + hash.toHex()))

let fields = hash.toFields()

// let bitStr = "";
const shaBitRepr: Bool[] = []
let bit255 = Bool(false)
let bit256 = Bool(false)

for (let i = 31; i >= 0; i--) {
    console.log(fields[i].toBigInt())
    const bits = fields[i].toBits(); 
    for (let j = 0; j < 8; j++) {
        // we skip last 2 bits
        if (i == 0 && j == 6) {
            bit255 = bits[j].toBoolean() ? Bool(true) : Bool(false);
        } else if (i == 0 && j == 7) {
            bit256 = bits[j].toBoolean() ? Bool(true) : Bool(false);
        } else {
            const x = bits[j].toBoolean() ? Bool(true) : Bool(false);
            shaBitRepr.push(x)
        }
    }
}

const sh254 = FpC.from(7059779437489773633646340506914701874621185009112317347175358107333056201401n) // 2^254 % q
const sh255 = FpC.from(14119558874979547267292681013829403749242370018224634694350716214666112402802n) // 2^255 % q

console.log(shaBitRepr.length)
let x = FpU.fromBits(shaBitRepr)
console.log('x: ', x.toBigInt())

const a = Provable.if(bit255.equals(Bool(true)), FpC.provable, sh254, FpC.from(0n))
const b = Provable.if(bit256.equals(Bool(true)), FpC.provable, sh255, FpC.from(0n))

const res = x.add(a).add(b).assertCanonical(); 
console.log('res: ', res.toBigInt());

// let shaBitRepr: Bool[] = []
// for (let i = 0; i < 32; i++) {
//     const bits = fields[i].toBits(); 
//     for (let j = 0; j < 8; j++) {
//         const x = bits[j].toBoolean() ? Bool(true) : Bool(false);
//         shaBitRepr.push(x)
//     }
// }

// shaBitRepr = shaBitRepr.reverse()
// shaBitRepr = shaBitRepr.slice(0, 254)

// let x = FpU.fromBits(shaBitRepr)
// console.log(x.toBigInt())

// let str92 = "01011100"
// let bits1 = [Bool(true), Bool(false), Bool(false), Bool(false), Bool(false), Bool(false), Bool(false), Bool(false)]
// let bits92 = [Bool(false), Bool(false), Bool(true), Bool(true), Bool(true), Bool(false), Bool(true), Bool(false)]

// let x = Field.fromBits(bits92)
// console.log(x)

// let x = FpU.from(41934624648789633692325845435058116789193741866735454986050232623745889205117n)
// let y = x.assertCanonical()
// console.log(x.toBigInt())
// console.log(y.toBigInt())


