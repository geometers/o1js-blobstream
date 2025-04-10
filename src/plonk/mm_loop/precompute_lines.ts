import fs from 'fs';
import { Fp2, FpC } from '../../towers/index.js';
import { G2Affine } from '../../ec/g2.js';
import { computeLineCoeffs } from '../../lines/coeffs.js';
import { G2Line } from '../../lines/index.js';

const g2_lines_path = `./src/plonk/mm_loop/g2_lines.json`;
const tau_lines_path = `./src/plonk/mm_loop/tau_lines.json`;

function precompute_lines(
  g2_x_0: bigint,
  g2_x_1: bigint,
  g2_y_0: bigint,
  g2_y_1: bigint,

  tau_x_0: bigint,
  tau_x_1: bigint,
  tau_y_0: bigint,
  tau_y_1: bigint
) {
  let g2_x = new Fp2({ c0: FpC.from(g2_x_0), c1: FpC.from(g2_x_1) });
  let g2_y = new Fp2({ c0: FpC.from(g2_y_0), c1: FpC.from(g2_y_1) });
  let g2 = new G2Affine({ x: g2_x, y: g2_y });

  let g2_lines = computeLineCoeffs(g2);

  fs.writeFile(
    g2_lines_path,
    JSON.stringify(g2_lines.map((line: G2Line) => G2Line.toJSON(line))),
    'utf8',
    (err: any) => {
      if (err) {
        console.error('Error writing to file:', err);
        return;
      }
      console.log('g2 lines successfully written');
    }
  );

  let tau_x = new Fp2({ c0: FpC.from(tau_x_0), c1: FpC.from(tau_x_1) });
  let tau_y = new Fp2({ c0: FpC.from(tau_y_0), c1: FpC.from(tau_y_1) });

  let tau = new G2Affine({ x: tau_x, y: tau_y });

  let tau_lines = computeLineCoeffs(tau);

  fs.writeFile(
    tau_lines_path,
    JSON.stringify(tau_lines.map((line: G2Line) => G2Line.toJSON(line))),
    'utf8',
    (err: any) => {
      if (err) {
        console.error('Error writing to file:', err);
        return;
      }
      console.log('tau lines successfully written');
    }
  );
}

precompute_lines(
  // g2_x
  10857046999023057135944570762232829481370756359578518086990519993285655852781n,
  11559732032986387107991004021392285783925812861821192530917403151452391805634n,

  // g2_y
  8495653923123431417604973247489272438418190587263600148770280649306958101930n,
  4082367875863433681332203403145435568316851327593401208105741076214120093531n,

  // tau_x
  19089565590083334368588890253123139704298730990782503769911324779715431555531n,
  15805639136721018565402881920352193254830339253282065586954346329754995870280n,

  // tau_y
  6779728121489434657638426458390319301070371227460768374343986326751507916979n,
  9779648407879205346559610309258181044130619080926897934572699915909528404984n
);
