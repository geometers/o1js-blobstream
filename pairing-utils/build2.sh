#!/bin/bash

# Trap SIGINT (Ctrl+C) to handle interrupts and clean up
trap 'echo "Script interrupted. Cleaning up..."; rm -rf pkg; exit 1' INT TERM

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$SCRIPT_DIR"  # Already in project root per your note

# Remove pkg
rm -rf pkg
mkdir pkg

# Read values from Cargo.toml
CARGO_NAME=$(sed -n '/^\[package\]/,/^\[/{ /^name = /s/^name = "\(.*\)"/\1/p; }' Cargo.toml | head -n 1 | tr -d '[:space:]')
CARGO_VERSION=$(sed -nE 's/^version = "(.*)"/\1/p' Cargo.toml | tr -d '[:space:]')
LICENSE="Apache-2.0"

# Set package name with required prefix
PKG_NAME="@nori-zk/${CARGO_NAME}"

echo "Building package: ${PKG_NAME}@${CARGO_VERSION}"
rustup target add wasm32-unknown-unknown
cargo install wasm-pack

# Timeout for wasm-pack build (20 seconds)
timeout 200 wasm-pack build --features wasm
WASM_EXIT_CODE=$?

# If wasm-pack fails and the exit code is not 124, exit with 1
if [ $WASM_EXIT_CODE -ne 0 ] && [ $WASM_EXIT_CODE -ne 124 ]; then
    echo "wasm-pack build failed with exit code $WASM_EXIT_CODE"
    exit 1
fi

# If wasm-pack build succeeds or times out (exit code 124), proceed with the rest of the script
echo "wasm-pack build completed (or timed out)."

# Proceed with the rest of the script

# Copy package.json.template to pkg/package.json
cp ./package.json.template ./pkg/package.json

PKG_JSON="./pkg/package.json"

# Update package.json using safe substitution
sed -i.bak \
  -e "s|\"version\": \".*\"|\"version\": \"${CARGO_VERSION}\"|" \
  -e "s|\"name\": \".*\"|\"name\": \"${PKG_NAME}\"|" \
  -e "/\"publishConfig\": {/,/}/d" \
  "$PKG_JSON"

# Insert publishConfig near the end, before closing brace
sed -i.bak \
    -e '/"version":/a\  "license": "'"${LICENSE}"'",' \
   -e '/"version":/a\  "publishConfig": {\n    "registry": "https://registry.npmjs.org/",\n    "access": "public"\n  },' \
   "$PKG_JSON"

# Cleanup and output
find ./pkg -name "*.bak" -delete
echo "Modified package.json:"
cat "$PKG_JSON"