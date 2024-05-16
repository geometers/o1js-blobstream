import { Struct } from 'o1js';
import { FpA } from '../towers/fp.js';
import { G2Affine } from './g2.js';

class G1Affine extends Struct({ x: FpA.provable, y: FpA.provable }) {}

export { G1Affine, G2Affine };
