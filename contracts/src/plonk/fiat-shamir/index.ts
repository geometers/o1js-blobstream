import { Bytes, Hash, Provable, Struct, UInt8 } from "o1js";
import { FpC, FrC } from "../../towers/index.js";
import { Sp1PlonkProof, deserializeProof, zeroProof } from "../proof.js";
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

const sizeAlphaBytes = () => {
    let size = 0 
    size += 5 // for alpha_separator 

    size += 32 // for bytes of beta_hash

    size += 2 * 32 // for qcp_0 cm 
    size += 2 * 32 // for grand_product_zm 

    return size
}

const sizeZetaBytes = () => {
    let size = 0 

    size += 4 // for zeta_separator 

    size += 32 // for bytes of alpha_hash

    size += 3 * 2 * 32 // 3 h_i chunks 

    return size
}


class BytesGamma extends Bytes(gammaSizeInBytes()) {}
class BytesBeta extends Bytes(sizeBetaBytes()) {}
class BytesAlpha extends Bytes(sizeAlphaBytes()) {}
class BytesZeta extends Bytes(sizeZetaBytes()) {}



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
    
        this.gamma_digest = Hash.SHA2_256.hash(new BytesGamma(cm_bytes));
        this.gamma = shaToFr(this.gamma_digest)
    }

    squeezeBeta() {
        const beta_separator = FpC.from(0x62657461n);
        let separator_bytes = provableBn254BaseFieldToBytes(beta_separator); 
    
        // beta is 32 bits and we cut the rest (256 - 32) bits which is 28 bytes 
        let cm_bytes = separator_bytes.slice(28, 32);
    
        cm_bytes = cm_bytes.concat(this.gamma_digest.bytes);
        // assert(cm_bytes.length === sizeBetaBytes())
    
        this.beta_digest = Hash.SHA2_256.hash(new BytesBeta(cm_bytes));
        this.beta = shaToFr(this.beta_digest);
    }

    squeezeAlpha(proof: Sp1PlonkProof) {
        const alpha_separator = FpC.from(0x616C706861n);
        let separator_bytes = provableBn254BaseFieldToBytes(alpha_separator); 

        // alpha is 39 bits, so we leave only 40 bits (to keep it multiple of 8)
        // and we cut the rest (256 - 40) bits which is 27 bytes 
        let cm_bytes = separator_bytes.slice(27, 32);
        
        cm_bytes = cm_bytes.concat(this.beta_digest.bytes);

        const qcp_0_x = provableBn254BaseFieldToBytes(proof.qcp_0_wire_x);
        cm_bytes = cm_bytes.concat(qcp_0_x);

        const qcp_0_y = provableBn254BaseFieldToBytes(proof.qcp_0_wire_y);
        cm_bytes = cm_bytes.concat(qcp_0_y);

        const grand_product_x = provableBn254BaseFieldToBytes(proof.grand_product_x);
        cm_bytes = cm_bytes.concat(grand_product_x);

        const grand_product_y = provableBn254BaseFieldToBytes(proof.grand_product_y);
        cm_bytes = cm_bytes.concat(grand_product_y);
        
        this.alpha_digest = Hash.SHA2_256.hash(new BytesAlpha(cm_bytes));
        this.alpha = shaToFr(this.alpha_digest);
    }

    squeezeZeta(proof: Sp1PlonkProof) {
        const zeta_separator = FpC.from(0x7a657461n);
        let separator_bytes = provableBn254BaseFieldToBytes(zeta_separator); 

        // zeta is 31 bits, so we leave only 32 bits (to keep it multiple of 8)
        // and we cut the rest (256 - 32) bits which is 28 bytes 
        let cm_bytes = separator_bytes.slice(28, 32);
        
        cm_bytes = cm_bytes.concat(this.alpha_digest.bytes);

        const h0_x = provableBn254BaseFieldToBytes(proof.h0_x);
        cm_bytes = cm_bytes.concat(h0_x);

        const h0_y = provableBn254BaseFieldToBytes(proof.h0_y);
        cm_bytes = cm_bytes.concat(h0_y);

        const h1_x = provableBn254BaseFieldToBytes(proof.h1_x);
        cm_bytes = cm_bytes.concat(h1_x);

        const h1_y = provableBn254BaseFieldToBytes(proof.h1_y);
        cm_bytes = cm_bytes.concat(h1_y);

        const h2_x = provableBn254BaseFieldToBytes(proof.h2_x);
        cm_bytes = cm_bytes.concat(h2_x);

        const h2_y = provableBn254BaseFieldToBytes(proof.h2_y);
        cm_bytes = cm_bytes.concat(h2_y);
        
        this.zeta_digest = Hash.SHA2_256.hash(new BytesZeta(cm_bytes));
        this.zeta = shaToFr(this.zeta_digest);
    }

    
}

