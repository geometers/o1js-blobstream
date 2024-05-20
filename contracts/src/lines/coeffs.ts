import { G2Line } from './index.js';
import { G2Affine } from '../ec/index.js';
import { ATE_LOOP_COUNT } from '../towers/index.js';

const computeLineCoeffs = (Q: G2Affine): Array<G2Line> => {
  const negQ = Q.neg();
  const lines: Array<G2Line> = [];

  let T = new G2Affine({ x: Q.x, y: Q.y });

  let line;
  for (let i = 1; i < ATE_LOOP_COUNT.length; i++) {
    line = G2Line.fromPoints(T, T);
    lines.push(line);
    T = T.double_from_line(line.lambda);

    if (ATE_LOOP_COUNT[i] == 1) {
      line = G2Line.fromPoints(T, Q);
      lines.push(line);

      T = T.add_from_line(line.lambda, Q);
    } else if (ATE_LOOP_COUNT[i] == -1) {
      line = G2Line.fromPoints(T, negQ);
      lines.push(line);

      T = T.add_from_line(line.lambda, negQ);
    }
  }

  let Q1 = Q.frobenius();
  let Q2 = Q1.negative_frobenius();

  line = G2Line.fromPoints(T, Q1);
  lines.push(line);

  T = T.add_from_line(line.lambda, Q1);

  line = G2Line.fromPoints(T, Q2);
  lines.push(line);

  return lines;
};

export { computeLineCoeffs };
