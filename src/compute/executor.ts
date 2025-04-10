import { Logger } from '../logging/logger.js';
import {
  ComputationalStage,
  ComputationPlan,
  MainThreadComputationStage,
  ParallelComputationStage,
  ProcessCmd,
  ProcessCmdOutput,
  SerialComputationalStage,
} from './plan.js';
import {
  PlatformFeatureDetectionComputationalPlan,
  PlatformFeatures,
} from './plans/platform/index.js';
import { ProcessPool } from './processPool.js';

type InferInput<P> = P extends ComputationPlan<any, any, infer I> ? I : never;
type InferOutput<P> = P extends ComputationPlan<any, infer R, any> ? R : never;
type InferState<P> = P extends ComputationPlan<infer S, any, any> ? S : never;

function applyNumaOptimization<S extends PlatformFeatures>(
  stageProcessCommands: ProcessCmd[],
  state: S
) {
  return stageProcessCommands.map((processCmd, idx) => {
    const numaNode = idx % state.numaNodes!;
    const { cmd, args } = processCmd;

    // replace the cmd with numactl and move the args one level down
    const newCmd = 'numactl';
    const newArgs = [
      `--cpunodebind=${numaNode}`,
      `--membind=${numaNode}`,
      cmd,
      ...args,
    ];

    const newProcessCommand = { ...processCmd, cmd: newCmd, args: newArgs };
    if (newProcessCommand.printableArgs) {
      newProcessCommand.printableArgs = [
        0,
        1,
        2,
        ...newProcessCommand.printableArgs.map((idx: number) => idx + 3),
      ];
    }
    return newProcessCommand;
  });
}

let executorId = 0;

export class ComputationalPlanExecutor {
  #poolSize: number;
  #processPool: ProcessPool;
  #logger: Logger;
  #planExecutionId = 0;
  #activePlans = new Map<
    number,
    { plan: ComputationPlan<any, any, any>; state: any }
  >();

