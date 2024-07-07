import fs from "fs";
import assert from "assert";
import { createForeignField } from "o1js";

class Fr extends createForeignField(21888242871839275222246405745257275088548364400416034343698204186575808495617n) {}
class FrC extends Fr.Canonical {}

function loadPoseidon() {
    const PoseidonParams = {
        C: new Array<Array<FrC>>(),
        S: new Array<Array<FrC>>(),
        M: new Array<Array<Array<FrC>>>(),
        P: new Array<Array<Array<FrC>>>()
    }
    
    const params = JSON.parse(fs.readFileSync('./src/poseidon/constants.json', 'utf8'));
    
    for (let i = 0; i < params.C.length; i++) {
        const ci = params.C[i].map((x: string) => FrC.provable.fromJSON(x))
        PoseidonParams.C.push(ci)
    }

    for (let i = 0; i < params.S.length; i++) {
        const si = params.S[i].map((x: string) => FrC.provable.fromJSON(x))
        PoseidonParams.S.push(si)
    }
    
    for (let i = 0; i < params.M.length; i++) {
        const mi = [];
        for (let j = 0; j < params.M[i].length; j++) {
            const mij = params.M[i][j].map((x: string) => FrC.provable.fromJSON(x))
            mi.push(mij)
        }
        PoseidonParams.M.push(mi)
    }

    for (let i = 0; i < params.P.length; i++) {
        const pi = [];
        for (let j = 0; j < params.P[i].length; j++) {
            const pij = params.P[i][j].map((x: string) => FrC.provable.fromJSON(x))
            pi.push(pij)
        }
        PoseidonParams.P.push(pi)
    }

    const pow5 = (a: FrC) => {
        let acc = a.mul(a).assertCanonical(); // a^2 
        acc = acc.mul(acc).assertCanonical() // a^4
        return a.mul(acc).assertCanonical() // a^5
    }

    // Supports only 1 output
    function poseidon(inputs: Array<FrC>, initState: FrC = FrC.from(0n)): FrC {
        const N_ROUNDS_F = 8;
        const N_ROUNDS_P = [56, 57, 56, 60, 60, 63, 64, 63, 60, 66, 60, 65, 70, 60, 64, 68];

        assert(inputs.length > 0);
        assert(inputs.length <= N_ROUNDS_P.length);

        const t = inputs.length + 1;
        const nRoundsF = N_ROUNDS_F;
        const nRoundsP = N_ROUNDS_P[t - 2];
        const C = PoseidonParams.C[t-2];
        const S = PoseidonParams.S[t-2];
        const M = PoseidonParams.M[t-2];
        const P = PoseidonParams.P[t-2];

        let state = [initState, ...inputs];

        state = state.map((a, i) => a.add(C[i]).assertCanonical());

        for (let r = 0; r < nRoundsF/2 - 1; r++) {
            state = state.map(a => pow5(a)); 
            state = state.map((a, i) => a.add(C[(r +1)* t +i]).assertCanonical());
            state = state.map((_, i) => 
                state.reduce((acc, a, j) => {
                    let tmp = a.mul(M[j][i]).assertCanonical();
                    return acc.add(tmp).assertCanonical()
                }, FrC.from(0n))
            );
        }

        state = state.map(a => pow5(a));
        state = state.map((a, i) => a.add(C[(nRoundsF/2-1 +1)* t +i]).assertCanonical());
        state = state.map((_, i) => 
            state.reduce((acc, a, j) => {
                let tmp = a.mul(P[j][i]).assertCanonical();
                return acc.add(tmp).assertCanonical()
            }, FrC.from(0n))
        );

        for (let r = 0; r < nRoundsP; r++) {
            state[0] = pow5(state[0]);
            state[0] = state[0].add(C[(nRoundsF/2 +1)*t + r]).assertCanonical()

            const s0 = state.reduce((acc, a, j) => {
                const tmp = a.mul(S[(t*2-1)*r+j]).assertCanonical(); 
                return acc.add(tmp).assertCanonical();
            }, FrC.from(0n));
            for (let k=1; k<t; k++) {
                const tmp = state[0].mul(S[(t*2-1)*r+t+k-1]).assertCanonical();
                state[k] = state[k].add(tmp).assertCanonical();
            }
            state[0] = s0;
        }

        for (let r = 0; r < nRoundsF/2-1; r++) {
            state = state.map(a => pow5(a));
            state = state.map((a, i) => a.add(C[ (nRoundsF/2 +1)*t + nRoundsP + r*t + i ]).assertCanonical());
            state = state.map((_, i) => 
                state.reduce((acc, a, j) => {
                    let tmp = a.mul(M[j][i]).assertCanonical();
                    return acc.add(tmp).assertCanonical()
                }, FrC.from(0n))
            );
        }

        state = state.map(a => pow5(a));
        state = state.map((_, i) => 
            state.reduce((acc, a, j) => {
                let tmp = a.mul(M[j][i]).assertCanonical();
                return acc.add(tmp).assertCanonical()
            }, FrC.from(0n))
        );

        // only single output poseidon
        return state[0]

    }

    return poseidon
}

const poseidonHash = loadPoseidon(); 

console.log(poseidonHash([FrC.from(1n), FrC.from(1n)]).toBigInt())
