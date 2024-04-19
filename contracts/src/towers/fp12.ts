import { Struct } from "o1js";
import { ATE_LOOP_COUNT, atc } from "./consts.js";
import { FpC } from "./fp.js";
import { Fp2 } from "./fp2.js";
import { Fp6 } from "./fp6.js";
import { GAMMA_1S, GAMMA_2S, GAMMA_3S } from "./precomputed.js";

// Fp6^2[w]/(w^2 - v)
class Fp12 extends Struct({c0: Fp6, c1: Fp6}) {
    // c0: Fp6 
    // c1: Fp6

    // constructor(c0: Fp6, c1: Fp6) {
    //     this.c0 = c0
    //     this.c1 = c1
    // }

    static zero(): Fp12 {
        return new Fp12({c0: Fp6.zero(), c1: Fp6.zero()})
    }

    static one(): Fp12 {
        return new Fp12({c0: Fp6.one(), c1: Fp6.zero()})
    }

    neg(): Fp12 {
        return new Fp12({c0: this.c0.neg(), c1: this.c1.neg()})
    }

    conjugate(): Fp12 {
        return new Fp12({c0: this.c0, c1: this.c1.neg()})
    }

    inverse() {
        let t0 = this.c0.mul(this.c0);
        let t1 = this.c1.mul(this.c1);

        t0 = t0.sub(t1.mul_by_v());
        t1 = t0.inverse();

        const c0 = this.c0.mul(t1);
        const c1 = this.c1.neg().mul(t1);

        return new Fp12({c0, c1})
    }

    mul(rhs: Fp12): Fp12 {
        const t0 = this.c0.mul(rhs.c0);
        const t1 = this.c1.mul(rhs.c1);

        const c0 = t1.mul_by_v().add(t0);

        const a0_a1 = this.c0.add(this.c1);
        const b0_b1 = rhs.c0.add(rhs.c1);

        const c1 = a0_a1.mul(b0_b1).sub(t0).sub(t1);

        return new Fp12({c0, c1});
    }

    square(): Fp12 {
        let c0 = this.c0.sub(this.c1);
        let c3 = this.c0.sub(this.c1.mul_by_v());
        let c2 = this.c0.mul(this.c1);

        c0 = (c0.mul(c3)).add(c2);
        const c1 = c2.mul_by_fp(FpC.from(2n));

        c2 = c2.mul_by_v();
        c0 = c0.add(c2);

        return new Fp12({c0, c1});
    }

    frobenius_pow_p(): Fp12 {
        const t1 = this.c0.c0.conjugate();
        let t2 = this.c1.c0.conjugate();
        let t3 = this.c0.c1.conjugate();
        let t4 = this.c1.c1.conjugate();
        let t5 = this.c0.c2.conjugate();
        let t6 = this.c1.c2.conjugate();

        t2 = t2.mul(GAMMA_1S[0]);
        t3 = t3.mul(GAMMA_1S[1]);
        t4 = t4.mul(GAMMA_1S[2]);
        t5 = t5.mul(GAMMA_1S[3]);
        t6 = t6.mul(GAMMA_1S[4]);

        const c0 = new Fp6({c0: t1, c1: t3, c2: t5});
        const c1 = new Fp6({c0: t2, c1: t4, c2: t6});

        return new Fp12({c0, c1})
    }

    frobenius_pow_p_squared(): Fp12 {
        const t1 = this.c0.c0;
        const t2 = this.c1.c0.mul(GAMMA_2S[0]);
        const t3 = this.c0.c1.mul(GAMMA_2S[1]);
        const t4 = this.c1.c1.mul(GAMMA_2S[2]);
        const t5 = this.c0.c2.mul(GAMMA_2S[3]);
        const t6 = this.c1.c2.mul(GAMMA_2S[4]);

        const c0 = new Fp6({c0: t1, c1: t3, c2: t5});
        const c1 = new Fp6({c0: t2, c1: t4, c2: t6});

        return new Fp12({c0, c1})
    }

    frobenius_pow_p_cubed(): Fp12 {
        const t1 = this.c0.c0.conjugate();
        let t2 = this.c1.c0.conjugate();
        let t3 = this.c0.c1.conjugate();
        let t4 = this.c1.c1.conjugate();
        let t5 = this.c0.c2.conjugate();
        let t6 = this.c1.c2.conjugate();

        t2 = t2.mul(GAMMA_3S[0]);
        t3 = t3.mul(GAMMA_3S[1]);
        t4 = t4.mul(GAMMA_3S[2]);
        t5 = t5.mul(GAMMA_3S[3]);
        t6 = t6.mul(GAMMA_3S[4]);

        const c0 = new Fp6({c0: t1, c1: t3, c2: t5});
        const c1 = new Fp6({c0: t2, c1: t4, c2: t6});

        return new Fp12({c0, c1})
    }

