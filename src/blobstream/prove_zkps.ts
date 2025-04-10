import {
  Poseidon,
  UInt64,
  verify,
  MerkleTree,
  Mina,
  AccountUpdate,
  Cache,
  Bytes,
  Field,
  Undefined,
  ZkProgram,
  Provable,
} from 'o1js';
import {
  blobstreamVerifier,
  BlobstreamProof,
  BlobstreamInput,
  Bytes32,
} from './verify_blobstream.js';
import {
  blobInclusionVerifier,
  BlobInclusionProof,
  BlobInclusionInput,
} from './verify_blob_inclusion.js';
import {
  batcherVerifier,
  BatcherProof,
  BatcherInput,
  Bytes29,
  BatcherOutput,
  Bytes64,
  BatcherDynamicProof,
  BlobInclusionDynamicProof,
} from './batcher.js';
import { NodeProofLeft } from '../structs.js';
import fs from 'fs';
import { ethers } from 'ethers';
import {
  BlobstreamMerkleWitness,
  BlobstreamProcessor,
  adminPrivateKey,
} from './blobstream_contract.js';
import { HelloWorldRollup, StateBytes } from './rollup.js';
import {
  parseDigestProvable,
  parsePublicInputs,
  parsePublicInputsProvable,
} from '../plonk/parse_pi.js';

const args = process.argv;

async function prove_blobstream() {
  const blobstreamPlonkProofPath = args[3];
  const blobstreamSP1ProofPath = args[4];
  const blobstreamProofPath = args[5];
  const cacheDir = args[6];

  const blobstreamPlonkProof = await NodeProofLeft.fromJSON(
    JSON.parse(fs.readFileSync(blobstreamPlonkProofPath, 'utf8'))
  );

  const blobstreamSP1Proof = JSON.parse(
    fs.readFileSync(blobstreamSP1ProofPath, 'utf8')
  );
  const defaultEncoder = ethers.AbiCoder.defaultAbiCoder();
  const decoded = defaultEncoder.decode(
    ['bytes32', 'bytes32', 'bytes32', 'uint64', 'uint64', 'bytes32'],
    Buffer.from(blobstreamSP1Proof.public_values.buffer.data)
  );

  const input = new BlobstreamInput({
    trustedHeaderHash: Bytes32.fromHex(decoded[0].slice(2)),
    targetHeaderHash: Bytes32.fromHex(decoded[1].slice(2)),
    dataCommitment: Bytes32.fromHex(decoded[2].slice(2)),
    trustedBlockHeight: UInt64.from(decoded[3]),
    targetBlockHeight: UInt64.from(decoded[4]),
    validatorBitmap: Bytes32.fromHex(decoded[5].slice(2)),
  });

  const vk = (
    await blobstreamVerifier.compile({ cache: Cache.FileSystem(cacheDir) })
  ).verificationKey;

  const proof = await blobstreamVerifier.compute(input, blobstreamPlonkProof);
  const valid = await verify(proof.proof, vk);

  fs.writeFileSync(blobstreamProofPath, JSON.stringify(proof.proof), 'utf8');
  console.log('valid blobstream proof?: ', valid);
}

