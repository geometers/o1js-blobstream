import { getMlo } from "./get_mlo.js";
import fs from "fs"

const args = process.argv;
// assert(args.length >= 6)

const mloPath = args[2]
const hexProof = args[3]
const programVk = args[4]
const hexPi = args[5]

const mlo = getMlo(hexProof, programVk, hexPi)
fs.writeFileSync(mloPath, mlo.toJSON(), 'utf-8');
console.log(`JSON data has been written to ${mloPath}`)