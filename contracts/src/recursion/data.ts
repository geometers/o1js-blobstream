import { Field, Provable, Struct } from "o1js";
import { G1Affine, G2Affine } from "../ec/index.js";
import { ATE_LOOP_COUNT, Fp12 } from "../towers/index.js";

class Groth16Data extends Struct({
    negA: G1Affine,
    B: G2Affine, 
    PI: G1Affine, 
    C: G1Affine, 
    g: Provable.Array(Fp12, ATE_LOOP_COUNT.length),
    T: G2Affine, 
    c: Fp12, 
    w27: Fp12
}) {}

export { Groth16Data }