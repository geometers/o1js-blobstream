import { Crypto, Provable, Struct, createForeignField, provable } from 'o1js';
import { P } from './consts.js';
// import { AnyTuple } from 'o1js/dist/node/lib/util/types';
// const P = 21888242871839275222246405745257275088696311157297823662689037894645226208583n
class Fp extends createForeignField(P) {}

class FpU extends Fp.Unreduced {}
class FpA extends Fp.AlmostReduced {}
class FpC extends Fp.Canonical {}

// function main() {
//     let s = Provable.witness(
//       FpC.provable,
//       () => FpC.from(21888242871839275222246405745257275088696357297823662689037894645226208581n)
//     );
//     let t = Provable.witness(
//         FpC.provable,
//         () => FpC.from(21888242871839275246405745257275088696311157297823662689037894645226208581n)
//     );
//     let a = Provable.witness(
//         FpC.provable,
//         () => FpC.from(218882428718392752464745257275088696311157297823662689037894645226208581n)
//     );
//     let b = Provable.witness(
//         FpC.provable,
//         () => FpC.from(21888242871839275246474525727508396311157297823662689037894645226208581n)
//     );
//     s.mul(t).assertCanonical();
//     a.mul(b).assertCanonical();
// }

// (async () => {
//     console.time('running Fp constant version');
//     await main();
//     console.timeEnd('running Fp constant version');

//     console.time('running Fp witness generation & checks');
//     await Provable.runAndCheck(main);
//     console.timeEnd('running Fp witness generation & checks');

//     console.time('creating Fp constraint system');
//     let cs = await Provable.constraintSystem(main);
//     console.timeEnd('creating Fp constraint system');

//     console.log(cs.summary());
// })();

export { Fp, FpU, FpA, FpC };
