import { ComputationalPlanExecutor } from '../../compute/executor.js';
import { PlonkComputationalPlan } from '../../compute/plans/plonk/index.js';
import { Sp1 } from './types.js';

export async function performSp1ToPlonk(
  executor: ComputationalPlanExecutor,
  sp1: Sp1
) {
  // Unpack arguments
  const hexPi = `0x${Buffer.from(sp1.public_values.buffer.data).toString(
    'hex'
  )}`;
  const programVK = sp1.proof.Plonk.public_inputs[0];
  const encodedProof = `0x00000000${sp1.proof.Plonk.encoded_proof}`;

  // Invoke executor
  return executor.execute(new PlonkComputationalPlan(), {
    hexPi,
    programVK,
    encodedProof,
  });
}
