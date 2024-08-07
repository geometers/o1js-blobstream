use pairing_utils::compute_and_serialize_aux_witness;
use std::env;
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() != 3 {
        eprintln!("Usage: cargo run --bin aux_witness -- path_to_mlo_o1js_output path_where_to_save_aux_witness");
        process::exit(1);
    }

    compute_and_serialize_aux_witness(&args[1], &args[2]);
}
