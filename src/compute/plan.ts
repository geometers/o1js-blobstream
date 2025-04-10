import { PlatformFeatures } from './plans/platform';

export interface ProcessCmd {
  cmd: string;
  args: string[];
  emit?: boolean;
  capture?: boolean;
  printableArgs?: number[];
}

/*export interface OptimisableProcessCmd extends ProcessCmd {
    args: string[];
}*/

export interface ProcessCmdOutput {
  code: number;
  stdOut?: string;
  stdErr?: string;
  error?: Error;
}

export interface BaseComputationalStage {
  name: string;
}

export interface SerialComputationalStage<T> extends BaseComputationalStage {
  type: 'serial-cmd';
  processCmd: ProcessCmd | ((state: T) => ProcessCmd);
  callback?: (state: T, result: ProcessCmdOutput) => Promise<void> | void;
  prerequisite?: (state: T) => Promise<boolean> | boolean;
}

export interface ParallelComputationStage<T> extends BaseComputationalStage {
  type: 'parallel-cmd';
  processCmds: ProcessCmd[] | ((state: T) => ProcessCmd[]);
  callback?: (state: T, result: ProcessCmdOutput[]) => Promise<void> | void;
  prerequisite?: (state: T) => Promise<boolean> | boolean;
  numaOptimized?: boolean;
}

export interface MainThreadComputationStage<T> extends BaseComputationalStage {
  type: 'main-thread';
  execute: (state: T) => Promise<void> | void;
  prerequisite?: (state: T) => Promise<boolean> | boolean;
}

export type ComputationalStage<T> =
  | SerialComputationalStage<T>
  | ParallelComputationStage<T>
  | MainThreadComputationStage<T>;

export interface ComputationPlan<T extends PlatformFeatures, R, I> {
  __inputType: I;
  name: string;
  stages: ComputationalStage<T>[];
  init?: (state: T, input: I) => Promise<void>;
  then: (state: T) => Promise<R>;
  finally?: (state: T) => Promise<void>;
}

export function Implements<T>() {
  return <U extends new (...args: any[]) => T>(constructor: U): U => {
    return constructor;
  };
}
