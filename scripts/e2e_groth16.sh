#!/bin/bash

# exit if any of scripts exit
set -e 

args=("$@")
ENV=$(realpath ${args[0]})
source ${ENV}
SCRIPT_DIR=$(dirname -- $(realpath $0)) 
cd $SCRIPT_DIR/..

node_version=$(node -v)
node_version=${node_version:1}
node_version=${node_version%\.*}
node_version=${node_version%\.*}
node_version=$(($node_version))
if [ $node_version -lt 22 ]
then
  echo "Node version is too low - $node_version. Please upgrade to NodeJS 22 or higher."
  exit 1
fi

npm install
npm run build

WORK_DIR_RELATIVE_TO_SCRIPTS="./scripts/${WORK_DIR}"
mkdir -p ${WORK_DIR_RELATIVE_TO_SCRIPTS}

CACHE_DIR_RELATIVE_TO_SCRIPTS="./scripts/${CACHE_DIR}"
mkdir -p ${CACHE_DIR_RELATIVE_TO_SCRIPTS}

# get alphabeta
./scripts/get_alphabeta_groth16.sh ${ENV}

# get aux pairing witness 
./scripts/get_aux_witness_groth16.sh ${ENV}

# test e2e proof 
./scripts/groth16_tree.sh ${ENV}