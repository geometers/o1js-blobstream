import { Struct } from 'o1js';
import { Sp1PlonkProof } from './proof.js';
import { Sp1PlonkFiatShamir } from './fiat-shamir/index.js';
import { StateUntilPairing } from './state.js';

// This is running accumulator that we pass through recursion
// Not all values are needed at each circuit but since Poseidon is cheap we take this approach for now
class Accumulator extends Struct({
  proof: Sp1PlonkProof,
  fs: Sp1PlonkFiatShamir,
  state: StateUntilPairing,
}) {
  deepClone() {
    return new Accumulator({
      proof: this.proof,
      fs: this.fs.deepClone(),
      state: this.state.deepClone(),
    });
  }
}

export { Accumulator };
