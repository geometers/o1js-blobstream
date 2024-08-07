use ark_bn254::{Bn254, Fq12, Fq2, Fq6, G1Affine, G2Affine};
use ark_ec::pairing::{MillerLoopOutput, Pairing};
use ark_ff::{Field, MontFp};
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
    tau: G2Affine,
}

impl SRS {
    #[allow(dead_code)]
    fn new(g2: G2Affine, tau: G2Affine) -> Self {
        Self { g2, tau }
    }
}

// e(a, [1]) * e(b, [x]) == 1
pub fn assert_kzg_pairing(srs: &SRS, a: G1Affine, b: G1Affine) {
    let mlo: MillerLoopOutput<_> = Bn254::multi_miller_loop(&[a, b], &[srs.g2, srs.tau]);
    let e = Bn254::final_exponentiation(mlo).unwrap().0;
    assert_eq!(e, Fq12::one());
}

pub fn assert_o1js_mlo(x: Fq12) {
    let e = Bn254::final_exponentiation(MillerLoopOutput(x)).unwrap().0;
    assert_eq!(e, Fq12::one());
}

fn get_shift_factor() -> Fq12 {
    let rng = &mut StdRng::seed_from_u64(123u64);
    sample_27th_root_of_unity(rng)
}

#[allow(dead_code)]
fn make_fq12() -> Fq12 {
    let g00 =
        MontFp!("7132501230381864267188409488606173516635842146803349097563305179025064669065");
    let g01 =
        MontFp!("16365919602559810549726669100967320393143548174841331179289652685753593493650");
    let g0 = Fq2::new(g00, g01);

    let g10 =
        MontFp!("3532095959317750303964796360428780559597205257991016775312050753348379506721");
    let g11 =
        MontFp!("18634158873596615205287518873401860019057794615246596548091176453228829533646");
    let g1 = Fq2::new(g10, g11);

    let g20 =
        MontFp!("5581090697418127075806485318594150677879841066635013512096731176744342492127");
    let g21 =
        MontFp!("1354975069351217677760809604335762049397632419417110654497819354750851356054");
    let g2 = Fq2::new(g20, g21);

    let g = Fq6::new(g0, g1, g2);

    let h00: ark_ff::Fp<ark_ff::MontBackend<ark_bn254::FqConfig, 4>, 4> =
        MontFp!("15665151486746981962219262278742126187753639050101108188325922459179333115049");
    let h01 =
        MontFp!("2482671709059119726943774312645729129273477576245631706425041190756079176733");
    let h0 = Fq2::new(h00, h01);

    let h10 =
        MontFp!("20324490397940400734909154464690181469291619326777848983577166161876280041452");
    let h11 =
        MontFp!("963088239415532675560461442673174771458628954456447330308929714589995123602");
    let h1 = Fq2::new(h10, h11);

    let h20 =
        MontFp!("15738819323212231225616795239021111381572087156520794499435496905779083242808");
    let h21 =
        MontFp!("18558041820785676386999019237679130182912471677672005556863825989565934244312");
    let h2 = Fq2::new(h20, h21);

    let h = Fq6::new(h0, h1, h2);

    let x = Fq12::new(g, h);
    x
}

pub fn compute_aux_witness(x: Fq12) -> (u8, Fq12) {
    // here we build the auxiliary witness
    let w27 = get_shift_factor();

    // display_fq12(w27, "w27");

    let mut eth_residue = Fq12::zero();
    let mut shift_power = 0u8;

    for i in 0..3 {
        let tmp_shift = w27.pow(&[i as u64, 0, 0, 0]);
        let tmp_eth = x * tmp_shift;

        if exp(tmp_eth, &RESIDUE) == Fq12::one() {
            // println!("found at {}", i);
            shift_power = i;
            // shift = tmp_shift;
            eth_residue = tmp_eth;

            break;
        }
    }

    // this roots can be hardcoded instead of sampling each time
    // let w27 = sample_27th_root_of_unity(rng);
    let ts = TS { w: w27 };

    let root = eth_root(eth_residue, ts);
    assert_eq!(exp(root, &E), eth_residue);

    (shift_power, root)
}

// kzg_cm_x:  901400747077620025400301297093108336754952977087255479152802078130377135061n
// kzg_cm_y:  9871538468213629451154813373070973090724115843159250956172838734074033850822n
// neg fq x:  15616337568370127376524227028151073256580278759114373848263446467695063344960n
// neg fq y:  7832884519901757212610282645451612198280328669107375106588682868237424303092n

#[cfg(test)]
mod kzg_tests {
    use ark_bn254::{Fq, Fq2, G1Affine, G2Affine};
    use ark_ff::MontFp;

    use crate::{
        display_fq12,
        kzg::{assert_kzg_pairing, assert_o1js_mlo, compute_aux_witness, make_fq12},
    };

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

        let tau_x_0: Fq = MontFp!(
            "19089565590083334368588890253123139704298730990782503769911324779715431555531"
        );
        let tau_x_1: Fq = MontFp!(
            "15805639136721018565402881920352193254830339253282065586954346329754995870280"
        );

        let tau_x = Fq2::new(tau_x_0, tau_x_1);

        let tau_y_0: Fq =
            MontFp!("6779728121489434657638426458390319301070371227460768374343986326751507916979");
        let tau_y_1: Fq =
            MontFp!("9779648407879205346559610309258181044130619080926897934572699915909528404984");

        let tau_y = Fq2::new(tau_y_0, tau_y_1);

        let tau = G2Affine::new(tau_x, tau_y);

        SRS::new(g2, tau)
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

        assert_kzg_pairing(&srs, a, b);
    }

    #[test]
    fn aux_witness_sp1_pairing_plonk() {
        let srs = init();
        let (a, b) = get_ab();

        assert_kzg_pairing(&srs, a, b);

        let mlo = make_fq12();
        assert_o1js_mlo(mlo);

        // display_fq12(mlo, "mlo");

        let (shift_pow, c) = compute_aux_witness(mlo);

        println!("shift pow: {}", shift_pow);

        display_fq12(c, "c");
    }
}
