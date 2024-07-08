import { Bool, Field, UInt8 } from "o1js";
import { FpC } from "../towers/index.js";


const provableBn254BaseFieldToBytes = (x: FpC) => {
    // prepend 2 zero bits to make it a multiple of 8 (256 bits)
    let bits = [Bool(false), Bool(false)];
    bits = bits.concat(x.toBits())

    console.log(bits.length)

    const chunks: UInt8[] = [];

    for (let i = 0; i < bits.length; i += 8) {
        let chunk = Field.fromBits(bits.slice(i, i + 8));
        chunks.push(UInt8.Unsafe.fromField(chunk));
    }

    return chunks;
}

const lhs = provableBn254BaseFieldToBytes(FpC.from(1n));
const rhs = provableBn254BaseFieldToBytes(FpC.from(1n));

let full = lhs.concat(rhs);
console.log(full.length);


