import v8 from 'v8';
import { Field, Poseidon, Provable } from "o1js";
import { Sp1PlonkProof, deserializeProof } from '../proof.js';
import { VK } from '../vk.js';
import { FrC } from '../../towers/fr.js';
import { compute_commitment_linearized_polynomial, compute_commitment_linearized_polynomial_split_0, compute_commitment_linearized_polynomial_split_1, compute_commitment_linearized_polynomial_split_2, customPiLagrange, fold_state, opening_of_linearized_polynomial, pi_contribution, preparePairing } from '../piop/plonk_utils.js';
import { Sp1PlonkFiatShamir } from "../fiat-shamir/index.js";
import { Accumulator } from '../accumulator.js';
import { StateUntilPairing, empty } from '../state.js';
import { Fp12 } from '../../towers/fp12.js';
import { make_c, make_w27 } from '../helpers.js';
import fs from "fs";
import { KZGPairing } from '../mm_loop/multi_miller.js';
import { KZGLineAccumulator } from '../mm_loop/accumulate_lines.js';
import { G2Line } from '../../lines/index.js';
import { G1Affine } from '../../ec/index.js';
import { AffineCache } from '../../lines/precompute.js';
import { ATE_LOOP_COUNT } from '../../towers/consts.js';

const hexProof = "0x801c66ac0adb18b19c32120abcaea2dfa6ebc07925a4c12abbb823ffa50aeae202c3b8910a8d533f786b3f53345442e25ec85abd1ba147574d276f2242ff7831b8bea1402648e4c4e876f53fb2d6211414fc5da6e1441484a1a7ccc599621663ad6d628621f6e3a0ded5513478fa59e788b4e06102202cb4663002b9b30467c4054aaf512ecd8e695bb68bf9500cd3de1da60d8084c3f2bf5de1d748d4b01131b9545f9e14507651644746c0952ada51abba4358bba695fcfa5162f013b044e93f486e7704d08d5ee2e0bcd5bbc01b8e6e12f0d09df5a285dc0da05840e5fc1a2f7fb6e200fdb49c7bdf737927f8f9b4f60a000baa9c4377964155caf01e701a1b35d5e92ec3ef85185eb95cb37e92cccb85a35617e7cafa2fe942d0c8a1845540ec1d4d2745400e54065f8601ff4ea8985dad2f3b8000b35e1b90e5525938d5d30157212509e6e2b6bc3b1dc0c71f04c735c431473e1776f138c8e5808e8a99cc59669916d026eafe692c6a8345c17239d6e7683a924360336ad10f948b4bfb2041226b043ad28ad6471c591ec17c09b84c591740e751c04018873ac617df8c2ffa52651b096bd46e6a04bf3e1797e903f47fbb64761a028967c5b3f748165358c8b6b027af7d77b3ca83fee575b2d39e5874128ac952016bda7aca187426bcb7a0460d0111783b814486fdf46d76d6854ed3889036126f3af5ffef96efea25d73524230c22a1f411ec42f76a07c2d5f3b78d2311550b790be1303a81c9aee96077b72a2575c5739eab16dee3e1f3fdaddfc9278814b9ffc764fd883c59fb4a0c4fd577081e07e2504b9eabfbf2962d03873f5ce9ff38ffe0f20446ae43b7abd35e84aa243c4a64ae86448e02a0728c10c8e38e226854d34bcb8ae85b19856e908ad4d01c1a70e88c77dafad62c1eca5dcd0a640558b9162b0fff944cfca3d330ba0e870b306fa22276609649e111fafd23b8eaf4571d6bc47b4d963ad28d80e2e3fcbf04ca5a5f641b32333729d102a9b4a9d26ac03c6e4f15adfedf250f506c4d79f10342a6ccde9efa0bce51fe08df09d697f07e38487f2bd7a04f4bc410eba22c2e1b3517159a47eb183a51cad319b54d3c645d56db854739bb844f8c7e49207f0807d26e1a837bdea04a774f09e64a2ff4cb852ba5f31849c8451330c4b8ab85b5261b092715702b7604202584c70431947264f339486a6222843ff99810d6fb05"

const g2_lines_path = fs.readFileSync("./src/plonk/mm_loop/g2_lines.json", 'utf8');
const tau_lines_path = fs.readFileSync("./src/plonk/mm_loop/tau_lines.json", 'utf8');

let parsed_g2_lines: any[] = JSON.parse(g2_lines_path);
const g2_lines = parsed_g2_lines.map(
  (g: any): G2Line => G2Line.fromJSON(g)
);

let parsed_tau_lines: any[] = JSON.parse(tau_lines_path);
const tau_lines = parsed_tau_lines.map(
  (g: any): G2Line => G2Line.fromJSON(g)
);

