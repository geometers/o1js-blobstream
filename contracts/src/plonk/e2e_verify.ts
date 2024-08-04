import { Provable } from 'o1js';
import v8 from 'v8';
import { Sp1PlonkVerifier } from './verifier.js';
import { VK } from './vk.js';
import fs from "fs"
import { FrC } from '../towers/fr.js';
import { Sp1PlonkProof, deserializeProof } from './proof.js';
import { parsePublicInputs } from './parse_pi.js';
import { AuXWitness } from './aux_witness.js';

const args = process.argv;

const hexProof = args[2]
const programVk = args[3]
const hexPi = args[4]
const auxWtnsPath = args[5]
const auxWitness = AuXWitness.loadFromPath(auxWtnsPath)

const g2_lines = fs.readFileSync(`./src/plonk/mm_loop/g2_lines.json`, 'utf8');
const tau_lines = fs.readFileSync(`./src/plonk/mm_loop/tau_lines.json`, 'utf8');

const Verifier = new Sp1PlonkVerifier(VK, g2_lines, tau_lines)

function main() {
    const [pi0, pi1] = Provable.witness(Provable.Array(FrC.provable, 2), () => parsePublicInputs(programVk, hexPi));
    const proof = Provable.witness(Sp1PlonkProof, () => new Sp1PlonkProof(deserializeProof(hexProof)))

    Verifier.verify(proof, pi0, pi1, auxWitness);
}

// npm run build && node --max-old-space-size=65536 build/src/plonk/e2e_verify.js
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
