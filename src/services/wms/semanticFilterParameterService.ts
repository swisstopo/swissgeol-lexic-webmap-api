/**
 * @fileoverview Owns SEMANTIC_FILTER expression generation and parsing
 * boundaries.
 */

import type { ValidatedFilter } from "../../types/filters/filterRequestValidationTypes";
import { calculateSemanticConstraint } from "./semanticConstraintService";
import { solve_semantic_filter } from "./solveSemanticFilter";
import type {
  CachedSemanticConstraint,
  SemanticConstraintParam,
  SemanticFilterSolver,
  SemanticFilterSolverOptions,
} from "../../types/wms/semanticFilterParameterTypes";

const SEMANTIC_CONSTRAINT_FUNCTION = "calculate_semantic_constraint";
const SEMANTIC_CONSTRAINT_AND_OPERATOR = "AND";
const SEMANTIC_CONSTRAINT_OR_OPERATOR = "OR";
const SEMANTIC_CONSTRAINT_CACHE_MAX_ENTRIES = 1000;
const SEMANTIC_CONSTRAINT_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Represents invalid SEMANTIC_FILTER argument syntax before constraint
 * resolution reaches GraphDB-backed services.
 */
export class SemanticFilterInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SemanticFilterInputError";
  }
}

const TERM_FILTER_TYPES = new Set<string>([
  "f-tectonic-term",
  "f-lithostrat-term",
  "f-lithology-term",
]);

const serializeSemanticArgument = (value: unknown): string =>
  JSON.stringify(String(value));

/*
 * SEMANTIC_FILTER is a transport expression, not the final GeoServer filter.
 * These helpers define the ordered argument contract for
 * calculate_semantic_constraint(layer, filterId, ...params). The inverse adapter
 * below reconstructs typed values before delegating to semantic resolution.
 */
const getSemanticConstraintParams = (
  filter: ValidatedFilter
): SemanticConstraintParam[] => {
  if (filter.filterId === "f-byAttribute") {
    return [filter.parameters.attribute, filter.parameters.value];
  }

  if (filter.filterId === "f-chronostrat-term") {
    if (filter.parameters.type === "Younger") {
      return [filter.parameters.type, filter.parameters.to];
    }

    if (filter.parameters.type === "Older") {
      return [filter.parameters.type, filter.parameters.from];
    }

    return [filter.parameters.type, filter.parameters.from, filter.parameters.to];
  }

  return [
    filter.parameters.term,
    filter.parameters.includeNarrowers ?? true,
  ];
};

/**
 * Serializes one validated filter into a calculate_semantic_constraint call.
 *
 * The positional argument contract produced here is consumed by
 * `calculateSemanticConstraint` after `/wms` parses the `SEMANTIC_FILTER`
 * string:
 * - term filters: layer id, filter id, term URI, includeNarrowers;
 * - chronostratigraphy: layer id, filter id, mode, boundary term(s);
 * - by-attribute: layer id, filter id, attribute, value.
 *
 * `generateWmsRequest` uses this instead of embedding CQL directly so `/wms`
 * can resolve vocabularies, use cache, and generate backend CQL at request time.
 */
export const buildSemanticConstraintExpression = (
  layerId: string,
  filter: ValidatedFilter
): string => {
  const args = [
    layerId,
    filter.filterId,
    ...getSemanticConstraintParams(filter),
  ].map(serializeSemanticArgument);

  return `${SEMANTIC_CONSTRAINT_FUNCTION}( ${args.join(" , ")} )`;
};

/**
 * Serializes validated filters into the ordered SEMANTIC_FILTER expression used
 * by generateWmsRequest responses.
 *
 * Empty filter arrays produce `undefined`, which means no `SEMANTIC_FILTER`
 * parameter is emitted. Repeated term filters of the same type are grouped with
 * `OR`; all groups and independent filters are joined with `AND`.
 *
 * The inverse path is `createSemanticFilterSolver`, which parses this string
 * during `/wms` handling and replaces each semantic call with generated CQL.
 */
