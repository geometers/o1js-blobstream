#!/bin/bash -e

mkdir -p ./src/recursion/vks/
mkdir -p ./src/recursion/proofs/


mkdir -p ./src/recursion/proofs/layer0
mkdir -p ./src/recursion/proofs/layer1
mkdir -p ./src/recursion/proofs/layer2
mkdir -p ./src/recursion/proofs/layer3
mkdir -p ./src/recursion/proofs/layer4
mkdir -p ./src/recursion/proofs/layer5


echo "Compiling recursion vks..."
node build/src/recursion/compile_recursion_vks &
wait 

echo "Computing ZKPs 0-18..."
for i in `seq 0 18`; do
    node build/src/recursion/prove_zkps.js zkp${i} 2>/dev/null &
done

wait

echo "Computed ZKPs 0-18..."

for i in `seq 1 5`; do
    echo "Compressing layer ${i}..."
    upper_limit=$(( 2 ** (5 - i) - 1 ))
    for j in $(seq 0 $upper_limit); do
        # echo "${i}, ${j}"
        node build/src/recursion/node_resolver.js ${i} ${j} 2>/dev/null &
    done
    wait
    echo "Compressed layer ${i}..."
done

echo "Done!"