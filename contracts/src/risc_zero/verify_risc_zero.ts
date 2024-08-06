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
    ZkProgram,
    Struct,
    UInt64,
    Undefined,
  } from 'o1js';
import { FrC } from '../towers/index.js';
import { NodeProofLeft } from '../structs.js';
import { parsePublicInputs, parsePublicInputsProvable } from '../plonk/parse_pi.js';
import { provableBn254ScalarFieldToBytes, wordToBytes } from '../sha/utils.js';
import fs from 'fs';

const RiscZeroExampleImageID: FrC = FrC.from(process.env.RISC_ZERO_EXAMPLE_IMAGE_ID as string)
const workDir = process.env.RISC_ZERO_EXAMPLE_WORK_DIR as string;
const riscZeroExampleNodeVk: Field = Field.from(JSON.parse(fs.readFileSync(`${workDir}/proofs/layer4/p0.json`, 'utf8')).publicOutput[2]);

const vk = VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/nodeVk.json`, 'utf8')))

export class Bytes29 extends Bytes(29) {}

class RiscZeroExampleInput extends Struct({
}) {}

const riscZeroExampleVerifier = ZkProgram({
    name: 'RiscZeroExampleVerifier',
    publicInput: RiscZeroExampleInput,
    publicOutput: Undefined,
    methods: {
      compute: {
        privateInputs: [NodeProofLeft],
        async method(
            input: RiscZeroExampleInput,
            proof: NodeProofLeft,
        ) {
            proof.verify(vk)
            proof.publicOutput.subtreeVkDigest.assertEquals(riscZeroExampleNodeVk)


            let bytes: UInt8[] = []; 
            bytes = bytes.concat([
            ]);    
             Provable.asProver(() => {
                const buffer = Buffer.from(new Uint8Array(bytes.map((byte) => byte.toNumber())));
                console.log(buffer.toString('hex'));
            });
           
            const pi0 = RiscZeroExampleImageID;
            const pi1 = parsePublicInputsProvable(Bytes.from(bytes));
            
            const piDigest = Poseidon.hashPacked(Provable.Array(FrC.provable, 2), [pi0, pi1])
            // piDigest.assertEquals(proof.publicOutput.rightOut)

            return undefined;
        },
      },
    },
});

const RiscZeroExampleProof = ZkProgram.Proof(riscZeroExampleVerifier);
export { riscZeroExampleVerifier, RiscZeroExampleProof, RiscZeroExampleInput };