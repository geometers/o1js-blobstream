import { Poseidon, UInt64, verify, MerkleTree, Mina, AccountUpdate, Cache } from "o1js";
import { blobstreamVerifier, BlobstreamProof, BlobstreamInput, Bytes32 } from "./verify_blobstream.js";
import { blobInclusionVerifier, BlobInclusionProof, BlobInclusionInput, Bytes29 } from "./verify_blob_inclusion.js";
import { NodeProofLeft } from "../structs.js";
import fs from "fs";
import { ethers } from "ethers";
import { BlobstreamMerkleWitness, BlobstreamProcessor, adminPrivateKey } from "./blobstream_contract.js";
import { HelloWorldRollup, StateBytes } from "./rollup.js";

const args = process.argv;

async function prove_blobstream() {
    const blobstreamPlonkProofPath = args[3];
    const blobstreamSP1ProofPath = args[4];
    const blobstreamProofPath = args[5];
    const cacheDir = args[6];

    const blobstreamPlonkProof = await NodeProofLeft.fromJSON(JSON.parse(fs.readFileSync(blobstreamPlonkProofPath, 'utf8')));

    const blobstreamSP1Proof = JSON.parse(fs.readFileSync(blobstreamSP1ProofPath, 'utf8'));
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

    const vk = (await blobstreamVerifier.compile({cache: Cache.FileSystem(cacheDir)})).verificationKey;

    const proof = await blobstreamVerifier.compute(input, blobstreamPlonkProof);
    const valid = await verify(proof, vk); 

    fs.writeFileSync(blobstreamProofPath, JSON.stringify(proof), 'utf8');
    console.log("valid blobstream proof?: ", valid);
}

async function prove_blob_inclusion() {
    const blobInclusionPlonkProofPath = args[3];
    const blobInclusionSP1ProofPath = args[4];
    const blobInclusionProofPath = args[5];
    const cacheDir = args[6];

    const blobInclusionPlonkProof = await NodeProofLeft.fromJSON(JSON.parse(fs.readFileSync(blobInclusionPlonkProofPath, 'utf8')));

    const blobInclusionSP1Proof = JSON.parse(fs.readFileSync(blobInclusionSP1ProofPath, 'utf8'));

    const data = blobInclusionSP1Proof.public_values.buffer.data.slice(16);
    const input = new BlobInclusionInput ({
        namespace: Bytes29.from(data.slice(0, 29)),
        blob: Bytes32.from(data.slice(29, 61)),
        dataCommitment: Bytes32.from(data.slice(61)),
    });

    const vk = (await blobInclusionVerifier.compile({cache: Cache.FileSystem(cacheDir)})).verificationKey;

    const proof = await blobInclusionVerifier.compute(input, blobInclusionPlonkProof);

    const valid = await verify(proof, vk); 

    fs.writeFileSync(blobInclusionProofPath, JSON.stringify(proof), 'utf8');
    console.log("valid blob inclusion proof?: ", valid);
}

async function blobstream_contract() {
    const blobstreamProofPath = args[3];
    const cacheDir = args[4];

    (await blobstreamVerifier.compile({cache: Cache.FileSystem(cacheDir)})).verificationKey;

    const blobstreamTree = new MerkleTree(32);

    let txn;
    let Local = await Mina.LocalBlockchain({ proofsEnabled: true });
    Mina.setActiveInstance(Local);

    const [feePayer1] = Local.testAccounts;

    // contract account
    const contractAccount = Mina.TestPublicKey.random();
    const contract = new BlobstreamProcessor(contractAccount);
    await BlobstreamProcessor.compile({cache: Cache.FileSystem(cacheDir)});

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

    const blobstreamProof = await BlobstreamProof.fromJSON(JSON.parse(fs.readFileSync(blobstreamProofPath, 'utf8')));

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
    const blobstreamProofPath = args[3];
    const blobInclusionProofPath = args[4];
    const cacheDir = args[5];

    (await blobstreamVerifier.compile({cache: Cache.FileSystem(cacheDir)})).verificationKey;
    (await blobInclusionVerifier.compile({cache: Cache.FileSystem(cacheDir)})).verificationKey;

    const blobstreamTree = new MerkleTree(32);

    let txn;
    let Local = await Mina.LocalBlockchain({ proofsEnabled: true });
    Mina.setActiveInstance(Local);

    const [feePayer1] = Local.testAccounts;

    // contract account
    const contractAccount = Mina.TestPublicKey.random();
    const contract = new BlobstreamProcessor(contractAccount);
    await BlobstreamProcessor.compile({cache: Cache.FileSystem(cacheDir)});

    console.log('Deploying Blobstream Processor...');

    txn = await Mina.transaction(feePayer1, async () => {
    AccountUpdate.fundNewAccount(feePayer1);
        await contract.deploy();
    });
    await txn.sign([feePayer1.key, contractAccount.key]).send();

    const rollupContractAccount = Mina.TestPublicKey.random();
    const rollupContract = new HelloWorldRollup(rollupContractAccount);
    await HelloWorldRollup.compile({cache: Cache.FileSystem(cacheDir)});

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

    const blobstreamProof = await BlobstreamProof.fromJSON(JSON.parse(fs.readFileSync(blobstreamProofPath, 'utf8')));

    const path = blobstreamTree.getWitness(0n);

    txn = await Mina.transaction(feePayer1, async () => {
        await contract.update(adminPrivateKey, blobstreamProof, new BlobstreamMerkleWitness(path));
    });
    await txn.prove();
    await txn.sign([feePayer1.key]).send();

    let currentState;

    const blob = Bytes32.fromHex('736f6d65206461746120746f2073746f7265206f6e20626c6f636b636861696e');
    const blobInclusionProof = await BlobInclusionProof.fromJSON(JSON.parse(fs.readFileSync(blobInclusionProofPath, 'utf8')));
    txn = await Mina.transaction(feePayer1, async () => {
        await rollupContract.update(adminPrivateKey, blobInclusionProof, new BlobstreamMerkleWitness(path), blob);
    });
    await txn.prove();
    await txn.sign([feePayer1.key]).send();

    currentState = Mina.getAccount(rollupContractAccount).zkapp?.appState?.[0].toString();
    Poseidon.hashPacked(StateBytes.provable, blob).assertEquals(currentState!);

    console.log(`Successfully updated the rollup state while showing blob inclusion!`);
}

switch(args[2]) {
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
}