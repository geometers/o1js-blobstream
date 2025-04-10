import { G2Line } from '../../lines/index.js';
import fs from 'fs';
import { ATE_LOOP_COUNT } from '../../towers/consts.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const g2_lines_required = require('../mm_loop/g2_lines.json');
const tau_lines_required = require('../mm_loop/tau_lines.json');
//import g2_lines_required from '../mm_loop/g2_lines.json';
//import tau_lines_required from '../mm_loop/tau_lines.json'
const g2_lines_path = JSON.stringify(g2_lines_required); //fs.readFileSync(`./src/plonk/mm_loop/g2_lines.json`, 'utf8');
const tau_lines_path = JSON.stringify(tau_lines_required); //fs.readFileSync(`./src/plonk/mm_loop/tau_lines.json`, 'utf8');

function ateCntSlice(from: number, to: number) {
  let line_cnt = 0;

  for (let i = from; i < to; i++) {
    if (ATE_LOOP_COUNT[i] == 0) {
      line_cnt += 1;
    } else {
      line_cnt += 2;
    }
  }

  return line_cnt;
}

class LineParser {
  g2_lines: Array<G2Line>;
  tau_lines: Array<G2Line>;

  constructor(g2_lines: Array<G2Line>, tau_lines: Array<G2Line>) {
    this.g2_lines = g2_lines;
    this.tau_lines = tau_lines;
  }

  static init() {
    let parsed_g2_lines: any[] = JSON.parse(g2_lines_path);
    let g2_lines = parsed_g2_lines.map((g: any): G2Line => G2Line.fromJSON(g));

    let parsed_tau_lines: any[] = JSON.parse(tau_lines_path);
    let tau_lines = parsed_tau_lines.map(
      (tau: any): G2Line => G2Line.fromJSON(tau)
    );

    return new LineParser(g2_lines, tau_lines);
  }

  parse_g2(from: number, to: number) {
    let start = ateCntSlice(1, from);
    let toSlice = ateCntSlice(from, to);
    return this.g2_lines.slice(start, start + toSlice);
  }

  parse_tau(from: number, to: number) {
    let start = ateCntSlice(1, from);
    let toSlice = ateCntSlice(from, to);
    return this.tau_lines.slice(start, start + toSlice);
  }

  frobenius_g2_lines() {
    return this.g2_lines.slice(-2);
  }

  frobenius_tau_lines() {
    return this.tau_lines.slice(-2);
  }
}

export { LineParser };