export const buildSemanticFilterExpression = (
  layerId: string,
  filters: ValidatedFilter[]
): string | undefined => {
  if (filters.length === 0) {
    return undefined;
  }

  const termGroups = new Map<string, string[]>();
  const operands: string[][] = [];

  for (const filter of filters) {
    const expression = buildSemanticConstraintExpression(layerId, filter);
    const isGroupedTerm = TERM_FILTER_TYPES.has(filter.filterId);
    const existingGroup = isGroupedTerm
      ? termGroups.get(filter.filterId)
      : undefined;
    if (existingGroup) {
      existingGroup.push(expression);
      continue;
    }

    const group = [expression];
    operands.push(group);
    if (isGroupedTerm) {
      termGroups.set(filter.filterId, group);
    }
  }

  return operands
    .map((operand) =>
      operand.length === 1
        ? operand[0]
        : `(${operand.join(` ${SEMANTIC_CONSTRAINT_OR_OPERATOR} `)})`
    )
    .join(` ${SEMANTIC_CONSTRAINT_AND_OPERATOR} `);
};

const parseIncludeNarrowers = (value: string): boolean => {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new SemanticFilterInputError(
    "Semantic term constraint includeNarrowers must be true or false."
  );
};

const getSemanticConstraintAdapterParams = (
  filterType: string,
  orderedParams: string[]
): unknown[] => {
  if (TERM_FILTER_TYPES.has(filterType)) {
    const [term, includeNarrowers] = orderedParams;
    return [term, parseIncludeNarrowers(includeNarrowers ?? "true")];
  }

  return orderedParams;
};

const getSemanticConstraintCacheKey = (
  layerName: string,
  filterType: string,
  params: unknown[]
): string => JSON.stringify([layerName, filterType, params]);

const setCachedConstraint = (
  cache: Map<string, CachedSemanticConstraint>,
  key: string,
  value: CachedSemanticConstraint,
  maxEntries: number
): void => {
  while (cache.size >= maxEntries) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (oldestKey === undefined) {
      break;
    }

    cache.delete(oldestKey);
  }

  cache.set(key, value);
};

/**
 * Creates the parser-backed solver used by `/wms` to turn `SEMANTIC_FILTER`
 * into backend CQL.
 *
 * Runtime flow for every matched `calculate_semantic_constraint(...)` call:
 * 1. `solve_semantic_filter` parses the call and returns positional string args.
 * 2. This adapter restores the parameter shape expected by
 *    `calculateSemanticConstraint` (`includeNarrowers` becomes boolean for term
 *    filters; other filters keep ordered values).
 * 3. A stable cache key is built from layer, filter id, and parameters. Cached
 *    promises are reused until TTL expiry, including in-flight GraphDB work.
 * 4. `calculateSemanticConstraint` resolves the filter through the Filters and
 *    GraphDB domains and returns the CQL fragment that replaces the semantic
 *    call in the original expression.
 *
 * Tests can create isolated solvers with custom cache limits or clock functions
 * without mutating the default production solver.
 */
export const createSemanticFilterSolver = (
  options: SemanticFilterSolverOptions = {}
): SemanticFilterSolver => {
  const resolver =
    options.calculateSemanticConstraint ?? calculateSemanticConstraint;
  const maxEntries = Math.max(
    1,
    options.cacheMaxEntries ?? SEMANTIC_CONSTRAINT_CACHE_MAX_ENTRIES
  );
  const ttlMs = options.cacheTtlMs ?? SEMANTIC_CONSTRAINT_CACHE_TTL_MS;
  const now = options.now ?? Date.now;
  const cache = new Map<string, CachedSemanticConstraint>();

  return (filterString: string): Promise<string> =>
    solve_semantic_filter(filterString, async (args: string[]): Promise<string> => {
      const [layerName = "", filterType = "", ...orderedParams] = args;
      const params = getSemanticConstraintAdapterParams(filterType, orderedParams);
      const cacheKey = getSemanticConstraintCacheKey(layerName, filterType, params);
      const cached = cache.get(cacheKey);
      const currentTime = now();

      if (cached && cached.expiresAt > currentTime) {
        return cached.value;
      }

      if (cached) {
        cache.delete(cacheKey);
      }

      const value = resolver(layerName, filterType, params).catch((error: unknown) => {
        cache.delete(cacheKey);
        throw error;
      });

      setCachedConstraint(
        cache,
        cacheKey,
        {
          expiresAt: currentTime + ttlMs,
          value,
        },
        maxEntries
      );

      return value;
    });
};

export const solveSemanticFilter: SemanticFilterSolver = createSemanticFilterSolver();
