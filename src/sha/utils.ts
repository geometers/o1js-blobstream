import { Bool, Field, UInt8, Provable } from 'o1js';
import { FpC, FrC } from '../towers/index.js';

const provableBn254BaseFieldToBytes = (x: FpC) => {
  // append 2 zero bits to make it a multiple of 8 (256 bits)
  let bits = [Bool(false), Bool(false)];
  bits = x.toBits().concat(bits);

  const chunks: UInt8[] = [];

  for (let i = 0; i < bits.length; i += 8) {
    let chunk = Field.fromBits(bits.slice(i, i + 8));
    chunks.push(UInt8.Unsafe.fromField(chunk));
  }

  return chunks.reverse();
};

const provableBn254ScalarFieldToBytes = (x: FrC) => {
  // append 2 zero bits to make it a multiple of 8 (256 bits)
  let bits = [Bool(false), Bool(false)];
  bits = x.toBits().concat(bits);

  const chunks: UInt8[] = [];

  for (let i = 0; i < bits.length; i += 8) {
    let chunk = Field.fromBits(bits.slice(i, i + 8));
    chunks.push(UInt8.Unsafe.fromField(chunk));
  }

  return chunks.reverse();
};

function bytesToWord(wordBytes: UInt8[]): Field {
  return wordBytes.reduce((acc, byte, idx) => {
    const shift = 1n << BigInt(8 * idx);
    return acc.add(byte.value.mul(shift));
  }, Field.from(0));
}

function wordToBytes(word: Field, bytesPerWord = 8): UInt8[] {
  let bytes = Provable.witness(Provable.Array(UInt8, bytesPerWord), () => {
    let w = word.toBigInt();
    return Array.from({ length: bytesPerWord }, (_, k) =>
      UInt8.from((w >> BigInt(8 * k)) & 0xffn)
    );
  });

  // check decomposition
  bytesToWord(bytes).assertEquals(word);

  return bytes;
}

export {
  provableBn254BaseFieldToBytes,
  provableBn254ScalarFieldToBytes,
  wordToBytes,
  bytesToWord,
};
