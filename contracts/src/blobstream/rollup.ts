import {
    Field,
    PrivateKey,
    Provable,
    SmartContract,
    State,
    VerificationKey,
    method,
    state,
    Poseidon,
    UInt8,
    Bytes,
    Gadgets,
    PublicKey,
    Proof,
  } from 'o1js';
import { FrC } from '../towers/index.js';
import { NodeProofLeft } from '../structs.js';
import fs from "fs"
import { parsePublicInputs, parsePublicInputsProvable } from '../plonk/parse_pi.js';
import { provableBn254ScalarFieldToBytes } from '../sha/utils.js';
import { BlobInclusionProof } from './verify_blob_inclusion.js';
import { BlobstreamMerkleWitness, BlobstreamProcessor } from './blobstream_contract.js';
import { BatcherInput, BatcherOutput, BatcherProof } from './batcher.js';

export const adminPrivateKey = PrivateKey.fromBase58(
    'EKFcef5HKXAn7V2rQntLiXtJr15dkxrsrQ1G4pnYemhMEAWYbkZW'
);

export const adminPublicKey = adminPrivateKey.toPublicKey();

class BatcherProofType extends BatcherProof {}

export class StateBytes extends Bytes(32) {}

export class HelloWorldRollup extends SmartContract {

    @state(Field) rollupState = State<Field>();
    @state(PublicKey) blobstreamAddress = State<PublicKey>();
    @state(Field) blobInclusionVkHash = State<Field>();
    @state(Field) batcherVkHash = State<Field>();

    init() {
        super.init();
        this.rollupState.set(Poseidon.hashPacked(Field, Field.from(0n)));
        this.account.delegate.set(adminPublicKey);
    }
    @method async setParameters(admin: PrivateKey, blobstreamAddress: PublicKey, blobInclusionVkHash: Field, batcherVkHash: Field) {
        this.blobstreamAddress.set(blobstreamAddress);
        this.blobInclusionVkHash.set(blobInclusionVkHash);
        this.batcherVkHash.set(batcherVkHash);

        const adminPk = admin.toPublicKey();
        this.account.delegate.requireEquals(adminPk);
    }

    @method async update(admin: PrivateKey, pathInBlobstream: BlobstreamMerkleWitness, batcherProof: BatcherProofType) {
        const blobstreamAddress = this.blobstreamAddress.get();
        this.blobstreamAddress.requireEquals(blobstreamAddress);

        const blobstreamContract = new BlobstreamProcessor(this.blobstreamAddress.get());

        const blobstreamRoot = blobstreamContract.commitmentsRoot.get();
        blobstreamContract.commitmentsRoot.requireEquals(blobstreamRoot);

        batcherProof.verify();

        pathInBlobstream.calculateRoot(
            Poseidon.hash([
                ...batcherProof.publicOutput.dataCommitment.toFields(),
            ])
        ).assertEquals(blobstreamRoot);

        const currentState = this.rollupState.getAndRequireEquals();
        currentState.assertEquals(batcherProof.publicOutput.initialStateHash);

        this.rollupState.set(batcherProof.publicOutput.currentStateHash);

        const blobInclusionVkHash = this.blobInclusionVkHash.get();
        this.blobInclusionVkHash.requireEquals(blobInclusionVkHash);
        blobInclusionVkHash.assertEquals(batcherProof.publicInput.blobInclusionVkHash);

        const batcherVkHash = this.batcherVkHash.get();
        this.batcherVkHash.requireEquals(batcherVkHash);
        batcherVkHash.assertEquals(batcherProof.publicInput.batcherVkHash);

        const adminPk = admin.toPublicKey();
        this.account.delegate.requireEquals(adminPk);
    }
}