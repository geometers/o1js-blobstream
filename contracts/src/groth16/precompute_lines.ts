import { G2Affine } from "../ec/index.js"
import { G2Line, computeLineCoeffs } from "../lines/index.js"
import { Fp2, FpC } from "../towers/index.js"
import fs from 'fs'

// gamma = 9G2 
let gamma_x_0 = FpC.from(13193736976255674115506271204866518055492249136949196233486205080643750676277n)
let gamma_x_1 = FpC.from(4821341333500639427117806840255663771228880693152568023710381392280915109763n)
let gamma_x = new Fp2({c0: gamma_x_0, c1: gamma_x_1})

let gamma_y_0 = FpC.from(18281872490245496509379794148214936771631698359916681711594256455596877716636n)
let gamma_y_1 = FpC.from(5830427496645529367349790160167113194176899755997018131088404969293864912751n)
let gamma_y = new Fp2({c0: gamma_y_0, c1: gamma_y_1})

let gamma = new G2Affine({x: gamma_x, y: gamma_y})
let gamma_lines = computeLineCoeffs(gamma);

fs.writeFile('./src/groth16/gamma_lines.json', JSON.stringify(gamma_lines.map((g: G2Line) => G2Line.toJSON(g))), 'utf8', (err: any) => {
    if (err) {
      console.error('Error writing to file:', err);
      return;
    }
    console.log('Data has been written to gamma_lines.json');
});

// delta = 10G2
// 2Q = 10G2
let delta_x_0 = FpC.from(14502447760486387799059318541209757040844770937862468921929310682431317530875n)
let delta_x_1 = FpC.from(2443430939986969712743682923434644543094899517010817087050769422599268135103n)
let delta_x = new Fp2({c0: delta_x_0, c1: delta_x_1})

let delta_y_0 = FpC.from(11721331165636005533649329538372312212753336165656329339895621434122061690013n)
let delta_y_1 = FpC.from(4704672529862198727079301732358554332963871698433558481208245291096060730807n)
let delta_y = new Fp2({c0: delta_y_0, c1: delta_y_1})

let delta = new G2Affine({x: delta_x, y: delta_y})
let delta_lines = computeLineCoeffs(delta);

fs.writeFile('./src/groth16/delta_lines.json', JSON.stringify(delta_lines.map((g: G2Line) => G2Line.toJSON(g))), 'utf8', (err: any) => {
    if (err) {
      console.error('Error writing to file:', err);
      return;
    }
    console.log('Data has been written to delta_lines.json');
});
