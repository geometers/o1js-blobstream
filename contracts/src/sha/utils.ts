import { Bool, Field, UInt8 } from "o1js";
import { FpC, FrC } from "../towers/index.js";

const provableBn254BaseFieldToBytes = (x: FpC) => {
    // append 2 zero bits to make it a multiple of 8 (256 bits)
    let bits = [Bool(false), Bool(false)];
    bits = x.toBits().concat(bits)

    const chunks: UInt8[] = [];

    for (let i = 0; i < bits.length; i += 8) {
        let chunk = Field.fromBits(bits.slice(i, i + 8));
        chunks.push(UInt8.Unsafe.fromField(chunk));
    }

    return chunks.reverse();
}

const provableBn254ScalarFieldToBytes = (x: FrC) => {
    // append 2 zero bits to make it a multiple of 8 (256 bits)
    let bits = [Bool(false), Bool(false)];
    bits = x.toBits().concat(bits)

    const chunks: UInt8[] = [];

    for (let i = 0; i < bits.length; i += 8) {
        let chunk = Field.fromBits(bits.slice(i, i + 8));
        chunks.push(UInt8.Unsafe.fromField(chunk));
    }

    return chunks.reverse();
}

const xorBytes = (x: UInt8[], y: UInt8[]) => {
    
}

export { provableBn254BaseFieldToBytes, provableBn254ScalarFieldToBytes }


