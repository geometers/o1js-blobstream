import { Field, Poseidon, Provable, VerificationKey, verify } from "o1js";
import { zkp0, ZKP0Proof } from "./zkp0.js";
import fs from "fs"
import { FrC } from "../../towers/fr.js";
import { Sp1PlonkProof, deserializeProof } from "../proof.js";
import { Sp1PlonkFiatShamir } from "../fiat-shamir/index.js";
import { StateUntilPairing, empty } from "../state.js";
import { Accumulator } from "../accumulator.js";

// const wt = new WitnessTracker();
// let in0 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), Fp12.one(), get_shift_power());
// let in1 = wt.zkp0(in0);
// let in2 = wt.zkp1(in1);
// let in3 = wt.zkp2(in2);
// let in4 = wt.zkp3(in3);
// let in5 = wt.zkp4(in4);
// let in6 = wt.zkp5(in5);
// let in7 = wt.zkp6(in6);
// let in8 = wt.zkp7(in7);
// let in9 = wt.zkp8(in8);
// let in10 = wt.zkp9(in9);
// let in11 = wt.zkp10(in10);
// let in12 = wt.zkp11(in11);
// let in13 = wt.zkp12(in12);
// let in14 = wt.zkp13(in13);
// let in15 = wt.zkp14(in14);
// let in16 = wt.zkp15(in15);
// let in17 = wt.zkp16(in16);
// let in18 = wt.zkp17(in17);
// wt.zkp18(in18);

const make_acc = () => {
    const hexProof = "0x801c66ac0adb18b19c32120abcaea2dfa6ebc07925a4c12abbb823ffa50aeae202c3b8910a8d533f786b3f53345442e25ec85abd1ba147574d276f2242ff7831b8bea1402648e4c4e876f53fb2d6211414fc5da6e1441484a1a7ccc599621663ad6d628621f6e3a0ded5513478fa59e788b4e06102202cb4663002b9b30467c4054aaf512ecd8e695bb68bf9500cd3de1da60d8084c3f2bf5de1d748d4b01131b9545f9e14507651644746c0952ada51abba4358bba695fcfa5162f013b044e93f486e7704d08d5ee2e0bcd5bbc01b8e6e12f0d09df5a285dc0da05840e5fc1a2f7fb6e200fdb49c7bdf737927f8f9b4f60a000baa9c4377964155caf01e701a1b35d5e92ec3ef85185eb95cb37e92cccb85a35617e7cafa2fe942d0c8a1845540ec1d4d2745400e54065f8601ff4ea8985dad2f3b8000b35e1b90e5525938d5d30157212509e6e2b6bc3b1dc0c71f04c735c431473e1776f138c8e5808e8a99cc59669916d026eafe692c6a8345c17239d6e7683a924360336ad10f948b4bfb2041226b043ad28ad6471c591ec17c09b84c591740e751c04018873ac617df8c2ffa52651b096bd46e6a04bf3e1797e903f47fbb64761a028967c5b3f748165358c8b6b027af7d77b3ca83fee575b2d39e5874128ac952016bda7aca187426bcb7a0460d0111783b814486fdf46d76d6854ed3889036126f3af5ffef96efea25d73524230c22a1f411ec42f76a07c2d5f3b78d2311550b790be1303a81c9aee96077b72a2575c5739eab16dee3e1f3fdaddfc9278814b9ffc764fd883c59fb4a0c4fd577081e07e2504b9eabfbf2962d03873f5ce9ff38ffe0f20446ae43b7abd35e84aa243c4a64ae86448e02a0728c10c8e38e226854d34bcb8ae85b19856e908ad4d01c1a70e88c77dafad62c1eca5dcd0a640558b9162b0fff944cfca3d330ba0e870b306fa22276609649e111fafd23b8eaf4571d6bc47b4d963ad28d80e2e3fcbf04ca5a5f641b32333729d102a9b4a9d26ac03c6e4f15adfedf250f506c4d79f10342a6ccde9efa0bce51fe08df09d697f07e38487f2bd7a04f4bc410eba22c2e1b3517159a47eb183a51cad319b54d3c645d56db854739bb844f8c7e49207f0807d26e1a837bdea04a774f09e64a2ff4cb852ba5f31849c8451330c4b8ab85b5261b092715702b7604202584c70431947264f339486a6222843ff99810d6fb05"
    let pi0 = FrC.from("0x0097228875a04c12dda0a76b705856f1a99fd19613c0ba69b056f4c4d18921e5")
    let pi1 = FrC.from("0x048e48f4b209e2dc6d92839ecba0e9321e83ea61ecb6430fc737b1e94c3fabbb")
    
    let proof = new Sp1PlonkProof(deserializeProof(hexProof))
    let fs = Sp1PlonkFiatShamir.empty()
    let state = new StateUntilPairing(empty(pi0, pi1))
    
    let acc = new Accumulator({
        proof, 
        fs, 
        state
    });

    return acc
}



