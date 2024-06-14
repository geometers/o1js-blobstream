import { G1Affine, G2Affine } from "../ec/index.js";
import { computeLineCoeffs } from "../lines/coeffs.js";
import { G2Line } from "../lines/index.js";
import { FpC, Fp2, Fp6, Fp12 } from "../towers/index.js";

const getBSlice = (i: number): Array<G2Line> => {
  const bLines = getBHardcodedLines();
  switch(i) {
      case 0:
          return bLines.slice(0, 27)
      case 1:
          return bLines.slice(27, 27 + 25)
      case 2:
          return bLines.slice(27 + 25, 27 + 25 + 28)
      case 3:
          return bLines.slice(27 + 25 + 28, 27 + 25 + 28 + 9 + 2)
  }

  return []
}

const getNegA = (): G1Affine => {
    let ax =
    FpC.from(
      3010198690406615200373504922352659861758983907867017329644089018310584441462n
    );
  let ay =
    FpC.from(
      17861058253836152797273815394432013122766662423622084931972383889279925210507n
    );
  return new G1Affine({ x: ax, y: ay });
}

const getB = (): G2Affine => {
    // B = 3G2
    let qx_0 =
    FpC.from(
    2725019753478801796453339367788033689375851816420509565303521482350756874229n
    );
    let qx_1 =
    FpC.from(
    7273165102799931111715871471550377909735733521218303035754523677688038059653n
    );
    let qx = new Fp2({ c0: qx_0, c1: qx_1 });

    let qy_0 =
    FpC.from(
    2512659008974376214222774206987427162027254181373325676825515531566330959255n
    );
    let qy_1 =
    FpC.from(
    957874124722006818841961785324909313781880061366718538693995380805373202866n
    );
    let qy = new Fp2({ c0: qy_0, c1: qy_1 });

    return new G2Affine({ x: qx, y: qy });
}

const getC = (): G1Affine => {
    let cx =
    FpC.from(
      3353031288059533942658390886683067124040920775575537747144343083137631628272n
    );
  let cy =
    FpC.from(
      2566709105286906361299853307776759647279481117519912024775619069693558446822n
    );
  return new G1Affine({ x: cx, y: cy });
}

const getPI = (): G1Affine => {
  let px =
  FpC.from(
    3010198690406615200373504922352659861758983907867017329644089018310584441462n
  );
let py =
  FpC.from(
    4027184618003122424972590350825261965929648733675738730716654005365300998076n
  );
return new G1Affine({ x: px, y: py });
}

const getBHardcodedLines = (): Array<G2Line> => {
    const bLines = computeLineCoeffs(getB());

    return bLines
}

const get_c_hint = () => {
  const g00 =
    FpC.from(
      8897423645001056939056268519231815325467656837342852882451087287537275473804n
    );
  const g01 =
    FpC.from(
      18138139272559567939518097482985718014906685667120368514277181390096172923024n
    );
  const g0 = new Fp2({ c0: g00, c1: g01 });

  const g10 =
    FpC.from(
      890682786386207419990401269408877867055365238513127066872467761270125110890n
    );
  const g11 =
    FpC.from(
      4750321666726336751205035517601280287609855317476938700678826930426843064773n
    );
  const g1 = new Fp2({ c0: g10, c1: g11 });

  const g20 =
    FpC.from(
      14953000407776584730421940156750752760443598970594431156013040878221356476707n
    );
  const g21 =
    FpC.from(
      6946591669033202601688125790035809701439099296024168416231992724982469545916n
    );
  const g2 = new Fp2({ c0: g20, c1: g21 });

  const g = new Fp6({ c0: g0, c1: g1, c2: g2 });

  const h00 =
    FpC.from(
      16547839259872247812199200552840319554753470001240188786695026128107318278780n
    );
  const h01 =
    FpC.from(
      6986228249436824240579247638359343971029877154439482835588533029426127968008n
    );
  const h0 = new Fp2({ c0: h00, c1: h01 });

  const h10 =
    FpC.from(
      16374047592147651661889250799806620149277779368240268725094717916293235563222n
    );
  const h11 =
    FpC.from(
      217057155512489562238842102396389203095220456084723260332959485276833336678n
    );
  const h1 = new Fp2({ c0: h10, c1: h11 });

  const h20 =
    FpC.from(
      12992454955650978638035141566990652346837801465571809702823130195607152254938n
    );
  const h21 =
    FpC.from(
      12841826423360331447630860607932783436371936581969657268937606435533635857034n
    );
  const h2 = new Fp2({ c0: h20, c1: h21 });

  const h = new Fp6({ c0: h0, c1: h1, c2: h2 });

  return new Fp12({ c0: g, c1: h });
};

