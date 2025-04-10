#!/bin/bash

set -e

args=("$@")
ENV=${args[0]}
source ${ENV}

WORK_DIR_RELATIVE_TO_SCRIPTS="./scripts/${WORK_DIR}"
MLO_RELATIVE_PATH="$(realpath ${WORK_DIR_RELATIVE_TO_SCRIPTS})/mlo.json"
rm -f $MLO_RELATIVE_PATH
AUX_WITNESS_RELATIVE_PATH="$(realpath ${WORK_DIR_RELATIVE_TO_SCRIPTS})/aux_wtns.json"
rm -f $AUX_WITNESS_RELATIVE_PATH

NODE_SCRIPT="./build/src/plonk/serialize_mlo.js"

# obtain mlo result

node $NODE_SCRIPT $MLO_RELATIVE_PATH $HEX_PROOF $PROGRAM_VK $HEX_PI &

node_pid=$!
wait $node_pid
exit_status=$?

if [ $exit_status -eq 0 ]; then
  echo "Miller loop output successfully written"
else
  echo "Miller loop output computation failed"
  exit 1
fi

# reposition 
cd ./pairing-utils

cargo run --bin aux_witness -- $MLO_RELATIVE_PATH $AUX_WITNESS_RELATIVE_PATH & 
cargo_pid=$!
wait $cargo_pid
exit_status=$?

if [ $exit_status -eq 0 ]; then
  echo "Auxilary witness successfully computed"
else
  echo "Auxilary witness computation failed"
  exit 1
fi

echo "Success"