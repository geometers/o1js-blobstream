import { Field, Poseidon, Provable } from 'o1js';
import {
  ArrayListHasher,
  KzgAccumulator,
  KzgProof,
  KzgState,
} from '../../kzg/structs.js';
import { Accumulator } from '../accumulator.js';
import {
  compute_alpha_square_lagrange_0,
  compute_commitment_linearized_polynomial_split_0,
  compute_commitment_linearized_polynomial_split_1,
  compute_commitment_linearized_polynomial_split_2,
  customPiLagrange,
  evalVanishing,
  fold_quotient_split_0,
  fold_quotient_split_1,
  fold_state_0,
  fold_state_1,
  fold_state_2,
  opening_of_linearized_polynomial,
  pi_contribution,
  preparePairing_0,
  preparePairing_1,
} from '../piop/plonk_utils.js';
import { VK } from '../vk.js';
import { G1Affine } from '../../ec/index.js';
import { Fp12 } from '../../towers/fp12.js';
import { G2Line } from '../../lines/index.js';
import { KZGLineAccumulator } from '../mm_loop/accumulate_lines.js';
import fs from 'fs';
import { ATE_LOOP_COUNT } from '../../towers/consts.js';
import { make_w27 } from '../helpers.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const g2_lines_required = require('../mm_loop/g2_lines.json');
const tau_lines_required = require('../mm_loop/tau_lines.json');
//import g2_lines_required from '../mm_loop/g2_lines.json';
//import tau_lines_required from '../mm_loop/tau_lines.json';
const g2_lines_path = JSON.stringify(g2_lines_required); //fs.readFileSync(`./src/plonk/mm_loop/g2_lines.json`, 'utf8');
const tau_lines_path = JSON.stringify(tau_lines_required); //fs.readFileSync(`./src/plonk/mm_loop/tau_lines.json`, 'utf8');

let parsed_g2_lines: any[] = JSON.parse(g2_lines_path);
let g2_lines = parsed_g2_lines.map((g: any): G2Line => G2Line.fromJSON(g));

let parsed_tau_lines: any[] = JSON.parse(tau_lines_path);
let tau_lines = parsed_tau_lines.map(
  (tau: any): G2Line => G2Line.fromJSON(tau)
);

class WitnessTracker {
  acc: Accumulator;
  kzg: KzgAccumulator;
  line_hashes: Array<Field>;
  g: Array<Fp12>;

  constructor(acc: Accumulator) {
    this.acc = acc.deepClone();
  }

  zkp0(): Accumulator {
    this.acc.fs.squeezeGamma(
      this.acc.proof,
      this.acc.state.pi0,
      this.acc.state.pi1,
      VK
    );
    this.acc.fs.squeezeBeta();

    return this.acc.deepClone();
  }

  zkp1(): Accumulator {
    this.acc.fs.squeezeAlpha(this.acc.proof);
    this.acc.fs.squeezeZeta(this.acc.proof);

    const [zeta_pow_n, zh_eval] = evalVanishing(this.acc.fs.zeta, VK);
    const alpha_2_l0 = compute_alpha_square_lagrange_0(
      zh_eval,
      this.acc.fs.zeta,
      this.acc.fs.alpha,
      VK
    );

    this.acc.state.zeta_pow_n = zeta_pow_n;
    this.acc.state.zh_eval = zh_eval;
    this.acc.state.alpha_2_l0 = alpha_2_l0;

    return this.acc.deepClone();
  }

  zkp2(): Accumulator {
    const [hx, hy] = fold_quotient_split_0(
      this.acc.proof.h0_x,
      this.acc.proof.h0_y,
      this.acc.proof.h1_x,
      this.acc.proof.h1_y,
      this.acc.proof.h2_x,
      this.acc.proof.h2_y,
      this.acc.fs.zeta,
      this.acc.state.zeta_pow_n
    );

    this.acc.state.hx = hx;
    this.acc.state.hy = hy;

    return this.acc.deepClone();
  }

