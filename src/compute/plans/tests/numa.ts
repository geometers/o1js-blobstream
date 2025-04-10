import { ComputationalStage, ComputationPlan } from '../../plan.js';
import { range } from '../../../utils/range.js';
import { PlatformFeatures } from '../platform';

interface NumaNodeTestComputationPlanOutput {
  output: string[];
  input: string;
}

interface NumaNodeTestComputationPlanState
  extends PlatformFeatures,
    NumaNodeTestComputationPlanOutput {}

export class NumaNodeTestComputationPlan
  implements
    ComputationPlan<
      NumaNodeTestComputationPlanState,
      NumaNodeTestComputationPlanOutput,
      string
    >
{
  __inputType: string;
  name = 'NumaNodeTest';
  async init(
    state: NumaNodeTestComputationPlanState,
    input: string
  ): Promise<void> {
    state.output = [];
    state.input = input;
  }
  stages: ComputationalStage<NumaNodeTestComputationPlanState>[] = [
    {
      type: 'parallel-cmd',
      name: 'ScaledNumaEcho',
      processCmds: range(10).map((idx) => {
        return {
          cmd: 'echo',
          args: [`Command${idx}`],
          capture: true,
        };
      }),
      callback: (state, result) => {
        state.output = result.map((processOutput) =>
          (processOutput.stdOut as string).trim()
        );
      },
      numaOptimized: true,
    },
  ];
  async then(
    state: NumaNodeTestComputationPlanState
  ): Promise<NumaNodeTestComputationPlanOutput> {
    return { output: state.output, input: state.input };
  }
}
