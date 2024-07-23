import { Poseidon, UInt64, verify, MerkleTree, Mina, AccountUpdate } from "o1js";
import { blobstreamVerifier, BlobstreamProof, BlobstreamInput, Bytes32 } from "./verify_blobstream.js";
import { blobInclusionVerifier, BlobInclusionProof, BlobInclusionInput, Bytes29 } from "./verify_blob_inclusion.js";
import { NodeProofLeft } from "../structs.js";
import fs from "fs";
import { ethers } from "ethers";
import { BlobstreamMerkleWitness, BlobstreamProcessor, adminPrivateKey } from "./blobstream_contract.js";
import { HelloWorldRollup, StateBytes } from "./rollup.js";

const args = process.argv;

interface sp1JSON {
    proof: {
        public_inputs: [string],
        encoded_proof: string,
        raw_proof: string,
    },
    public_values: {
        buffer: {
            data: Uint8Array,
        }
    }
}

async function prove_blobstream() {
    const blobstreamPlonkProofPath = args[3]
    const blobstreamSP1ProofPath = args[4]

    const blobstreamPlonkProof = await NodeProofLeft.fromJSON(JSON.parse(fs.readFileSync(blobstreamPlonkProofPath, 'utf8')));

    const blobstreamSP1Proof: sp1JSON = JSON.parse(fs.readFileSync(blobstreamSP1ProofPath, 'utf8'));
    const defaultEncoder = ethers.AbiCoder.defaultAbiCoder()
    const decoded = defaultEncoder.decode(
        ['bytes32', 'bytes32', 'bytes32', 'uint64', 'uint64', 'bytes32'],
        Buffer.from(blobstreamSP1Proof.public_values.buffer.data),
    );

    const input = new BlobstreamInput({
        trustedHeaderHash: Bytes32.fromHex(decoded[0].slice(2)),
        targetHeaderHash: Bytes32.fromHex(decoded[1].slice(2)),
        dataCommitment: Bytes32.fromHex(decoded[2].slice(2)),
        trustedBlockHeight: UInt64.from(decoded[3]),
        targetBlockHeight: UInt64.from(decoded[4]),
        validatorBitmap: Bytes32.fromHex(decoded[5].slice(2)),
    });

    const vk = (await blobstreamVerifier.compile()).verificationKey;

    const proof = await blobstreamVerifier.compute(input, blobstreamPlonkProof);
    const valid = await verify(proof, vk); 

    fs.writeFileSync(`./blobstreamProof.json`, JSON.stringify(proof), 'utf8');
    console.log("valid blobstream proof?: ", valid);
}

async function prove_blob_inclusion() {
    const blobInclusionPlonkProofPath = args[3]
    const blobInclusionSP1ProofPath = args[4]

    const blobInclusionPlonkProof = await NodeProofLeft.fromJSON(JSON.parse(fs.readFileSync(blobInclusionPlonkProofPath, 'utf8')));

    const blobInclusionSP1Proof: sp1JSON = JSON.parse(fs.readFileSync(blobInclusionSP1ProofPath, 'utf8'));

    const data = blobInclusionSP1Proof.public_values.buffer.data.slice(16);
    const input = new BlobInclusionInput ({
        namespace: Bytes29.from(data.slice(0, 29)),
        blob: Bytes32.from(data.slice(29, 61)),
        dataCommitment: Bytes32.from(data.slice(61)),
    });

    const vk = (await blobInclusionVerifier.compile()).verificationKey;

    const proof = await blobInclusionVerifier.compute(input, blobInclusionPlonkProof);

    const valid = await verify(proof, vk); 

    fs.writeFileSync(`./blobInclusionProof.json`, JSON.stringify(proof), 'utf8');
    console.log("valid blob inclusion proof?: ", valid);
}

async function blobstream_contract() {
    (await blobstreamVerifier.compile()).verificationKey;

    const blobstreamTree = new MerkleTree(32);

    let txn;
    let Local = await Mina.LocalBlockchain({ proofsEnabled: true });
    Mina.setActiveInstance(Local);

    const [feePayer1] = Local.testAccounts;

    // contract account
    const contractAccount = Mina.TestPublicKey.random();
    const contract = new BlobstreamProcessor(contractAccount);
    await BlobstreamProcessor.compile();

    console.log('Deploying Blobstream Processor...');

    txn = await Mina.transaction(feePayer1, async () => {
    AccountUpdate.fundNewAccount(feePayer1);
        await contract.deploy();
    });
    await txn.sign([feePayer1.key, contractAccount.key]).send();

    const initialState =
    Mina.getAccount(contractAccount).zkapp?.appState?.[0].toString();

    let currentState;

    console.log('initial state', initialState);

    // update state with value that satisfies preconditions and correct admin private key
    console.log(
    `updating blobstream state`
    );

    const blobstreamProof = await BlobstreamProof.fromJSON(JSON.parse(fs.readFileSync(`./blobstreamProof.json`, 'utf8')));

    const path = blobstreamTree.getWitness(0n);


    txn = await Mina.transaction(feePayer1, async () => {
        await contract.update(adminPrivateKey, blobstreamProof, new BlobstreamMerkleWitness(path));
    });
    await txn.prove();
    await txn.sign([feePayer1.key]).send();

    currentState = Mina.getAccount(contractAccount).zkapp?.appState?.[0].toString();

    blobstreamTree.setLeaf(0n, Poseidon.hash([...blobstreamProof.publicInput.dataCommitment.toFields()]));
    blobstreamTree.getRoot().assertEquals(currentState!);
    console.log(`Current state successfully updated to ${currentState}`);
}