const make_w27 = () => {
  const g00 = FpC.from(0n);
  const g01 = FpC.from(0n);
  const g0 = new Fp2({ c0: g00, c1: g01 });

  const g10 = FpC.from(0n);
  const g11 = FpC.from(0n);
  const g1 = new Fp2({ c0: g10, c1: g11 });

  const g20 =
    FpC.from(
      8204864362109909869166472767738877274689483185363591877943943203703805152849n
    );
  const g21 =
    FpC.from(
      17912368812864921115467448876996876278487602260484145953989158612875588124088n
    );
  const g2 = new Fp2({ c0: g20, c1: g21 });

  const g = new Fp6({ c0: g0, c1: g1, c2: g2 });

  const h00 = FpC.from(0n);
  const h01 = FpC.from(0n);
  const h0 = new Fp2({ c0: h00, c1: h01 });

  const h10 = FpC.from(0n);
  const h11 = FpC.from(0n);
  const h1 = new Fp2({ c0: h10, c1: h11 });

  const h20 = FpC.from(0n);
  const h21 = FpC.from(0n);
  const h2 = new Fp2({ c0: h20, c1: h21 });

  const h = new Fp6({ c0: h0, c1: h1, c2: h2 });

  return new Fp12({ c0: g, c1: h });
};

const get_alpha_beta = () => {
  const g00 =
  FpC.from(
    15236026366081115775189008268827279188460509767791412223002071516712230243136n
  );
  const g01 =
    FpC.from(
      6215440416257879771835798894462272911584362693554071507387333170022915968459n
    );
  const g0 = new Fp2({ c0: g00, c1: g01 });

  const g10 =
    FpC.from(
      327103057455241435067667443479313476231822605363483269492284441153947736163n
    );
  const g11 =
    FpC.from(
      21407491999181370110335727005627502700263477893657601253120262494381745798609n
    );
  const g1 = new Fp2({ c0: g10, c1: g11 });

  const g20 =
    FpC.from(
      525552180734769320146546775716359936285417910747929441332388181393396138352n
    );
  const g21 =
    FpC.from(
      21839895985146908497205908141525701798812735906666117163465035659757713220218n
    );
  const g2 = new Fp2({ c0: g20, c1: g21 });

  const g = new Fp6({ c0: g0, c1: g1, c2: g2 });

  const h00 =
    FpC.from(
      3412291023425229121559615912222884028117294810598010176384323265610784774414n
    );
  const h01 =
    FpC.from(
      5950684622229973500866478431516135192754943733316958101749273043553811422450n
    );
  const h0 = new Fp2({ c0: h00, c1: h01 });

  const h10 =
    FpC.from(
      21615021913054200784401842387888144272574260691304757679221043470900768699496n
    );
  const h11 =
    FpC.from(
      7174236496269853539658238539172004552147343051569083162686377767746463697606n
    );
  const h1 = new Fp2({ c0: h10, c1: h11 });

  const h20 =
    FpC.from(
      18952846741600723806547666744734397713181953677964385696143456321504215601481n
    );
  const h21 =
    FpC.from(
      10053629471188292207905180123447562562427005580494322676492107379963220942539n
    );
  const h2 = new Fp2({ c0: h20, c1: h21 });

  const h = new Fp6({ c0: h0, c1: h1, c2: h2 });

  return new Fp12({ c0: g, c1: h });
}

export { getBSlice ,getBHardcodedLines, getNegA, getB, getC, getPI, get_c_hint, make_w27, get_alpha_beta }