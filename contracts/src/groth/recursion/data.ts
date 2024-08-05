import { Field, Provable, Struct } from "o1js";
import { G1Affine, G2Affine } from "../../ec/index.js";
import { Fp12 } from "../../towers/index.js";

class RecursionProof extends Struct({
    negA: G1Affine, 
    B: G2Affine, 
    C: G1Affine,
    PI: G1Affine, 
    c: Fp12, 
    c_inv: Fp12,
    shift_power: Field,
}) {
    deepClone() {
        return new RecursionProof({
            negA: new G1Affine({ x: this.negA.x, y: this.negA.y }),
            B: new G2Affine({ x: this.B.x, y: this.B.y }),
            C: new G1Affine({ x: this.C.x, y: this.C.y }),
            PI: new G1Affine({ x: this.PI.x, y: this.PI.y }),   
            c: new Fp12({ c0: this.c.c0, c1: this.c.c1 }),
            c_inv: new Fp12({ c0: this.c_inv.c0, c1: this.c_inv.c1 }),
            shift_power: Field.from(this.shift_power)
        })
    }
};

class State extends Struct({
    T: G2Affine, 
    f: Fp12, 
    g_digest: Field
}) {
    deepClone() {
        return new State({
            T: new G2Affine({ x: this.T.x, y: this.T.y }),
            f: new Fp12({ c0: this.f.c0, c1: this.f.c1 }),
            g_digest: Field.from(this.g_digest)
        })
    }
}

class Accumulator extends Struct({
    proof: RecursionProof, 
    state: State
}) {
    deepClone() {
        return new Accumulator({
            proof: this.proof.deepClone(), 
            state: this.state.deepClone()
        })
    }
}

export { RecursionProof, State, Accumulator }