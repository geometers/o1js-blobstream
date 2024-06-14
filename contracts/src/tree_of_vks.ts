import { Field, Poseidon, VerificationKey } from "o1js";
import { NOTHING_UP_MY_SLEEVE } from "./structs.js";

const isPowerOf2 = (n: number) => {
    return n > 0 && (n & (n - 1)) === 0;
}

const buildTreeOfVks = (baseVks: Array<VerificationKey>, compressorVk: VerificationKey) => {
    console.assert(isPowerOf2(baseVks.length));

    const baseLayerHashes: Array<Field> = []; 
    for (let i = 0; i < baseVks.length; i += 2) {
        const digest = Poseidon.hash([baseVks[i].hash, baseVks[i+1].hash, NOTHING_UP_MY_SLEEVE, NOTHING_UP_MY_SLEEVE, Field(1)]);
        console.log(digest);
        baseLayerHashes.push(digest); 
    }

    let layerHashes: Array<Field> = baseLayerHashes.map(x => Field.from(x)); 
    let layer = Field(1);
    while (layerHashes.length > 1) {
        let runningLayer: Array<Field> = []; 
        layer = layer.add(Field(1));
        for (let i = 0; i < layerHashes.length; i += 2) {
            const digest = Poseidon.hash([compressorVk.hash, compressorVk.hash, layerHashes[i], layerHashes[i + 1], layer]);
            runningLayer.push(digest); 
        }

        layerHashes = runningLayer.map(x=>Field.from(x));
    }
    
    return layerHashes[0]
}

export { buildTreeOfVks }