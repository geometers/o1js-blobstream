import { GrothVk } from "./vk.js";
import { Proof } from "./proof.js";
import { bn254 } from "../ec/g1.js";
import { FrC } from "../towers/fr.js";
import { ForeignCurve } from "o1js";

// pis are sent without beginning 1
export function computePI(VK: GrothVk, pis: Array<FrC>): ForeignCurve {
    let acc = new bn254({ x: VK.ic0.x, y: VK.ic0.y }); 

    acc = acc.add(VK.ic1.scale(pis[0]));
    acc = acc.add(VK.ic2.scale(pis[1]));
    acc = acc.add(VK.ic3.scale(pis[2]));
    acc = acc.add(VK.ic4.scale(pis[3]));
    acc = acc.add(VK.ic5.scale(pis[4]));

    return acc
}