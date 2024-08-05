import { Field, Struct } from "o1js"
import { Fp12, Fp12Type } from "../towers/fp12.js"
import fs from "fs"

export type AuXWitnessType = {
    c: Fp12Type, 
    shift_power: string
}

export class AuXWitness extends Struct({
    c: Fp12, 
    shift_power: Field
}) {
    static loadFromPath(path: string): AuXWitness {
        const data = fs.readFileSync(path, 'utf-8');
        const obj: AuXWitnessType = JSON.parse(data) 

        return new AuXWitness({
            c: Fp12.loadFromJSON(obj.c), 
            shift_power: Field.from(obj.shift_power)
        })
    }

static loadFromJSON(obj: AuXWitnessType): AuXWitness {
        return new AuXWitness({
            c: Fp12.loadFromJSON(obj.c), 
            shift_power: Field.from(obj.shift_power)
        })
    }
}