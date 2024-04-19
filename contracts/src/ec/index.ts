import { Struct } from "o1js";
import { FpC } from "../towers/fp.js";
import { G2Affine } from "./g2.js";

class G1Affine extends Struct({x: FpC.provable, y: FpC.provable}) {}

// class G2 {
//     x: Fp2 
//     y: Fp2
//     z: Fp2

//     constructor(x: Fp2, y: Fp2, z: Fp2) {
//         this.x = x; 
//         this.y = y; 
//         this.z = z;
//     }

//     to_affine() {
//         const z_inv = this.z.inverse(); 

//         const z_inv_2 = z_inv.mul(z_inv); 
//         const z_inv_3 = z_inv.mul(z_inv_2);

//         const x = this.x.mul(z_inv_2);
//         const y = this.y.mul(z_inv_3);

//         const z = new Fp2({c0: FpC.from(1n), c1: FpC.from(0n)});
//         return new G2(x, y, z)
//     }
// }

export { G1Affine, G2Affine }