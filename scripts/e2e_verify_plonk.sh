#!/bin/bash

set -e

source ./scripts/.env

NODE_SCRIPT="./build/src/plonk/e2e_verify.js"

AUX_WITNESS_RELATIVE_PATH="../$AUX_WITNESS_PATH"
node --max-old-space-size=16384 $NODE_SCRIPT $HEX_PROOF $PROGRAM_VK $HEX_PI $AUX_WITNESS_RELATIVE_PATH &

node_pid=$!
wait $node_pid
exit_status=$?

if [ $exit_status -eq 0 ]; then
  echo "Verification successfuly proven"
else
  echo "Verification failed"
  exit 1
fi

echo "Success"