export { Sp1PlonkFiatShamir }

const hexProof = "0x801c66ac0adb18b19c32120abcaea2dfa6ebc07925a4c12abbb823ffa50aeae202c3b8910a8d533f786b3f53345442e25ec85abd1ba147574d276f2242ff7831b8bea1402648e4c4e876f53fb2d6211414fc5da6e1441484a1a7ccc599621663ad6d628621f6e3a0ded5513478fa59e788b4e06102202cb4663002b9b30467c4054aaf512ecd8e695bb68bf9500cd3de1da60d8084c3f2bf5de1d748d4b01131b9545f9e14507651644746c0952ada51abba4358bba695fcfa5162f013b044e93f486e7704d08d5ee2e0bcd5bbc01b8e6e12f0d09df5a285dc0da05840e5fc1a2f7fb6e200fdb49c7bdf737927f8f9b4f60a000baa9c4377964155caf01e701a1b35d5e92ec3ef85185eb95cb37e92cccb85a35617e7cafa2fe942d0c8a1845540ec1d4d2745400e54065f8601ff4ea8985dad2f3b8000b35e1b90e5525938d5d30157212509e6e2b6bc3b1dc0c71f04c735c431473e1776f138c8e5808e8a99cc59669916d026eafe692c6a8345c17239d6e7683a924360336ad10f948b4bfb2041226b043ad28ad6471c591ec17c09b84c591740e751c04018873ac617df8c2ffa52651b096bd46e6a04bf3e1797e903f47fbb64761a028967c5b3f748165358c8b6b027af7d77b3ca83fee575b2d39e5874128ac952016bda7aca187426bcb7a0460d0111783b814486fdf46d76d6854ed3889036126f3af5ffef96efea25d73524230c22a1f411ec42f76a07c2d5f3b78d2311550b790be1303a81c9aee96077b72a2575c5739eab16dee3e1f3fdaddfc9278814b9ffc764fd883c59fb4a0c4fd577081e07e2504b9eabfbf2962d03873f5ce9ff38ffe0f20446ae43b7abd35e84aa243c4a64ae86448e02a0728c10c8e38e226854d34bcb8ae85b19856e908ad4d01c1a70e88c77dafad62c1eca5dcd0a640558b9162b0fff944cfca3d330ba0e870b306fa22276609649e111fafd23b8eaf4571d6bc47b4d963ad28d80e2e3fcbf04ca5a5f641b32333729d102a9b4a9d26ac03c6e4f15adfedf250f506c4d79f10342a6ccde9efa0bce51fe08df09d697f07e38487f2bd7a04f4bc410eba22c2e1b3517159a47eb183a51cad319b54d3c645d56db854739bb844f8c7e49207f0807d26e1a837bdea04a774f09e64a2ff4cb852ba5f31849c8451330c4b8ab85b5261b092715702b7604202584c70431947264f339486a6222843ff99810d6fb05"
const proof = deserializeProof(hexProof)
const fs = new Sp1PlonkFiatShamir()

fs.squeezeGamma(proof, FrC.from(0n), FrC.from(0n))
fs.squeezeBeta()
fs.squeezeAlpha(proof)
fs.squeezeZeta(proof)

console.log(fs.gamma.toBigInt())
console.log(fs.beta.toBigInt())
console.log(fs.alpha.toBigInt())
console.log(fs.zeta.toBigInt())



