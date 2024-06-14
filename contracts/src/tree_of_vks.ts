import { Field, Poseidon } from "o1js";

const isPowerOf2 = (n: number) => {
    return n > 0 && (n & (n - 1)) === 0;
}

const buildTreeOfVks = (baseVksHashes: Array<Field>, layer1VkHash: Field, nodeVkHash: Field) => {
    console.assert(isPowerOf2(baseVksHashes.length));

    const baseLayerHashes: Array<Field> = []; 
    for (let i = 0; i < baseVksHashes.length; i += 2) {
        const digest = Poseidon.hash([baseVksHashes[i], baseVksHashes[i+1], Field(1)]);
        baseLayerHashes.push(digest); 
    }

    let layerHashes: Array<Field> = baseLayerHashes.map(x => Field.from(x)); 
    let layer = Field(1);
    while (layerHashes.length > 1) {
        let runningLayer: Array<Field> = []; 
        layer = layer.add(Field(1));

        let [vkLeft, vkRight] = layer.equals(Field(2)) ? [layer1VkHash, layer1VkHash] : [nodeVkHash, nodeVkHash];

        for (let i = 0; i < layerHashes.length; i += 2) {
            const digest = Poseidon.hash([vkLeft, vkRight, layerHashes[i], layerHashes[i + 1], layer]);
            runningLayer.push(digest); 
        }

        layerHashes = runningLayer.map(x=>Field.from(x));
    }
    
    return layerHashes[0]
}

export { buildTreeOfVks }