    // when this is not in cyclotomic group (i.e. x^(p^6 + 1) not 1 ) 
    pow(expBeWnaf: Array<number>): Fp12 {
        let inv = this.inverse();
        let c = new Fp12({c0: this.c0, c1: this.c1});

        const n = expBeWnaf.length;
        for (let i = 1; i < n; i++) {
            c = c.square()

            if (expBeWnaf[i] == 1) {
                c = c.mul(this);
            } else if (expBeWnaf[i] == -1) {
                c = c.mul(inv);
            }
        }

        return c
    }

    // e = 6x + 2 + p - p^2 + p^3
    exp_e(): Fp12 {
        const c0 = this.pow(ATE_LOOP_COUNT);
        const c1 = this.frobenius_pow_p();
        const c2 = this.frobenius_pow_p_squared().inverse(); 
        const c3 = this.frobenius_pow_p_cubed();

        return c0.mul(c1).mul(c2).mul(c3)
    }

    display(name: string) {
        console.log(`${name}.g00: `, this.c0.c0.c0.toBigInt());
        console.log(`${name}.g01: `, this.c0.c0.c1.toBigInt());
        console.log(`${name}.g10: `, this.c0.c1.c0.toBigInt());
        console.log(`${name}.g11: `, this.c0.c1.c1.toBigInt());
        console.log(`${name}.g20: `, this.c0.c2.c0.toBigInt());
        console.log(`${name}.g21: `, this.c0.c2.c1.toBigInt());
        
        console.log(`${name}.h00: `, this.c1.c0.c0.toBigInt());
        console.log(`${name}.h01: `, this.c1.c0.c1.toBigInt());
        console.log(`${name}.h10: `, this.c1.c1.c0.toBigInt());
        console.log(`${name}.h11: `, this.c1.c1.c1.toBigInt());
        console.log(`${name}.h20: `, this.c1.c2.c0.toBigInt());
        console.log(`${name}.h21: `, this.c1.c2.c1.toBigInt());
    }
}

// function main() {
//     // TODO: add all of this in unit tests
//     const g00 = FpC.from(1n);
//     const g01 = FpC.from(2n);
//     const g0 = new Fp2({c0: g00, c1: g01});

//     const g10 = FpC.from(3n);
//     const g11 = FpC.from(4n);
//     const g1 = new Fp2({c0: g10, c1: g11});

//     const g20 = FpC.from(5n);
//     const g21 = FpC.from(6n);
//     const g2 = new Fp2({c0: g20, c1: g21});

//     const g = new Fp6({c0: g0, c1: g1, c2: g2});

//     const h00 = FpC.from(7n);
//     const h01 = FpC.from(8n);
//     const h0 = new Fp2({c0: h00, c1: h01});

//     const h10 = FpC.from(9n);
//     const h11 = FpC.from(10n);
//     const h1 = new Fp2({c0: h10, c1: h11});

//     const h20 = FpC.from(11n);
//     const h21 = FpC.from(12n);
//     const h2 = new Fp2({c0: h20, c1: h21});

//     const h = new Fp6({c0: h0, c1: h1, c2: h2});

//     const x = new Fp12({c0: g, c1: h});

//     let res = x.frobenius_pow_p(); 
//     // from arkworks after doing x.frobenius_map(1)
//     compare_results(res, arkworks_res_frob1);

//     res = x.frobenius_pow_p_squared(); 
//     res = x.frobenius_pow_p_cubed(); 
//     res = x.square();
//     res = x.mul(x);
//     res = x.pow([1, 1]); // x^3
//     res = x.pow([1, 0, 0, 0, -1])
//     res = x.conjugate()
//     res = x.inverse();
//     res = x.exp_e();
// }

// function compare_results(res: Fp12, arkworks_res: any) {
//     console.log(res.c0.c0.c0.toBigInt().toString() == arkworks_res["c0.c0.c0"]);
//     console.log(res.c0.c0.c1.toBigInt().toString() == arkworks_res["c0.c0.c1"]);
//     console.log(res.c0.c1.c0.toBigInt().toString() == arkworks_res["c0.c1.c0"]);
//     console.log(res.c0.c1.c1.toBigInt().toString() == arkworks_res["c0.c1.c1"]);
//     console.log(res.c0.c2.c0.toBigInt().toString() == arkworks_res["c0.c2.c0"]);
//     console.log(res.c0.c2.c1.toBigInt().toString() == arkworks_res["c0.c2.c1"]);

//     console.log(res.c1.c0.c0.toBigInt().toString() == arkworks_res["c1.c0.c0"]);
//     console.log(res.c1.c0.c1.toBigInt().toString() == arkworks_res["c1.c0.c1"]);
//     console.log(res.c1.c1.c0.toBigInt().toString() == arkworks_res["c1.c1.c0"]);
//     console.log(res.c1.c1.c1.toBigInt().toString() == arkworks_res["c1.c1.c1"]);
//     console.log(res.c1.c2.c0.toBigInt().toString() == arkworks_res["c1.c2.c0"]);
//     console.log(res.c1.c2.c1.toBigInt().toString() == arkworks_res["c1.c2.c1"]);
// }

export { Fp12 }

