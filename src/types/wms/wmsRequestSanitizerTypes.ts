import type { SemanticFilterSolver } from "./semanticFilterParameterTypes";

export interface WmsParameter {
  rawName: string;
  rawValue: string;
  rawSegment: string;
}

export interface WmsProxyRequestOptions {
  /**
   * Optional semantic solver used by tests and parser integrations.
   */
  solveSemanticFilter?: SemanticFilterSolver;
}
