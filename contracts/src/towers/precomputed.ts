import { FpC } from './fp.js';
import { Fp2 } from './fp2.js';

const fp2_non_residue = new Fp2({ c0: FpC.from(9n), c1: FpC.from(1n) });

// (9 + u)^(i * (p - 1) / 6) for i in 1..5
const GAMMA_1S = [
  new Fp2({
    c0: FpC.from(
      8376118865763821496583973867626364092589906065868298776909617916018768340080n
    ),
    c1: FpC.from(
      16469823323077808223889137241176536799009286646108169935659301613961712198316n
    ),
  }),
  new Fp2({
    c0: FpC.from(
      21575463638280843010398324269430826099269044274347216827212613867836435027261n
    ),
    c1: FpC.from(
      10307601595873709700152284273816112264069230130616436755625194854815875713954n
    ),
  }),
  new Fp2({
    c0: FpC.from(
      2821565182194536844548159561693502659359617185244120367078079554186484126554n
    ),
    c1: FpC.from(
      3505843767911556378687030309984248845540243509899259641013678093033130930403n
    ),
  }),
  new Fp2({
    c0: FpC.from(
      2581911344467009335267311115468803099551665605076196740867805258568234346338n
    ),
    c1: FpC.from(
      19937756971775647987995932169929341994314640652964949448313374472400716661030n
    ),
  }),
  new Fp2({
    c0: FpC.from(
      685108087231508774477564247770172212460312782337200605669322048753928464687n
    ),
    c1: FpC.from(
      8447204650696766136447902020341177575205426561248465145919723016860428151883n
    ),
  }),
];

// TODO: hardcode this
const NEG_GAMMA_13 = GAMMA_1S[2].neg();

// TODO: hardcode these
// 	γ_2i = 	γ_1i * 	γ_1i_conjugate
const GAMMA_2S = [
  GAMMA_1S[0].mul(GAMMA_1S[0].conjugate()),
  GAMMA_1S[1].mul(GAMMA_1S[1].conjugate()),
  GAMMA_1S[2].mul(GAMMA_1S[2].conjugate()),
  GAMMA_1S[3].mul(GAMMA_1S[3].conjugate()),
  GAMMA_1S[4].mul(GAMMA_1S[4].conjugate()),
];

// 	γ_3i = 	γ_1i * 	γ_2i
const GAMMA_3S = [
  GAMMA_1S[0].mul(GAMMA_2S[0]),
  GAMMA_1S[1].mul(GAMMA_2S[1]),
  GAMMA_1S[2].mul(GAMMA_2S[2]),
  GAMMA_1S[3].mul(GAMMA_2S[3]),
  GAMMA_1S[4].mul(GAMMA_2S[4]),
];

export { fp2_non_residue, GAMMA_1S, GAMMA_2S, GAMMA_3S, NEG_GAMMA_13 };
