import { ComputationalPlanExecutor } from './executor.js';
import { NumaNodeTestComputationPlan } from './plans/tests/numa.js';

async function main() {
  const testPlanExecutor = new ComputationalPlanExecutor(12);
  const result = await testPlanExecutor.execute(
    new NumaNodeTestComputationPlan(),
    'TestInput'
  );
  console.log(result);
  console.log(testPlanExecutor.workerFreeStatus());
}

main().catch(console.error);