async function rollup_contract() {
    (await blobstreamVerifier.compile()).verificationKey;
    (await blobInclusionVerifier.compile()).verificationKey;

    const blobstreamTree = new MerkleTree(32);

    let txn;
    let Local = await Mina.LocalBlockchain({ proofsEnabled: true });
    Mina.setActiveInstance(Local);

    const [feePayer1] = Local.testAccounts;

    // contract account
    const contractAccount = Mina.TestPublicKey.random();
    const contract = new BlobstreamProcessor(contractAccount);
    await BlobstreamProcessor.compile();

    console.log('Deploying Blobstream Processor...');

    txn = await Mina.transaction(feePayer1, async () => {
    AccountUpdate.fundNewAccount(feePayer1);
        await contract.deploy();
    });
    await txn.sign([feePayer1.key, contractAccount.key]).send();

    const rollupContractAccount = Mina.TestPublicKey.random();
    const rollupContract = new HelloWorldRollup(rollupContractAccount);
    await HelloWorldRollup.compile();

    console.log('Deploying Rollup...');

    txn = await Mina.transaction(feePayer1, async () => {
    AccountUpdate.fundNewAccount(feePayer1);
        await rollupContract.deploy();
    });
    await txn.sign([feePayer1.key, rollupContractAccount.key]).send();

    console.log('Setting Blobstream address...');
    txn = await Mina.transaction(feePayer1, async () => {
        await rollupContract.setBlobstreamAddress(adminPrivateKey, contractAccount);
    });
    await txn.prove();
    await txn.sign([feePayer1.key]).send();

    console.log(
    `updating blobstream state`
    );

    const blobstreamProof = await BlobstreamProof.fromJSON(JSON.parse(fs.readFileSync(`./blobstreamProof.json`, 'utf8')));

    const path = blobstreamTree.getWitness(0n);

    txn = await Mina.transaction(feePayer1, async () => {
        await contract.update(adminPrivateKey, blobstreamProof, new BlobstreamMerkleWitness(path));
    });
    await txn.prove();
    await txn.sign([feePayer1.key]).send();

    let currentState;

    const blob = Bytes32.fromHex('736f6d65206461746120746f2073746f7265206f6e20626c6f636b636861696e');
    const blobInclusionProof = await BlobInclusionProof.fromJSON(JSON.parse(fs.readFileSync(`./blobInclusionProof.json`, 'utf8')));
    txn = await Mina.transaction(feePayer1, async () => {
        await rollupContract.update(adminPrivateKey, blobInclusionProof, new BlobstreamMerkleWitness(path), blob);
    });
    await txn.prove();
    await txn.sign([feePayer1.key]).send();

    currentState = Mina.getAccount(rollupContractAccount).zkapp?.appState?.[0].toString();
    Poseidon.hashPacked(StateBytes.provable, blob).assertEquals(currentState!);

    console.log(`Successfully updated the rollup state while showing blob inclusion!`);
}

switch(process.argv[2]) {
    case 'blobstream':
        await prove_blobstream();
        break;

    case 'blob_inclusion':
        await prove_blob_inclusion();
        break;

    case 'blobstream_contract':
        await blobstream_contract();
        break;

    case 'rollup_contract':
        await rollup_contract();
        break;

    case 'compute':
        const buffer = Buffer.from([23,222,218,138,26,221,91,104,100,52,175,210,154,247,215,247,98,174,170,105,192,69,132,81,155,1,79,107,113,199,21,59,84,194,151,84,211,241,195,97,42,27,66,199,65,180,132,167,103,66,126,36,208,21,173,231,70,99,192,148,136,88,245,84,147,136,254,117,56,227,238,36,167,45,41,254,7,49,120,58,209,170,251,253,35,81,251,155,19,245,137,220,149,90,217,89,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,29,60,218,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,29,60,238,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,255,255,255,255,255,255,255,255,255,255,255,255]);
        console.log(buffer.toString('hex'));
        break;

}