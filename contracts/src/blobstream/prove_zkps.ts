import { Poseidon, UInt64, verify, MerkleTree, Mina, AccountUpdate } from "o1js";
import { blobstreamVerifier, BlobstreamProof, BlobstreamInput, Bytes32 } from "./verify_blobstream.js";
import { NodeProofLeft } from "../structs.js";
import fs from "fs";
import { ethers } from "ethers";
import { BlobstreamMerkleWitness, BlobstreamProcessor, adminPrivateKey } from "./blobstream_contract.js";

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

switch(process.argv[2]) {
    case 'blobstream':
        await prove_blobstream();
        break;

    case 'blobstream_contract':
        await blobstream_contract();
        break;

    case 'compute':
        const Tree = new MerkleTree(32);
        console.log(Tree.getRoot().toBigInt().toString(10));
        break;

}