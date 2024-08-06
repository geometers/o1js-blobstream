import { Field, Poseidon, Provable } from "o1js";
import { Accumulator, RecursionProof, State } from "./recursion/data.js";
import { ATE_LOOP_COUNT, Fp12, Fp2 } from "../towers/index.js";
import { G2Affine } from "../ec/g2.js";
import { G2Line, computeLineCoeffs } from "../lines/index.js";
import { LineAccumulator } from "./accumulate_lines.js";
import { Proof } from "./proof.js";
import { AuXWitness } from "../aux_witness.js";
import { ArrayListHasher } from "../array_list_hasher.js";
import { VK } from "./vk_from_env.js";
import { LineParser } from "../line_parser.js";
import { bn254 } from "../ec/g1.js";
import { G1Affine } from "../ec/index.js";

class WitnessTracker {
    proof: Proof
    acc: Accumulator
    line_hashes: Array<Field> 
    g: Array<Fp12>
    b_lines: Array<G2Line>

    constructor(proof: Proof, auxWitness: AuXWitness) {
        this.proof = proof; 
        const recursionProof = new RecursionProof({
            negA: proof.negA, 
            B: proof.B, 
            C: proof.C, 
            PI: proof.PI, 
            c: auxWitness.c, 
            c_inv: auxWitness.c.inverse(), 
            shift_power: auxWitness.shift_power
        }); 
    
        const state = new State({
            T: new G2Affine({ x: proof.B.x, y: proof.B.y }), 
            f: Fp12.zero(), 
            g_digest: ArrayListHasher.empty()
        })

        this.acc = new Accumulator({ proof: recursionProof, state })
        this.b_lines = computeLineCoeffs(proof.B);
        this.line_hashes = new Array(ATE_LOOP_COUNT.length).fill(Field(0n))
        this.g = LineAccumulator.accumulate(this.b_lines, VK.gamma_lines, VK.delta_lines, proof.B, proof.negA, proof.PI, proof.C)

        state.g_digest.assertEquals(ArrayListHasher.hash(this.line_hashes))
    }

    runT(begin: number, end: number) {
        const negB = this.proof.B.neg(); 
        const b_lines = LineParser.parse(begin, end, this.b_lines);

        let line_cnt = 0; 
        for(let i = begin; i < end; i++) {
            const b_line = b_lines[line_cnt];
            line_cnt += 1;
            this.acc.state.T = this.acc.state.T.double_from_line(b_line.lambda);

            if(ATE_LOOP_COUNT[i] == 1) {
                const b_line = b_lines[line_cnt];
                line_cnt += 1; 
                this.acc.state.T = this.acc.state.T.add_from_line(b_line.lambda, this.proof.B);
            } else if (ATE_LOOP_COUNT[i] == -1) { 
                const b_line = b_lines[line_cnt];
                line_cnt += 1; 
                this.acc.state.T = this.acc.state.T.add_from_line(b_line.lambda, negB);
            }
        }
    }

    updateTFrob() {
        const piB = this.proof.B.frobenius(); 
        let frob_b_lines = LineParser.frobenius_lines(this.b_lines);
        this.acc.state.T = this.acc.state.T.add_from_line(frob_b_lines[0].lambda, piB);
    }

    in0(): [Accumulator, Array<Field>, Array<G2Line>] {
        return [this.acc.deepClone(), [...this.line_hashes], this.b_lines]
    }

    zkp0(): [Accumulator, Array<Field>] { 
        const begin = 1; 
        const end = ATE_LOOP_COUNT.length - 55; 

        this.runT(begin, end); // update T 
        for (let i = begin; i < end; i++) {
            this.line_hashes[i - 1] = Poseidon.hashPacked(Fp12, this.g[i - 1])
        }
        this.acc.state.g_digest = ArrayListHasher.hash(this.line_hashes)
        return [this.acc.deepClone(), [...this.line_hashes]]
    }

    zkp1(): [Accumulator, Array<Field>] { 
        const begin = ATE_LOOP_COUNT.length - 55; 
        const end = ATE_LOOP_COUNT.length - 45;

        this.runT(begin, end); // update T 
        for (let i = begin; i < end; i++) {
            this.line_hashes[i - 1] = Poseidon.hashPacked(Fp12, this.g[i - 1])
        }
        this.acc.state.g_digest = ArrayListHasher.hash(this.line_hashes)
        return [this.acc.deepClone(), [...this.line_hashes]]
    }

    zkp2(): [Accumulator, Array<Field>] { 
        const begin = ATE_LOOP_COUNT.length - 45; 
        const end = ATE_LOOP_COUNT.length - 35;

        this.runT(begin, end); // update T 
        for (let i = begin; i < end; i++) {
            this.line_hashes[i - 1] = Poseidon.hashPacked(Fp12, this.g[i - 1])
        }
        this.acc.state.g_digest = ArrayListHasher.hash(this.line_hashes)
        return [this.acc.deepClone(), [...this.line_hashes]]
    }

    zkp3(): [Accumulator, Array<Field>] { 
        const begin = ATE_LOOP_COUNT.length - 35; 
        const end = ATE_LOOP_COUNT.length - 25;

        this.runT(begin, end); // update T 
        for (let i = begin; i < end; i++) {
            this.line_hashes[i - 1] = Poseidon.hashPacked(Fp12, this.g[i - 1])
        }
        this.acc.state.g_digest = ArrayListHasher.hash(this.line_hashes)
        return [this.acc.deepClone(), [...this.line_hashes]]
    }

