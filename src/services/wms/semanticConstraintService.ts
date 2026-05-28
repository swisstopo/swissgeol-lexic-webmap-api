/**
 * @fileoverview Resolves one semantic filter constraint into a GeoServer CQL
 * fragment.
 */

import type { LayerFilterId } from "../../types/layers/layerFilterTypes";
import {
  resolveFiltersForLayer,
} from "../filters/filterResolutionService";
import type {
  FilterResolutionOptions,
  ResolvedFilter,
} from "../../types/filters/filterResolutionTypes";
import type { ResolvedByAttributeFilter } from "../../types/filters/byAttributeFilterTypes";
import type { ResolvedChronostratigraphyFilter } from "../../types/filters/chronostratigraphyFilterTypes";
import type { ResolvedTermFilter } from "../../types/filters/termFilterTypes";
import type { SemanticConstraintParam } from "../../types/wms/semanticConstraintTypes";
/**
 * Represents invalid calculate_semantic_constraint input before any CQL is
 * generated for GeoServer.
 */
export class SemanticConstraintInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SemanticConstraintInputError";
  }
}

const TERM_FILTER_TYPES = new Set<string>([
  "f-tectonic-term",
  "f-lithostrat-term",
  "f-lithology-term",
]);

const isSemanticConstraintParam = (
  value: unknown
): value is SemanticConstraintParam =>
  ["string", "number", "boolean"].includes(typeof value);

const requireParamsArray = (params: unknown): unknown[] => {
  if (!Array.isArray(params)) {
    throw new SemanticConstraintInputError(
      "Semantic constraint params must be an ordered array."
    );
  }

  return params;
};

const requireStringParam = (
  params: unknown[],
  index: number,
  description: string
): string => {
  const value = params[index];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SemanticConstraintInputError(
      `Semantic constraint requires ${description}.`
    );
  }

  return value;
};

const requireBooleanParam = (
  params: unknown[],
  index: number,
  description: string
): boolean => {
  const value = params[index];
  if (typeof value !== "boolean") {
    throw new SemanticConstraintInputError(
      `Semantic constraint requires ${description}.`
    );
  }

  return value;
};

const requireAnyValueParam = (
  params: unknown[],
  index: number,
  description: string
): SemanticConstraintParam => {
  const value = params[index];
  if (!isSemanticConstraintParam(value)) {
    throw new SemanticConstraintInputError(
      `Semantic constraint requires ${description}.`
    );
  }

  return value;
};

const getTermFilterParameters = (
  params: unknown[]
): {
  term: string;
  includeNarrowers: boolean;
} => ({
  term: requireStringParam(params, 0, "a term URI at params[0]"),
  includeNarrowers: requireBooleanParam(
    params,
    1,
    "an includeNarrowers boolean at params[1]"
  ),
});

const getChronostratigraphyFilterParameters = (
  params: unknown[]
):
  | {
      type: "Younger";
      to: string;
    }
  | {
      type: "Older";
      from: string;
    }
  | {
      type: "From-To";
      from: string;
      to: string;
    } => {
  const type = requireStringParam(params, 0, "a chronostratigraphy type at params[0]");

  if (type === "Younger") {
    return {
      type,
      to: requireStringParam(params, 1, "a to term URI at params[1]"),
    };
  }

  if (type === "Older") {
    return {
      type,
      from: requireStringParam(params, 1, "a from term URI at params[1]"),
    };
  }

  if (type === "From-To") {
    return {
      type,
      from: requireStringParam(params, 1, "a from term URI at params[1]"),
      to: requireStringParam(params, 2, "a to term URI at params[2]"),
    };
  }

  throw new SemanticConstraintInputError(
    "Semantic constraint chronostratigraphy type must be Younger, Older, or From-To."
  );
};

const getByAttributeFilterParameters = (
  params: unknown[]
): {
  attribute: string;
  value: SemanticConstraintParam;
} => ({
  attribute: requireStringParam(params, 0, "an attribute at params[0]"),
  value: requireAnyValueParam(params, 1, "a value at params[1]"),
});

/*
 * The WMS solver receives positional values parsed out of a string expression.
 * This adapter is the semantic boundary that converts those positional values
 * back into the same parameter objects expected by filter request validation.
 */
