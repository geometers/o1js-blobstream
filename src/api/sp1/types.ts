export interface Sp1Proof {
  Plonk: {
    encoded_proof: string;
    plonk_vkey_hash: number[];
    public_inputs: string[];
    raw_proof: string;
  };
}

export interface Sp1PublicValues {
  buffer: {
    data: number[];
  };
}

export interface Sp1 {
  proof: Sp1Proof;
  public_values: Sp1PublicValues;
  sp1_version: string;
}

export interface Risc0Proof {
  negA: {
    x: string;
    y: string;
  };
  B: {
    x_c0: string;
    x_c1: string;
    y_c0: string;
    y_c1: string;
  };
  C: {
    x: string;
    y: string;
  };
  pi1: string;
  pi2: string;
  pi3: string;
  pi4: string;
  pi5: string;
}

export interface Risc0RawVk {
  delta: {
    x_c0: string;
    x_c1: string;
    y_c0: string;
    y_c1: string;
  };
  gamma: {
    x_c0: string;
    x_c1: string;
    y_c0: string;
    y_c1: string;
  };
  alpha: {
    x: string;
    y: string;
  };
  beta: {
    x_c0: string;
    x_c1: string;
    y_c0: string;
    y_c1: string;
  };
  ic0: {
    x: string;
    y: string;
  };
  ic1: {
    x: string;
    y: string;
  };
  ic2: {
    x: string;
    y: string;
  };
  ic3: {
    x: string;
    y: string;
  };
  ic4: {
    x: string;
    y: string;
  };
  ic5: {
    x: string;
    y: string;
  };
  w27: {
    g00: string;
    g01: string;
    g10: string;
    g11: string;
    g20: string;
    g21: string;
    h00: string;
    h01: string;
    h10: string;
    h11: string;
    h20: string;
    h21: string;
  };
}

export interface Risc0Vk {
  delta: {
    x_c0: string;
    x_c1: string;
    y_c0: string;
    y_c1: string;
  };
  gamma: {
    x_c0: string;
    x_c1: string;
    y_c0: string;
    y_c1: string;
  };
  alpha: {
    x: string;
    y: string;
  };
  beta: {
    x_c0: string;
    x_c1: string;
    y_c0: string;
    y_c1: string;
  };
  ic0: {
    x: string;
    y: string;
  };
  ic1: {
    x: string;
    y: string;
  };
  ic2: {
    x: string;
    y: string;
  };
  ic3: {
    x: string;
    y: string;
  };
  ic4: {
    x: string;
    y: string;
  };
  ic5: {
    x: string;
    y: string;
  };
  w27: {
    g00: string;
    g01: string;
    g10: string;
    g11: string;
    g20: string;
    g21: string;
    h00: string;
    h01: string;
    h10: string;
    h11: string;
    h20: string;
    h21: string;
  };

  alpha_beta: {
    g00: string;
    g01: string;
    g10: string;
    g11: string;
    g20: string;
    g21: string;
    h00: string;
    h01: string;
    h10: string;
    h11: string;
    h20: string;
    h21: string;
  };
}