import { Bytes, Hash, Gadgets, UInt32 } from 'o1js';

let preimage = 'aaaabbbb';
class Bytes8 extends Bytes(8) {}
let preimageBytes = Bytes8.fromString(preimage);

let hash = Gadgets.SHA256.hash(preimageBytes);
console.log(hash.toHex()); // e5c1edb50ff8b4fcc3ead3a845ffbe1ad51c9dae5d44335a5c333b57ac8df062

// let's now split sha into two runs
class Bytes4 extends Bytes(4) {}

const hash_1 = Gadgets.SHA256.hash(Bytes4.fromString('aaaa'));
console.log(hash_1.toHex());

const h2 = Gadgets.SHA256.initialState;

// const H: UInt32[] = [];
// for (let i = 0; i < 32; i+= 4) {
//     H.push(hash_1.bytes[i].toUInt32())
// }

// const hash_2 = Gadgets.SHA256.update(Bytes4.fromString("bbbb"), H)
// console.log(hash_2.toHex());
// const W = Gadgets.SHA256.createMessageSchedule()
