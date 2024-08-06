import fs from 'fs';

const args = process.argv;

const groth16ProofPath = args[2];
const groth16VKPath = args[3];
const runDir = args[4];
const workDir = args[5];
const proofName = args[6];
const envPath = `${runDir}/env.${proofName}`;

const env = `\
WORK_DIR=${workDir}/${proofName}/e2e_groth16
CACHE_DIR=${workDir}/groth16_cache
VK_PATH=${groth16VKPath}
PROOF_PATH=${groth16ProofPath}
`;

fs.writeFileSync(envPath, env, 'utf8');