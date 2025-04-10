use crate::{kzg::{assert_o1js_mlo, compute_aux_witness}, serialize::{serialize_fq12, Field12}};
use ark_bn254::{Bn254, Fq, Fq12, Fq2, Fq6, G1Affine, G2Affine};
use ark_ec::pairing::Pairing;
use serde::{Deserialize, Serialize};
use serde_wasm_bindgen::{from_value, to_value};
use std::str::FromStr;
use wasm_bindgen::prelude::*;

/// Witness

#[derive(Serialize, Deserialize, Debug)]
pub struct Field12JSValue {
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
pub struct AuxWitnessJSValue {
    c: Field12,
    shift_power: String,
}

// Deserialize Fq12 from a JavaScript object
pub fn deserialize_fq12_jsvalue(f12: Field12JSValue) -> Fq12 {
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

#[wasm_bindgen]
pub fn compute_and_serialize_aux_witness_js(mlo_js_input: JsValue) -> JsValue {
    // Convert the JavaScript object to the Field12 struct
    let f12_jsvalue: Field12JSValue = from_value(mlo_js_input).unwrap();
    let mlo = deserialize_fq12_jsvalue(f12_jsvalue);

    // Should probably do a softer version of assert.
    assert_o1js_mlo(mlo);

    // Compute
    let (shift_pow, c) = compute_aux_witness(mlo);

    // Return 
    let c_serialized = serialize_fq12(c);
    let aux_witness = AuxWitnessJSValue {
        c: c_serialized,
        shift_power: shift_pow.to_string(),
    };

    to_value(&aux_witness).unwrap()
}

/// alphabeta


#[derive(Serialize, Deserialize, Debug)]
pub struct Alpha {
    pub x: String,
    pub y: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Beta {
    pub x_c0: Option<String>,
    pub x_c1: Option<String>,
    pub y_c0: Option<String>,
    pub y_c1: Option<String>,
}


#[derive(Serialize, Deserialize, Debug)]
pub struct AlphaBetaJSInputValue {
    pub alpha: Alpha,
    pub beta: Beta,
}

#[wasm_bindgen]
pub fn make_alpha_beta_js(alpha_beta_js_input: JsValue) -> JsValue {
    // Convert the JavaScript object to the AlphaBetaJSValue struct
    let alpha_beta_data: AlphaBetaJSInputValue = from_value(alpha_beta_js_input).unwrap();

    // Parse alpha and beta points
    let alpha_x: Fq = Fq::from_str(&alpha_beta_data.alpha.x).unwrap();
    let alpha_y: Fq = Fq::from_str(&alpha_beta_data.alpha.y).unwrap();

    let beta_x_c0: Fq = Fq::from_str(&alpha_beta_data.beta.x_c0.unwrap()).unwrap();
    let beta_x_c1: Fq = Fq::from_str(&alpha_beta_data.beta.x_c1.unwrap()).unwrap();

    let beta_y_c0: Fq = Fq::from_str(&alpha_beta_data.beta.y_c0.unwrap()).unwrap();
    let beta_y_c1: Fq = Fq::from_str(&alpha_beta_data.beta.y_c1.unwrap()).unwrap();

    let beta_x = Fq2::new(beta_x_c0, beta_x_c1);
    let beta_y = Fq2::new(beta_y_c0, beta_y_c1);

    let alpha = G1Affine::new(alpha_x, alpha_y);
    let beta = G2Affine::new(beta_x, beta_y);

    // Perform the multi-miller loop
    let alpha_beta = Bn254::multi_miller_loop(&[alpha], &[beta]).0;

    // Serialize the Fq12 result
    let serialized_alpha_beta = serialize_fq12(alpha_beta);

    // Update the input data with the serialized result

    let result_data = Field12JSValue {
        g00: serialized_alpha_beta.g00,
        g01: serialized_alpha_beta.g01,
        g10: serialized_alpha_beta.g10,
        g11: serialized_alpha_beta.g11,
        g20: serialized_alpha_beta.g20,
        g21: serialized_alpha_beta.g21,
        h00: serialized_alpha_beta.h00,
        h01: serialized_alpha_beta.h01,
        h10: serialized_alpha_beta.h10,
        h11: serialized_alpha_beta.h11,
        h20: serialized_alpha_beta.h20,
        h21: serialized_alpha_beta.h21,
    };

    // Serialize to JsValue for passing to JS
    to_value(&result_data).unwrap()
}
