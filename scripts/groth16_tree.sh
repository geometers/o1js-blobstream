#!/bin/bash

args=("$@")
ENV=${args[0]}
source ${ENV}

WORK_DIR_RELATIVE_TO_SCRIPTS="../scripts/${WORK_DIR}"
CACHE_DIR_RELATIVE_TO_SCRIPTS="../scripts/${CACHE_DIR}"
AUX_WITNESS_RELATIVE_PATH="$(realpath ${WORK_DIR_RELATIVE_TO_SCRIPTS})/aux_wtns.json"


mkdir -p ${WORK_DIR_RELATIVE_TO_SCRIPTS}/vks/
mkdir -p ${WORK_DIR_RELATIVE_TO_SCRIPTS}/proofs/

mkdir -p ${WORK_DIR_RELATIVE_TO_SCRIPTS}/proofs/layer0
mkdir -p ${WORK_DIR_RELATIVE_TO_SCRIPTS}/proofs/layer1
mkdir -p ${WORK_DIR_RELATIVE_TO_SCRIPTS}/proofs/layer2
mkdir -p ${WORK_DIR_RELATIVE_TO_SCRIPTS}/proofs/layer3
mkdir -p ${WORK_DIR_RELATIVE_TO_SCRIPTS}/proofs/layer4

echo "Compiling recursion vks..."
node ./build/src/compile_recursion_vks.js ${WORK_DIR_RELATIVE_TO_SCRIPTS} ${CACHE_DIR_RELATIVE_TO_SCRIPTS} &

node_pid=$!
wait $node_pid
exit_status=$?

if [ $exit_status -eq 0 ]; then
  echo "Recursion vks compiled successfully"
else
  echo "Recursion vks compilation failed"
  exit 1
fi

MAX_THREADS=${MAX_THREADS:-16}
echo "MAX THREADS: $MAX_THREADS"

MAX_ITERATIONS=$(( (16 + $MAX_THREADS - 1)/$MAX_THREADS ))
TOTAL_IN_LOOP=16
SHOULD_BREAK=false

export GROTH16_VK_PATH=${VK_PATH}

echo "Computing ZKPs 0-15..."
for i in `seq 0 $MAX_ITERATIONS`; do
  for j in `seq 0 $(( $MAX_THREADS - 1 ))`; do
    ZKP_I=$(( $i * $MAX_THREADS + $j ))
    if (( $ZKP_I >= $TOTAL_IN_LOOP )); then
      SHOULD_BREAK=true
    fi
    if $SHOULD_BREAK; then
      break
    fi
    # echo "Computing ZKP ${ZKP_I}..."
    node ./build/src/groth/recursion/prove_zkps.js zkp${ZKP_I} $PROOF_PATH $AUX_WITNESS_RELATIVE_PATH ${WORK_DIR_RELATIVE_TO_SCRIPTS} ${CACHE_DIR_RELATIVE_TO_SCRIPTS} &
  done
  wait
  if $SHOULD_BREAK; then
    break
  fi
done

echo "Computed ZKPs 0-15..."

for i in `seq 1 4`; do
    echo "Compressing layer ${i}..."
    upper_limit=$(( 2 ** (4 - i) - 1 ))
    MAX_ITERATIONS=$(( ($upper_limit + $MAX_THREADS - 1) / $MAX_THREADS ))
    SHOULD_BREAK=false
    for j in `seq 0 $MAX_ITERATIONS`; do
        # echo "${i}, ${j}"
       for k in `seq 0 $(( $MAX_THREADS - 1 ))`; do
          ZKP_J=$(( $j * $MAX_THREADS + $k ))
          if (( $ZKP_J > $upper_limit )); then
            SHOULD_BREAK=true
          fi
          if $SHOULD_BREAK; then
            break
          fi
          # echo "${i}, ${j}, ${k}, ${ZKP_J}"
          node ./build/src/node_resolver.js $TOTAL_IN_LOOP ${i} ${ZKP_J} ${WORK_DIR_RELATIVE_TO_SCRIPTS} ${CACHE_DIR_RELATIVE_TO_SCRIPTS} &
        done
        wait
        if $SHOULD_BREAK; then
          break
        fi
    done
    echo "Compressed layer ${i}..."
done

echo "Done!"