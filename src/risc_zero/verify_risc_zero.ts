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
import fs from 'fs';

const workDir = process.env.RISC_ZERO_EXAMPLE_WORK_DIR as string;
const riscZeroExampleNodeVk: Field = Field.from(
  JSON.parse(fs.readFileSync(`${workDir}/proofs/layer4/p0.json`, 'utf8'))
    .publicOutput[2]
);

const vk = VerificationKey.fromJSON(
  JSON.parse(fs.readFileSync(`${workDir}/vks/nodeVk.json`, 'utf8'))
);

const riscZeroExampleVerifier = ZkProgram({
  name: 'RiscZeroExampleVerifier',
  publicInput: Field,
  publicOutput: Undefined,
  methods: {
    compute: {
      privateInputs: [NodeProofLeft, Provable.Array(FrC.provable, 5)],
      async method(input: Field, proof: NodeProofLeft, pis: Array<FrC>) {
        proof.verify(vk);
        proof.publicOutput.subtreeVkDigest.assertEquals(riscZeroExampleNodeVk);

        const piDigest = Poseidon.hashPacked(
          Provable.Array(FrC.provable, 5),
          pis
        );
        piDigest.assertEquals(input);

        piDigest.assertEquals(proof.publicOutput.rightOut);

        return undefined;
      },
    },
  },
});

const RiscZeroExampleProof = ZkProgram.Proof(riscZeroExampleVerifier);
export { riscZeroExampleVerifier, RiscZeroExampleProof };
