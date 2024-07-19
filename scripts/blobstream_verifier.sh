#!/bin/bash

source ./scripts/.env
cd ./contracts

echo "Computing Blobstream..."
node build/src/prove_blobstream.js zkp${i} $HEX_PROOF $PROGRAM_VK $HEX_PI $AUX_WITNESS_RELATIVE_PATH  2>/dev/null &
echo "Computed Blobstream..."

echo "Done!"