  async #performMainThreadStage<S extends PlatformFeatures>(
    stage: MainThreadComputationStage<S>,
    state: S
  ) {
    let result: void | Promise<void> = stage.execute(state);
    if (result instanceof Promise) {
      await result;
    }
  }

  async #performSerialStage<S extends PlatformFeatures>(
    stage: SerialComputationalStage<S>,
    state: S
  ) {
    let processCmd = stage.processCmd;
    if (processCmd instanceof Function) {
      processCmd = processCmd(state);
    }

    if (stage.callback) {
      const cmdResult = await this.#processPool
        .runCommand(processCmd)
        .catch((err) => err as ProcessCmdOutput);
      const stageCallback = stage.callback(state, cmdResult);
      if (stageCallback instanceof Promise) {
        await stageCallback;
      }
    } else
      await this.#processPool
        .runCommand(processCmd)
        .catch((err: ProcessCmdOutput) => {
          throw err.error;
        });
  }

  async #performParallelStage<S extends PlatformFeatures>(
    stage: ParallelComputationStage<S>,
    state: S
  ) {
    let processCmds = stage.processCmds;
    if (processCmds instanceof Function) {
      processCmds = processCmds(state);
    }

    // If this is numa optimised then we should modify our commands
    let modifiedCommands = processCmds;
    if (stage.numaOptimized && state.numaNodes) {
      modifiedCommands = applyNumaOptimization<S>(modifiedCommands, state);
    }

    if (stage.callback) {
      const cmdResults = await Promise.all(
        modifiedCommands.map((cmd) =>
          this.#processPool
            .runCommand(cmd)
            .catch((err) => err as ProcessCmdOutput)
        )
      );
      const stageCallback = stage.callback(state, cmdResults);
      if (stageCallback instanceof Promise) {
        await stageCallback;
      }
    } else
      await Promise.all(
        modifiedCommands.map((cmd) =>
          this.#processPool.runCommand(cmd).catch((err: ProcessCmdOutput) => {
            throw err.error;
          })
        )
      );
  }

  async #stagePrerequisiteIndicatesSkip<S extends PlatformFeatures>(
    stage: ComputationalStage<S>,
    state: S
  ) {
    const prerequisiteCheck = stage.prerequisite;
    if (prerequisiteCheck) {
      let prerequisiteResult: boolean | Promise<boolean>;
      prerequisiteResult = prerequisiteCheck(state);

      if (prerequisiteResult instanceof Promise) {
        prerequisiteResult = await prerequisiteResult;
      }

      if (!prerequisiteResult) {
        return true;
      }
    }
    return false;
  }

  async #executeComputationalPlanInner<S extends PlatformFeatures, R, I>(
    state = {} as S,
    plan: ComputationPlan<S, R, I>,
    input: I
  ) {
    this.#planExecutionId++;
    const planId = this.#planExecutionId;
    this.#logger.log(`Executing computational plan '${plan.name}'.`);
    let error: Error | undefined = undefined;
    const startTime = Date.now();
    try {
      this.#activePlans.set(planId, { plan, state });
      if (plan.init) {
        this.#logger.log(
          `Calling the 'init' function of the '${plan.name}' computational plan.`
        );
        await plan.init(state, input);
      }

      let stageStartTime: number;
      for (let stage_idx = 0; stage_idx < plan.stages.length; stage_idx++) {
        const stage = plan.stages[stage_idx];
        stageStartTime = Date.now();

        const prerequisiteCheck = stage.prerequisite;
        if (prerequisiteCheck) {
          let prerequisiteResult: boolean | Promise<boolean>;
          prerequisiteResult = prerequisiteCheck(state);

          if (prerequisiteResult instanceof Promise) {
            prerequisiteResult = await prerequisiteResult;
          }

          if (!prerequisiteResult) {
            continue;
          }
        }

        if (await this.#stagePrerequisiteIndicatesSkip(stage, state)) continue;

        this.#logger.log(
          `[${stage.type}] Executing stage ${stage_idx} '${stage.name}' of the '${plan.name}' computational plan.`
        );

        switch (stage.type) {
          case 'main-thread': {
            await this.#performMainThreadStage(stage, state);
            break;
          }
          case 'serial-cmd': {
            await this.#performSerialStage(stage, state);
            break;
          }
          case 'parallel-cmd': {
            await this.#performParallelStage(stage, state);
            break;
          }
          default: {
            throw new Error(
              `Unknown stage type '${
                (stage as ComputationalStage<S>).type
              }' aborting.`
            );
          }
        }

        this.#logger.log(
          `[${stage.type}] Stage ${stage_idx} '${stage.name}' of the '${
            plan.name
          }' computational plan completed in ${
            (Date.now() - stageStartTime) / 1000
          } seconds.`
        );
      }

      // Run then
      this.#logger.log(
        `Calling the 'then' function of the '${plan.name}' computational plan.`
      );
      const result = await plan.then(state);
      return result;
    } catch (err) {
      error = err as Error;
      throw error;
    } finally {
      const elapsed = (Date.now() - startTime) / 1000;
      let finallyWorked = true;

      this.#activePlans.delete(planId);

      if (error)
        this.#logger.error(
          `Execution of the '${plan.name}' computational plan failed after ${elapsed} seconds: ${error}`
        );

      if (plan.finally) {
        this.#logger.info(
          `Calling the 'finally' function of the '${plan.name}' computational plan.`
        );
        await plan.finally(state).catch((err) => {
          this.#logger.error(
            `An error occured when calling the 'finally' function of the '${plan.name}' computational plan. ${err}`
          );
          finallyWorked = false;
        });
      }

      if (!error) {
        if (finallyWorked)
          this.#logger.log(
            `Execution of the computational plan '${plan.name}' completed successfully in ${elapsed} seconds.`
          );
        else
          this.#logger.warn(
            `Computational plan '${plan.name}' completed successfully in ${elapsed} seconds. However the 'finally' function had an error. Some cache cleanup logic may not have completed and left stray files on your system.'`
          );
      }
    }
  }

  async execute<P extends ComputationPlan<any, any, any>>(
    plan: P,
    input: InferInput<P>
  ) {
    // Define platform features
    const plaformPlan = new PlatformFeatureDetectionComputationalPlan();
    // Execute platform plan
    const platformFeatures = await this.#executeComputationalPlanInner<
      PlatformFeatures,
      PlatformFeatures,
      InferInput<P>
    >({} as PlatformFeatures, plaformPlan as InferInput<P>, input);
    // Execute the given plan
    return await this.#executeComputationalPlanInner<
      InferState<P>,
      InferOutput<P>,
      InferInput<P>
    >(platformFeatures as InferState<P>, plan, input);
  }

  async terminate() {
    let resolver = Promise.resolve();
    this.#activePlans.forEach((activePlan) => {
      resolver = resolver.then(async () => {
        if (activePlan.plan.finally)
          await activePlan.plan.finally(activePlan.state);
      });
    });
    return resolver;
  }

  workerFreeStatus() {
    return this.#processPool.workerFreeStatus();
  }

  constructor(poolSize: number) {
    executorId++;
    this.#poolSize = poolSize;
    this.#processPool = new ProcessPool(poolSize);
    this.#logger = new Logger(`ComputationalPlanExecutor${executorId}`);
  }
}
