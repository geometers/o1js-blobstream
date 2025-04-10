import { Field } from 'o1js';
import { G1Affine } from '../../ec/index.js';
import { Fp12, Fp2, Fp6, FpC } from '../../towers/index.js';

const get_shift_power = () => {
  return Field(1);
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

const make_c = () => {
  const g00 =
    FpC.from(
      17809908658599905669233067874409671242283811456930317134097852515933265216479n
    );
  const g01 =
    FpC.from(
      10470319950495296318475942057390759978984283582646520325845146396832798744381n
    );
  const g0 = new Fp2({ c0: g00, c1: g01 });

  const g10 =
    FpC.from(
      1373135849386422495692138679924894529759861193424843995200995811039858963801n
    );
  const g11 =
    FpC.from(
      4151889749263745023524983530491306316029185969007955602029676318334863673425n
    );
  const g1 = new Fp2({ c0: g10, c1: g11 });

  const g20 =
    FpC.from(
      1883139602444365611950631463211279742694452790893121626873037845779196729729n
    );
  const g21 =
    FpC.from(
      5970861074310287921791209887447017145467548262755834228090160275948965220592n
    );
  const g2 = new Fp2({ c0: g20, c1: g21 });

  const g = new Fp6({ c0: g0, c1: g1, c2: g2 });

  const h00 =
    FpC.from(
      8272275029453109257537215541598684465966378905168481611395466647313920794223n
    );
  const h01 =
    FpC.from(
      6528355645505131592004806143872955449923182807855245558498656878832420827687n
    );
  const h0 = new Fp2({ c0: h00, c1: h01 });

  const h10 =
    FpC.from(
      3573455312579151391773341072183096633393861827822237744511204344095866198236n
    );
  const h11 =
    FpC.from(
      13887087321099986238457788805257237158292466867317026248356158744036572390154n
    );
  const h1 = new Fp2({ c0: h10, c1: h11 });

  const h20 =
    FpC.from(
      8758905191894461468078152818257133000648036138216514283495174743031726740128n
    );
  const h21 =
    FpC.from(
      1605680599485677076580175190060679598446825635319440181718819634340079700385n
    );
  const h2 = new Fp2({ c0: h20, c1: h21 });

  const h = new Fp6({ c0: h0, c1: h1, c2: h2 });

  return new Fp12({ c0: g, c1: h });
};

const make_A = () => {
  const x =
    FpC.from(
      901400747077620025400301297093108336754952977087255479152802078130377135061n
    );
  const y =
    FpC.from(
      9871538468213629451154813373070973090724115843159250956172838734074033850822n
    );

  return new G1Affine({ x, y });
};

const make_negB = () => {
  const x =
    FpC.from(
      15616337568370127376524227028151073256580278759114373848263446467695063344960n
    );
  const y =
    FpC.from(
      7832884519901757212610282645451612198280328669107375106588682868237424303092n
    );

  return new G1Affine({ x, y });
};

export { get_shift_power, make_w27, make_c, make_A, make_negB };
