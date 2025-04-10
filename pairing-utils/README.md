# Pairing Utils

# Run normally (aka a rust binary)

cargo run --bin alphabeta
cargo run --bin aux_witness

# Build for wasm

`./build.sh`

# Release npm package

After building for wasm `cd pkg && npm publish`

# Troubleshooting

1. Conflicting binaryen
   - `sudo apt remove binaryen`
