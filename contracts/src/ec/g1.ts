import { createForeignCurve } from "o1js";
import { createField } from "o1js/dist/node/bindings/crypto/finite-field";

var bn254Params = {
    name: "bn254",
    modulus: 21888242871839275222246405745257275088696311157297823662689037894645226208583n,
    order: 21888242871839275222246405745257275088548364400416034343698204186575808495617n,
    a: 0n,
    b: 3n,
    generator: {
      x: 1n,
      y: 2n
    }
};

const bn254 = createForeignCurve(bn254Params)

export { bn254 }