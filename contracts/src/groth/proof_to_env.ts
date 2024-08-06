import fs from 'fs';

const args = process.argv;

const groth16ProofPath = args[2];
const groth16RawVKPath = args[3];
const groth16VKPath = args[4];
const runDir = args[5];
const workDir = args[6];
const proofName = args[7];
const envPath = `${runDir}/env.${proofName}`;

const env = `\
WORK_DIR=${workDir}/${proofName}/e2e_groth16
CACHE_DIR=${workDir}/groth16_cache
RAW_VK_PATH=${groth16RawVKPath}
VK_PATH=${groth16VKPath}
PROOF_PATH=${groth16ProofPath}
`;

fs.writeFileSync(envPath, env, 'utf8');