async function prove_zkp0() {
    const vk0 = (await zkp0.compile()).verificationKey;
    const acc = make_acc();
    let cin0 = Poseidon.hashPacked(Accumulator, acc);

    const proof0 = await zkp0.compute(cin0, acc);
    const valid = await verify(proof0, vk0); 
    console.log("valid zkp0?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp0.json', JSON.stringify(proof0), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk0.json', JSON.stringify(vk0), 'utf8');
}

// async function prove_zkp1() {
//     const vk1 = (await zkp1.compile()).verificationKey;

//     let cin1 = Poseidon.hashPacked(Groth16Data, in1);
//     const proof1 = await zkp1.compute(cin1, in1, getBSlice(1));

//     const valid = await verify(proof1, vk1); 
//     console.log("valid zkp1?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp1.json', JSON.stringify(proof1), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk1.json', JSON.stringify(vk1), 'utf8');
// }


// async function prove_zkp2() {
//     const vk2 = (await zkp2.compile()).verificationKey;

//     let cin2 = Poseidon.hashPacked(Groth16Data, in2);
//     const proof2 = await zkp2.compute(cin2, in2, getBSlice(2));

//     const valid = await verify(proof2, vk2); 
//     console.log("valid zkp2?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp2.json', JSON.stringify(proof2), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk2.json', JSON.stringify(vk2), 'utf8');
// }

// async function prove_zkp3() {
//     const vk3 = (await zkp3.compile()).verificationKey;

//     let cin3 = Poseidon.hashPacked(Groth16Data, in3);
//     const proof3 = await zkp3.compute(cin3, in3);

//     const valid = await verify(proof3, vk3); 
//     console.log("valid zkp3?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp3.json', JSON.stringify(proof3), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk3.json', JSON.stringify(vk3), 'utf8');
// }

// async function prove_zkp4() {
//     const vk4 = (await zkp4.compile()).verificationKey;

//     let cin4 = Poseidon.hashPacked(Groth16Data, in4);
//     const proof4 = await zkp4.compute(cin4, in4);

//     const valid = await verify(proof4, vk4); 
//     console.log("valid zkp4?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp4.json', JSON.stringify(proof4), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk4.json', JSON.stringify(vk4), 'utf8');
// }

// async function prove_zkp5() {
//     const vk5 = (await zkp5.compile()).verificationKey;

//     let cin5 = Poseidon.hashPacked(Groth16Data, in5);
//     const proof5 = await zkp5.compute(cin5, in5);

//     const valid = await verify(proof5, vk5); 
//     console.log("valid zkp5?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp5.json', JSON.stringify(proof5), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk5.json', JSON.stringify(vk5), 'utf8');
// }

// async function prove_zkp6() {
//     const vk6 = (await zkp6.compile()).verificationKey;

//     let cin6 = Poseidon.hashPacked(Groth16Data, in6);
//     const proof6 = await zkp6.compute(cin6, in6);

//     const valid = await verify(proof6, vk6); 
//     console.log("valid zkp6?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp6.json', JSON.stringify(proof6), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk6.json', JSON.stringify(vk6), 'utf8');
// }

// async function prove_zkp7() {
//     const vk7 = (await zkp7.compile()).verificationKey;

//     let cin7 = Poseidon.hashPacked(Groth16Data, in7);
//     const proof7 = await zkp7.compute(cin7, in7);

//     const valid = await verify(proof7, vk7); 
//     console.log("valid zkp7?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp7.json', JSON.stringify(proof7), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk7.json', JSON.stringify(vk7), 'utf8');
// }

// async function prove_zkp8() {
//     const vk8 = (await zkp8.compile()).verificationKey;

//     let cin8 = Poseidon.hashPacked(Groth16Data, in8);
//     const proof8 = await zkp8.compute(cin8, in8);

//     const valid = await verify(proof8, vk8); 
//     console.log("valid zkp8?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp8.json', JSON.stringify(proof8), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk8.json', JSON.stringify(vk8), 'utf8');
// }

// async function prove_zkp9() {
//     const vk9 = (await zkp9.compile()).verificationKey;

//     let cin9 = Poseidon.hashPacked(Groth16Data, in9);
//     const proof9 = await zkp9.compute(cin9, in9);

//     const valid = await verify(proof9, vk9); 
//     console.log("valid zkp9?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp9.json', JSON.stringify(proof9), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk9.json', JSON.stringify(vk9), 'utf8');
// }

// async function prove_zkp10() {
//     const vk10 = (await zkp10.compile()).verificationKey;

//     let cin10 = Poseidon.hashPacked(Groth16Data, in10);
//     const proof10 = await zkp10.compute(cin10, in10);

//     const valid = await verify(proof10, vk10); 
//     console.log("valid zkp10?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp10.json', JSON.stringify(proof10), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk10.json', JSON.stringify(vk10), 'utf8');
// }

// async function prove_zkp11() {
//     const vk11 = (await zkp11.compile()).verificationKey;

//     let cin11 = Poseidon.hashPacked(Groth16Data, in11);
//     const proof11 = await zkp11.compute(cin11, in11);

//     const valid = await verify(proof11, vk11); 
//     console.log("valid zkp11?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp11.json', JSON.stringify(proof11), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk11.json', JSON.stringify(vk11), 'utf8');
// }

// async function prove_zkp12() {
//     const vk12 = (await zkp12.compile()).verificationKey;

//     let cin12 = Poseidon.hashPacked(Groth16Data, in12);
//     const proof12 = await zkp12.compute(cin12, in12);

//     const valid = await verify(proof12, vk12); 
//     console.log("valid zkp12?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp12.json', JSON.stringify(proof12), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk12.json', JSON.stringify(vk12), 'utf8');
// }

// async function prove_zkp13() {
//     const vk13 = (await zkp13.compile()).verificationKey;

//     let cin13 = Poseidon.hashPacked(Groth16Data, in13);
//     const proof13 = await zkp13.compute(cin13, in13);

//     const valid = await verify(proof13, vk13); 
//     console.log("valid zkp13?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp13.json', JSON.stringify(proof13), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk13.json', JSON.stringify(vk13), 'utf8');
// }

// async function prove_zkp14() {
//     const vk14 = (await zkp14.compile()).verificationKey;

//     let cin14 = Poseidon.hashPacked(Groth16Data, in14);
//     const proof14 = await zkp14.compute(cin14, in14);

//     const valid = await verify(proof14, vk14); 
//     console.log("valid zkp14?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp14.json', JSON.stringify(proof14), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk14.json', JSON.stringify(vk14), 'utf8');
// }

// async function prove_zkp15() {
//     const vk15 = (await zkp15.compile()).verificationKey;

//     let cin15 = Poseidon.hashPacked(Groth16Data, in15);
//     const proof15 = await zkp15.compute(cin15, in15);

//     const valid = await verify(proof15, vk15); 
//     console.log("valid zkp15?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp15.json', JSON.stringify(proof15), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk15.json', JSON.stringify(vk15), 'utf8');
// }

// async function prove_zkp16() {
//     const vk16 = (await zkp16.compile()).verificationKey;

//     let cin16 = Poseidon.hashPacked(Groth16Data, in16);
//     const proof16 = await zkp16.compute(cin16, in16);

//     const valid = await verify(proof16, vk16); 
//     console.log("valid zkp16?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp16.json', JSON.stringify(proof16), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk16.json', JSON.stringify(vk16), 'utf8');
// }

// async function prove_zkp17() {
//     const vk17 = (await zkp17.compile()).verificationKey;

//     let cin17 = Poseidon.hashPacked(Groth16Data, in17);
//     const proof17 = await zkp17.compute(cin17, in17);

//     const valid = await verify(proof17, vk17); 
//     console.log("valid zkp17?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp17.json', JSON.stringify(proof17), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk17.json', JSON.stringify(vk17), 'utf8');
// }

// async function prove_zkp18() {
//     const vk18 = (await zkp18.compile()).verificationKey;

//     let cin18 = Poseidon.hashPacked(Groth16Data, in18);
//     const proof18 = await zkp18.compute(cin18, in18);

//     const valid = await verify(proof18, vk18); 
//     console.log("valid zkp18?: ", valid);

//     fs.writeFileSync('./src/recursion/proofs/layer0/zkp18.json', JSON.stringify(proof18), 'utf8');
//     fs.writeFileSync('./src/recursion/vks/vk18.json', JSON.stringify(vk18), 'utf8');
// }


switch(process.argv[2]) {
    case 'zkp0':
        await prove_zkp0();
        break;
    // case 'zkp1':
    //     await prove_zkp1();
    //     break;
    // case 'zkp2':
    //     await prove_zkp2();
    //     break;
    // case 'zkp3':
    //     await prove_zkp3();
    //     break;
    // case 'zkp4':
    //     await prove_zkp4();
    //     break;
    // case 'zkp5':
    //     await prove_zkp5();
    //     break;
    // case 'zkp6':
    //     await prove_zkp6();
    //     break;
    // case 'zkp7':
    //     await prove_zkp7();
    //     break;
    // case 'zkp8':
    //     await prove_zkp8();
    //     break;
    // case 'zkp9':
    //     await prove_zkp9();
    //     break;
    // case 'zkp10':
    //     await prove_zkp10();
    //     break;
    // case 'zkp11':
    //     await prove_zkp11();
    //     break;
    // case 'zkp12':
    //     await prove_zkp12();
    //     break;
    // case 'zkp13':
    //     await prove_zkp13();
    //     break;
    // case 'zkp14':
    //     await prove_zkp14();
    //     break;
    // case 'zkp15':
    //     await prove_zkp15();
    //     break;
    // case 'zkp16':
    //     await prove_zkp16();
    //     break;
    // case 'zkp17':
    //     await prove_zkp17();
    //     break;
    // case 'zkp18':
    //     await prove_zkp18();
    //     break;
}