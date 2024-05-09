import { Struct } from "o1js";
import { FpC } from "../towers/fp.js";
import { G2Affine } from "./g2.js";

class G1Affine extends Struct({x: FpC.provable, y: FpC.provable}) {}

export { G1Affine, G2Affine }