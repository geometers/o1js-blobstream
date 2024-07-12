use ark_bn254::{Bn254, Fq12, G1Affine, G2Affine};
use ark_ec::pairing::{MillerLoopOutput, Pairing};
use ark_ff::Field;
use ark_std::{
    rand::{rngs::StdRng, SeedableRng},
    One, Zero,
};

use crate::{
    constants::{E, RESIDUE},
    eth_root::eth_root,
    tonelli_shanks::TS,
    utils::{exp, sample_27th_root_of_unity},
};

pub struct SRS {
    g2: G2Affine,
    x: G2Affine,
}

impl SRS {
    fn new(g2: G2Affine, x: G2Affine) -> Self {
        Self { g2, x }
    }
}

// e(a, [1]) * e(b, [x]) == 1
pub fn assert_kzg_pairing(srs: &SRS, a: G1Affine, b: G1Affine) -> bool {
    let mlo: MillerLoopOutput<_> = Bn254::multi_miller_loop(&[a, b], &[srs.g2, srs.x]);
    Bn254::final_exponentiation(mlo).unwrap().0 == Fq12::one()
}

fn get_shift_factor() -> Fq12 {
    let rng = &mut StdRng::seed_from_u64(123u64);
    sample_27th_root_of_unity(rng)
}

pub fn compute_aux_witness(x: Fq12) -> (u8, Fq12) {
    // here we build the auxiliary witness
    let w27 = get_shift_factor();

    let mut eth_residue = Fq12::zero();
    let mut shift = Fq12::zero();
    let mut shift_power = 0u8;

    for i in 0..3 {
        let tmp_shift = w27.pow(&[i as u64, 0, 0, 0]);
        let tmp_eth = x * tmp_shift;

        if exp(tmp_eth, &RESIDUE) == Fq12::one() {
            println!("found at {}", i);
            shift_power = i;
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

    let c = root.inverse().unwrap();
    let res = x * shift * exp(c, &E);
    assert_eq!(res, Fq12::one());

    (shift_power, c)
}

// kzg_cm_x:  901400747077620025400301297093108336754952977087255479152802078130377135061n
// kzg_cm_y:  9871538468213629451154813373070973090724115843159250956172838734074033850822n
// neg fq x:  15616337568370127376524227028151073256580278759114373848263446467695063344960n
// neg fq y:  7832884519901757212610282645451612198280328669107375106588682868237424303092n

#[cfg(test)]
mod kzg_tests {
    use ark_bn254::{Bn254, Fq, Fq2, G1Affine, G2Affine};
    use ark_ec::pairing::Pairing;
    use ark_ff::MontFp;

    use crate::{display_fq12, kzg::{assert_kzg_pairing, compute_aux_witness}};

    use super::SRS;

    fn init() -> SRS {
        let g2_x_0: Fq = MontFp!(
            "10857046999023057135944570762232829481370756359578518086990519993285655852781"
        );
        let g2_x_1: Fq = MontFp!(
            "11559732032986387107991004021392285783925812861821192530917403151452391805634"
        );

        let g2_x = Fq2::new(g2_x_0, g2_x_1);

        let g2_y_0: Fq =
            MontFp!("8495653923123431417604973247489272438418190587263600148770280649306958101930");
        let g2_y_1: Fq =
            MontFp!("4082367875863433681332203403145435568316851327593401208105741076214120093531");

        let g2_y = Fq2::new(g2_y_0, g2_y_1);

        let g2 = G2Affine::new(g2_x, g2_y);

        let x_0: Fq = MontFp!(
            "19089565590083334368588890253123139704298730990782503769911324779715431555531"
        );
        let x_1: Fq = MontFp!(
            "15805639136721018565402881920352193254830339253282065586954346329754995870280"
        );

        let x_x = Fq2::new(x_0, x_1);

        let y_0: Fq =
            MontFp!("6779728121489434657638426458390319301070371227460768374343986326751507916979");
        let y_1: Fq =
            MontFp!("9779648407879205346559610309258181044130619080926897934572699915909528404984");

        let x_y = Fq2::new(y_0, y_1);

        let x = G2Affine::new(x_x, x_y);

        SRS::new(g2, x)
    }

    fn get_ab() -> (G1Affine, G1Affine) {
        let a_x: Fq =
            MontFp!("901400747077620025400301297093108336754952977087255479152802078130377135061");
        let a_y: Fq =
            MontFp!("9871538468213629451154813373070973090724115843159250956172838734074033850822");

        let b_x: Fq = MontFp!(
            "15616337568370127376524227028151073256580278759114373848263446467695063344960"
        );
        let b_y: Fq =
            MontFp!("7832884519901757212610282645451612198280328669107375106588682868237424303092");

        let a = G1Affine::new(a_x, a_y);
        let b = G1Affine::new(b_x, b_y);

        (a, b)
    }

    #[test]
    fn assert_sp1_pairing_plonk() {
        let srs = init();
        let (a, b) = get_ab();

        assert!(assert_kzg_pairing(&srs, a, b))
    }

    #[test]
    fn aux_witness_sp1_pairing_plonk() {
        let srs = init();
        let (a, b) = get_ab();

        assert!(assert_kzg_pairing(&srs, a, b));

        let mlo = Bn254::multi_miller_loop(&[a, b], &[srs.g2, srs.x]);
        let (shift_pow, c) = compute_aux_witness(mlo.0);   

        println!("shift pow: {}", shift_pow); 

        display_fq12(c, "c");

    }
}
