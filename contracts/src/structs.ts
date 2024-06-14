import { DynamicProof, Field, Poseidon, Struct } from "o1js";

const NOTHING_UP_MY_SLEEVE = Field(0); // TODO: let this be a hash of some public string

class CIn extends Struct({
    digest: Field
}) {}

class COut extends Struct({
    leftPiInDigest: Field, 
    rightPiOutDigest:Field,
    runningVksDigest: Field
}) {}

class CZkpIn extends Struct({
    digest: Field
}) {}

class CZkpOut extends Struct({
    digest: Field
}) {}

class GenericProofLeft extends DynamicProof<CZkpIn, CZkpOut> {
    static publicInputType = CZkpIn; 
    static publicOutputType = CZkpOut;
    static maxProofsVerified = 2 as const;
}

class GenericProofRight extends DynamicProof<CZkpIn, CZkpOut> {
    static publicInputType = CZkpIn; 
    static publicOutputType = CZkpOut;
    static maxProofsVerified = 2 as const;
}

class GenericZkpLeft extends DynamicProof<CZkpIn, CZkpOut>  {
    static publicInputType = CZkpIn; 
    static publicOutputType = CZkpOut;
    static maxProofsVerified = 0 as const;
}

class GenericZkpRight extends DynamicProof<CZkpIn, CZkpOut>  {
    static publicInputType = CZkpIn; 
    static publicOutputType = CZkpOut;
    static maxProofsVerified = 0 as const;
}

const toDefaultInput = (): CIn => {
    return new CIn({
        digest: NOTHING_UP_MY_SLEEVE
    })
}

const toInput = (x: Field): CIn => {
    return new CIn({
        digest: Poseidon.hash([x])
    })
}

const inpFromHashed = (digest: Field): CIn => {
    return new CIn({
        digest
    })
}

const toDefaultOutput = (x: Field): CZkpOut => {
    return new CZkpOut({
        digest: x
    });
}

export { 
    NOTHING_UP_MY_SLEEVE, 
    CIn, 
    COut, 
    CZkpIn, 
    CZkpOut, 
    GenericProofLeft, 
    GenericProofRight, 
    toDefaultOutput, 
    toInput, 
    toDefaultInput, 
    inpFromHashed, 
    GenericZkpLeft, 
    GenericZkpRight
 }