const getFilterParameters = (filterType: string, params: unknown): unknown => {
  const orderedParams = requireParamsArray(params);

  if (TERM_FILTER_TYPES.has(filterType)) {
    return getTermFilterParameters(orderedParams);
  }

  if (filterType === "f-chronostrat-term") {
    return getChronostratigraphyFilterParameters(orderedParams);
  }

  if (filterType === "f-byAttribute") {
    return getByAttributeFilterParameters(orderedParams);
  }

  return orderedParams;
};

const quoteCqlIdentifier = (identifier: string): string =>
  `"${identifier.replace(/"/gu, '""')}"`;

const quoteCqlString = (value: string): string =>
  `'${value.replace(/'/gu, "''")}'`;

const formatCqlValue = (value: string | number | boolean): string =>
  typeof value === "string" ? quoteCqlString(value) : String(value);

const buildInCondition = (attribute: string, values: string[]): string =>
  `${quoteCqlIdentifier(attribute)} IN ( ${values.map(quoteCqlString).join(" , ")} )`;

const combineConditions = (
  conditions: string[],
  operator: "AND" | "OR"
): string => {
  if (conditions.length === 1) {
    return conditions[0];
  }

  return `( ${conditions.join(` ${operator} `)} )`;
};

const buildTermConstraint = (filter: ResolvedTermFilter): string =>
  combineConditions(
    filter.targetAttributes.map((attribute) =>
      buildInCondition(attribute, filter.resolvedTerms)
    ),
    "OR"
  );

const buildChronostratigraphyConstraint = (
  filter: ResolvedChronostratigraphyFilter
): string => {
  if (filter.mode === "younger") {
    return buildInCondition(filter.targetAttributes.to, filter.resolvedTerms);
  }

  if (filter.mode === "older") {
    return buildInCondition(filter.targetAttributes.from, filter.resolvedTerms);
  }

  return combineConditions(
    [
      buildInCondition(filter.targetAttributes.from, filter.resolvedTerms),
      buildInCondition(filter.targetAttributes.to, filter.resolvedTerms),
    ],
    "AND"
  );
};

const buildByAttributeConstraint = (filter: ResolvedByAttributeFilter): string =>
  `${quoteCqlIdentifier(filter.attribute)} = ${formatCqlValue(filter.value)}`;

/*
 * Resolved filters are deliberately CQL-agnostic until this point. The builder
 * below is the only place in this service that translates the resolved filter
 * families into GeoServer CQL syntax and quoting rules.
 */
const buildResolvedConstraint = (filter: ResolvedFilter): string => {
  if (filter.type === "term") {
    return buildTermConstraint(filter);
  }

  if (filter.type === "chronostratigraphy") {
    return buildChronostratigraphyConstraint(filter);
  }

  return buildByAttributeConstraint(filter);
};

/**
 * Resolves one calculate_semantic_constraint call into the CQL fragment that
 * can be appended to the backend GeoServer WMS request.
 *
 * This is the bridge between the WMS semantic-expression syntax and GeoServer
 * CQL:
 * 1. `getFilterParameters` converts ordered string/boolean/number parameters
 *    from the parser back into the same shape accepted by filter validation.
 * 2. `resolveFiltersForLayer` reuses the normal Filters domain validation and
 *    resolution flow, so semantic calls and JSON API filter payloads cannot
 *    diverge in behavior.
 * 3. Exactly one resolved filter is serialized by `buildResolvedConstraint`.
 *    Term filters become `attribute IN (...)`; chronostratigraphy maps to the
 *    configured `from`/`to` attributes; by-attribute becomes equality.
 *
 * Validation failures are wrapped as `SemanticConstraintInputError` so `/wms`
 * can classify malformed semantic filters as client input problems rather than
 * upstream GeoServer failures.
 */
export const calculateSemanticConstraint = async (
  layerName: string,
  filterType: string,
  params: unknown,
  options: FilterResolutionOptions = {}
): Promise<string> => {
  const resolution = await resolveFiltersForLayer(
    layerName,
    [
      {
        filterId: filterType as LayerFilterId,
        parameters: getFilterParameters(filterType, params),
      },
    ],
    options
  );

  if (resolution.error) {
    throw new SemanticConstraintInputError(resolution.error.message);
  }

  const [resolvedFilter] = resolution.resolvedFilters;
  if (!resolvedFilter) {
    throw new SemanticConstraintInputError(
      "Semantic constraint did not resolve any filter."
    );
  }

  return buildResolvedConstraint(resolvedFilter);
};
