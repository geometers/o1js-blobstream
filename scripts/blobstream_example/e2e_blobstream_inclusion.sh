set -e 

export MAX_THREADS=${MAX_THREADS:-4}

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


node "./build/src/blobstream/sp1_to_env.js" $SCRIPT_DIR/blobstreamSP1Proof.json $RUN_DIR $RUN_DIR_RELATIVE_TO_SCRIPTS blobstream &

node_pid=$!
wait $node_pid
exit_status=$?

if [ $exit_status -eq 0 ]; then
  echo "Blobstream env successfully written"
else
  echo "Blobstream env failed"
  exit 1
fi

node "./build/src/blobstream/sp1_to_env.js" $SCRIPT_DIR/blobInclusionSP1Proof.json $RUN_DIR $RUN_DIR_RELATIVE_TO_SCRIPTS blobInclusion &

node_pid=$!
wait $node_pid
exit_status=$?

if [ $exit_status -eq 0 ]; then
  echo "Blob inclusion env successfully written"
else
  echo "Blob inclusion env failed"
  exit 1
fi

popd

pushd ./scripts

./e2e_plonk.sh $RUN_DIR/env.blobstream
./e2e_plonk.sh $RUN_DIR/env.blobInclusion

source $RUN_DIR/env.blobstream
export BLOBSTREAM_ENABLED=true
export BLOBSTREAM_WORK_DIR=$WORK_DIR
export BLOBSTREAM_PROGRAM_VK=$PROGRAM_VK

source $RUN_DIR/env.blobInclusion
export BLOB_INCLUSION_ENABLED=true
export BLOB_INCLUSION_WORK_DIR=$WORK_DIR
export BLOB_INCLUSION_PROGRAM_VK=$PROGRAM_VK

source $RUN_DIR/env.blobstream
node "../contracts/build/src/blobstream/prove_zkps.js" blobstream ${WORK_DIR}/proofs/layer5/p0.json $SCRIPT_DIR/blobstreamSP1Proof.json ${RUN_DIR}/blobstreamProof.json ${CACHE_DIR} &

node_pid=$!
wait $node_pid
exit_status=$?

if [ $exit_status -eq 0 ]; then
  echo "Blobstream proof successfully written"
else
  echo "Blobstream proof failed"
  exit 1
fi

source $RUN_DIR/env.blobInclusion
node "../contracts/build/src/blobstream/prove_zkps.js" blob_inclusion ${WORK_DIR}/proofs/layer5/p0.json $SCRIPT_DIR/blobInclusionSP1Proof.json ${RUN_DIR}/blobInclusionProof.json ${CACHE_DIR} &

node_pid=$!
wait $node_pid
exit_status=$?

if [ $exit_status -eq 0 ]; then
  echo "Blob inclusion proof successfully written"
else
  echo "Blob inclusion proof failed"
  exit 1
fi

node "../contracts/build/src/blobstream/prove_zkps.js" batcher ${RUN_DIR}/blobInclusionProof.json $SCRIPT_DIR/blobInclusionSP1Proof.json ${RUN_DIR}/batcherProof.json ${CACHE_DIR} &

node_pid=$!
wait $node_pid
exit_status=$?

if [ $exit_status -eq 0 ]; then
  echo "Batcher proof successfully written"
else
  echo "Batcher proof failed"
  exit 1
fi

node "../contracts/build/src/blobstream/prove_zkps.js" rollup_contract ${RUN_DIR}/blobstreamProof.json ${RUN_DIR}/batcherProof.json ${CACHE_DIR} &

node_pid=$!
wait $node_pid
exit_status=$?

if [ $exit_status -eq 0 ]; then
  echo "Rollup successfully ran"
else
  echo "Rollup failed"
  exit 1
fi

popd
