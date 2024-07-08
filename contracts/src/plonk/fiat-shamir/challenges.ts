import { provableBn254BaseFieldToBytes, provableBn254ScalarFieldToBytes } from "../../sha/utils.js";
import { FpC, FrC } from "../../towers/index.js";
import { Bytes, Hash, Provable } from "o1js";
import { shaToFr } from "./sha_to_fr.js";
import { Sp1PlonkVk, VK } from "../vk.js";
import { Sp1PlonkProof, zeroProof } from "../proof.js";
import { assert } from "console";


// we have to make BytesGamma to extend Bytes(n) 
// so this function cannot be used in the runtime although it's useful for doing sanity checks
const gammaSizeInBytes = () => {
    let size = 0 
    size += 5 // for gamma_separator 

    size += 3 * 2 * 32 // 3 permutation polys * 2 coordinates * 32 bytes for each coord 
    size += 6 * 2 * 32 // 6 selector polys * 2 coordinates * 32 bytes each coord 

    size += 2 * 32 // 2 public inputs each of 32 bytes 

    size += 3 * 2 * 32 // 1 custom gate triple (l, r, o) * 2 coordinates * 32 bytes each coord

    return size
}

class BytesGamma extends Bytes(837) {} // output of gammaSizeInBytes()

function squeezeGamma(proof: Sp1PlonkProof, pi0F: FrC, pi1F: FrC) {
    const gamma_separator = FpC.from(0x67616d6d61); // TODO: we can read this from file
    let separator_bytes = provableBn254BaseFieldToBytes(gamma_separator); 

    // gamma is 39 bits, so we leave only 40 bits (to keep it multiple of 8)
    // and we cut the rest (256 - 40) bits which is 27 bytes 
    let cm_bytes = separator_bytes.slice(27, 32); 

    const s1x = provableBn254BaseFieldToBytes(VK.qs1_x);
    cm_bytes = cm_bytes.concat(s1x);

    const s1y = provableBn254BaseFieldToBytes(VK.qs1_y);
    cm_bytes = cm_bytes.concat(s1y);

    const s2x = provableBn254BaseFieldToBytes(VK.qs2_x);
    cm_bytes = cm_bytes.concat(s2x);

    const s2y = provableBn254BaseFieldToBytes(VK.qs2_y);
    cm_bytes = cm_bytes.concat(s2y);

    const s3x = provableBn254BaseFieldToBytes(VK.qs3_x);
    cm_bytes = cm_bytes.concat(s3x);

    const s3y = provableBn254BaseFieldToBytes(VK.qs3_y);
    cm_bytes = cm_bytes.concat(s3y);

    const qlx = provableBn254BaseFieldToBytes(VK.ql_x);
    cm_bytes = cm_bytes.concat(qlx);

    const qly = provableBn254BaseFieldToBytes(VK.ql_y);
    cm_bytes = cm_bytes.concat(qly);

    const qrx = provableBn254BaseFieldToBytes(VK.qr_x);
    cm_bytes = cm_bytes.concat(qrx);

    const qry = provableBn254BaseFieldToBytes(VK.qr_y);
    cm_bytes = cm_bytes.concat(qry);

    const qmx = provableBn254BaseFieldToBytes(VK.qm_x);
    cm_bytes = cm_bytes.concat(qmx);

    const qmy = provableBn254BaseFieldToBytes(VK.qm_y);
    cm_bytes = cm_bytes.concat(qmy);

    const qox = provableBn254BaseFieldToBytes(VK.qo_x);
    cm_bytes = cm_bytes.concat(qox);

    const qoy = provableBn254BaseFieldToBytes(VK.qo_y);
    cm_bytes = cm_bytes.concat(qoy);

    const qkx = provableBn254BaseFieldToBytes(VK.qk_x);
    cm_bytes = cm_bytes.concat(qkx);

    const qky = provableBn254BaseFieldToBytes(VK.qk_y);
    cm_bytes = cm_bytes.concat(qky);

    const qcp_0_x = provableBn254BaseFieldToBytes(VK.qcp_0_x);
    cm_bytes = cm_bytes.concat(qcp_0_x);

    const qcp_0_y = provableBn254BaseFieldToBytes(VK.qcp_0_y);
    cm_bytes = cm_bytes.concat(qcp_0_y);

    // two public inputs
    const pi0 = provableBn254ScalarFieldToBytes(pi0F); 
    cm_bytes = cm_bytes.concat(pi0);

    const pi1 = provableBn254ScalarFieldToBytes(pi1F); 
    cm_bytes = cm_bytes.concat(pi1);

    // there is one gate, so we have just 1 [l, r, o]
    const lx = provableBn254BaseFieldToBytes(proof.l_com_x);
    cm_bytes = cm_bytes.concat(lx);

    const ly = provableBn254BaseFieldToBytes(proof.l_com_y);
    cm_bytes = cm_bytes.concat(ly);

    const rx = provableBn254BaseFieldToBytes(proof.r_com_x);
    cm_bytes = cm_bytes.concat(rx);

    const ry = provableBn254BaseFieldToBytes(proof.r_com_y);
    cm_bytes = cm_bytes.concat(ry);

    const ox = provableBn254BaseFieldToBytes(proof.o_com_x);
    cm_bytes = cm_bytes.concat(ox);

    const oy = provableBn254BaseFieldToBytes(proof.o_com_y);
    cm_bytes = cm_bytes.concat(oy);

    assert(cm_bytes.length === gammaSizeInBytes());

    return new BytesGamma(cm_bytes)
}


class BytesGammaSmall extends Bytes(5 + 32) {} 
function deriveGamma(vc: FpC): BytesGamma { 
    const gamma = FpC.from(0x67616d6d61);

    let gamma_bytes = provableBn254BaseFieldToBytes(gamma); 
    let vx_bytes = provableBn254BaseFieldToBytes(vc); 

    // gamma is 39 bits, so we leave only 40 bits (to keep it multiple of 8)
    // and we cut the rest (256 - 40) bits which is 27 bytes 
    gamma_bytes = gamma_bytes.slice(27, 32); 

    return new BytesGammaSmall(gamma_bytes.concat(vx_bytes))
}

function deriveBeta() {

}

function deriveAlpha() {

}

function deriveZeta() {

}


const proof: Sp1PlonkProof = zeroProof()

const hash = Hash.SHA2_256.hash(squeezeGamma(proof, FrC.from(0n), FrC.from(0n)))
const gammaFr = shaToFr(hash)
console.log(gammaFr.toBigInt())


export { deriveGamma }

// const vx = FpC.from(10627327753818917257580031743580923447218792977466576262416509126412843282369n)
// let hash = Hash.SHA2_256.hash(deriveGamma(vx));
// const gammaFr = shaToFr(hash)
// console.log(gammaFr.toBigInt())

// console.log(gammaSizeInBytes())
