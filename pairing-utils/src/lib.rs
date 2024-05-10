use ark_bn254::Fq12;

pub mod constants;
pub mod eth_root;
pub mod utils;
pub mod tonelli_shanks;

pub fn display_fq12(x: Fq12, label: &str) {
    println!("{}.g00: {}", label, x.c0.c0.c0);
    println!("{}.g01: {}", label, x.c0.c0.c1);
    println!("{}.g10: {}", label, x.c0.c1.c0);
    println!("{}.g11: {}", label, x.c0.c1.c1);
    println!("{}.g20: {}", label, x.c0.c2.c0);
    println!("{}.g21: {}", label, x.c0.c2.c1);

    println!("{}.h00: {}", label, x.c1.c0.c0);
    println!("{}.h01: {}", label, x.c1.c0.c1);
    println!("{}.h10: {}", label, x.c1.c1.c0);
    println!("{}.h11: {}", label, x.c1.c1.c1);
    println!("{}.h20: {}", label, x.c1.c2.c0);
    println!("{}.h21: {}", label, x.c1.c2.c1);
}

#[cfg(test)]
mod tests {
    use ark_bn254::{Bn254, Fq12, Fq2, Fq6, Fr, G1Affine, G2Affine};
    use ark_ec::{pairing::{MillerLoopOutput, Pairing}, AffineRepr};
    use ark_std::rand::{rngs::StdRng, SeedableRng};
    use std::ops::Mul;
    use ark_ff::{Field, MontFp, Zero, One};

    use crate::{constants::{E, RESIDUE}, display_fq12, eth_root::eth_root, tonelli_shanks::TS, utils::{exp, sample_27th_root_of_unity}};

    fn get_alpha_beta() -> Fq12 {
        let g1 = G1Affine::generator();
        let g2 = G2Affine::generator();
        
        let alpha = g1.mul(Fr::from(2u64));
        let beta = g2.mul(Fr::from(3u64));

        Bn254::multi_miller_loop(&[alpha], &[beta]).0
    }

    fn get_shift_factor() -> Fq12 {
        let rng = &mut StdRng::seed_from_u64(123u64);
        sample_27th_root_of_unity(rng)
    }

    #[test]
    fn display() {
        let w27 = get_shift_factor();
        display_fq12(w27, "w27");
    }

    #[test]
    fn mock_groth16() {
        // 0 = (-a, b) * alpha_beta * (pi, gamma) * (c, delta)

        // alpha_beta = 6

        // gamma = 9 
        // pi = 4

        // delta = 10 
        // c = -3 

        // a = 4
        // b = 3

        let g1 = G1Affine::generator();
        let g2 = G2Affine::generator();

        let alpha_beta = get_alpha_beta();

        let gamma = g2.mul(Fr::from(9u64));
        let pi = g1.mul(Fr::from(4u64));

        let delta = g2.mul(Fr::from(10u64));
        let c = g1.mul(-Fr::from(3u64));

        let a = g1.mul(Fr::from(4u64));
        let b = g2.mul(Fr::from(3u64));

        let x = Bn254::multi_miller_loop(&[-a, pi, c], &[b, gamma, delta]);
        let x = x.0.mul(alpha_beta);
        let x = MillerLoopOutput(x);
        let e = Bn254::final_exponentiation(x).unwrap();
        assert_eq!(e.0, Fq12::one());
    }

    #[test]
    fn output_from_o1js() {

        // f.g00:  17808378310914494803826030629014669552789301567630738137438947038982301798249n
        // f.g01:  18224720034675313042587862542545682637466951012991990948678157277636935734822n
        // f.g10:  16752173496591140244882921302297084240828046883221481486068704348659555575765n
        // f.g11:  21838782079470542605885494506935176658465257168903739407027608887094810715340n
        // f.g20:  6647755231552550780409655855026908538068032576728337827006186204399317036729n
        // f.g21:  10988982044641268222472543595856057571453300469590971153695152347934536668398n
        // f.h00:  11077893498163791318989661260786073859450215845524079036992295450245421650388n
        // f.h01:  8684286590460568917985996458331664550956166778762178442512474069043150405994n
        // f.h10:  13224681622225280194787234255798462142826386922632880990161838692862694924819n
        // f.h11:  1154534286581271292094913012522346169068110759790961245540647560288336368218n
        // f.h20:  874182515937588562880579790073346860466167073115629405159962126631740016980n
        // f.h21:  8023313088558458500716358711741090088290753117111893298405090264471882688888n

        let g00 = MontFp!(
            "17808378310914494803826030629014669552789301567630738137438947038982301798249"
        );
        let g01 = MontFp!(
            "18224720034675313042587862542545682637466951012991990948678157277636935734822"
        );
        let g0 = Fq2::new(g00, g01);

        let g10 =
            MontFp!("16752173496591140244882921302297084240828046883221481486068704348659555575765");
        let g11 = MontFp!(
            "21838782079470542605885494506935176658465257168903739407027608887094810715340"
        );
        let g1 = Fq2::new(g10, g11);

        let g20 =
            MontFp!("6647755231552550780409655855026908538068032576728337827006186204399317036729");
        let g21 = MontFp!(
            "10988982044641268222472543595856057571453300469590971153695152347934536668398"
        );
        let g2 = Fq2::new(g20, g21);

        let g = Fq6::new(g0, g1, g2);

        let h00: ark_ff::Fp<ark_ff::MontBackend<ark_bn254::FqConfig, 4>, 4> = MontFp!(
            "11077893498163791318989661260786073859450215845524079036992295450245421650388"
        );
        let h01 =
            MontFp!("8684286590460568917985996458331664550956166778762178442512474069043150405994");
        let h0 = Fq2::new(h00, h01);

        let h10 =
            MontFp!("13224681622225280194787234255798462142826386922632880990161838692862694924819");
        let h11 = MontFp!(
            "1154534286581271292094913012522346169068110759790961245540647560288336368218"
        );
        let h1 = Fq2::new(h10, h11);

        let h20 = MontFp!(
            "874182515937588562880579790073346860466167073115629405159962126631740016980"
        );
        let h21 = MontFp!(
            "8023313088558458500716358711741090088290753117111893298405090264471882688888"
        );
        let h2 = Fq2::new(h20, h21);

        let h = Fq6::new(h0, h1, h2);

        let x = Fq12::new(g, h);
        let x = MillerLoopOutput(x);
        let e = Bn254::final_exponentiation(x).unwrap();
        assert_eq!(e.0, Fq12::one());

        // here we build the auxiliary witness 
        let w27 = get_shift_factor();

        let mut eth_residue = Fq12::zero();
        let mut shift = Fq12::zero();

        for i in 0..3 {
            let tmp_shift = w27.pow(&[i as u64, 0, 0, 0]);
            let tmp_eth = x.0 * tmp_shift;
    
            if exp(tmp_eth, &RESIDUE) == Fq12::one() {
                println!("found at {}", i);
                shift = tmp_shift;
                // shift = tmp_shift;
                eth_residue = tmp_eth;
    
                break;
            }
        }
    
        // this roots can be hardcoded instead of sampling each time
        let rng = &mut StdRng::seed_from_u64(1232313u64);
        let w27 = sample_27th_root_of_unity(rng);
        let ts = TS { w: w27 };
    
        let root = eth_root(eth_residue, ts);
        assert_eq!(exp(root, &E), eth_residue);

        // mm * w^shift = c^e 
        // mm * w^shift * c^(-e) = 1 
        let c = root.inverse().unwrap();
        let res = x.0 * shift * exp(c, &E); 
        assert_eq!(res, Fq12::one());
    }
}
