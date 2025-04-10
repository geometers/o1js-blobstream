import {
  compute_and_serialize_aux_witness_js as wasmComputeAuxWitness,
  make_alpha_beta_js as wasmMakeAlphaBeta,
} from '@nori-zk/proof-conversion-pairing-utils';
import { Fp12Type } from '../towers/fp12';
import { Risc0RawVk, Risc0Vk } from '../api/sp1/types';

export interface AuxWitnessWasm {
  c: Fp12Type;
  shift_power: string;
}

export interface Alpha {
  x: string;
  y: string;
}

export interface Beta {
  x_c0: string;
  x_c1: string;
  y_c0: string;
  y_c1: string;
}

export interface AlphaBetaWasm {
  alpha: Alpha;
  beta: Beta;
}

export function computeAuxWitness(f12: Fp12Type): AuxWitnessWasm {
  return wasmComputeAuxWitness(f12) as AuxWitnessWasm;
}

export function makeAlphaBeta(raw_vk: Risc0RawVk, input: AlphaBetaWasm) {
  // this is not complete
  // cargo run --bin alphabeta -- $RAW_VK_PATH $VK_PATH &
  // make_alpha_beta this function takes json_path for the $RAW_VK_PATH env var and uses this as "v"... it then
  // extends v by overriding the alpha_beta Field12 fields

  const serialized_alpha_beta = wasmMakeAlphaBeta(input) as Fp12Type;

  const v: Risc0Vk = {
    delta: {
      x_c0: raw_vk.delta.x_c0,
      x_c1: raw_vk.delta.x_c1,
      y_c0: raw_vk.delta.y_c0,
      y_c1: raw_vk.delta.y_c1,
    },
    gamma: {
      x_c0: raw_vk.gamma.x_c0,
      x_c1: raw_vk.gamma.x_c1,
      y_c0: raw_vk.gamma.y_c0,
      y_c1: raw_vk.gamma.y_c1,
    },
    alpha: {
      x: raw_vk.alpha.x,
      y: raw_vk.alpha.y,
    },
    beta: {
      x_c0: raw_vk.beta.x_c0,
      x_c1: raw_vk.beta.x_c1,
      y_c0: raw_vk.beta.y_c0,
      y_c1: raw_vk.beta.y_c1,
    },
    ic0: {
      x: raw_vk.ic0.x,
      y: raw_vk.ic0.y,
    },
    ic1: {
      x: raw_vk.ic1.x,
      y: raw_vk.ic1.y,
    },
    ic2: {
      x: raw_vk.ic2.x,
      y: raw_vk.ic2.y,
    },
    ic3: {
      x: raw_vk.ic3.x,
      y: raw_vk.ic3.y,
    },
    ic4: {
      x: raw_vk.ic4.x,
      y: raw_vk.ic4.y,
    },
    ic5: {
      x: raw_vk.ic5.x,
      y: raw_vk.ic5.y,
    },
    w27: {
      g00: raw_vk.w27.g00,
      g01: raw_vk.w27.g01,
      g10: raw_vk.w27.g10,
      g11: raw_vk.w27.g11,
      g20: raw_vk.w27.g20,
      g21: raw_vk.w27.g21,
      h00: raw_vk.w27.h00,
      h01: raw_vk.w27.h01,
      h10: raw_vk.w27.h10,
      h11: raw_vk.w27.h11,
      h20: raw_vk.w27.h20,
      h21: raw_vk.w27.h21,
    },
    alpha_beta: {
      g00: '',
      g01: '',
      g10: '',
      g11: '',
      g20: '',
      g21: '',
      h00: '',
      h01: '',
      h10: '',
      h11: '',
      h20: '',
      h21: '',
    },
  };

  v['alpha_beta']['g00'] = serialized_alpha_beta.g00;
  v['alpha_beta']['g01'] = serialized_alpha_beta.g01;
  v['alpha_beta']['g10'] = serialized_alpha_beta.g10;
  v['alpha_beta']['g11'] = serialized_alpha_beta.g11;
  v['alpha_beta']['g20'] = serialized_alpha_beta.g20;
  v['alpha_beta']['g21'] = serialized_alpha_beta.g21;
  v['alpha_beta']['h00'] = serialized_alpha_beta.h00;
  v['alpha_beta']['h01'] = serialized_alpha_beta.h01;
  v['alpha_beta']['h10'] = serialized_alpha_beta.h10;
  v['alpha_beta']['h11'] = serialized_alpha_beta.h11;
  v['alpha_beta']['h20'] = serialized_alpha_beta.h20;
  v['alpha_beta']['h21'] = serialized_alpha_beta.h21;

  return v;
}