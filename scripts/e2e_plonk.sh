#!/bin/bash
set -e

ENV_FILE=$(realpath "$1")
source "${ENV_FILE}"
SCRIPT_DIR=$(dirname -- "$(realpath "$0")")
cd "$SCRIPT_DIR/.."

# Validate Node.js version
node_version=$(node -v | cut -d'.' -f1 | tr -d 'v')
if [ "$node_version" -lt 22 ]; then
  echo "Node version is too low - $node_version. Please upgrade to NodeJS 22 or higher."
  exit 1
fi

# Build contracts if needed
if [ ! -d "./build" ]; then
  [ ! -d "node_modules" ] && npm ci
  npm run build
fi

# Set paths
VERSION_DIR=$(dirname "$ENV_FILE")
E2E_PLONK_DIR="$VERSION_DIR/e2e_plonk"
AUX_WITNESS_PATH="$E2E_PLONK_DIR/aux_wtns.json"

# Generate aux witness
start_time=$(date +%s)
./scripts/get_aux_witness_plonk.sh "$ENV_FILE"
end_time=$(date +%s)
echo "Aux witness generated in $((end_time - start_time))s"

# Validate aux witness
if [ ! -f "$AUX_WITNESS_PATH" ]; then
  echo "ERROR: Missing aux witness at $AUX_WITNESS_PATH"
  exit 1
fi

# Run proof generation
./scripts/plonk_tree.sh \
  "$ENV_FILE" \
  "$AUX_WITNESS_PATH" \
  "$E2E_PLONK_DIR" \
  "./scripts/${CACHE_DIR}"