import { FpC, FrC } from "../towers/index.js"

type PlonkSp1Proof = {
    l_com_x: FpC
    l_com_y: FpC
    r_com_x: FpC
    r_com_y: FpC
    o_com_x: FpC
    o_com_y: FpC

    h0_x: FpC
    h0_y: FpC
    h1_x: FpC
    h1_y: FpC
    h2_x: FpC
    h2_y: FpC

    l_at_zeta: FrC
    r_at_zeta: FrC
    o_at_zeta: FrC

    s1_at_zeta: FrC
    s2_at_zeta: FrC

    grand_product_x: FpC
    grand_product_y: FpC 

    grand_product_at_zeta: FrC 

    batch_at_zeta_x: FrC
    batch_at_zeta_y: FrC

    opening_at_zeta_omega_x: FpC
    opening_at_zeta_omega_y: FpC

    qcp_at_zeta: FrC
    bsb_commitments: FrC // still not sure about this
}

const zeroProof = () => {
    const x: PlonkSp1Proof = {
        l_com_x: FpC.from(0n),
        l_com_y: FpC.from(0n),
        r_com_x: FpC.from(0n),
        r_com_y: FpC.from(0n),
        o_com_x: FpC.from(0n),
        o_com_y: FpC.from(0n),
        h0_x: FpC.from(0n),
        h0_y: FpC.from(0n),
        h1_x: FpC.from(0n),
        h1_y: FpC.from(0n),
        h2_x: FpC.from(0n),
        h2_y: FpC.from(0n),
        l_at_zeta: FrC.from(0n),
        r_at_zeta: FrC.from(0n),
        o_at_zeta: FrC.from(0n),
        s1_at_zeta: FrC.from(0n),
        s2_at_zeta: FrC.from(0n),
        grand_product_x: FpC.from(0n),
        grand_product_y: FpC.from(0n),
        grand_product_at_zeta: FrC.from(0n),
        batch_at_zeta_x: FrC.from(0n),
        batch_at_zeta_y: FrC.from(0n),
        opening_at_zeta_omega_x: FpC.from(0n),
        opening_at_zeta_omega_y: FpC.from(0n),
        qcp_at_zeta: FrC.from(0n),
        bsb_commitments: FrC.from(0n)
    }
}

const randomProof = () => {
    const x: PlonkSp1Proof = {
        l_com_x: FpC.random(),
        l_com_y: FpC.random(),
        r_com_x: FpC.random(),
        r_com_y: FpC.random(),
        o_com_x: FpC.random(),
        o_com_y: FpC.random(),
        h0_x: FpC.random(),
        h0_y: FpC.random(),
        h1_x: FpC.random(),
        h1_y: FpC.random(),
        h2_x: FpC.random(),
        h2_y: FpC.random(),
        l_at_zeta: FrC.random(),
        r_at_zeta: FrC.random(),
        o_at_zeta: FrC.random(),
        s1_at_zeta: FrC.random(),
        s2_at_zeta: FrC.random(),
        grand_product_x: FpC.random(),
        grand_product_y: FpC.random(),
        grand_product_at_zeta: FrC.random(),
        batch_at_zeta_x: FrC.random(),
        batch_at_zeta_y: FrC.random(),
        opening_at_zeta_omega_x: FpC.random(),
        opening_at_zeta_omega_y: FpC.random(),
        qcp_at_zeta: FrC.random(),
        bsb_commitments: FrC.random()
    }

    return x
}

export { PlonkSp1Proof, randomProof, zeroProof }