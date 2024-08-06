#!/bin/bash

set -e

args=("$@")
ENV=${args[0]}
source ${ENV}

WORK_DIR_RELATIVE_TO_SCRIPTS="./scripts/${WORK_DIR}"

# reposition 
cd ./pairing-utils

cargo run --bin alphabeta -- $RAW_VK_PATH $VK_PATH & 
cargo_pid=$!
wait $cargo_pid
exit_status=$?

if [ $exit_status -eq 0 ]; then
  echo "alpha*beta successfully generated"
else
  echo "computatio"
  exit 1
fi

echo "Success"