  zkp3(): Accumulator {
    const [hx, hy] = fold_quotient_split_1(
      this.acc.state.hx,
      this.acc.state.hy,
      this.acc.state.zh_eval
    );

    this.acc.state.hx = hx;
    this.acc.state.hy = hy;

    const pis = pi_contribution(
      [this.acc.state.pi0, this.acc.state.pi1],
      this.acc.fs.zeta,
      this.acc.state.zh_eval,
      VK.inv_domain_size,
      VK.omega
    );

    // ~32k
    const l_pi_commit = customPiLagrange(
      this.acc.fs.zeta,
      this.acc.state.zh_eval,
      this.acc.proof.qcp_0_wire_x,
      this.acc.proof.qcp_0_wire_y,
      VK
    );
    const pi = pis.add(l_pi_commit).assertCanonical();

    // very cheap
    const linearized_opening = opening_of_linearized_polynomial(
      this.acc.proof,
      this.acc.fs.alpha,
      this.acc.fs.beta,
      this.acc.fs.gamma,
      pi,
      this.acc.state.alpha_2_l0
    );

    this.acc.state.pi = pi;
    this.acc.state.linearized_opening = linearized_opening;

    return this.acc.deepClone();
  }

  zkp4(): Accumulator {
    const [lcm_x, lcm_y] = compute_commitment_linearized_polynomial_split_0(
      this.acc.proof,
      VK
    );

    this.acc.state.lcm_x = lcm_x;
    this.acc.state.lcm_y = lcm_y;

    return this.acc.deepClone();
  }

  zkp5(): Accumulator {
    const [lcm_x, lcm_y] = compute_commitment_linearized_polynomial_split_1(
      this.acc.state.lcm_x,
      this.acc.state.lcm_y,
      this.acc.proof,
      VK,
      this.acc.fs.beta,
      this.acc.fs.gamma,
      this.acc.fs.alpha
    );

    this.acc.state.lcm_x = lcm_x;
    this.acc.state.lcm_y = lcm_y;

    return this.acc.deepClone();
  }

  zkp6(): Accumulator {
    const [lcm_x, lcm_y] = compute_commitment_linearized_polynomial_split_2(
      this.acc.state.lcm_x,
      this.acc.state.lcm_y,
      this.acc.proof,
      VK,
      this.acc.fs.beta,
      this.acc.fs.gamma,
      this.acc.fs.alpha,
      this.acc.fs.zeta,
      this.acc.state.alpha_2_l0,
      this.acc.state.hx,
      this.acc.state.hy
    );

    this.acc.state.lcm_x = lcm_x;
    this.acc.state.lcm_y = lcm_y;

    return this.acc.deepClone();
  }

  zkp7(): Accumulator {
    let H = this.acc.fs.gammaKzgDigest_part0(
      this.acc.proof,
      VK,
      this.acc.state.lcm_x,
      this.acc.state.lcm_y,
      this.acc.state.linearized_opening
    );
    this.acc.state.H = H;

    return this.acc.deepClone();
  }

  zkp8(): Accumulator {
    this.acc.fs.gammaKzgDigest_part1(this.acc.proof, this.acc.state.H);
    this.acc.fs.squeezeGammaKzgFromDigest();

    const [cm_x, cm_y, cm_opening] = fold_state_0(
      this.acc.proof,
      this.acc.state.lcm_x,
      this.acc.state.lcm_y,
      this.acc.state.linearized_opening,
      this.acc.fs.gamma_kzg
    );

    this.acc.state.cm_x = cm_x;
    this.acc.state.cm_y = cm_y;
    this.acc.state.cm_opening = cm_opening;

    return this.acc.deepClone();
  }

  zkp9(): Accumulator {
    const [cm_x, cm_y] = fold_state_1(
      VK,
      this.acc.proof,
      this.acc.state.cm_x,
      this.acc.state.cm_y,
      this.acc.fs.gamma_kzg
    );

    this.acc.state.cm_x = cm_x;
    this.acc.state.cm_y = cm_y;

    return this.acc.deepClone();
  }

  zkp10(): Accumulator {
    const [cm_x, cm_y] = fold_state_2(
      VK,
      this.acc.proof,
      this.acc.state.cm_x,
      this.acc.state.cm_y,
      this.acc.fs.gamma_kzg
    );
    const kzg_random = this.acc.fs.squeezeRandomForKzg(
      this.acc.proof,
      cm_x,
      cm_y
    );

    this.acc.state.cm_x = cm_x;
    this.acc.state.cm_y = cm_y;
    this.acc.state.kzg_random = kzg_random;

    return this.acc.deepClone();
  }

