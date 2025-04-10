import { Field, Poseidon, Provable } from 'o1js';
import { ATE_LOOP_COUNT, Fp12 } from './towers/index.js';

class ArrayListHasher {
  static n: number;

  static empty(): Field {
    const a = new Array(this.n).fill(Field(0n));
    return Poseidon.hashPacked(Provable.Array(Field, this.n), a);
  }

  static hash(arr: Array<Field>): Field {
    return Poseidon.hashPacked(Provable.Array(Field, this.n), arr);
  }

  static open(
    lhs: Array<Field>,
    opening: Array<Fp12>,
    rhs: Array<Field>
  ): Field {
    const opening_hashes: Field[] = opening.map((x) =>
      Poseidon.hashPacked(Fp12, x)
    );

    let arr: Field[] = [];
    arr = arr.concat(lhs);
    arr = arr.concat(opening_hashes);
    arr = arr.concat(rhs);

    return this.hash(arr);
  }
}

ArrayListHasher.n = ATE_LOOP_COUNT.length;

export { ArrayListHasher };
