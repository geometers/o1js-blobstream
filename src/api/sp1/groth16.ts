import { ComputationalPlanExecutor } from '../../compute/executor.js';
import { Groth16ComputationalPlan } from '../../compute/plans/groth16/index.js';
import { Risc0Proof, Risc0RawVk } from './types.js';

export async function performRisc0ToGroth16(
  executor: ComputationalPlanExecutor,
  risc0_proof: Risc0Proof,
  risc0_raw_vk: Risc0RawVk,
) {
  // print performing sp1 to plonk
    console.log('Performing Risc0 to Groth16 conversion...');
    
    // Invoke executor
    return executor.execute(new Groth16ComputationalPlan(), {
        risc0_proof: risc0_proof,
        raw_vk: risc0_raw_vk,
    });
}