// const arkworks_res_frob1 = {
//     "c0.c0.c0": "1",
//     "c0.c0.c1": "21888242871839275222246405745257275088696311157297823662689037894645226208581",
//     "c0.c1.c0": "18403825810980266942818486922527826999298808716316102853382469444191903103267",
//     "c0.c1.c1": "10285678850015582725602772979496857661220446766353913946092242777037565658567",
//     "c0.c2.c0": "1206641321953283270833714125376416931468304999383738418085045759374114446372",
//     "c0.c2.c1": "18532588176558358261636576921062066108174276162474095808292927126658498601373",
//     "c1.c0.c0": "15285475670255014489229669040738642330633146371560861622129435166663266298424",
//     "c1.c0.c1": "4503326591755535150059358256710294674953135681215152008960092180291386250406",
//     "c1.c1.c0": "16676038575187844943310927664569462212246367451594032388461421128719214025850",
//     "c1.c1.c1": "3336942089258638962701677172923213016266019736652133098342307295433337108087",
//     "c1.c2.c0": "21349673280550689267642407988536924884743314711499493762643067160037446099821",
//     "c1.c2.c1": "19033225495368496540456934014739061511647005313793238349017974916481889468720",  
// }


// from arkworks after doing x.frobenius_map(2)
// g00: 1
// g01: 2
// g10: 21888242871839275215634524289812909324440499928820537599766200118004609252682
// g11: 21888242871839275213430563804664787403021896185994775578791920859124403600715
// g20: 11019802425740609607093018714128810104871396294401028259830
// g21: 13223762910888731528511622456954572125845675553281233911796
// h00: 21888242871839275206818682349220421638766084957517489515869083082483786644821
// h01: 21888242871839275204614721864072299717347481214691727494894803823603580992855
// h10: 21888242871839275222246405745257275088696311157297823662689037894645226208574
// h11: 21888242871839275222246405745257275088696311157297823662689037894645226208573
// h20: 24243565336629341135604641171083382230717071847682262171637
// h21: 26447525821777463057023244913909144251691351106562467823604


// from arkworks after doing x.frobenius_map(3)
// g00: 1
// g01: 21888242871839275222246405745257275088696311157297823662689037894645226208581
// g10: 20262384629628542082427890552954301897511496391875032226741190309233034071487
// g11: 13510025832061595681356728743011387518023223489846624259161293630842380854317
// g20: 14434583937479300111918859015251024854522091544655430884964012455493419373909
// g21: 5321140945310493723743963773120102838006463210284936995529434904309985383721
// h00: 18648014972069781566423530861342131455948544127580818462251747692019883941292
// h01: 17988758112276602884585249529751842530376932579651112909508560308059520435570
// h10: 5212204296651430278935478080687812876449943705703791274227616765926012182733
// h11: 18551300782580636259544728572334062072430291420645690564346730599211889100496
// h20: 3529604462488008749536563444909457751874771746438506108328226340450443918919
// h21: 6425272933872002439026289856785984876914438381677011457273661535037214968687

// g00:  1n
// g01:  21888242871839275222246405745257275088696311157297823662689037894645226208581
// g10:  20262384629628542082427890552954301897511496391875032226741190309233034071487
// g11:  13510025832061595681356728743011387518023223489846624259161293630842380854317
// g20:  14434583937479300111918859015251024854522091544655430884964012455493419373909
// g21:  5321140945310493723743963773120102838006463210284936995529434904309985383721
// h00:  18648014972069781566423530861342131455948544127580818462251747692019883941292
// h01:  17988758112276602884585249529751842530376932579651112909508560308059520435570
// h10:  5212204296651430278935478080687812876449943705703791274227616765926012182733
// h11:  18551300782580636259544728572334062072430291420645690564346730599211889100496
// h20:  3529604462488008749536563444909457751874771746438506108328226340450443918919
// h21:  6425272933872002439026289856785984876914438381677011457273661535037214968687

// square: 
// g00:  21888242871839275222246405745257275088696311157297823662689037894645226207305
// g01:  5329
// g10:  21888242871839275222246405745257275088696311157297823662689037894645226207585
// g11:  4543
// g20:  21888242871839275222246405745257275088696311157297823662689037894645226208057
// g21:  2693
// h00:  21888242871839275222246405745257275088696311157297823662689037894645226207657
// h01:  3296
// h10:  21888242871839275222246405745257275088696311157297823662689037894645226207981
// h11:  2394
// h20:  21888242871839275222246405745257275088696311157297823662689037894645226208505
// h21:  364

// arkworks x * x
// g00: 21888242871839275222246405745257275088696311157297823662689037894645226207305
// g01: 5329
// g10: 21888242871839275222246405745257275088696311157297823662689037894645226207585
// g11: 4543
// g20: 21888242871839275222246405745257275088696311157297823662689037894645226208057
// g21: 2693
// h00: 21888242871839275222246405745257275088696311157297823662689037894645226207657
// h01: 3296
// h10: 21888242871839275222246405745257275088696311157297823662689037894645226207981
// h11: 2394
// h20: 21888242871839275222246405745257275088696311157297823662689037894645226208505
// h21: 364