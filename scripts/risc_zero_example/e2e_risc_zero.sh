set -e 

SCRIPT_DIR=$(dirname -- $(realpath $0)) 
cd $SCRIPT_DIR/../..

RUN_DIR_RELATIVE_TO_SCRIPTS=$(basename $SCRIPT_DIR)/run
RUN_DIR=$(pwd)/scripts/$RUN_DIR_RELATIVE_TO_SCRIPTS

mkdir -p $RUN_DIR

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

node "./build/src/groth/proof_to_env.js" $SCRIPT_DIR/risc_zero_proof.json $SCRIPT_DIR/risc_zero_vk.json $RUN_DIR $RUN_DIR_RELATIVE_TO_SCRIPTS risc_zero &

node_pid=$!
wait $node_pid
exit_status=$?

if [ $exit_status -eq 0 ]; then
  echo "Risc Zero env successfully written"
else
  echo "Risc Zero env failed"
  exit 1
fi

popd

pushd ./scripts

# ./e2e_groth16.sh $RUN_DIR/env.risc_zero

source $RUN_DIR/env.risc_zero
export RISC_ZERO_EXAMPLE_WORK_DIR=$WORK_DIR
export RISC_ZERO_EXAMPLE_IMAGE_ID=1 
node "../contracts/build/src/risc_zero/prove_zkps.js" blobstream ${WORK_DIR}/proofs/layer4/p0.json ${RUN_DIR}/riscZeroProof.json ${CACHE_DIR} 2>/dev/null &

node_pid=$!
wait $node_pid
exit_status=$?

if [ $exit_status -eq 0 ]; then
  echo "Risc Zero example proof successfully written"
else
  echo "Risc Zero example proof failed"
  exit 1
fi

popd