  zkp11(): Accumulator {
    const [kzg_cm_x, kzg_cm_y, neg_fq_x, neg_fq_y] = preparePairing_0(
      VK,
      this.acc.proof,
      this.acc.state.kzg_random,
      this.acc.state.cm_x,
      this.acc.state.cm_y,
      this.acc.state.cm_opening
    );

    this.acc.state.kzg_cm_x = kzg_cm_x;
    this.acc.state.kzg_cm_y = kzg_cm_y;
    this.acc.state.neg_fq_x = neg_fq_x;
    this.acc.state.neg_fq_y = neg_fq_y;

    return this.acc.deepClone();
  }

  zkp12(shift_power: Field, c: Fp12): [KzgAccumulator, Array<Field>] {
    const [kzg_cm_x, kzg_cm_y] = preparePairing_1(
      VK,
      this.acc.proof,
      this.acc.state.kzg_random,
      this.acc.state.kzg_cm_x,
      this.acc.state.kzg_cm_y,
      this.acc.fs.zeta
    );

    // this.acc.state.kzg_cm_x = kzg_cm_x;
    // this.acc.state.kzg_cm_y = kzg_cm_y;

    const A = new G1Affine({ x: kzg_cm_x, y: kzg_cm_y });
    const negB = new G1Affine({
      x: this.acc.state.neg_fq_x,
      y: this.acc.state.neg_fq_y,
    });

    let kzgProof = new KzgProof({
      A,
      negB,
      shift_power,
      c,
      c_inv: c.inverse(),
      pi0: this.acc.state.pi0,
      pi1: this.acc.state.pi1,
    });

    let kzgState = new KzgState({
      f: c.inverse(),
      lines_hashes_digest: ArrayListHasher.empty(),
    });

    let kzgAccumulator = new KzgAccumulator({
      proof: kzgProof,
      state: kzgState,
    });

    this.g = KZGLineAccumulator.accumulate(g2_lines, tau_lines, A, negB);
    this.line_hashes = new Array(ArrayListHasher.n).fill(Field(0n));
    this.kzg = kzgAccumulator.deepClone();
    return [this.kzg.deepClone(), [...this.line_hashes]];
  }

  zkp13(): [KzgAccumulator, Array<Field>] {
    for (let i = 1; i < ATE_LOOP_COUNT.length - 46; i++) {
      this.line_hashes[i - 1] = Poseidon.hashPacked(Fp12, this.g[i - 1]);
    }

    this.kzg.state.lines_hashes_digest = ArrayListHasher.hash(this.line_hashes);
    return [this.kzg.deepClone(), [...this.line_hashes]];
  }

  zkp14(): [KzgAccumulator, Array<Field>] {
    for (
      let i = ATE_LOOP_COUNT.length - 46;
      i < ATE_LOOP_COUNT.length - 26;
      i++
    ) {
      this.line_hashes[i - 1] = Poseidon.hashPacked(Fp12, this.g[i - 1]);
    }

    this.kzg.state.lines_hashes_digest = ArrayListHasher.hash(this.line_hashes);
    return [this.kzg.deepClone(), [...this.line_hashes]];
  }

  zkp15(): [KzgAccumulator, Array<Field>] {
    for (
      let i = ATE_LOOP_COUNT.length - 26;
      i < ATE_LOOP_COUNT.length - 6;
      i++
    ) {
      this.line_hashes[i - 1] = Poseidon.hashPacked(Fp12, this.g[i - 1]);
    }

    this.kzg.state.lines_hashes_digest = ArrayListHasher.hash(this.line_hashes);
    return [this.kzg.deepClone(), [...this.line_hashes]];
  }

  zkp16(): [KzgAccumulator, Array<Field>] {
    for (let i = ATE_LOOP_COUNT.length - 6; i < ATE_LOOP_COUNT.length; i++) {
      this.line_hashes[i - 1] = Poseidon.hashPacked(Fp12, this.g[i - 1]);
    }

    this.line_hashes[ATE_LOOP_COUNT.length - 1] = Poseidon.hashPacked(
      Fp12,
      this.g[ATE_LOOP_COUNT.length - 1]
    );

    this.kzg.state.lines_hashes_digest = ArrayListHasher.hash(this.line_hashes);
    return [this.kzg.deepClone(), [...this.line_hashes]];
  }

  zkp17(): KzgAccumulator {
    let idx = 0;

    for (let i = 1; i < 10; i++) {
      idx = i - 1;
      this.kzg.state.f = this.kzg.state.f.square().mul(this.g[idx]);

      if (ATE_LOOP_COUNT[i] == 1) {
        this.kzg.state.f = this.kzg.state.f.mul(this.kzg.proof.c_inv);
      }

      if (ATE_LOOP_COUNT[i] == -1) {
        this.kzg.state.f = this.kzg.state.f.mul(this.kzg.proof.c);
      }
    }

    return this.kzg.deepClone();
  }

