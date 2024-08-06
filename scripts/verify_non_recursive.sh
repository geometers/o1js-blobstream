#!/bin/bash

# exit if any of scripts exit
set -e 

# get aux pairing witness 
./scripts/get_aux_witness_plonk.sh 

# test e2e proof 
./scripts/e2e_verify_plonk.sh