async function prove_blob_inclusion() {
  const blobInclusionPlonkProofPath = args[3];
  const blobInclusionSP1ProofPath = args[4];
  const blobInclusionProofPath = args[5];
  const cacheDir = args[6];

  const blobInclusionSP1Proof = JSON.parse(
    fs.readFileSync(blobInclusionSP1ProofPath, 'utf8')
  );

  const data = blobInclusionSP1Proof.public_values.buffer.data;
  const digest = ethers.sha256(new Uint8Array(data));
  const digestBytes = ethers.getBytes(digest);

  const blobInclusionVk = (
    await blobInclusionVerifier.compile({ cache: Cache.FileSystem(cacheDir) })
  ).verificationKey;

  const blobInclusionInput = new BlobInclusionInput({
    digest: Bytes32.from(digestBytes),
  });

  const blobInclusionPlonkProof = await NodeProofLeft.fromJSON(
    JSON.parse(fs.readFileSync(blobInclusionPlonkProofPath, 'utf8'))
  );
  const blobInclusionProof = await blobInclusionVerifier.compute(
    blobInclusionInput,
    blobInclusionPlonkProof
  );
  const blobInclusionValid = await verify(
    blobInclusionProof.proof,
    blobInclusionVk
  );

  fs.writeFileSync(
    blobInclusionProofPath,
    JSON.stringify(blobInclusionProof.proof),
    'utf8'
  );

  console.log('valid blob inclusion proof?: ', blobInclusionValid);
}

