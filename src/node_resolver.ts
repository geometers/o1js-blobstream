import { Bool, Field, VerificationKey, Cache } from 'o1js';
import fs from 'fs';
import {
  NodeProofLeft,
  NodeProofRight,
  ZkpProofLeft,
  ZkpProofRight,
} from './structs.js';
import { layer1 } from './compressor/layer1node.js';
import { node } from './compressor/compressor.js';

const NUM_OF_ZKPS = parseInt(process.argv[2]);

enum LeftOrRight {
  LEFT,
  RIGHT,
}

const resolveLeafProof = async (
  index: number,
  side: LeftOrRight
): Promise<ZkpProofLeft | ZkpProofRight> => {
  // if index is gt than number of zkps just make dummy proof with last proof input/output
  if (index >= NUM_OF_ZKPS) {
    const pLast = await ZkpProofLeft.fromJSON(
      JSON.parse(
        fs.readFileSync(
          `${workDir}/proofs/layer0/zkp${NUM_OF_ZKPS - 1}.json`,
          'utf8'
        )
      )
    );

    if (side === LeftOrRight.LEFT) {
      return ZkpProofLeft.dummy(pLast.publicOutput, pLast.publicOutput, 0);
    } else {
      return ZkpProofRight.dummy(pLast.publicOutput, pLast.publicOutput, 0);
    }
  }

  if (side === LeftOrRight.LEFT) {
    // console.log("reading zkp: ", index);
    return await ZkpProofLeft.fromJSON(
      JSON.parse(
        fs.readFileSync(`${workDir}/proofs/layer0/zkp${index}.json`, 'utf8')
      )
    );
  } else {
    // console.log("reading zkp: ", index);
    return await ZkpProofRight.fromJSON(
      JSON.parse(
        fs.readFileSync(`${workDir}/proofs/layer0/zkp${index}.json`, 'utf8')
      )
    );
  }
};

const resolveLeafVk = async (index: number): Promise<VerificationKey> => {
  // if dummy then just return vk0
  if (index >= NUM_OF_ZKPS) {
    return await VerificationKey.fromJSON(
      JSON.parse(fs.readFileSync(`${workDir}/vks/vk${0}.json`, 'utf8'))
    );
  }

  // console.log("reading vk: ", index);
  return await VerificationKey.fromJSON(
    JSON.parse(fs.readFileSync(`${workDir}/vks/vk${index}.json`, 'utf8'))
  );
};

const proveLayer1 = async (index: number) => {
  await layer1.compile({ cache: Cache.FileSystem(cacheDir) });

  const leftIdx = index * 2;
  const rightIdx = leftIdx + 1;

  const vkLeft = await resolveLeafVk(leftIdx);
  const vkRight = await resolveLeafVk(rightIdx);

  const piLeft = await resolveLeafProof(leftIdx, LeftOrRight.LEFT);
  const piRight = await resolveLeafProof(rightIdx, LeftOrRight.RIGHT);

  let verifyLeft = Bool(true);
  let verifyRight = Bool(true);

  if (leftIdx >= NUM_OF_ZKPS) {
    verifyLeft = Bool(false);
  }

  if (rightIdx >= NUM_OF_ZKPS) {
    verifyRight = Bool(false);
  }

  const proof = await layer1.compute(
    piLeft,
    vkLeft,
    verifyLeft,
    piRight,
    vkRight,
    verifyRight
  );
  fs.writeFileSync(
    `${workDir}/proofs/layer1/p${index}.json`,
    JSON.stringify(proof.proof),
    'utf8'
  );
  console.log(`layer: 1 node: ${index} written`);
};

const proveLayer2 = async (index: number) => {
  const layer1Vk = await VerificationKey.fromJSON(
    JSON.parse(fs.readFileSync(`${workDir}/vks/layer1Vk.json`, 'utf8'))
  );
  await node.compile({ cache: Cache.FileSystem(cacheDir) });

  const leftIdx = index * 2;
  const rightIdx = leftIdx + 1;

  const piLeft = await NodeProofLeft.fromJSON(
    JSON.parse(
      fs.readFileSync(`${workDir}/proofs/layer1/p${leftIdx}.json`, 'utf8')
    )
  );
  const piRight = await NodeProofRight.fromJSON(
    JSON.parse(
      fs.readFileSync(`${workDir}/proofs/layer1/p${rightIdx}.json`, 'utf8')
    )
  );

  const proof = await node.compute(
    piLeft,
    layer1Vk,
    piRight,
    layer1Vk,
    Field(2)
  );
  fs.writeFileSync(
    `${workDir}/proofs/layer2/p${index}.json`,
    JSON.stringify(proof.proof),
    'utf8'
  );
  console.log(`layer: 2 node: ${index} written`);
};

const prove = async (layer: number, index: number) => {
  if (layer === 1) {
    proveLayer1(index);
  } else if (layer === 2) {
    proveLayer2(index);
  } else {
    await node.compile({ cache: Cache.FileSystem(cacheDir) });
    const leftIdx = index * 2;
    const rightIdx = leftIdx + 1;

    const nodeVk = await VerificationKey.fromJSON(
      JSON.parse(fs.readFileSync(`${workDir}/vks/nodeVk.json`, 'utf8'))
    );

    const piLeft = await NodeProofLeft.fromJSON(
      JSON.parse(
        fs.readFileSync(
          `${workDir}/proofs/layer${layer - 1}/p${leftIdx}.json`,
          'utf8'
        )
      )
    );
    const piRight = await NodeProofRight.fromJSON(
      JSON.parse(
        fs.readFileSync(
          `${workDir}/proofs/layer${layer - 1}/p${rightIdx}.json`,
          'utf8'
        )
      )
    );

    const proof = await node.compute(
      piLeft,
      nodeVk,
      piRight,
      nodeVk,
      Field(layer)
    );
    fs.writeFileSync(
      `${workDir}/proofs/layer${layer}/p${index}.json`,
      JSON.stringify(proof.proof),
      'utf8'
    );
    console.log(`layer: ${layer} node: ${index} written`);
  }
};

const workDir = process.argv[5];
const cacheDir = process.argv[6];

prove(parseInt(process.argv[3]), parseInt(process.argv[4]));
