import { Field, Poseidon } from "o1js";
import { NOTHING_UP_MY_SLEEVE } from "./structs.js";

const isPowerOf2 = (n: number) => {
    return n > 0 && (n & (n - 1)) === 0;
}

const nextPowerOf2 = (n: number) => {
    const is = isPowerOf2(n); 
    if (is) return n; 

    const log = Math.ceil(Math.log2(n)); 
    return 1 << log; 
}

const appendToMakePowerOf2 = (baseVksHashes: Array<Field>) => {
    const n = baseVksHashes.length; 
    const nn = nextPowerOf2(n); 

    const dummyVks = new Array(nn - n).fill(Field(NOTHING_UP_MY_SLEEVE));
    return baseVksHashes.concat(dummyVks)
}


const buildTreeOfVks = (baseVksHashes: Array<Field>, layer1VkHash: Field, nodeVkHash: Field) => {
    const leaves = appendToMakePowerOf2(baseVksHashes);

    const baseLayerHashes: Array<Field> = []; 
    for (let i = 0; i < leaves.length; i += 2) {
        const digest = Poseidon.hash([leaves[i], leaves[i+1], Field(1)]);
        baseLayerHashes.push(digest); 
    }

    let layerHashes: Array<Field> = baseLayerHashes.map(x => Field.from(x)); 
    let layer = Field(1);
    while (layerHashes.length > 1) {
        let runningLayer: Array<Field> = []; 
        layer = layer.add(Field(1));

        let [vkLeft, vkRight] = layer.equals(Field(2)).toBoolean() ? [layer1VkHash, layer1VkHash] : [nodeVkHash, nodeVkHash];

        for (let i = 0; i < layerHashes.length; i += 2) {
            const digest = Poseidon.hash([vkLeft, vkRight, layerHashes[i], layerHashes[i + 1], layer]);
            runningLayer.push(digest); 
        }

        console.log('---------------')
        runningLayer.forEach(h => {
            console.log(h.toBigInt());
        });
        console.log('---------------')

        layerHashes = runningLayer.map(x=>Field.from(x));
    }
    
    return layerHashes[0]
}

export { buildTreeOfVks }