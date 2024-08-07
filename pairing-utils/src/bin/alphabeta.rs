use std::env;
use std::process;

use pairing_utils::make_alpha_beta;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() != 3 {
        eprintln!(
            "Usage: cargo run --bin alphabeta -- path_to_risc_zero_vk path_to_save_alphabeta"
        );
        process::exit(1);
    }

    make_alpha_beta(&args[1], &args[2]);
}
