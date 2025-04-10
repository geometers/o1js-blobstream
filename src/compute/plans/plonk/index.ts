import { resolve } from 'path';
import { computeAuxWitness } from '../../../pairing-utils/index.js';
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
import { getMlo } from '../../../plonk/get_mlo.js';

export type PlonkInput = {
  hexPi: string;
  programVK: string;
  encodedProof: string;
};

export interface PlonkProofData {
  maxProofsVerified: 0 | 1 | 2;
  proof: string;
  publicInput: string[];
  publicOutput: string[];
}

export interface PlonkVkData {
  data: string;
  hash: string;
}

export interface PlonkOutput {
  vkData: PlonkVkData;
  proofData: PlonkProofData;
}

interface State extends PlatformFeatures, PlonkOutput {
  workingDirName: string;
  workingDir: string;
  cacheDir: string;
  input: PlonkInput;
  witnessPath: string;
}

const proofVkCacheStructure: DirectoryStructure = {
  proofs: range(6).map((i) => `layer${i}`),
  vks: range(6).map((i) => `layer${i}`),
};

const nodeCacheStructure: DirectoryStructure = range(4).map((i) => `node${i}`);

export class PlonkComputationalPlan
  implements ComputationPlan<State, PlonkOutput, PlonkInput>
{
  readonly __inputType!: PlonkInput;
  name = 'PlonkConverter';
  async init(state: State, input: PlonkInput): Promise<void> {
    state.input = input;
    state.workingDirName = getRandomString(20);
    const pwd = process.cwd();
    state.workingDir = resolve(pwd, '.conversion-cache', state.workingDirName);
    state.cacheDir = resolve(pwd, '.conversion-cache', 'plonk_cache');
  }
  stages: ComputationalStage<State>[] = [
    {
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
      name: 'GenerateWitness',
      type: 'main-thread',
      execute: (state: State) => {
        const mlo = getMlo(
          state.input.encodedProof,
          state.input.programVK,
          state.input.hexPi
        ).toJSON();

        const witness = computeAuxWitness(JSON.parse(mlo));
        state.witnessPath = resolve(state.workingDir, 'aux_wtns.json');

        // Write the mlo and witness to the cache dir
        writeFileSync(resolve(state.workingDir, 'mlo.json'), mlo);
        writeFileSync(state.witnessPath, JSON.stringify(witness));
        return;
      },
    },
    // If u wanna see stdout then you can change the capture boolean key in the plonk plan to emit
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
      name: 'ComputeZPK',
      type: 'parallel-cmd',
      processCmds: (state: State) => {
        return range(24).map((i) => {
          return {
            cmd: 'node',
            args: [
              '--max-old-space-size=6000',
              resolve(
                rootDir,
                'build',
                'src',
                'plonk',
                'recursion',
                'prove_zkps.js'
              ),
              `zkp${i}`,
              state.input.encodedProof,
              state.input.programVK,
              state.input.hexPi,
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
    ...range(1, 6).map((i) => {
      const stage: ParallelComputationStage<State> = {
        name: `CompressLayer${i}`,
        type: 'parallel-cmd',
        processCmds: (state: State) => {
          const upperLimit = Math.pow(2, 5 - i) - 1;
          return range(upperLimit + 1).map((ZKP_J) => {
            return {
              cmd: 'node',
              args: [
                '--max-old-space-size=6000',
                resolve(rootDir, 'build', 'src', 'node_resolver.js'),
                '24',
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
  async then(state: State): Promise<PlonkOutput> {
    const output: PlonkOutput = {
      vkData: JSON.parse(
        readFileSync(resolve(state.workingDir, 'vks', 'nodeVk.json'), 'utf8')
      ) as PlonkVkData,
      proofData: JSON.parse(
        readFileSync(
          resolve(state.workingDir, 'proofs', 'layer5', 'p0.json'),
          'utf8'
        )
      ) as PlonkProofData,
    };
    return output;
  }
  async finally(state: State): Promise<void> {
    rmSync(state.workingDir, { recursive: true, force: true });
  }
}
