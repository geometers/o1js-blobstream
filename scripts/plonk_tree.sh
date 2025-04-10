#!/bin/bash
set -e

ENV_FILE=$(realpath "$1")
AUX_WITNESS_PATH=$(realpath "$2")
WORK_DIR=$(realpath "$3")
CACHE_DIR=$(realpath "$4")

source "${ENV_FILE}"

# Optimized Parameters
export RAYON_NUM_THREADS=2  # Per Node.js process
export CROSSBEAM_THREADS=1
# Node.js memory (8GB per process)
export NODE_MEMORY_LIMIT=8192
MAX_THREADS=${MAX_THREADS:-32}

# NUMA Directory Setup
mkdir -p "${WORK_DIR}"/{proofs,vks}/{layer0,layer1,layer2,layer3,layer4,layer5}

for node in {0..3}; do
  node_dir="${WORK_DIR}/node${node}"
  mkdir -p "$node_dir"
  ln -sfn "${WORK_DIR}/proofs" "${node_dir}/proofs" 2>/dev/null
  ln -sfn "${WORK_DIR}/vks" "${node_dir}/vks" 2>/dev/null
done

# Compile recursion vks
start_time=$(date +%s)
echo "Compiling recursion vks..."
node --max-old-space-size=$NODE_MEMORY_LIMIT \
  ./build/src/compile_recursion_vks.js "${WORK_DIR}" "${CACHE_DIR}"
end_time=$(date +%s)
echo "Compiled recursion vks in $((end_time - start_time))s"

# ZKP Computation
start_time=$(date +%s)
echo "Computing ZKPs 0-23 with ${MAX_THREADS} threads..."

compute_zkp() {
  local ZKP_I=$1
  local NUMA_NODES=$(numactl --hardware | grep -oP '(?<=available: )\d+')
  local NUMA_NODE=$((ZKP_I % NUMA_NODES))
  
  # Pass arguments as positional parameters using ::::
  numactl --cpunodebind=$NUMA_NODE --membind=$NUMA_NODE \
    node --max-old-space-size=$NODE_MEMORY_LIMIT \
    ./build/src/plonk/recursion/prove_zkps.js \
    "zkp${ZKP_I}" \
    "$HEX_PROOF" \
    "$PROGRAM_VK" \
    "$HEX_PI" \
    "$AUX_WITNESS_PATH" \
    "$WORK_DIR" \
    "$CACHE_DIR"
}

# Export variables explicitly for parallel
export HEX_PROOF PROGRAM_VK HEX_PI AUX_WITNESS_PATH WORK_DIR CACHE_DIR
export -f compute_zkp

# Use env_parallel to preserve environment
seq 0 23 | parallel -j $MAX_THREADS --halt soon,fail=1 compute_zkp

end_time=$(date +%s)
echo "Computed ZKPs in $((end_time - start_time))s"

# Layer Compression
start_time=$(date +%s)

compress_layer() {
  local layer=$1
  local ZKP_J=$2
  local NUMA_NODES=$(numactl --hardware | grep -oP '(?<=available: )\d+')
  local NUMA_NODE=$((ZKP_J % NUMA_NODES))
  
  numactl --cpunodebind=$NUMA_NODE --membind=$NUMA_NODE \
    node --max-old-space-size=$NODE_MEMORY_LIMIT \
    ./build/src/node_resolver.js \
    24 \
    "${layer}" \
    "${ZKP_J}" \
    "${WORK_DIR}" \
    "${CACHE_DIR}"
}

export -f compress_layer

for i in {1..5}; do
  upper_limit=$((2 ** (5 - i) - 1))
  echo "Compressing layer $i (0-$upper_limit)..."
  seq 0 $upper_limit | parallel -j $MAX_THREADS compress_layer $i
done

end_time=$(date +%s)
echo "Compressed layers in $((end_time - start_time))s"

echo "Done!"