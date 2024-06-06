import { G1Affine, G2Affine } from "../ec/index.js";
import { computeLineCoeffs } from "../lines/coeffs.js";
import { G2Line } from "../lines/index.js";
import { FpC, Fp2 } from "../towers/index.js";

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

const getBHardcodedLines = (): Array<G2Line> => {
    const bLines = computeLineCoeffs(getB());

    return bLines
}

export { getBHardcodedLines, getNegA, getB }