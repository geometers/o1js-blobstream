import { ethers } from "ethers";
import { FrC } from "../towers/index.js";

// TODO: some stuff here can be hardcoded
export function parsePublicInputs(programVk: string, piHex: string): [FrC, FrC] {
    const digest = ethers.sha256(piHex);
    const bytes = ethers.getBytes(digest);
  
    const k: bigint = 14474011154664524427946373126085988481658748083205070504932198000989141204991n; // (1 << 253) - 1
    const k_pad = ethers.zeroPadBytes("0x" + k.toString(16), 32);
  
    const k_bytes = ethers.getBytes(k_pad);
  
    const pi1_bytes = [];
    for (let i = 0; i < 32; i++) {
      pi1_bytes.push(bytes[i] & k_bytes[i]);
    }
  
    let pi1 = ethers.hexlify(new Uint8Array(pi1_bytes));
    
    return [FrC.from(programVk), FrC.from(pi1)]
}