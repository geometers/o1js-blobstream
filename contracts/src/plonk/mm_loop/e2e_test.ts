import fs from 'fs';
import { get_shift_power, make_A, make_c, make_negB, make_w27 } from './helpers.js';
import { KZGPairing } from './multi_miller.js';
import { Provable } from 'o1js';
import { G1Affine } from '../../ec/index.js';
import { Fp12 } from '../../towers/fp12.js';

const g2_lines = fs.readFileSync(`./src/plonk/mm_loop/g2_lines.json`, 'utf8');
const tau_lines = fs.readFileSync(`./src/plonk/mm_loop/tau_lines.json`, 'utf8');
const kzgP = new KZGPairing(g2_lines, tau_lines, make_w27());

function main() {
  let A = Provable.witness(G1Affine, () => make_A());
  let negB = Provable.witness(G1Affine, () => make_negB());
  let c = Provable.witness(Fp12, () => make_c());

  kzgP.proveEqual(A, negB, get_shift_power(), c);
}


// npm run build && node --max-old-space-size=65536 build/src/plonk/mm_loop/e2e_test.js
import v8 from 'v8';
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
