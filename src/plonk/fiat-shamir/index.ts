import { Bytes, Gadgets, UInt8, UInt32, Provable } from 'o1js';
import { FrC } from '../../towers/index.js';
import { Hash, Struct } from 'o1js';
import { FpC } from '../../towers/index.js';
import { Sp1PlonkProof } from '../proof.js';
import {
  bytesToWord,
  provableBn254BaseFieldToBytes,
  provableBn254ScalarFieldToBytes,
  wordToBytes,
} from '../../sha/utils.js';
import { Sp1PlonkVk } from '../vk.js';
import { shaToFr } from './sha_to_fr.js';

const Bytes741Padding = [
  UInt8.from(0x80n),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0x17n),
  UInt8.from(0x28n),
];

const gammaSizeInBytes = () => {
  let size = 0;
  size += 5; // for gamma_separator

  size += 3 * 2 * 32; // 3 permutation polys * 2 coordinates * 32 bytes for each coord
  size += 6 * 2 * 32; // 6 selector polys * 2 coordinates * 32 bytes each coord

  size += 2 * 32; // 2 public inputs each of 32 bytes

  size += 3 * 2 * 32; // 1 custom gate triple (l, r, o) * 2 coordinates * 32 bytes each coord

  return size;
};

const sizeBetaBytes = () => {
  let size = 0;
  size += 4; // for beta_separator

  size += 32; // for bytes of gamma_hash

  return size;
};

const sizeAlphaBytes = () => {
  let size = 0;
  size += 5; // for alpha_separator

  size += 32; // for bytes of beta_hash

  size += 2 * 32; // for qcp_0 cm
  size += 2 * 32; // for grand_product_zm

  return size;
};

const sizeZetaBytes = () => {
  let size = 0;

  size += 4; // for zeta_separator

  size += 32; // for bytes of alpha_hash

  size += 3 * 2 * 32; // 3 h_i chunks

  return size;
};

const sizeGammaKzgBytes = () => {
  let size = 0;

  size += 5; // for gamma_separator

  size += 32; // for bytes of zeta_digest

  size += 1 * 2 * 32; // for linearized commitment

  size += 3 * 2 * 32; // for [l, r, o] commitments

  size += 2 * 2 * 32; // for [s1, s2] commitments

  size += 1 * 2 * 32; // for qcp_0 commitment

  size += 7 * 32; // for according openings of [linearized, l, r, o, s1, s2, qco_0] openings

  size += 32; // for shifted grand product opening

  return size;
};

const sizeRandomBytes = () => {
  let size = 0;

  size += 4 * 2 * 32; // cm, batch, grand, batch shifted

  size += 2 * 32; // zeta and gamma

  return size;
};

export class BytesGamma extends Bytes(gammaSizeInBytes()) {}
export class BytesBeta extends Bytes(sizeBetaBytes()) {}
export class BytesAlpha extends Bytes(sizeAlphaBytes()) {}
export class BytesZeta extends Bytes(sizeZetaBytes()) {}
export class BytesGammaKzg extends Bytes(sizeGammaKzgBytes()) {}
export class BytesRandomKzg extends Bytes(sizeRandomBytes()) {}

export class Bytes32 extends Bytes(32) {}

export type Sp1PlonkFiatShamirType = {
  gamma_digest: Bytes32;
  gamma: FrC;

  beta_digest: Bytes32;
  beta: FrC;

  alpha_digest: Bytes32;
  alpha: FrC;

  zeta_digest: Bytes32;
  zeta: FrC;

  gamma_kzg_digest: Bytes32;
  gamma_kzg: FrC;
};

