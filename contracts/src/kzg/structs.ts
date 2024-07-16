import { Field, Poseidon, Provable, Struct } from "o1js";
import { ATE_LOOP_COUNT, Fp12, FrC } from "../towers/index.js";
import { G1Affine } from "../ec/index.js";
import { G2Line } from "../lines/index.js";

// e(A, [1])*e(negB, [x]) = 1
class KzgProof extends Struct({
    A: G1Affine, 
    negB: G1Affine, 
    shift_power: Field, 
    c: Fp12,
    c_inv: Fp12,
    pi0: FrC.provable, 
    pi1: FrC.provable,
}) {}; 

class KzgState extends Struct({
    f: Fp12, 
    lines_hashes_digest: Field
}) 
{
    deepClone() {
        return new KzgState({
            f: new Fp12({ c0: this.f.c0, c1: this.f.c1 }),
            lines_hashes_digest: Field.from(this.lines_hashes_digest.toBigInt())
        })
    }
}


class KzgAccumulator extends Struct({
    proof: KzgProof, 
    state: KzgState
}) 
{
    deepClone() {
        return new KzgAccumulator({
            proof: this.proof, 
            state: this.state.deepClone()
        })
    }
}


class ArrayListHasher { 
    static n: number;

    static empty(): Field {
        const a = new Array(this.n).fill(Field(0n))
        return Poseidon.hashPacked(Provable.Array(Field, ATE_LOOP_COUNT.length), a)
    }

    static hash(arr: Array<Field>): Field {
        return Poseidon.hashPacked(Provable.Array(Field, ATE_LOOP_COUNT.length), arr)
    }

    static open(lhs: Array<Field>, opening: Array<Fp12>, rhs: Array<Field>): Field {
        const opening_hashes: Field[] = opening.map((x) => Poseidon.hashPacked(Fp12, x));

        let arr: Field[] = [] 
        arr = arr.concat(lhs) 
        arr = arr.concat(opening_hashes)
        arr = arr.concat(rhs)

        return this.hash(arr)
    }
}

ArrayListHasher.n = ATE_LOOP_COUNT.length

export { KzgProof, KzgState, KzgAccumulator, ArrayListHasher }