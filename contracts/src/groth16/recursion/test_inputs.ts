import { WitnessTracker } from "./witness_trace.js";
import { getB, getC, getNegA, getPI, get_c_hint, get_shift_power } from "./helpers.js";
import { ATE_LOOP_COUNT, Fp12 } from "../../towers/index.js";
import { Poseidon, Provable } from "o1js";


const wt = new WitnessTracker();
let in0 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), Fp12.one(), get_shift_power());
let in1 = wt.zkp0(in0);
let in2 = wt.zkp1(in1);
let in3 = wt.zkp2(in2);
let in4 = wt.zkp3(in3);
let in5 = wt.zkp4(in4);
let in6 = wt.zkp5(in5);
let in7 = wt.zkp6(in6);
let in8 = wt.zkp7(in7);
let in9 = wt.zkp8(in8);
let in10 = wt.zkp9(in9);
let in11 = wt.zkp10(in10);
let in12 = wt.zkp11(in11);
let in13 = wt.zkp12(in12);
let in14 = wt.zkp13(in13);
let in15 = wt.zkp14(in14);
let in16 = wt.zkp15(in15);
let in17 = wt.zkp16(in16);
let in18 = wt.zkp17(in17);
wt.zkp18(in18);

console.log("proof 0 in: ", Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), in0.g).toBigInt());