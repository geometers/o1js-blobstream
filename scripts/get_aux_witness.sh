#!/bin/bash

set -e

source ./scripts/.env
cd ./contracts
NODE_SCRIPT="./build/src/plonk/serialize_mlo.js"

# obtain mlo result
MLO_RELATIVE_PATH="../$MLO_PATH"
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
cd ../pairing-utils
AUX_WITNESS_RELATIVE_PATH="../$AUX_WITNESS_PATH"

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