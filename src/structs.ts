import { DynamicProof, Field, Struct, Undefined, FeatureFlags } from 'o1js';

class ZkpProofLeft extends DynamicProof<Field, Field> {
  static publicInputType = Field;
  static publicOutputType = Field;
  static maxProofsVerified = 0 as const;

  static featureFlags = FeatureFlags.allMaybe;
}

class ZkpProofRight extends DynamicProof<Field, Field> {
  static publicInputType = Field;
  static publicOutputType = Field;
  static maxProofsVerified = 0 as const;

  static featureFlags = FeatureFlags.allMaybe;
}

class SubtreeCarry extends Struct({
  leftIn: Field,
  rightOut: Field,
  subtreeVkDigest: Field,
}) {}

class NodeProofLeft extends DynamicProof<Undefined, SubtreeCarry> {
  static publicInputType = Undefined;
  static publicOutputType = SubtreeCarry;
  static maxProofsVerified = 2 as const;

  static featureFlags = FeatureFlags.allMaybe;
}

class NodeProofRight extends DynamicProof<Undefined, SubtreeCarry> {
  static publicInputType = Undefined;
  static publicOutputType = SubtreeCarry;
  static maxProofsVerified = 2 as const;

  static featureFlags = FeatureFlags.allMaybe;
}

const NOTHING_UP_MY_SLEEVE = Field(0);

export {
  ZkpProofLeft,
  ZkpProofRight,
  NodeProofLeft,
  NodeProofRight,
  SubtreeCarry,
  NOTHING_UP_MY_SLEEVE,
};
