#!/bin/bash

# exit if any of scripts exit
set -e 

SCRIPT_DIR=$(dirname -- $(realpath $0)) 
cd $SCRIPT_DIR/..

source ./scripts/.env

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

node "build/src/plonk/recursion/run.js" $PROGRAM_VK $HEX_PI