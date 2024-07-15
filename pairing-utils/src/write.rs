use std::{fs::File, io::{BufReader, BufWriter}};
use ark_ff::MontFp;
use ark_std::One;

use ark_bn254::{Fq, Fq12};
use ark_serialize::{CanonicalDeserialize, CanonicalSerialize, Read, Write};

#[test]
fn write_fp12() {
    // Create or open the file
    // let mut file = File::create("output").unwrap();
    // let mut buffer = Vec::<u8>::new();

    // let f = Fq12::one();
    // f.serialize_compressed(&mut buffer).unwrap();

    // file.write_all(buffer.as_slice()).unwrap();

    let mut file = File::open("output").expect("File could not be opened.");
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).unwrap();

    // // println!("{:?}", buffer)

    // // // // let reader = BufReader::new(*buffer);

    let f_read = Fq12::deserialize_compressed(buffer.as_slice()).unwrap();
    println!("{}", f_read);

    // Ok(())
}

use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
struct Person {
    name: String,
    age: u8,
    email: String,
}

#[test]
fn write_person() {
    let person = Person {
        name: String::from("Alice"),
        age: 30,
        email: String::from("alice@example.com"),
    };

    // Serialize the struct to a JSON string
    let json = serde_json::to_string(&person).unwrap();
    println!("Serialized JSON: {}", json);

    // Write the JSON string to a file
    std::fs::write("person.json", &json).unwrap();
}

#[derive(Serialize, Deserialize, Debug)]
struct FieldElement {
    x: String,
}

#[test]
fn fq_to_json() {
    let x: Fq = MontFp!(
        "15616337568370127376524227028151073256580278759114373848263446467695063344960"
    );

    let f = FieldElement {
        x: x.to_string()
    };

    let json = serde_json::to_string(&f).unwrap();
    println!("Serialized JSON: {}", json);

    // Write the JSON string to a file
    std::fs::write("person.json", &json).unwrap();
}