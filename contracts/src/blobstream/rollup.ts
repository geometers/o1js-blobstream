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
  } from 'o1js';
import { FrC } from '../towers/index.js';
import { NodeProofLeft } from '../structs.js';
import fs from "fs"
import { parsePublicInputs, parsePublicInputsProvable } from '../plonk/parse_pi.js';
import { provableBn254ScalarFieldToBytes } from '../sha/utils.js';
import { BlobInclusionProof } from './verify_blob_inclusion.js';
import { BlobstreamMerkleWitness, BlobstreamProcessor } from './blobstream_contract.js';

export const adminPrivateKey = PrivateKey.fromBase58(
    'EKFcef5HKXAn7V2rQntLiXtJr15dkxrsrQ1G4pnYemhMEAWYbkZW'
);

export const adminPublicKey = adminPrivateKey.toPublicKey();

class BlobInclusionProofType extends BlobInclusionProof {}

export class StateBytes extends Bytes(32) {}

export class HelloWorldRollup extends SmartContract {

    @state(Field) rollupState = State<Field>();
    @state(PublicKey) blobstreamAddress = State<PublicKey>();

    init() {
        super.init();
        this.rollupState.set(Field(0));
        this.account.delegate.set(adminPublicKey);
    }
    @method async setBlobstreamAddress(admin: PrivateKey, blobstreamAddress: PublicKey) {
        this.blobstreamAddress.set(blobstreamAddress);

        const adminPk = admin.toPublicKey();
        this.account.delegate.requireEquals(adminPk);
    }

    @method async update(admin: PrivateKey, blobInclusionProof: BlobInclusionProofType, pathInBlobstream: BlobstreamMerkleWitness, newState: StateBytes) {
        blobInclusionProof.verify()
        
        const blobstreamAddress = this.blobstreamAddress.get();
        this.blobstreamAddress.requireEquals(blobstreamAddress);

        const blobstreamContract = new BlobstreamProcessor(this.blobstreamAddress.get());

        const blobstreamRoot = blobstreamContract.commitmentsRoot.get();
        blobstreamContract.commitmentsRoot.requireEquals(blobstreamRoot);

        pathInBlobstream.calculateRoot(
            Poseidon.hash([
                ...blobInclusionProof.publicInput.dataCommitment.toFields(),
            ])
        ).assertEquals(blobstreamRoot);

        this.rollupState.requireNothing();
        this.rollupState.set(Poseidon.hashPacked(StateBytes.provable, newState));

        const adminPk = admin.toPublicKey();
        this.account.delegate.requireEquals(adminPk);
    }
}