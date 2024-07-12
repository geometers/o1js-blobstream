import { G1Affine } from "../../ec/index.js";
import { Fp12, Fp2, Fp6, FpC } from "../../towers/index.js";

const get_shift_power = () => {
    return 1
}

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

const make_c = () => {
    const g00 = FpC.from(11145477201299941116140608573711495786512581352718730265962194795777122247717n);
    const g01 = FpC.from(15526625881231632400695623764353794116375526320405624295235018276211966964305n);
    const g0 = new Fp2({ c0: g00, c1: g01 });
  
    const g10 = FpC.from(20476147343995300189853227682942985567651918216039650404872355279301013159587n);
    const g11 = FpC.from(5120930510835469292263709468425984594623391513205535959130290844641044211789n);
    const g1 = new Fp2({ c0: g10, c1: g11 });
  
    const g20 =
      FpC.from(
        15483182154168761987496715088010753628793857897143765909816793180112498818339n
      );
    const g21 =
      FpC.from(
        5169946892802160131701040573062643150788241006038713858051218960933130126700n
      );
    const g2 = new Fp2({ c0: g20, c1: g21 });
  
    const g = new Fp6({ c0: g0, c1: g1, c2: g2 });
  
    const h00 = FpC.from(14811779025100093693739925685439192632552234395486864638259559035826829445617n);
    const h01 = FpC.from(8948201541668683857045272064574381382907153276249933155780250537973518039348n);
    const h0 = new Fp2({ c0: h00, c1: h01 });
  
    const h10 = FpC.from(3002146130515686131400993876229612142482500665069687082401944462134710374006n);
    const h11 = FpC.from(1717989864644963036742213836826009155922753477745071557012264101573508074185n);
    const h1 = new Fp2({ c0: h10, c1: h11 });
  
    const h20 = FpC.from(18573037089274548602378955714836014092056872182950493368751606760833234358700n);
    const h21 = FpC.from(4742138352052351818283416807771568127908947551233317210927407296537518452480n);
    const h2 = new Fp2({ c0: h20, c1: h21 });
  
    const h = new Fp6({ c0: h0, c1: h1, c2: h2 });
  
    return new Fp12({ c0: g, c1: h });
}

const make_A = () => {
  const x = FpC.from(901400747077620025400301297093108336754952977087255479152802078130377135061n)
  const y = FpC.from(9871538468213629451154813373070973090724115843159250956172838734074033850822n)

  return new G1Affine({x, y})
}

const make_negB = () => {
  const x = FpC.from(15616337568370127376524227028151073256580278759114373848263446467695063344960)
  const y = FpC.from(7832884519901757212610282645451612198280328669107375106588682868237424303092)

  return new G1Affine({x, y})
}

export { get_shift_power, make_w27, make_c, make_A, make_negB }