function init(): Sp1PlonkFiatShamirType {
  return {
    gamma_digest: new Bytes32(Array.from({ length: 32 }, () => UInt8.from(0n))),
    gamma: FrC.from(0n),
    beta_digest: new Bytes32(Array.from({ length: 32 }, () => UInt8.from(0n))),
    beta: FrC.from(0n),
    alpha_digest: new Bytes32(Array.from({ length: 32 }, () => UInt8.from(0n))),
    alpha: FrC.from(0n),
    zeta_digest: new Bytes32(Array.from({ length: 32 }, () => UInt8.from(0n))),
    zeta: FrC.from(0n),
    gamma_kzg_digest: new Bytes32(
      Array.from({ length: 32 }, () => UInt8.from(0n))
    ),
    gamma_kzg: FrC.from(0n),
  };
}

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
  constructor(fs: Sp1PlonkFiatShamirType) {
    super(fs);
  }

  static empty() {
    return new Sp1PlonkFiatShamir(init());
  }

  deepClone() {
    return new Sp1PlonkFiatShamir({
      gamma_digest: new Bytes32([...this.gamma_digest.bytes]),
      gamma: FrC.from(this.gamma.toBigInt()),
      beta_digest: new Bytes32([...this.beta_digest.bytes]),
      beta: FrC.from(this.beta.toBigInt()),
      alpha_digest: new Bytes32([...this.alpha_digest.bytes]),
      alpha: FrC.from(this.alpha.toBigInt()),
      zeta_digest: new Bytes32([...this.zeta_digest.bytes]),
      zeta: FrC.from(this.zeta.toBigInt()),
      gamma_kzg_digest: new Bytes32([...this.gamma_kzg_digest.bytes]),
      gamma_kzg: FrC.from(this.gamma_kzg.toBigInt()),
    });
  }

  squeezeGamma(proof: Sp1PlonkProof, pi0F: FrC, pi1F: FrC, vk: Sp1PlonkVk) {
    const gamma_separator = FpC.from(0x67616d6d61n); // TODO: we can read this from file
    let separator_bytes = provableBn254BaseFieldToBytes(gamma_separator);

    // gamma is 39 bits, so we leave only 40 bits (to keep it multiple of 8)
    // and we cut the rest (256 - 40) bits which is 27 bytes
    let cm_bytes = separator_bytes.slice(27, 32);

    const s1x = provableBn254BaseFieldToBytes(vk.qs1_x);
    cm_bytes = cm_bytes.concat(s1x);

    const s1y = provableBn254BaseFieldToBytes(vk.qs1_y);
    cm_bytes = cm_bytes.concat(s1y);

    const s2x = provableBn254BaseFieldToBytes(vk.qs2_x);
    cm_bytes = cm_bytes.concat(s2x);

    const s2y = provableBn254BaseFieldToBytes(vk.qs2_y);
    cm_bytes = cm_bytes.concat(s2y);

    const s3x = provableBn254BaseFieldToBytes(vk.qs3_x);
    cm_bytes = cm_bytes.concat(s3x);

    const s3y = provableBn254BaseFieldToBytes(vk.qs3_y);
    cm_bytes = cm_bytes.concat(s3y);

    const qlx = provableBn254BaseFieldToBytes(vk.ql_x);
    cm_bytes = cm_bytes.concat(qlx);

    const qly = provableBn254BaseFieldToBytes(vk.ql_y);
    cm_bytes = cm_bytes.concat(qly);

    const qrx = provableBn254BaseFieldToBytes(vk.qr_x);
    cm_bytes = cm_bytes.concat(qrx);

    const qry = provableBn254BaseFieldToBytes(vk.qr_y);
    cm_bytes = cm_bytes.concat(qry);

    const qmx = provableBn254BaseFieldToBytes(vk.qm_x);
    cm_bytes = cm_bytes.concat(qmx);

    const qmy = provableBn254BaseFieldToBytes(vk.qm_y);
    cm_bytes = cm_bytes.concat(qmy);

    const qox = provableBn254BaseFieldToBytes(vk.qo_x);
    cm_bytes = cm_bytes.concat(qox);

    const qoy = provableBn254BaseFieldToBytes(vk.qo_y);
    cm_bytes = cm_bytes.concat(qoy);

    const qkx = provableBn254BaseFieldToBytes(vk.qk_x);
    cm_bytes = cm_bytes.concat(qkx);

    const qky = provableBn254BaseFieldToBytes(vk.qk_y);
    cm_bytes = cm_bytes.concat(qky);

    const qcp_0_x = provableBn254BaseFieldToBytes(vk.qcp_0_x);
    cm_bytes = cm_bytes.concat(qcp_0_x);

    const qcp_0_y = provableBn254BaseFieldToBytes(vk.qcp_0_y);
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
    this.gamma = shaToFr(this.gamma_digest);
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
    const alpha_separator = FpC.from(0x616c706861n);
    let separator_bytes = provableBn254BaseFieldToBytes(alpha_separator);

    // alpha is 39 bits, so we leave only 40 bits (to keep it multiple of 8)
    // and we cut the rest (256 - 40) bits which is 27 bytes
    let cm_bytes = separator_bytes.slice(27, 32);

    cm_bytes = cm_bytes.concat(this.beta_digest.bytes);

    const qcp_0_x = provableBn254BaseFieldToBytes(proof.qcp_0_wire_x);
    cm_bytes = cm_bytes.concat(qcp_0_x);

    const qcp_0_y = provableBn254BaseFieldToBytes(proof.qcp_0_wire_y);
    cm_bytes = cm_bytes.concat(qcp_0_y);

    const grand_product_x = provableBn254BaseFieldToBytes(
      proof.grand_product_x
    );
    cm_bytes = cm_bytes.concat(grand_product_x);

    const grand_product_y = provableBn254BaseFieldToBytes(
      proof.grand_product_y
    );
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

  squeezeGammaKzg(
    proof: Sp1PlonkProof,
    vk: Sp1PlonkVk,
    linearized_cm_x: FpC,
    linearized_cm_y: FpC,
    linearized_opening: FrC
  ) {
    const gamma_separator = FpC.from(0x67616d6d61n);
    let separator_bytes = provableBn254BaseFieldToBytes(gamma_separator);

    // gamma is 39 bits, so we leave only 40 bits (to keep it multiple of 8)
    // and we cut the rest (256 - 40) bits which is 27 bytes
    let cm_bytes = separator_bytes.slice(27, 32);

    // note that here they compute challenge from zeta_reduced and not unreduced as before
    cm_bytes = cm_bytes.concat(provableBn254ScalarFieldToBytes(this.zeta));

    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(linearized_cm_x));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(linearized_cm_y));

    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(proof.l_com_x));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(proof.l_com_y));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(proof.r_com_x));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(proof.r_com_y));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(proof.o_com_x));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(proof.o_com_y));

    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(vk.qs1_x));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(vk.qs1_y));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(vk.qs2_x));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(vk.qs2_y));

    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(vk.qcp_0_x));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(vk.qcp_0_y));

    cm_bytes = cm_bytes.concat(
      provableBn254ScalarFieldToBytes(linearized_opening)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254ScalarFieldToBytes(proof.l_at_zeta)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254ScalarFieldToBytes(proof.r_at_zeta)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254ScalarFieldToBytes(proof.o_at_zeta)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254ScalarFieldToBytes(proof.s1_at_zeta)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254ScalarFieldToBytes(proof.s2_at_zeta)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254ScalarFieldToBytes(proof.qcp_0_at_zeta)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254ScalarFieldToBytes(proof.grand_product_at_omega_zeta)
    );

    this.gamma_kzg_digest = Hash.SHA2_256.hash(new BytesGammaKzg(cm_bytes));
    this.gamma_kzg = shaToFr(this.gamma_kzg_digest);
  }

  squeezeRandomForKzg(proof: Sp1PlonkProof, cm_x: FpC, cm_y: FpC): FrC {
    let cm_bytes = provableBn254BaseFieldToBytes(cm_x);
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(cm_y));

    cm_bytes = cm_bytes.concat(
      provableBn254BaseFieldToBytes(proof.batch_opening_at_zeta_x)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254BaseFieldToBytes(proof.batch_opening_at_zeta_y)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254BaseFieldToBytes(proof.grand_product_x)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254BaseFieldToBytes(proof.grand_product_y)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254BaseFieldToBytes(proof.batch_opening_at_zeta_omega_x)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254BaseFieldToBytes(proof.batch_opening_at_zeta_omega_y)
    );

    cm_bytes = cm_bytes.concat(provableBn254ScalarFieldToBytes(this.zeta));
    cm_bytes = cm_bytes.concat(provableBn254ScalarFieldToBytes(this.gamma_kzg));

    const random_digest = Hash.SHA2_256.hash(new BytesRandomKzg(cm_bytes));
    return shaToFr(random_digest);
  }

  // just delay digest to fr
  // TODO: make this a generic function for all challenges
  gammaKzgDigest_part0(
    proof: Sp1PlonkProof,
    vk: Sp1PlonkVk,
    linearized_cm_x: FpC,
    linearized_cm_y: FpC,
    linearized_opening: FrC
  ) {
    const gamma_separator = FpC.from(0x67616d6d61n);
    let separator_bytes = provableBn254BaseFieldToBytes(gamma_separator);

    // gamma is 39 bits, so we leave only 40 bits (to keep it multiple of 8)
    // and we cut the rest (256 - 40) bits which is 27 bytes
    let cm_bytes = separator_bytes.slice(27, 32);

    // note that here they compute challenge from zeta_reduced and not unreduced as before
    cm_bytes = cm_bytes.concat(provableBn254ScalarFieldToBytes(this.zeta));

    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(linearized_cm_x));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(linearized_cm_y));

    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(proof.l_com_x));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(proof.l_com_y));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(proof.r_com_x));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(proof.r_com_y));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(proof.o_com_x));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(proof.o_com_y));

    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(vk.qs1_x));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(vk.qs1_y));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(vk.qs2_x));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(vk.qs2_y));

    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(vk.qcp_0_x));
    cm_bytes = cm_bytes.concat(provableBn254BaseFieldToBytes(vk.qcp_0_y));

    cm_bytes = cm_bytes.concat(
      provableBn254ScalarFieldToBytes(linearized_opening)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254ScalarFieldToBytes(proof.l_at_zeta)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254ScalarFieldToBytes(proof.r_at_zeta)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254ScalarFieldToBytes(proof.o_at_zeta)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254ScalarFieldToBytes(proof.s1_at_zeta)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254ScalarFieldToBytes(proof.s2_at_zeta)
    );
    cm_bytes = cm_bytes.concat(
      provableBn254ScalarFieldToBytes(proof.qcp_0_at_zeta).slice(0, 27)
    );

    const chunks = [];
    for (let i = 0; i < cm_bytes.length; i += 4) {
      const chunk = UInt32.Unsafe.fromField(
        bytesToWord(cm_bytes.slice(i, i + 4).reverse())
      );
      chunks.push(chunk);
    }

    let H = Gadgets.SHA256.initialState;
    for (let i = 0; i < 11; i++) {
      const messageBlock = chunks.slice(16 * i, 16 * (i + 1));
      let W = Gadgets.SHA256.createMessageSchedule(messageBlock);
      H = Gadgets.SHA256.compression(H, W);
    }

    return H;

    // this.gamma_kzg_digest = Hash.SHA2_256.hash(new BytesGammaKzg(cm_bytes));
  }

  gammaKzgDigest_part1(proof: Sp1PlonkProof, H: UInt32[]) {
    let cm_bytes = provableBn254ScalarFieldToBytes(proof.qcp_0_at_zeta).slice(
      27,
      32
    );
    cm_bytes = cm_bytes.concat(
      provableBn254ScalarFieldToBytes(proof.grand_product_at_omega_zeta)
    );

    cm_bytes = cm_bytes.concat(Bytes741Padding);

    const chunks = [];
    for (let i = 0; i < cm_bytes.length; i += 4) {
      const chunk = UInt32.Unsafe.fromField(
        bytesToWord(cm_bytes.slice(i, i + 4).reverse())
      );
      chunks.push(chunk);
    }

    const messageBlock = chunks;
    let W = Gadgets.SHA256.createMessageSchedule(messageBlock);
    H = Gadgets.SHA256.compression(H, W);

    this.gamma_kzg_digest = Bytes.from(
      H.map((x) => wordToBytes(x.value, 4).reverse()).flat()
    );
  }

  squeezeGammaKzgFromDigest() {
    this.gamma_kzg = shaToFr(this.gamma_kzg_digest);
  }
}

export { Sp1PlonkFiatShamir };
