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
    MerkleTree,
    MerkleWitness,
    Undefined,
    Proof,
  } from 'o1js';
import { FrC } from '../towers/index.js';
import { NodeProofLeft } from '../structs.js';
import fs from "fs"
import { parsePublicInputs, parsePublicInputsProvable } from '../plonk/parse_pi.js';
import { provableBn254ScalarFieldToBytes } from '../sha/utils.js';
import { BlobstreamInput, BlobstreamProof, blobstreamVerifier } from './verify_blobstream.js';

export const adminPrivateKey = PrivateKey.fromBase58(
    'EKFcef5HKXAn7V2rQntLiXtJr15dkxrsrQ1G4pnYemhMEAWYbkZW'
);

export const adminPublicKey = adminPrivateKey.toPublicKey();

export class BlobstreamMerkleWitness extends MerkleWitness(32) {}

class BlobstreamProofType extends BlobstreamProof {}

export class BlobstreamProcessor extends SmartContract {

    @state(Field) commitmentsRoot = State<Field>();
    @state(Field) currentLeafIndex = State<Field>();

    init() {
        super.init();
        this.commitmentsRoot.set(Field.from(19057105225525447794058879360670244229202611178388892366137113354909512903676n));
        this.currentLeafIndex.set(Field(0));
        this.account.delegate.set(adminPublicKey);
    }

    @method async update(admin: PrivateKey, blobstreamProof: BlobstreamProofType, path: BlobstreamMerkleWitness) {
        blobstreamProof.verify()
        let leafIndex = this.currentLeafIndex.get();
        this.currentLeafIndex.requireEquals(leafIndex);

        let commitmentsRoot = this.commitmentsRoot.get();
        this.commitmentsRoot.requireEquals(commitmentsRoot);

        path.calculateRoot(Field(0)).assertEquals(commitmentsRoot);
        const newRoot = path.calculateRoot(Poseidon.hash([
            ...blobstreamProof.publicInput.dataCommitment.toFields(),
        ]));

        this.commitmentsRoot.requireNothing();
        this.commitmentsRoot.set(newRoot);

        this.currentLeafIndex.set(leafIndex.add(Field.from(1)));

        const adminPk = admin.toPublicKey();
        this.account.delegate.requireEquals(adminPk);
    }
}