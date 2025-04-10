import * as os from 'os';
import { ComputationalStage, ComputationPlan } from '../../plan.js';

export interface PlatformFeatures {
  platformName: 'linux' | 'windows' | 'darwin';
  numactl?: boolean;
  numaNodes?: number;
}

export class PlatformFeatureDetectionComputationalPlan
  implements ComputationPlan<PlatformFeatures, PlatformFeatures, undefined>
{
  __inputType: undefined;
  name = 'PlatformFeatureDetection';
  stages: ComputationalStage<PlatformFeatures>[] = [
    {
      type: 'main-thread',
      name: 'PlatformDetection',
      execute: (state) => {
        state.platformName = os.platform() as 'linux' | 'windows' | 'darwin';
      },
    },
    {
      type: 'serial-cmd',
      name: 'NumaCtlCheck',
      prerequisite: (state) => state.platformName === 'linux',
      processCmd: {
        cmd: 'numactl',
        args: ['echo'],
        emit: false,
        capture: true,
      },
      callback: (state, result) => {
        if (result.error || result.stdErr) state.numactl = false;
        else state.numactl = true;
      },
    },
    {
      type: 'serial-cmd',
      name: 'NumaCtlNodeCheck',
      prerequisite: (state) => state.numactl == true,
      processCmd: {
        cmd: '/bin/bash',
        args: ['-c', "numactl --hardware | grep -oP '(?<=available: )\\d+'"],
        emit: false,
        capture: true,
      },
      callback: (state, result) => {
        state.numaNodes = parseInt(result.stdOut?.trim() || 'NaN');
      },
    },
  ];
  async then(state: PlatformFeatures) {
    return state;
  }
}
