import { Provable } from 'o1js';
import { Groth16Verifier } from './verifier.js';

const grothVerifier = new Groth16Verifier('./src/groth/example_jsons/vk.json');

function main() {
  const proof = Provable.witness(Proof, () =>
    Proof.parse(grothVerifier.vk, './src/groth/example_jsons/proof.json')
  );
  const aux_witness = Provable.witness(AuXWitness, () =>
    AuXWitness.parse('./src/groth/example_jsons/aux_witness.json')
  );
  grothVerifier.verify(proof, aux_witness);
}

// npm run build && node --max-old-space-size=65536 build/src/groth/e2e_test.js
import v8 from 'v8';
import { Proof } from './proof.js';
import { AuXWitness } from '../aux_witness.js';
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