async function prove_batcher() {
  const blobInclusionProofPath = args[3];
  const blobInclusionSP1ProofPath = args[4];
  const batcherProofPath = args[5];
  const cacheDir = args[6];

  const blobInclusionSP1Proof = JSON.parse(
    fs.readFileSync(blobInclusionSP1ProofPath, 'utf8')
  );

  const data = blobInclusionSP1Proof.public_values.buffer.data;
  const digest = ethers.sha256(new Uint8Array(data));
  const digestBytes = ethers.getBytes(digest);
  console.log(`data: ${Buffer.from(new Uint8Array(data)).toString('hex')}`);
  console.log(`digest: ${digest}`);
  const digestProvable = parseDigestProvable(Bytes.from(digestBytes));
  console.log(`digestProvable: ${digestProvable.toBigInt()}`);
  const blobInclusionVk = (
    await blobInclusionVerifier.compile({ cache: Cache.FileSystem(cacheDir) })
  ).verificationKey;
  const batcherVk = (
    await batcherVerifier.compile({ cache: Cache.FileSystem(cacheDir) })
  ).verificationKey;

  const batcherDummyInput = new BatcherInput({
    index: Field.from(0n),
    namespace: Bytes29.fromHex(
      '0000000000000000000000000000000000000000000000000000000000'
    ),
    currentRollingHash: [Field.from(0n), Field.from(0n)],
    currentStateHash: Poseidon.hashPacked(Field, Field.from(0n)),
    batcherVkHash: Field.from(0n),
    blobInclusionVkHash: Field.from(0n),
  });
  const batcherDummyOutput = new BatcherOutput({
    currentRollingHash: [Field.from(0n), Field.from(0n)],
    currentStateHash: Field.from(0n),
    dataCommitment: Bytes32.fromHex(
      '0000000000000000000000000000000000000000000000000000000000000000'
    ),
    initialStateHash: Field.from(0n),
  });
  const blobInclusionDummyInput = new BlobInclusionInput({
    digest: Bytes32.fromHex(
      '0000000000000000000000000000000000000000000000000000000000000000'
    ),
  });

  const input0 = new BatcherInput({
    index: Field.from(0n),
    namespace: Bytes.fromHex(
      '0000000000000000000000000000000000000000000000000000240713'
    ),
    currentRollingHash: [Field.from(0n), Field.from(0n)],
    currentStateHash: Poseidon.hashPacked(Field, Field.from(0n)),
    batcherVkHash: batcherVk.hash,
    blobInclusionVkHash: blobInclusionVk.hash,
  });
  const proof0 = await batcherVerifier.compute(
    input0,
    BatcherDynamicProof.fromProof(
      await BatcherProof.dummy(batcherDummyInput, batcherDummyOutput, 2)
    ),
    batcherVk,
    BlobInclusionDynamicProof.fromProof(
      await BlobInclusionProof.dummy(blobInclusionDummyInput, undefined, 1)
    ),
    blobInclusionVk,
    Field.from(0n),
    Bytes64.from(data.slice(0, 64))
  );
  const valid0 = await verify(proof0.proof, batcherVk);
  console.log('valid batcher proof0?: ', valid0);

  const input1 = new BatcherInput({
    index: Field.from(1n),
    namespace: Bytes.fromHex(
      '0000000000000000000000000000000000000000000000000000000000'
    ),
    currentRollingHash: proof0.proof.publicOutput.currentRollingHash,
    currentStateHash: proof0.proof.publicOutput.currentStateHash,
    batcherVkHash: batcherVk.hash,
    blobInclusionVkHash: blobInclusionVk.hash,
  });
  const numToAdd1 = Field.fromBytes([
    ...data.slice(64, 128).slice(0, 20),
    ...Array(12).fill(0),
  ]);
  console.log(`num to add 1: ${numToAdd1}`);
  const proof1 = await batcherVerifier.compute(
    input1,
    BatcherDynamicProof.fromProof(proof0.proof),
    batcherVk,
    BlobInclusionDynamicProof.fromProof(
      await BlobInclusionProof.dummy(blobInclusionDummyInput, undefined, 1)
    ),
    blobInclusionVk,
    Field.from(0n),
    Bytes64.from(data.slice(64, 128))
  );
  const valid1 = await verify(proof1.proof, batcherVk);
  console.log('valid batcher proof1?: ', valid1);
  proof1.proof.publicOutput.currentStateHash.assertEquals(
    Poseidon.hashPacked(Field, numToAdd1)
  );

  const input2 = new BatcherInput({
    index: Field.from(2n),
    namespace: Bytes.fromHex(
      '0000000000000000000000000000000000000000000000000000000000'
    ),
    currentRollingHash: proof1.proof.publicOutput.currentRollingHash,
    currentStateHash: proof1.proof.publicOutput.currentStateHash,
    batcherVkHash: batcherVk.hash,
    blobInclusionVkHash: blobInclusionVk.hash,
  });
  const numToAdd2 = Field.fromBytes([
    ...data.slice(128, 192).slice(0, 20),
    ...Array(12).fill(0),
  ]);
  console.log(`num to add 2: ${numToAdd2}`);
  const proof2 = await batcherVerifier.compute(
    input2,
    BatcherDynamicProof.fromProof(proof1.proof),
    batcherVk,
    BlobInclusionDynamicProof.fromProof(
      await BlobInclusionProof.dummy(blobInclusionDummyInput, undefined, 1)
    ),
    blobInclusionVk,
    numToAdd1,
    Bytes64.from(data.slice(128, 192))
  );
  const valid2 = await verify(proof2.proof, batcherVk);
  console.log('valid batcher proof2?: ', valid2);
  proof2.proof.publicOutput.currentStateHash.assertEquals(
    Poseidon.hashPacked(Field, numToAdd1.add(numToAdd2))
  );

  const input3 = new BatcherInput({
    index: Field.from(3n),
    namespace: Bytes.fromHex(
      '0000000000000000000000000000000000000000000000000000000000'
    ),
    currentRollingHash: proof2.proof.publicOutput.currentRollingHash,
    currentStateHash: proof2.proof.publicOutput.currentStateHash,
    batcherVkHash: batcherVk.hash,
    blobInclusionVkHash: blobInclusionVk.hash,
  });
  const numToAdd3 = Field.fromBytes([
    ...data.slice(192, 256).slice(0, 20),
    ...Array(12).fill(0),
  ]);
  console.log(`num to add 3: ${numToAdd3}`);
  const proof3 = await batcherVerifier.compute(
    input3,
    BatcherDynamicProof.fromProof(proof2.proof),
    batcherVk,
    BlobInclusionDynamicProof.fromProof(
      await BlobInclusionProof.dummy(blobInclusionDummyInput, undefined, 1)
    ),
    blobInclusionVk,
    numToAdd1.add(numToAdd2),
    Bytes64.from(data.slice(192, 256))
  );
  const valid3 = await verify(proof3.proof, batcherVk);
  console.log('valid batcher proof3?: ', valid3);
  proof3.proof.publicOutput.currentStateHash.assertEquals(
    Poseidon.hashPacked(Field, numToAdd1.add(numToAdd2).add(numToAdd3))
  );

  const blobInclusionProof = await BlobInclusionProof.fromJSON(
    JSON.parse(fs.readFileSync(blobInclusionProofPath, 'utf8'))
  );
  const blobInclusionValid = await verify(blobInclusionProof, blobInclusionVk);
  console.log('valid blob inclusion proof?: ', blobInclusionValid);

  const input4 = new BatcherInput({
    index: Field.from(4n),
    namespace: Bytes.fromHex(
      '0000000000000000000000000000000000000000000000000000000000'
    ),
    currentRollingHash: proof3.proof.publicOutput.currentRollingHash,
    currentStateHash: proof3.proof.publicOutput.currentStateHash,
    batcherVkHash: batcherVk.hash,
    blobInclusionVkHash: blobInclusionVk.hash,
  });

  const proof4 = await batcherVerifier.compute(
    input4,
    BatcherDynamicProof.fromProof(proof3.proof),
    batcherVk,
    BlobInclusionDynamicProof.fromProof(blobInclusionProof),
    blobInclusionVk,
    numToAdd1.add(numToAdd2).add(numToAdd3),
    Bytes64.from([...data.slice(256, 289), ...Array(31).fill(0)])
  );
  const valid4 = await verify(proof4.proof, batcherVk);
  console.log('valid batcher proof4?: ', valid4);
  proof4.proof.publicOutput.currentStateHash.assertEquals(
    Poseidon.hashPacked(Field, numToAdd1.add(numToAdd2).add(numToAdd3))
  );

  fs.writeFileSync(batcherProofPath, JSON.stringify(proof4.proof), 'utf8');
}

