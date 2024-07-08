import { provableBn254BaseFieldToBytes } from "../../sha/utils.js";
import { FpC } from "../../towers/index.js";
import { Bytes, Hash } from "o1js";
import { shaToFr } from "./sha_to_fr.js";

class BytesGamma extends Bytes(5 + 32) {}

function deriveGamma(vc: FpC): BytesGamma { 
    const gamma = FpC.from(0x67616d6d61);

    let gamma_bytes = provableBn254BaseFieldToBytes(gamma); 
    let vx_bytes = provableBn254BaseFieldToBytes(vx); 

    // gamma is 39 bits, so we leave only 40 bits (to keep it multiple of 8)
    // and we cut the rest (256 - 40) bits which is 27 bytes 
    gamma_bytes = gamma_bytes.slice(27, 32); 

    return new BytesGamma(gamma_bytes.concat(vx_bytes))
}

export { deriveGamma }

const vx = FpC.from(10627327753818917257580031743580923447218792977466576262416509126412843282369n)
let hash = Hash.SHA2_256.hash(deriveGamma(vx));
const gammaFr = shaToFr(hash)
console.log(gammaFr.toBigInt())

