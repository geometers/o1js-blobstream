#!/bin/bash

args=("$@")
ENV=${args[0]}
source ${ENV}

cd ./contracts

WORK_DIR_RELATIVE_TO_SCRIPTS="../scripts/${WORK_DIR}"
CACHE_DIR_RELATIVE_TO_SCRIPTS="../scripts/${CACHE_DIR}"
AUX_WITNESS_RELATIVE_PATH="$(realpath ${WORK_DIR_RELATIVE_TO_SCRIPTS})/aux_wtns.json"


mkdir -p ${WORK_DIR_RELATIVE_TO_SCRIPTS}/plonk/recursion/vks/
mkdir -p ${WORK_DIR_RELATIVE_TO_SCRIPTS}/plonk/recursion/proofs/

mkdir -p ${WORK_DIR_RELATIVE_TO_SCRIPTS}/plonk/recursion/proofs/layer0
mkdir -p ${WORK_DIR_RELATIVE_TO_SCRIPTS}/plonk/recursion/proofs/layer1
mkdir -p ${WORK_DIR_RELATIVE_TO_SCRIPTS}/plonk/recursion/proofs/layer2
mkdir -p ${WORK_DIR_RELATIVE_TO_SCRIPTS}/plonk/recursion/proofs/layer3
mkdir -p ${WORK_DIR_RELATIVE_TO_SCRIPTS}/plonk/recursion/proofs/layer4
mkdir -p ${WORK_DIR_RELATIVE_TO_SCRIPTS}/plonk/recursion/proofs/layer5

echo "Compiling recursion vks..."
node ./build/src/plonk/recursion/compile_recursion_vks.js ${WORK_DIR_RELATIVE_TO_SCRIPTS} ${CACHE_DIR_RELATIVE_TO_SCRIPTS} 2>/dev/null &

node_pid=$!
wait $node_pid
exit_status=$?

if [ $exit_status -eq 0 ]; then
  echo "Recursion vks compiled successfully"
else
  echo "Recursion vks compilation failed"
  exit 1
fi

echo "Computing ZKPs 0-23..."
for i in `seq 0 23`; do
    node ./build/src/plonk/recursion/prove_zkps.js zkp${i} $HEX_PROOF $PROGRAM_VK $HEX_PI $AUX_WITNESS_RELATIVE_PATH ${WORK_DIR_RELATIVE_TO_SCRIPTS} ${CACHE_DIR_RELATIVE_TO_SCRIPTS} 2>/dev/null &
done

wait

echo "Computed ZKPs 0-23..."

for i in `seq 1 5`; do
    echo "Compressing layer ${i}..."
    upper_limit=$(( 2 ** (5 - i) - 1 ))
    for j in $(seq 0 $upper_limit); do
        # echo "${i}, ${j}"
        node ./build/src/plonk/recursion/node_resolver.js ${i} ${j} ${WORK_DIR_RELATIVE_TO_SCRIPTS} ${CACHE_DIR_RELATIVE_TO_SCRIPTS} 2>/dev/null &
    done
    wait
    echo "Compressed layer ${i}..."
done

echo "Done!"