    zkp4(): [Accumulator, Array<Field>] { 
        const begin = ATE_LOOP_COUNT.length - 25; 
        const end = ATE_LOOP_COUNT.length - 15;

        this.runT(begin, end); // update T 
        for (let i = begin; i < end; i++) {
            this.line_hashes[i - 1] = Poseidon.hashPacked(Fp12, this.g[i - 1])
        }
        this.acc.state.g_digest = ArrayListHasher.hash(this.line_hashes)
        return [this.acc.deepClone(), [...this.line_hashes]]
    }

    zkp5(): [Accumulator, Array<Field>] { 
        const begin = ATE_LOOP_COUNT.length - 15; 
        const end = ATE_LOOP_COUNT.length - 6;

        this.runT(begin, end); // update T 
        for (let i = begin; i < end; i++) {
            this.line_hashes[i - 1] = Poseidon.hashPacked(Fp12, this.g[i - 1])
        }
        this.acc.state.g_digest = ArrayListHasher.hash(this.line_hashes)
        return [this.acc.deepClone(), [...this.line_hashes]]
    }

    zkp6(): [Accumulator, Array<Field>] { 
        const begin = ATE_LOOP_COUNT.length - 6; 
        const end = ATE_LOOP_COUNT.length;

        this.runT(begin, end); // update T 
        for (let i = begin; i < end; i++) {
            this.line_hashes[i - 1] = Poseidon.hashPacked(Fp12, this.g[i - 1])
        }

        this.updateTFrob(); // update T with frobenius line part 
        this.line_hashes[ATE_LOOP_COUNT.length - 1] = Poseidon.hashPacked(Fp12, this.g[ATE_LOOP_COUNT.length - 1])

        this.acc.state.g_digest = ArrayListHasher.hash(this.line_hashes)
        return [this.acc.deepClone(), [...this.line_hashes]]
    }

    zkp7(): Accumulator { 
        let f = this.acc.proof.c_inv;

        for (let i = 1; i < 10; i++) {
            f = f.square().mul(this.g[i - 1]);

            if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(this.acc.proof.c_inv);
            }

            if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(this.acc.proof.c);
            }
        }

        this.acc.state.f = f;
        return this.acc.deepClone()
    }

    zkp8(): Accumulator { 
        let f = this.acc.state.f;

        for (let i = 10; i < 21; i++) {
            f = f.square().mul(this.g[i - 1]);

            if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(this.acc.proof.c_inv);
            }

            if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(this.acc.proof.c);
            }
        }

        this.acc.state.f = f;
        return this.acc.deepClone()
    }

    zkp9(): Accumulator { 
        let f = this.acc.state.f;

        for (let i = 21; i < 32; i++) {
            f = f.square().mul(this.g[i - 1]);

            if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(this.acc.proof.c_inv);
            }

            if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(this.acc.proof.c);
            }
        }

        this.acc.state.f = f;
        return this.acc.deepClone()
    }

    zkp10(): Accumulator { 
        let f = this.acc.state.f;

        for (let i = 32; i < 43; i++) {
            f = f.square().mul(this.g[i - 1]);

            if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(this.acc.proof.c_inv);
            }

            if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(this.acc.proof.c);
            }
        }

        this.acc.state.f = f;
        return this.acc.deepClone()
    }

    zkp11(): Accumulator { 
        let f = this.acc.state.f;

        for (let i = 43; i < 54; i++) {
            f = f.square().mul(this.g[i - 1]);

            if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(this.acc.proof.c_inv);
            }

            if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(this.acc.proof.c);
            }
        }

        this.acc.state.f = f;
        return this.acc.deepClone()
    }

    zkp12(): Accumulator { 
        let f = this.acc.state.f;

        for (let i = 54; i < 65; i++) {
            f = f.square().mul(this.g[i - 1]);

            if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(this.acc.proof.c_inv);
            }

            if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(this.acc.proof.c);
            }
        }

        this.acc.state.f = f;
        return this.acc.deepClone()
    }

    zkp13(): Accumulator { 
        let f = this.acc.state.f;

        f = f.mul(this.g[ATE_LOOP_COUNT.length - 1]); // mul f with frobenius part
		f = f
			.mul(this.acc.proof.c_inv.frobenius_pow_p())
			.mul(this.acc.proof.c.frobenius_pow_p_squared())
			.mul(this.acc.proof.c_inv.frobenius_pow_p_cubed())
            .mul(VK.alpha_beta);

        const w27 = VK.w27;
        const w27_sq = VK.w27_square; 

        const shift = Provable.switch([this.acc.proof.shift_power.equals(Field(0)), this.acc.proof.shift_power.equals(Field(1)), this.acc.proof.shift_power.equals(Field(2))], Fp12, [Fp12.one(), w27, w27_sq]);
		f = f.mul(shift);
		f.assert_equals(Fp12.one());

        this.acc.state.f = f;
        return this.acc.deepClone()
    }

    zkp14() {
        let acc = new bn254({ x: VK.ic0.x, y: VK.ic0.y }); 

        acc = acc.add(VK.ic1.scale(this.proof.pis[0]));
        acc = acc.add(VK.ic2.scale(this.proof.pis[1]));
        acc = acc.add(VK.ic3.scale(this.proof.pis[2]));
        // acc = acc.add(VK.ic4.scale(pis[3]));
        // acc = acc.add(VK.ic5.scale(pis[4]));

        return new G1Affine({ x: acc.x.assertCanonical(), y: acc.y.assertCanonical() })
    }
}

export { WitnessTracker }