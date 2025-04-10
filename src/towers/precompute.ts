import { FpC } from './fp.js';
import { Fp2 } from './fp2.js';
import fs from 'fs';
import { GAMMA_1S, GAMMA_2S, GAMMA_3S, NEG_GAMMA_13 } from './precomputed.js';

fs.writeFile(
  './src/towers/gamma_1s.json',
  JSON.stringify(GAMMA_1S.map((g: Fp2) => Fp2.toJSON(g))),
  'utf8',
  (err: any) => {
    if (err) {
      console.error('Error writing to file:', err);
      return;
    }
    console.log('Data has been written to gamma_1s.json');
  }
);

fs.writeFile(
  './src/towers/gamma_2s.json',
  JSON.stringify(GAMMA_2S.map((g: Fp2) => Fp2.toJSON(g))),
  'utf8',
  (err: any) => {
    if (err) {
      console.error('Error writing to file:', err);
      return;
    }
    console.log('Data has been written to gamma_2s.json');
  }
);

fs.writeFile(
  './src/towers/gamma_3s.json',
  JSON.stringify(GAMMA_3S.map((g: Fp2) => Fp2.toJSON(g))),
  'utf8',
  (err: any) => {
    if (err) {
      console.error('Error writing to file:', err);
      return;
    }
    console.log('Data has been written to gamma_3s.json');
  }
);

fs.writeFile(
  './src/towers/neg_gamma.json',
  JSON.stringify(Fp2.toJSON(NEG_GAMMA_13)),
  'utf8',
  (err: any) => {
    if (err) {
      console.error('Error writing to file:', err);
      return;
    }
    console.log('Data has been written to neg_gamma.json');
  }
);

// let gamma_1s_input = fs.readFileSync('./src/towers/gamma_1s.json', 'utf8');
// let parsed_gamma_1s: any[] = JSON.parse(gamma_1s_input);
// let gamma_1s = parsed_gamma_1s.map(
//   (g: any): Fp2 => Fp2.fromJSON(g)
// );

// gamma_1s[0].assert_equals(GAMMA_1S[0]);
