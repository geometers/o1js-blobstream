use ark_bn254::Fq12;
use ark_std::One;

use crate::{
    constants::{H, H_PRIME, R, S_PRIME, U, U_PRIME},
    tonelli_shanks::TS,
    utils::exp,
};

// e = 6x + 2 + p - p^2 + p^3
pub(crate) fn eth_root(y: Fq12, ts: TS) -> Fq12 {
    let c = exp(y, &U);
    assert_eq!(exp(c, &R), y);
    assert_eq!(exp(c, &H), Fq12::one());

    assert_ne!(c, Fq12::one());

    let a = exp(c, &U_PRIME);
    assert_eq!(exp(a, &S_PRIME), c);
    assert_eq!(exp(a, &H_PRIME), Fq12::one());

    assert_ne!(a, Fq12::one());

    ts.cube_root(a)
}

#[cfg(test)]
mod eth_root_tests {
    use crate::{constants::E, utils::sample_27th_root_of_unity};
    use ark_std::{
        rand::{rngs::StdRng, SeedableRng},
        UniformRand,
    };

    use super::*;

    #[test]
    fn test_eth_root() {
        let rng = &mut StdRng::seed_from_u64(9837981739u64);
        let w = sample_27th_root_of_unity(rng);

        let ts = TS { w };

        for _ in 0..5 {
            let x = Fq12::rand(rng);
            let y = exp(x, &E);

            let root = eth_root(y, ts);
            assert_eq!(exp(root, &E), y);
        }
    }
}
