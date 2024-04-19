import { G2Affine } from "../ec/index.js"
import { computeLineCoeffs } from "../lines/index.js"
import { Fp2, FpC } from "../towers/index.js"
import fs from 'fs'

// gamma = 7G2 
let gamma_x_0 = FpC.from(15512671280233143720612069991584289591749188907863576513414377951116606878472n)
let gamma_x_1 = FpC.from(18551411094430470096460536606940536822990217226529861227533666875800903099477n)
let gamma_x = new Fp2({c0: gamma_x_0, c1: gamma_x_1})

let gamma_y_0 = FpC.from(13376798835316611669264291046140500151806347092962367781523498857425536295743n)
let gamma_y_1 = FpC.from(1711576522631428957817575436337311654689480489843856945284031697403898093784n)
let gamma_y = new Fp2({c0: gamma_y_0, c1: gamma_y_1})

let gamma = new G2Affine({x: gamma_x, y: gamma_y})
let gamma_lines = computeLineCoeffs(gamma);

fs.writeFile('./src/groth16/gamma_lines.json', JSON.stringify(gamma_lines), 'utf8', (err: any) => {
    if (err) {
      console.error('Error writing to file:', err);
      return;
    }
    console.log('Data has been written to gamma_lines.json');
});

// delta = 14G2
// 2Q = 14G2
let delta_x_0 = FpC.from(5661669505880808244819716632315554310634743866396183042073198328850108104508n)
let delta_x_1 = FpC.from(15931622038192996671589371051242156072006014994949009182463955939868399309228n)
let delta_x = new Fp2({c0: delta_x_0, c1: delta_x_1})

let delta_y_0 = FpC.from(4059610048345577719683761812200139910495606568987861136624433831834429358783n)
let delta_y_1 = FpC.from(21571861065665377620827085164892588232073367452877114564853201018957316833140n)
let delta_y = new Fp2({c0: delta_y_0, c1: delta_y_1})

let delta = new G2Affine({x: delta_x, y: delta_y})
let delta_lines = computeLineCoeffs(delta);

fs.writeFile('./src/groth16/delta_lines.json', JSON.stringify(delta_lines), 'utf8', (err: any) => {
    if (err) {
      console.error('Error writing to file:', err);
      return;
    }
    console.log('Data has been written to delta_lines.json');
});
