import { resolve } from 'path';
import { computeAuxWitness } from '../../../pairing-utils/index.js';
import { Alpha } from '../../../pairing-utils/index.js';
import { Beta } from '../../../pairing-utils/index.js';
import { AlphaBetaWasm } from '../../../pairing-utils/index.js';
import { makeAlphaBeta } from '../../../pairing-utils/index.js';
import {
  createDirectories,
  createDirectory,
  DirectoryStructure,
} from '../../../utils/cache.js';
import { getRandomString } from '../../../utils/random.js';
import { range } from '../../../utils/range.js';
import {
  ComputationalStage,
  ComputationPlan,
  ParallelComputationStage,
} from '../../plan.js';
import { PlatformFeatures } from '../platform/index.js';
import rootDir from '../../../utils/root_dir.js';
import { readFileSync, rmSync, writeFileSync } from 'fs';
import { Risc0Proof, Risc0RawVk, Risc0Vk } from '../../../api/sp1/types.js';
import { Groth16Verifier } from '../../../groth/verifier.js';
import { Proof } from '../../../groth/proof.js';

export type Groth16Input = {
  risc0_proof: Risc0Proof;
  raw_vk: Risc0RawVk;
};

export interface Groth16ProofData {
  maxProofsVerified: 0 | 1 | 2;
  proof: string;
  publicInput: string[];
  publicOutput: string[];
}

export interface Groth16VkData {
  data: string;
  hash: string;
}

export interface Groth16Output {
    vkData: Groth16VkData;
    proofData: Groth16ProofData;
}

interface State extends PlatformFeatures, Groth16Output {
  workingDirName: string;
  workingDir: string;
  cacheDir: string;
  input: Groth16Input;
  witnessPath: string;
  proofPath: string;
  vkPath: string;
}

const proofVkCacheStructure: DirectoryStructure = {
  proofs: range(5).map((i) => `layer${i}`),
  vks: range(5).map((i) => `layer${i}`),
};

const nodeCacheStructure: DirectoryStructure = range(4).map((i) => `node${i}`);

export class Groth16ComputationalPlan
  implements ComputationPlan<State, Groth16Output, Groth16Input>
{
  readonly __inputType!: Groth16Input;
  name = 'Groth16Converter';
  async init(state: State, input: Groth16Input): Promise<void> {
    state.input = input;
    state.workingDirName = getRandomString(20);
    const pwd = process.cwd();
    state.workingDir = resolve(pwd, '.conversion-cache', state.workingDirName);
    state.cacheDir = resolve(pwd, '.conversion-cache', 'groth16_cache');
  }
  stages: ComputationalStage<State>[] = [
    {
      // Create the cache and working directories
      // Create the proofs and vks directories
      // Create the node directories
      name: 'CreateFileSystemCache',
      type: 'main-thread',
      execute: (state) => {
        createDirectory(state.cacheDir);
        createDirectory(state.workingDir);
        createDirectories(state.workingDir, proofVkCacheStructure);
        createDirectories(state.workingDir, nodeCacheStructure);
      },
    },
    {
      name: 'makeAlphaBeta',
      type: 'main-thread',
      execute: (state: State) => {
        const raw_vk = state.input.raw_vk;

        const input: AlphaBetaWasm = {
          alpha: {
            x: raw_vk.alpha.x,
            y: raw_vk.alpha.y,
          },
          beta: {
            x_c0: raw_vk.beta.x_c0,
            x_c1: raw_vk.beta.x_c1,
            y_c0: raw_vk.beta.y_c0,
            y_c1: raw_vk.beta.y_c1,
          },
        };

        const risc0_vk = makeAlphaBeta(raw_vk, input);

        writeFileSync(
          resolve(state.workingDir, 'risc_zero_vk.json'), 
          JSON.stringify(risc0_vk)
        );
        
        writeFileSync(
          resolve(state.workingDir, 'risc_zero_proof.json'),
          JSON.stringify(state.input.risc0_proof)
        );
        
        state.vkPath = resolve(state.workingDir, 'risc_zero_vk.json');
        state.proofPath = resolve(state.workingDir, 'risc_zero_proof.json');
      },
    },
    {     
          name: 'GenerateWitness',
          type: 'main-thread',
          execute: (state: State) => {
            // args = [vk_path, proof_path, mlo_write_path]
            const vk_path = state.vkPath;
            const proof_path = state.proofPath;
            
            const groth16 = new Groth16Verifier(vk_path);
            const proof = Proof.parse(groth16.vk, proof_path);
            const mlo = groth16.multiMillerLoop(proof).toJSON();
    
            const witness = computeAuxWitness(JSON.parse(mlo));
            state.witnessPath = resolve(state.workingDir, 'aux_wtns.json');
            
            // Write the mlo and witness to the cache dir
            writeFileSync(resolve(state.workingDir, 'mlo.json'), mlo);
            writeFileSync(state.witnessPath, JSON.stringify(witness));

            return;
          },
        },
    {
      name: 'CompileRecursion',
      type: 'serial-cmd',
      processCmd: (state: State) => {
        return {
          cmd: 'node',
          args: [
            '--max-old-space-size=6000',
            resolve(rootDir, 'build', 'src', 'compile_recursion_vks.js'),
            state.workingDir,
            state.cacheDir,
          ],
          capture: true,
          printableArgs: [0, 1, 2],
        };
      },
    },
    {
      name: 'ComputeZKP',
      type: 'parallel-cmd',
      processCmds: (state: State) => {
        process.env.GROTH16_VK_PATH = state.vkPath;
        return range(16).map((i) => {
          return {
            cmd: 'node',
            args: [
              '--max-old-space-size=6000',
              resolve(
                rootDir,
                'build',
                'src',
                'groth',
                'recursion',
                'prove_zkps.js'
              ),
              `zkp${i}`,
              state.proofPath,
              state.witnessPath,
              state.workingDir,
              state.cacheDir,
            ],
            capture: true,
            printableArgs: [0, 1, 2],
          };
        });
      },
      numaOptimized: true,
    },
    ...range(1, 5).map((i) => {
      const stage: ParallelComputationStage<State> = {
        name: `CompressLayer${i}`,
        type: 'parallel-cmd',
        processCmds: (state: State) => {
          const upperLimit = Math.pow(2, 4 - i) - 1;
          return range(upperLimit + 1).map((ZKP_J) => {
            return {
              cmd: 'node',
              args: [
                '--max-old-space-size=6000',
                resolve(rootDir, 'build', 'src', 'node_resolver.js'),
                '16',
                `${i}`,
                `${ZKP_J}`,
                state.workingDir,
                state.cacheDir,
              ],
              capture: true,
              printableArgs: [0, 1, 2, 3, 4],
            };
          });
        },
        numaOptimized: true,
      };
      return stage;
    }),
  ];
  async then(state: State): Promise<Groth16Output> {
    const output: Groth16Output = {
      vkData: JSON.parse(
        readFileSync(resolve(state.workingDir, 'vks', 'nodeVk.json'), 'utf8')
      ) as Groth16VkData,
      proofData: JSON.parse(
        readFileSync(
          resolve(state.workingDir, 'proofs', 'layer4', 'p0.json'),
          'utf8'
        )
      ) as Groth16ProofData,
    };
    return output;
  }
  async finally(state: State): Promise<void> {
    rmSync(state.workingDir, { recursive: true, force: true });
  }
}
