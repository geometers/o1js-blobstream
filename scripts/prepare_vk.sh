#!/bin/bash

set -e

args=("$@")
ENV=${args[0]}
source ${ENV}

WORK_DIR_RELATIVE_TO_SCRIPTS="./scripts/${WORK_DIR}"
rm -f $AUX_WITNESS_RELATIVE_PATH

# reposition 
cd ./pairing-utils

cargo run --bin alphabeta -- $RAW_VK_PATH $VK_PATH & 
cargo_pid=$!
wait $cargo_pid
exit_status=$?

if [ $exit_status -eq 0 ]; then
  echo "VK successfully prepared"
else
  echo "VK preparation failed"
  exit 1
fi

echo "Success"