function main() {
    // let pi0 = Provable.witness(FrC.provable, () => FrC.from("0x0097228875a04c12dda0a76b705856f1a99fd19613c0ba69b056f4c4d18921e5"))
    // let pi1 = Provable.witness(FrC.provable, () => FrC.from("0x048e48f4b209e2dc6d92839ecba0e9321e83ea61ecb6430fc737b1e94c3fabbb"))
    // let proof = Provable.witness(Sp1PlonkProof, () => new Sp1PlonkProof(deserializeProof(hexProof)))

    // let acc = Provable.witness(Accumulator, () => { 
    //     let proof = new Sp1PlonkProof(deserializeProof(hexProof))
    //     let fs = Sp1PlonkFiatShamir.empty()
    //     let state = new StateUntilPairing(empty(pi0, pi1))

    //     return new Accumulator({
    //         proof, 
    //         fs, 
    //         state
    //     })
    // })

    // Poseidon.hashPacked(Accumulator, acc)

    // const pis = pi_contribution([pi0, pi1], pi0, pi1, VK.inv_domain_size, VK.omega)
    // const l_pi_commit = customPiLagrange(pi0, pi0, proof.qcp_0_wire_x, proof.qcp_0_wire_y, VK)
    // const linearised_opening = opening_of_linearized_polynomial(proof, pi0, pi1, pi1, pi0, pi0);
    // const [lcm_x, lcm_y] = compute_commitment_linearized_polynomial(VK, proof, pi0, pi0, pi0, pi0, pi0, VK.g1_gen_x, VK.g1_gen_y)
    // const fs = Sp1PlonkFiatShamir.empty()
    // fs.squeezeGammaKzg(proof, VK, VK.g1_gen_x, VK.g1_gen_y, pi0)

    // const fs = new Sp1PlonkFiatShamir()
    // const random = fs.squeezeRandomForKzg(proof, VK.g1_gen_x, VK.g1_gen_y)

    // const [cm_x, cm_y, cm_opening] = fold_state(VK, proof, VK.g1_gen_x, VK.g1_gen_y, pi0, pi0);

    // const [kzg_cm_x, kzg_cm_y, neg_fq_x, neg_fq_y] = preparePairing(VK, proof, pi0, VK.g1_gen_x, VK.g1_gen_y, pi1, pi0)

    // const [x, y] = compute_commitment_linearized_polynomial_split_0(proof, VK)
    // compute_commitment_linearized_polynomial_split_1(VK.g1_gen_x, VK.g1_gen_y, proof, VK, pi0, pi1, pi0)
    // compute_commitment_linearized_polynomial_split_2(VK.g1_gen_x, VK.g1_gen_y, proof, VK, pi0, pi1, pi0, pi0, pi1, VK.g1_gen_x, VK.g1_gen_y)

    // 58826
    // fs.gammaKzgDigest(proof, VK, VK.g1_gen_x, VK.g1_gen_y, pi0)
    // let x = Provable.witness(Fp12, () => make_c());
    // let y = Provable.witness(Fp12, () => make_c());
    // let z = Provable.witness(Fp12, () => make_c());
    // let e = Provable.witness(Fp12, () => make_c());
    // let f = Provable.witness(Fp12, () => make_c());

    // Poseidon.hashPacked(Fp12, x)
    // Poseidon.hashPacked(Fp12, y)
    // Poseidon.hashPacked(Fp12, z)
    // Poseidon.hashPacked(Fp12, e)
    // Poseidon.hashPacked(Fp12, f)
    // let arr = Provable.witness(Provable.Array(Field, 65), () => new Array(65).fill(Field(0)))
    // Poseidon.hashPacked(Provable.Array(Field, 65), arr)

    // let arr = Provable.witness(Provable.Array(Fp12, 65), () => new Array(65).fill(make_c()))
    // Poseidon.hashPacked(Provable.Array(Fp12, 65), arr)
    // Poseidon.hashPacked(Provable.Array(Fp12, 65), arr)
    // let A = new G1Affine({ x: VK.g1_gen_x, y: VK.g1_gen_y })
    // let negB = new G1Affine({ x: VK.g1_gen_x, y: VK.g1_gen_y })

    const c = Provable.witness(Fp12, () => make_c())
    Poseidon.hashPacked(Fp12, c);
    Poseidon.hashPacked(Fp12, c);
    Poseidon.hashPacked(Fp12, c);
    Poseidon.hashPacked(Fp12, c);
    Poseidon.hashPacked(Fp12, c);
    Poseidon.hashPacked(Fp12, c);
    Poseidon.hashPacked(Fp12, c);
    Poseidon.hashPacked(Fp12, c);
    Poseidon.hashPacked(Fp12, c);
    Poseidon.hashPacked(Fp12, c);
    // one step in exp part 
    let f = c.square().mul(c).mul(c)
    f = c.square().mul(c).mul(c)
    f = c.square().mul(c).mul(c)
    f = c.square().mul(c).mul(c)
    f = c.square().mul(c).mul(c)
    f = c.square().mul(c).mul(c)
    f = c.square().mul(c).mul(c)
    f = c.square().mul(c).mul(c)
    f = c.square().mul(c).mul(c)
    // f = c.square().mul(c).mul(c)
    // f = c.square().mul(c).mul(c)
    // const f = c.mul(c)
}


// npm run build && node --max-old-space-size=65536 build/src/plonk/split_benchmarks/bench.js
(async () => {
    console.time('running Fp constant version');
    main();
    console.timeEnd('running Fp constant version');

    console.time('running Fp witness generation & checks');
    await Provable.runAndCheck(main);
    console.timeEnd('running Fp witness generation & checks');

    console.time('creating Fp constraint system');
    let cs = await Provable.constraintSystem(main);
    console.timeEnd('creating Fp constraint system');

    console.log(cs.summary());
    const totalHeapSize = v8.getHeapStatistics().total_available_size;
    let totalHeapSizeinGB = (totalHeapSize / 1024 / 1024 / 1024).toFixed(2);
    console.log(`Total heap size: ${totalHeapSizeinGB} GB`);

    // used_heap_size
    const usedHeapSize = v8.getHeapStatistics().used_heap_size;
    let usedHeapSizeinGB = (usedHeapSize / 1024 / 1024 / 1024).toFixed(2);
    console.log(`Used heap size: ${usedHeapSizeinGB} GB`);
})();
