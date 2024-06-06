// import {
//     ZkProgram,
//     Field,
//     DynamicProof,
//     Proof,
//     VerificationKey,
//     Undefined,
//     verify,
//     Provable,
//     Struct
//   } from 'o1js';
// import { ATE_LOOP_COUNT, Fp12 } from '../towers/index.js';
// import { G1Affine, G2Affine } from '../ec/index.js';
// import { AffineCache } from '../lines/precompute.js';
// import { G2Line } from '../lines/index.js';
// import { getBHardcodedLines, getNegA, getB } from './helpers.js';
// import { VK1, ZKP1Input, ZKP1Proof, ZKP1Output, zkp1 } from './zkp1.js'
// import { VK2, ZKP2Input, ZKP2Proof, ZKP2Output, zkp2 } from './zkp2.js'

// class ZKP3Input extends Struct({
// }) {}

// class ZKP3Output extends Struct({
//     negA: G1Affine,
//     b: G2Affine,
//     g: Provable.Array(Fp12, ATE_LOOP_COUNT.length - 1),
//     T: G2Affine,
// }) {}

// const zkp3 = ZkProgram({
//     name: 'zkp3',
//     publicInput: ZKP3Input,
//     publicOutput: ZKP3Output,
//     methods: {
//       compute: {
//         privateInputs: [Provable.Array(G2Line, 17), ZKP2Proof],
//         async method(
//             _input: ZKP3Input,
//             b_lines: Array<G2Line>,
//             proof: Proof<ZKP2Input, ZKP2Output>
//         ) {
//             proof.verify();
//             const negA = proof.publicOutput.negA;
//             const a_cache = new AffineCache(negA);

//             // handle pair (A, B) as first point
//             const g = proof.publicOutput.g;
        
//             const B = proof.publicOutput.b;
//             let T = proof.publicOutput.T;
//             const negB = B.neg();
        
//             let idx = 0;
//             let line_cnt = 0;
        
//             // for (let i = ATE_LOOP_COUNT.length - 12; i < ATE_LOOP_COUNT.length - 11; i++) {
//             //   idx = i - 1;
        
//             //   let line_b = b_lines[line_cnt];
//             //   line_cnt += 1;
//             //   line_b.assert_is_tangent(T);
        
//             //   g[idx] = line_b.psi(a_cache);
//             //   T = T.double_from_line(line_b.lambda);
        
//             //   if (ATE_LOOP_COUNT[i] == 1) {
//             //     let line_b = b_lines[line_cnt];
//             //     line_cnt += 1;
//             //     line_b.assert_is_line(T, B);
        
//             //     g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
//             //     T = T.add_from_line(line_b.lambda, B);
//             //   }
//             //   if (ATE_LOOP_COUNT[i] == -1) {
//             //     let line_b = b_lines[line_cnt];
//             //     line_cnt += 1;
//             //     line_b.assert_is_line(T, negB);
        
//             //     g[idx] = g[idx].sparse_mul(line_b.psi(a_cache));
//             //     T = T.add_from_line(line_b.lambda, negB);
//             //   }
//             // }
            
//             return new ZKP3Output({
//                 negA,
//                 b: B,
//                 g,
//                 T,
//             });
//         },
//       },
//     },
//   });


// const bLines = getBHardcodedLines();

// let zkp1Input = new ZKP1Input({
//   negA: getNegA(),
//   b: getB()
// });

// const vk1 = (await zkp1.compile()).verificationKey;
// const proof1 = await zkp1.compute(zkp1Input, bLines.slice(0,55));
// const validZkp1 = await verify(proof1, vk1);
// console.log('ok? validZkp1', validZkp1);
// console.log(proof1)

// const vk2 = (await zkp2.compile()).verificationKey;
// const proof2 = await zkp2.compute(ZKP2Input, bLines.slice(55, 55 + 17), proof1);
// const validZkp2 = await verify(proof2, vk2);
// console.log('ok? validZkp2', validZkp2);

// const vk3 = (await zkp3.compile()).verificationKey;
// const proof3 = await zkp3.compute(ZKP3Input, bLines.slice(55 + 17, 89), proof2);
// const validZkp3 = await verify(proof3, vk3);
// console.log('ok? validZkp3', validZkp3);