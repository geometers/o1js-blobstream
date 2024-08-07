#[cfg(test)]
mod tests {
    use crate::display_fq12;
    use ark_bn254::{Bn254, Fq, Fq2, G1Affine, G2Affine};
    use ark_ec::pairing::Pairing;
    use ark_ff::MontFp;

    #[test]
    fn make_alpha_beta() {
        let alpha_x: Fq = MontFp!(
            "20491192805390485299153009773594534940189261866228447918068658471970481763042"
        );
        let alpha_y: Fq =
            MontFp!("9383485363053290200918347156157836566562967994039712273449902621266178545958");

        let beta_x_c0: Fq =
            MontFp!("6375614351688725206403948262868962793625744043794305715222011528459656738731");
        let beta_x_c1: Fq =
            MontFp!("4252822878758300859123897981450591353533073413197771768651442665752259397132");

        let beta_y_c0: Fq = MontFp!(
            "10505242626370262277552901082094356697409835680220590971873171140371331206856"
        );
        let beta_y_c1: Fq = MontFp!(
            "21847035105528745403288232691147584728191162732299865338377159692350059136679"
        );

        let beta_x = Fq2::new(beta_x_c0, beta_x_c1);
        let beta_y = Fq2::new(beta_y_c0, beta_y_c1);

        let alpha = G1Affine::new(alpha_x, alpha_y);
        let beta = G2Affine::new(beta_x, beta_y);

        let alpha_beta = Bn254::multi_miller_loop(&[alpha], &[beta]).0;
        display_fq12(alpha_beta, "alpha_beta");
    }
}
