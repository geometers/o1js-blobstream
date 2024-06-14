import { DynamicProof, Field, Struct, Undefined } from "o1js"

class ZkpProofLeft extends DynamicProof<Field, Field> {
    static publicInputType = Field;
    static publicOutputType = Field;
    static maxProofsVerified = 0 as const;
}

class ZkpProofRight extends DynamicProof<Field, Field> {
    static publicInputType = Field;
    static publicOutputType = Field;
    static maxProofsVerified = 0 as const;
}

class SubtreeCarry extends Struct({
    leftIn: Field, 
    rightOut: Field, 
    subtreeVkDigest: Field
}) {};

class NodeProofLeft extends DynamicProof<Undefined, SubtreeCarry> {
    static publicInputType = Undefined;
    static publicOutputType = SubtreeCarry;
    static maxProofsVerified = 2 as const;
}

class NodeProofRight extends DynamicProof<Undefined, SubtreeCarry> {
    static publicInputType = Undefined;
    static publicOutputType = SubtreeCarry;
    static maxProofsVerified = 2 as const;
}

export { ZkpProofLeft, ZkpProofRight, NodeProofLeft, NodeProofRight, SubtreeCarry }