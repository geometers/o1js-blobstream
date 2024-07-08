import { Bytes, Hash } from "o1js";

// define a preimage
let preimage = 'The quick brown fox jumps over the lazy dog';

// create a Bytes class that represents 43 bytes
class Bytes43 extends Bytes(43) {}

// convert the preimage to bytes
let preimageBytes = Bytes43.fromString(preimage);

// hash the preimage
let hash = Hash.SHA2_256.hash(preimageBytes);

console.log(hash);
//d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592