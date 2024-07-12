use crate::constants::K;
use ark_bn254::Fq12;
use ark_ff::Field;
use ark_std::{rand::RngCore, One, UniformRand};

// bits are in big endian
pub(crate) fn exp<F: Field>(x: F, bits: &[u8]) -> F {
    let mut r = x;

    let n = bits.len();
    for i in 1..n {
        r *= r;
        if bits[i] == 1 {
            r = r * x;
        }
    }

    return r;
}

// K = (p^12 - 1)/27
pub(crate) fn sample_27th_root_of_unity<R: RngCore>(rng: &mut R) -> Fq12 {
    let one = Fq12::one();

    let pow_9 = |x: Fq12| -> bool { x.pow(&[9, 0, 0, 0]) != one };

    loop {
        let x = Fq12::rand(rng);
        let w = exp(x, &K);
        if w != one && pow_9(w) {
            return w;
        }
    }
}

#[cfg(test)]
mod utils_tests {
    use ark_ff::Field;
    use ark_std::rand::{rngs::StdRng, SeedableRng};

    use super::*;

    #[test]
    fn test_exp() {
        let rng = &mut StdRng::seed_from_u64(0u64);

        let x = Fq12::rand(rng);

        let p: u64 = 8904238409183123512;
        let p_bits: [u8; 63] = [
            1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0,
            0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1,
            1, 1, 0, 0, 0,
        ];
        let x_pow = x.pow(&[p]);
        let x_pow_hand = exp(x, &p_bits);
        assert_eq!(x_pow, x_pow_hand);
    }
}
