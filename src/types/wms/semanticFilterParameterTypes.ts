import type { SemanticConstraintParam } from "./semanticConstraintTypes";

/**
 * Converts a SEMANTIC_FILTER expression into a GeoServer CQL_FILTER string.
 */
export type SemanticFilterSolver = (filterString: string) => Promise<string>;

export type CalculateSemanticConstraint = (
  layerName: string,
  filterType: string,
  params: unknown
) => Promise<string>;

export type SemanticFilterSolverOptions = {
  cacheMaxEntries?: number;
  cacheTtlMs?: number;
  now?: () => number;
  calculateSemanticConstraint?: CalculateSemanticConstraint;
};

export type CachedSemanticConstraint = {
  expiresAt: number;
  value: Promise<string>;
};

export type { SemanticConstraintParam };