  zkp18(): KzgAccumulator {
    let idx = 0;

    for (let i = 10; i < 21; i++) {
      idx = i - 1;
      this.kzg.state.f = this.kzg.state.f.square().mul(this.g[idx]);

      if (ATE_LOOP_COUNT[i] == 1) {
        this.kzg.state.f = this.kzg.state.f.mul(this.kzg.proof.c_inv);
      }

      if (ATE_LOOP_COUNT[i] == -1) {
        this.kzg.state.f = this.kzg.state.f.mul(this.kzg.proof.c);
      }
    }

    return this.kzg.deepClone();
  }

  zkp19(): KzgAccumulator {
    let idx = 0;

    for (let i = 21; i < 32; i++) {
      idx = i - 1;
      this.kzg.state.f = this.kzg.state.f.square().mul(this.g[idx]);

      if (ATE_LOOP_COUNT[i] == 1) {
        this.kzg.state.f = this.kzg.state.f.mul(this.kzg.proof.c_inv);
      }

      if (ATE_LOOP_COUNT[i] == -1) {
        this.kzg.state.f = this.kzg.state.f.mul(this.kzg.proof.c);
      }
    }

    return this.kzg.deepClone();
  }

  zkp20(): KzgAccumulator {
    let idx = 0;

    for (let i = 32; i < 43; i++) {
      idx = i - 1;
      this.kzg.state.f = this.kzg.state.f.square().mul(this.g[idx]);

      if (ATE_LOOP_COUNT[i] == 1) {
        this.kzg.state.f = this.kzg.state.f.mul(this.kzg.proof.c_inv);
      }

      if (ATE_LOOP_COUNT[i] == -1) {
        this.kzg.state.f = this.kzg.state.f.mul(this.kzg.proof.c);
      }
    }

    return this.kzg.deepClone();
  }

  zkp21(): KzgAccumulator {
    let idx = 0;

    for (let i = 43; i < 54; i++) {
      idx = i - 1;
      this.kzg.state.f = this.kzg.state.f.square().mul(this.g[idx]);

      if (ATE_LOOP_COUNT[i] == 1) {
        this.kzg.state.f = this.kzg.state.f.mul(this.kzg.proof.c_inv);
      }

      if (ATE_LOOP_COUNT[i] == -1) {
        this.kzg.state.f = this.kzg.state.f.mul(this.kzg.proof.c);
      }
    }

    return this.kzg.deepClone();
  }

  zkp22(): KzgAccumulator {
    let idx = 0;

    for (let i = 54; i < 65; i++) {
      idx = i - 1;
      this.kzg.state.f = this.kzg.state.f.square().mul(this.g[idx]);

      if (ATE_LOOP_COUNT[i] == 1) {
        this.kzg.state.f = this.kzg.state.f.mul(this.kzg.proof.c_inv);
      }

      if (ATE_LOOP_COUNT[i] == -1) {
        this.kzg.state.f = this.kzg.state.f.mul(this.kzg.proof.c);
      }
    }

    return this.kzg.deepClone();
  }

  zkp23(): KzgAccumulator {
    this.kzg.state.f = this.kzg.state.f.mul(this.g[ATE_LOOP_COUNT.length - 1]);

    this.kzg.state.f = this.kzg.state.f
      .mul(this.kzg.proof.c_inv.frobenius_pow_p())
      .mul(this.kzg.proof.c.frobenius_pow_p_squared())
      .mul(this.kzg.proof.c_inv.frobenius_pow_p_cubed());

    const w27 = make_w27();
    const w27_sq = w27.square();

    const shift = Provable.switch(
      [
        this.kzg.proof.shift_power.equals(Field(0)),
        this.kzg.proof.shift_power.equals(Field(1)),
        this.kzg.proof.shift_power.equals(Field(2)),
      ],
      Fp12,
      [Fp12.one(), w27, w27_sq]
    );
    this.kzg.state.f = this.kzg.state.f.mul(shift);

    this.kzg.state.f.assert_equals(Fp12.one());

    return this.kzg.deepClone();
  }

  fullGHashes() {
    const h = this.g.map((gi) => Poseidon.hashPacked(Fp12, gi));
    return ArrayListHasher.hash(h);
  }
}

export { WitnessTracker };