async function blobstream_contract() {
  const blobstreamProofPath = args[3];
  const cacheDir = args[4];

  (await blobstreamVerifier.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  const blobstreamTree = new MerkleTree(32);

  let txn;
  let Local = await Mina.LocalBlockchain({ proofsEnabled: true });
  Mina.setActiveInstance(Local);

  const [feePayer1] = Local.testAccounts;

  // contract account
  const contractAccount = Mina.TestPublicKey.random();
  const contract = new BlobstreamProcessor(contractAccount);
  await BlobstreamProcessor.compile({ cache: Cache.FileSystem(cacheDir) });

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

  console.log('setting blobstream parameters');

  const blobstreamProof = await BlobstreamProof.fromJSON(
    JSON.parse(fs.readFileSync(blobstreamProofPath, 'utf8'))
  );

  txn = await Mina.transaction(feePayer1, async () => {
    await contract.setParameters(
      Poseidon.hashPacked(
        Bytes32.provable,
        blobstreamProof.publicInput.trustedHeaderHash
      )
    );
  });
  await txn.prove();
  await txn.sign([feePayer1.key]).send();

  // update state with value that satisfies preconditions and correct admin private key
  console.log(`updating blobstream state`);

  const path = blobstreamTree.getWitness(0n);

  txn = await Mina.transaction(feePayer1, async () => {
    await contract.update(
      adminPrivateKey,
      blobstreamProof,
      new BlobstreamMerkleWitness(path)
    );
  });
  await txn.prove();
  await txn.sign([feePayer1.key]).send();

  currentState =
    Mina.getAccount(contractAccount).zkapp?.appState?.[0].toString();

  blobstreamTree.setLeaf(
    0n,
    Poseidon.hash([...blobstreamProof.publicInput.dataCommitment.toFields()])
  );
  blobstreamTree.getRoot().assertEquals(currentState!);
  console.log(`Current state successfully updated to ${currentState}`);
}

async function rollup_contract() {
  const blobstreamProofPath = args[3];
  const batcherProofPath = args[4];
  const cacheDir = args[5];

  (await blobstreamVerifier.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;
  const blobInclusionVk = (
    await blobInclusionVerifier.compile({ cache: Cache.FileSystem(cacheDir) })
  ).verificationKey;
  const batcherVk = (
    await batcherVerifier.compile({ cache: Cache.FileSystem(cacheDir) })
  ).verificationKey;

  const blobstreamTree = new MerkleTree(32);

  let txn;
  let Local = await Mina.LocalBlockchain({ proofsEnabled: true });
  Mina.setActiveInstance(Local);

  const [feePayer1] = Local.testAccounts;

  // contract account
  const contractAccount = Mina.TestPublicKey.random();
  const contract = new BlobstreamProcessor(contractAccount);
  await BlobstreamProcessor.compile({ cache: Cache.FileSystem(cacheDir) });

  console.log('Deploying Blobstream Processor...');

  txn = await Mina.transaction(feePayer1, async () => {
    AccountUpdate.fundNewAccount(feePayer1);
    await contract.deploy();
  });
  await txn.sign([feePayer1.key, contractAccount.key]).send();

  const rollupContractAccount = Mina.TestPublicKey.random();
  const rollupContract = new HelloWorldRollup(rollupContractAccount);
  await HelloWorldRollup.compile({ cache: Cache.FileSystem(cacheDir) });

  console.log('Deploying Rollup...');

  txn = await Mina.transaction(feePayer1, async () => {
    AccountUpdate.fundNewAccount(feePayer1);
    await rollupContract.deploy();
  });
  await txn.sign([feePayer1.key, rollupContractAccount.key]).send();

  console.log('Setting Blobstream parameters...');

  const blobstreamProof = await BlobstreamProof.fromJSON(
    JSON.parse(fs.readFileSync(blobstreamProofPath, 'utf8'))
  );

  txn = await Mina.transaction(feePayer1, async () => {
    await rollupContract.setParameters(
      adminPrivateKey,
      contractAccount,
      blobInclusionVk.hash,
      batcherVk.hash
    );
  });
  await txn.prove();
  await txn.sign([feePayer1.key]).send();

  txn = await Mina.transaction(feePayer1, async () => {
    await contract.setParameters(
      Poseidon.hashPacked(
        Bytes32.provable,
        blobstreamProof.publicInput.trustedHeaderHash
      )
    );
  });
  await txn.prove();
  await txn.sign([feePayer1.key]).send();

  console.log(`Updating Blobstream state...`);

  const batcherProof = await BatcherProof.fromJSON(
    JSON.parse(fs.readFileSync(batcherProofPath, 'utf8'))
  );

  const path = blobstreamTree.getWitness(0n);

  txn = await Mina.transaction(feePayer1, async () => {
    await contract.update(
      adminPrivateKey,
      blobstreamProof,
      new BlobstreamMerkleWitness(path)
    );
  });
  await txn.prove();
  await txn.sign([feePayer1.key]).send();

  let currentState;

  txn = await Mina.transaction(feePayer1, async () => {
    await rollupContract.update(
      adminPrivateKey,
      new BlobstreamMerkleWitness(path),
      batcherProof
    );
  });
  await txn.prove();
  await txn.sign([feePayer1.key]).send();

  currentState = Mina.getAccount(
    rollupContractAccount
  ).zkapp?.appState?.[0].toString();
  batcherProof.publicOutput.currentStateHash.assertEquals(currentState!);

  console.log(
    `Successfully updated the rollup state while showing blob inclusion through batching!`
  );
}

switch (args[2]) {
  case 'blobstream':
    await prove_blobstream();
    break;

  case 'blob_inclusion':
    await prove_blob_inclusion();
    break;

  case 'batcher':
    await prove_batcher();
    break;

  case 'blobstream_contract':
    await blobstream_contract();
    break;

  case 'rollup_contract':
    await rollup_contract();
    break;
}
