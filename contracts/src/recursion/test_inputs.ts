import { WitnessTracker } from "./witness_trace.js";
import { getB, getC, getNegA, getPI, get_c_hint, get_shift_power } from "./helpers.js";
import { ATE_LOOP_COUNT, Fp12 } from "../towers/index.js";
import { Poseidon, Provable } from "o1js";


const wt = new WitnessTracker();
let in0 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), Fp12.one(), get_shift_power());
let in1 = wt.zkp0(in0);
// let in2 = wt.zkp1(in1);

console.log("proof 0 in: ", Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), in0.g).toBigInt());