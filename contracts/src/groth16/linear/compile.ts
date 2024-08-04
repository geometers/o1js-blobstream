import { zkp1 } from './zkp1.js';
import { zkp2 } from './zkp2.js';
import { zkp3 } from './zkp3.js';
import { zkp4 } from './zkp4.js';
import { zkp5 } from './zkp5.js';
import { zkp6 } from './zkp6.js';
import { zkp7 } from './zkp7.js';
import { zkp8 } from './zkp8.js';
import { zkp9 } from './zkp9.js';
import { zkp10 } from './zkp10.js';
import { zkp11 } from './zkp11.js';
import { zkp12 } from './zkp12.js';
import { zkp13 } from './zkp13.js';
import { zkp14 } from './zkp14.js';
import { zkp15 } from './zkp15.js';
import { zkp16 } from './zkp16.js';
import { zkp17 } from './zkp17.js';
import { zkp18 } from './zkp18.js';
import { zkp19 } from './zkp19.js';
import { zkp20 } from './zkp20.js';
import { zkp21 } from './zkp21.js';
import { zkp22 } from './zkp22.js';
import { zkp23 } from './zkp23.js';
import { zkp24 } from './zkp24.js';
import { getBHardcodedLines } from './helpers.js';

import fs from 'fs';
import { G2Line } from '../../lines/index.js';
import { Cache, VerificationKey } from 'o1js';

const bLines = getBHardcodedLines();
let deltaLinesInput = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
let parsedDeltaLines: any[] = JSON.parse(deltaLinesInput);
const deltaLines = parsedDeltaLines.map((g: any): G2Line => G2Line.fromJSON(g));

function getBLines(i: number) {
  if (i == 1) {
    return bLines.slice(0, 62)
  } else if (i == 2) {
    return bLines.slice(62, 62 + 29)
  } else {
    return []
  }
}

function getDeltaLines(i: number) {
  if (i == 3) {
    return deltaLines.slice(0, 20);
  } else if (i == 4) {
    return deltaLines.slice(20, 40);
  } else if (i == 5) {
    return deltaLines.slice(40, 59);
  } else if (i == 6) {
    return deltaLines.slice(59, 78);
  } else if (i == 7) {
    return deltaLines.slice(78, 91);
  } else {
    return []
  }
}

async function compileZKP1(): Promise<VerificationKey> {
    const vk = (await zkp1.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP2(): Promise<VerificationKey> {
    await compileZKP1();
    const vk = (await zkp2.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP3(): Promise<VerificationKey> {
    await compileZKP2();
    const vk = (await zkp3.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP4(): Promise<VerificationKey> {
    await compileZKP3();
    const vk = (await zkp4.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP5(): Promise<VerificationKey> {
    await compileZKP4();
    const vk = (await zkp5.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP6(): Promise<VerificationKey> {
    await compileZKP5();
    const vk = (await zkp6.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP7(): Promise<VerificationKey> {
    await compileZKP6();
    const vk = (await zkp7.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP8(): Promise<VerificationKey> {
    await compileZKP7();
    const vk = (await zkp8.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP9(): Promise<VerificationKey> {
    await compileZKP8();
    const vk = (await zkp9.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP10(): Promise<VerificationKey> {
    await compileZKP9();
    const vk = (await zkp10.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP11(): Promise<VerificationKey> {
    await compileZKP10();
    const vk = (await zkp11.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP12(): Promise<VerificationKey> {
    await compileZKP11();
    const vk = (await zkp12.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP13(): Promise<VerificationKey> {
    await compileZKP12();
    const vk = (await zkp13.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP14(): Promise<VerificationKey> {
    await compileZKP13();
    const vk = (await zkp14.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP15(): Promise<VerificationKey> {
    await compileZKP14();
    const vk = (await zkp15.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP16(): Promise<VerificationKey> {
    await compileZKP15();
    const vk = (await zkp16.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP17(): Promise<VerificationKey> {
    await compileZKP16();
    const vk = (await zkp17.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP18(): Promise<VerificationKey> {
    await compileZKP17();
    const vk = (await zkp18.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP19(): Promise<VerificationKey> {
    await compileZKP18();
    const vk = (await zkp19.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP20(): Promise<VerificationKey> {
    await compileZKP19();
    const vk = (await zkp20.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP21(): Promise<VerificationKey> {
    await compileZKP20();
    const vk = (await zkp21.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP22(): Promise<VerificationKey> {
    await compileZKP21();
    const vk = (await zkp22.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP23(): Promise<VerificationKey> {
    await compileZKP22();
    const vk = (await zkp23.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP24(): Promise<VerificationKey> {
    await compileZKP23();
    const vk = (await zkp24.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey
    return vk
}

async function compileZKP(i: number): Promise<VerificationKey | undefined> {
    if (i == 1) {
        return compileZKP1()
    } else if (i == 2) {
        return compileZKP2()
    } else if (i == 3) {
        return compileZKP3()
    } else if (i == 4) {
        return compileZKP4()
    } else if (i == 5) {
        return compileZKP5()
    } else if (i == 6) {
        return compileZKP6()
    } else if (i == 7) {
        return compileZKP7()
    } else if (i == 8) {
        return compileZKP8()
    } else if (i == 9) {
        return compileZKP9()
    } else if (i == 10) {
        return compileZKP10()
    } else if (i == 11) {
        return compileZKP11()
    } else if (i == 12) {
        return compileZKP12()
    } else if (i == 13) {
        return compileZKP13()
    } else if (i == 14) {
        return compileZKP14()
    } else if (i == 15) {
        return compileZKP15()
    } else if (i == 16) {
        return compileZKP16()
    } else if (i == 17) {
        return compileZKP17()
    } else if (i == 18) {
        return compileZKP18()
    } else if (i == 19) {
        return compileZKP19()
    } else if (i == 20) {
        return compileZKP20()
    } else if (i == 21) {
        return compileZKP21()
    } else if (i == 22) {
        return compileZKP22()
    } else if (i == 23) {
        return compileZKP23()
    } else if (i == 24) {
        return compileZKP24()
    }
}

export { getBLines, getDeltaLines, compileZKP };
