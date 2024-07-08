import { Bytes, Hash, Provable, Struct, UInt8 } from "o1js";
import { FpC, FrC } from "../../towers/index.js";
import { Sp1PlonkProof, zeroProof } from "../proof.js";
import { provableBn254BaseFieldToBytes, provableBn254ScalarFieldToBytes } from "../../sha/utils.js";
import { VK } from "../vk.js";
import { shaToFr } from "./sha_to_fr.js";

const gammaSizeInBytes = () => {
    let size = 0 
    size += 5 // for gamma_separator 

    size += 3 * 2 * 32 // 3 permutation polys * 2 coordinates * 32 bytes for each coord 
    size += 6 * 2 * 32 // 6 selector polys * 2 coordinates * 32 bytes each coord 

    size += 2 * 32 // 2 public inputs each of 32 bytes 

    size += 3 * 2 * 32 // 1 custom gate triple (l, r, o) * 2 coordinates * 32 bytes each coord

    return size
}

const sizeBetaBytes = () => {
    let size = 0 
    size += 4 // for beta_separator 

    size += 32 // for bytes of gamma_hash

    return size
}


class BytesGamma extends Bytes(837) {} // output of gammaSizeInBytes()
class BytesBeta extends Bytes(36) {} // output of sizeBetaBytes()

class Bytes32 extends Bytes(32) {}

class Sp1PlonkFiatShamir extends Struct({
    gamma_digest: Bytes32.provable,
    gamma: FrC.provable,

    beta_digest: Bytes32.provable,
    beta: FrC.provable,

    alpha_digest: Bytes32.provable,
    alpha: FrC.provable,

    zeta_digest: Bytes32.provable,
    zeta: FrC.provable,

    gamma_kzg_digest: Bytes32.provable,
    gamma_kzg: FrC.provable,
}) {
    constructor() {
        super({
            gamma_digest: new Bytes32(Array.from({ length: 32 }, () => UInt8.from(0n))),
            gamma: FrC.from(0n),
            beta_digest: new Bytes32(Array.from({ length: 32 }, () => UInt8.from(0n))),
            beta: FrC.from(0n),
            alpha_digest: new Bytes32(Array.from({ length: 32 }, () => UInt8.from(0n))),
            alpha: FrC.from(0n),
            zeta_digest: new Bytes32(Array.from({ length: 32 }, () => UInt8.from(0n))),
            zeta: FrC.from(0n),
            gamma_kzg_digest: new Bytes32(Array.from({ length: 32 }, () => UInt8.from(0n))),
            gamma_kzg: FrC.from(0n)
        });
    }

    squeezeGamma(proof: Sp1PlonkProof, pi0F: FrC, pi1F: FrC) {
        const gamma_separator = FpC.from(0x67616d6d61n); // TODO: we can read this from file
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
    
        // assert(cm_bytes.length === gammaSizeInBytes());
    
        this.gamma_digest = Hash.SHA2_256.hash(cm_bytes);
        this.gamma = shaToFr(this.gamma_digest)
    }

    squeezeBeta() {
        const beta_separator = FpC.from(0x62657461n);
        let separator_bytes = provableBn254BaseFieldToBytes(beta_separator); 
    
        // beta is 32 bits and we cut the rest (256 - 32) bits which is 28 bytes 
        let cm_bytes = separator_bytes.slice(28, 32); 
    
        cm_bytes = cm_bytes.concat(this.gamma_digest.bytes)
        // assert(cm_bytes.length === sizeBetaBytes())
    
        this.beta_digest = Hash.SHA2_256.hash(cm_bytes);
        this.beta = shaToFr(this.beta_digest)
    }
}

export { Sp1PlonkFiatShamir }

const proof: Sp1PlonkProof = zeroProof()
const fs = new Sp1PlonkFiatShamir()

fs.squeezeGamma(proof, FrC.from(0n), FrC.from(0n))
fs.squeezeBeta()

console.log(fs.gamma.toBigInt())
console.log(fs.beta.toBigInt())


