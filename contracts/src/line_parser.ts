import { G2Line } from "./lines/index.js";
import { ATE_LOOP_COUNT } from "./towers/consts.js";

function ateCntSlice(from: number, to: number) {
    let line_cnt = 0;
  
    for (let i = from; i < to; i++) {
      if (ATE_LOOP_COUNT[i] == 0) {
        line_cnt += 1
      } else {
        line_cnt += 2
      }
    }

    return line_cnt
}

class LineParser {
    static parse(from: number, to: number, lines: Array<G2Line>): Array<G2Line> {
        let start = ateCntSlice(1, from);
        let toSlice = ateCntSlice(from, to); 
        return lines.slice(start, start + toSlice)
    }

    static frobenius_lines(lines: Array<G2Line>) {
        return lines.slice(-2)
    }
}

export { LineParser }