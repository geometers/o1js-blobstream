import { Provable, Struct } from "o1js";
import { ATE_LOOP_COUNT, Fp12, FpC, FrC } from "../towers/index.js";

class StateUntilPairing extends Struct({
    pi0: FrC.provable, 
    pi1: FrC.provable,

    zeta_pow_n: FrC.provable,
    zh_eval: FrC.provable,

    alpha_2_l0: FrC.provable,

    hx: FpC.provable, 
    hy: FpC.provable, 

    pi: FrC.provable, // public inputs contribution

    linearized_opening: FrC.provable, 

    lcm_x: FpC.provable, 
    lcm_y: FpC.provable, 

    cm_x: FpC.provable, 
    cm_y: FpC.provable, 

    cm_opening: FrC.provable, 

    kzg_random: FrC.provable, 

    kzg_cm_x: FpC.provable, 
    kzg_cm_y: FpC.provable, 
    neg_fq_x: FpC.provable, 
    neg_fq_y: FpC.provable,

    // in pairing: 
    // g: Provable.Array(Fp12, ATE_LOOP_COUNT.length), 
    // f: Fp12

}) {}

type StateUntilPairingType = {
    pi0: FrC, 
    pi1: FrC,

    zeta_pow_n: FrC,
    zh_eval: FrC,

    alpha_2_l0: FrC,

    hx: FpC, 
    hy: FpC, 

    pi: FrC, // public inputs contribution

    linearized_opening: FrC, 

    lcm_x: FpC, 
    lcm_y: FpC, 

    cm_x: FpC, 
    cm_y: FpC, 

    cm_opening: FrC, 

    kzg_random: FrC, 

    kzg_cm_x: FpC, 
    kzg_cm_y: FpC, 
    neg_fq_x: FpC, 
    neg_fq_y: FpC,

    // in pairing: 
    // g: Array<Fp12>, 
    // f: Fp12
}

function empty(pi0: FrC, pi1: FrC): StateUntilPairingType {
    return {
        pi0, 
        pi1, 

        zeta_pow_n: FrC.from(0n),
        zh_eval: FrC.from(0n),
    
        alpha_2_l0: FrC.from(0n),
    
        hx: FpC.from(0n), 
        hy: FpC.from(0n), 
    
        pi: FrC.from(0n), // public inputs contribution
    
        linearized_opening: FrC.from(0n), 
    
        lcm_x: FpC.from(0n), 
        lcm_y: FpC.from(0n), 
    
        cm_x: FpC.from(0n), 
        cm_y: FpC.from(0n), 
    
        cm_opening: FrC.from(0n), 
    
        kzg_random: FrC.from(0n), 
    
        kzg_cm_x: FpC.from(0n), 
        kzg_cm_y: FpC.from(0n), 
        neg_fq_x: FpC.from(0n), 
        neg_fq_y: FpC.from(0n),
    
        // in pairing: 
        // g: new Array(ATE_LOOP_COUNT.length).fill(Fp12.zero()),
        // f: Fp12.zero()
    }
}

export { StateUntilPairingType, StateUntilPairing, empty }