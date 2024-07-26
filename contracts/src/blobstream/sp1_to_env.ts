import fs from 'fs';

const args = process.argv;

const sp1Proof = args[2];
const envPath = args[3];
const proofName = args[4];

const sp1 = JSON.parse(fs.readFileSync(sp1Proof, 'utf8'));
const hexPi = Buffer.from(sp1.public_values.buffer.data).toString('hex');
const programVk = sp1.proof.Plonk.public_inputs[0];
const encodedProof = sp1.proof.Plonk.encoded_proof;

const env = `\
WORK_DIR=blobstream_example/run/${proofName}/e2e_plonk
CACHE_DIR=blobstream_example/run/plonk_cache
HEX_PROOF="0x00000000${encodedProof}"
PROGRAM_VK="${programVk}"
HEX_PI="0x${hexPi}"
`;

fs.writeFileSync(envPath, env, 'utf8');