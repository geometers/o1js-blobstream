use ark_bn254::{Fq, Fq12, Fq2, Fq6};
use ark_std::Zero;
use serde::{Deserialize, Serialize};
use std::str::FromStr;

#[derive(Serialize, Deserialize, Debug)]
pub struct Field12 {
    pub g00: String,
    pub g01: String,

    pub g10: String,
    pub g11: String,

    pub g20: String,
    pub g21: String,

    pub h00: String,
    pub h01: String,

    pub h10: String,
    pub h11: String,

    pub h20: String,
    pub h21: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AuxWitness {
    c: Field12,
    shift_power: String,
}

pub fn serialize_aux_witness(c: Fq12, shift_pow: u8, path: &str) {
    let c_serialized = serialize_fq12(c);
    let aux_witness = AuxWitness {
        c: c_serialized,
        shift_power: shift_pow.to_string(),
    };

    let json = serde_json::to_string(&aux_witness).unwrap();
    std::fs::write(path, &json).unwrap();
}

pub fn serialize_fq12(f: Fq12) -> Field12 {
    let to_string = |x: Fq| -> String {
        if x == Fq::zero() {
            "0".to_string()
        } else {
            x.to_string()
        }
    };

    Field12 {
        g00: to_string(f.c0.c0.c0),
        g01: to_string(f.c0.c0.c1),

        g10: to_string(f.c0.c1.c0),
        g11: to_string(f.c0.c1.c1),

        g20: to_string(f.c0.c2.c0),
        g21: to_string(f.c0.c2.c1),

        h00: to_string(f.c1.c0.c0),
        h01: to_string(f.c1.c0.c1),

        h10: to_string(f.c1.c1.c0),
        h11: to_string(f.c1.c1.c1),

        h20: to_string(f.c1.c2.c0),
        h21: to_string(f.c1.c2.c1),
    }
}

pub fn deserialize_fq12(path: &str) -> Fq12 {
    let json = std::fs::read_to_string(path).unwrap();
    let f12: Field12 = serde_json::from_str(&json).unwrap();

    let g00: Fq = Fq::from_str(&f12.g00).unwrap();
    let g01: Fq = Fq::from_str(&f12.g01).unwrap();
    let g0 = Fq2::new(g00, g01);

    let g10: Fq = Fq::from_str(&f12.g10).unwrap();
    let g11: Fq = Fq::from_str(&f12.g11).unwrap();
    let g1 = Fq2::new(g10, g11);

    let g20: Fq = Fq::from_str(&f12.g20).unwrap();
    let g21: Fq = Fq::from_str(&f12.g21).unwrap();
    let g2 = Fq2::new(g20, g21);

    let g: Fq6 = Fq6::new(g0, g1, g2);

    let h00: Fq = Fq::from_str(&f12.h00).unwrap();
    let h01: Fq = Fq::from_str(&f12.h01).unwrap();
    let h0 = Fq2::new(h00, h01);

    let h10: Fq = Fq::from_str(&f12.h10).unwrap();
    let h11: Fq = Fq::from_str(&f12.h11).unwrap();
    let h1 = Fq2::new(h10, h11);

    let h20: Fq = Fq::from_str(&f12.h20).unwrap();
    let h21: Fq = Fq::from_str(&f12.h21).unwrap();
    let h2 = Fq2::new(h20, h21);

    let h: Fq6 = Fq6::new(h0, h1, h2);

    Fq12::new(g, h)
}
