#!/bin/bash

# exit if any of scripts exit
set -e 

SCRIPT_DIR=$(dirname -- $(realpath $0)) 
cd $SCRIPT_DIR/..

rm -f mlo.json aux_wtns.json

pushd ./contracts

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

popd

# get aux pairing witness 
./scripts/get_aux_witness.sh 

# test e2e proof 
./scripts/plonk_tree.sh