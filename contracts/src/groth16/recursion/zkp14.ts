import {
    ZkProgram,
    Field,
    DynamicProof,
    Proof,
    VerificationKey,
    Undefined,
    verify,
    Provable,
    Struct,
    Poseidon,
    CanonicalForeignField
  } from 'o1js';
import { ATE_LOOP_COUNT, Fp12, Fp2, FpC } from '../../towers/index.js';
import { G1Affine, G2Affine } from '../../ec/index.js';
import { AffineCache } from '../../lines/precompute.js';
import { G2Line } from '../../lines/index.js';
import { Groth16Data } from './data.js';
import { Fp } from '../../towers/fp.js';
import fs from "fs";

const zkp14 = ZkProgram({
    name: 'zkp14',
    publicInput: Field,
    publicOutput: Field,
    methods: {
      compute: {
        privateInputs: [Groth16Data],
        async method(
            input: Field,
            wIn: Groth16Data, 
        ) {
            const inDigest = Poseidon.hashPacked(Groth16Data, wIn);
            inDigest.assertEquals(input);

            const g = wIn.g;
            const c = wIn.c;
            const c_inv = c.inverse();
            let f = wIn.f;
        
            let idx = 0;
        
            for (let i = ATE_LOOP_COUNT.length - 30; i < ATE_LOOP_COUNT.length - 23; i++) {
              idx = i - 1;
              f = f.square().mul(g[idx]);
        
              if (ATE_LOOP_COUNT[i] == 1) {
                f = f.mul(c_inv);
              }
        
              if (ATE_LOOP_COUNT[i] == -1) {
                f = f.mul(c);
              }
            }
         
            const output =  new Groth16Data({
                negA: wIn.negA, 
                B: wIn.B, 
                C: wIn.C, 
                PI: wIn.PI,
                g,
                T: wIn.T,
                c: wIn.c, 
                f, 
                shift: wIn.shift
            });

            return Poseidon.hashPacked(Groth16Data, output);
        },
      },
    },
  });



const ZKP14Proof = ZkProgram.Proof(zkp14);
export { ZKP14Proof, zkp14 }