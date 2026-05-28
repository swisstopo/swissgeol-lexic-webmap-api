/**
 * @fileoverview Sanitizes inbound WMS parameters before forwarding them to
 * GeoServer.
 */

import {
  solveSemanticFilter,
} from "./semanticFilterParameterService";
import type {
  WmsParameter,
  WmsProxyRequestOptions,
} from "../../types/wms/wmsRequestSanitizerTypes";

const SEMANTIC_FILTER_PARAMETER_NAME = "SEMANTIC_FILTER";
const CQL_FILTER_PARAMETER_NAME = "CQL_FILTER";

/**
 * Represents invalid inbound WMS proxy input that should be returned as a
 * client-side request error.
 */
export class WmsProxyInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WmsProxyInputError";
  }
}

const decodeParameterName = (rawName: string): string => {
  try {
    return decodeURIComponent(rawName.replace(/\+/gu, " "));
  } catch {
    return rawName;
  }
};

const decodeParameterValue = (rawValue: string): string => {
  try {
    return decodeURIComponent(rawValue.replace(/\+/gu, " "));
  } catch {
    return rawValue;
  }
};

const parseWmsRequestBody = (body: string): WmsParameter[] =>
  body
    .split("&")
    .filter((parameter) => parameter.length > 0)
    .map((parameter) => {
      const separatorIndex = parameter.indexOf("=");

      if (separatorIndex === -1) {
        return {
          rawName: parameter,
          rawValue: "",
          rawSegment: parameter,
        };
      }

      return {
        rawName: parameter.slice(0, separatorIndex),
        rawValue: parameter.slice(separatorIndex + 1),
        rawSegment: parameter,
      };
    });

const serializeWmsRequestBody = (parameters: WmsParameter[]): string =>
  parameters.map(({ rawSegment }) => rawSegment).join("&");

const isParameterNamed = (
  parameter: WmsParameter,
  parameterName: string
): boolean =>
  decodeParameterName(parameter.rawName).toUpperCase() === parameterName;

const getSingleParameterValue = (
  parameters: WmsParameter[],
  parameterName: string
): string | undefined => {
  const matchingParameters = parameters.filter((parameter) =>
    isParameterNamed(parameter, parameterName)
  );

  if (matchingParameters.length > 1) {
    throw new WmsProxyInputError(
      `WMS request must not include multiple ${parameterName} parameters.`
    );
  }

  const [parameter] = matchingParameters;

  return parameter ? decodeParameterValue(parameter.rawValue) : undefined;
};

const buildGeneratedWmsParameter = (
  name: string,
  value: string
): WmsParameter => ({
  rawName: encodeURIComponent(name),
  rawValue: encodeURIComponent(value),
  rawSegment: `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
});

const requireNonEmptyWmsParameters = (body: string): string => {
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    throw new WmsProxyInputError("WMS request parameters must not be empty.");
  }

  return trimmedBody;
};

/**
 * Removes client-provided filtering parameters and replaces SEMANTIC_FILTER
 * with the backend-generated CQL_FILTER expected by GeoServer.
 *
 * Flow:
 * 1. Parse the raw WMS query/form body without normalizing unrelated parameters.
 * 2. Reject duplicate `SEMANTIC_FILTER` entries because one request must have
 *    one semantic expression.
 * 3. Drop every inbound `SEMANTIC_FILTER` and `CQL_FILTER`. Clients are not
 *    allowed to stack custom CQL on top of backend-controlled semantic filters.
 * 4. Resolve the semantic expression through `solveSemanticFilter` and append a
 *    single encoded backend `CQL_FILTER` only when the generated CQL is nonempty.
 * 5. Re-serialize the preserved raw parameters plus the generated filter.
 *
 * This keeps all non-filter WMS parameters byte-stable while making the filter
 * portion fully backend-controlled.
 */
export const sanitizeWmsRequestBody = async (
  body: string,
  options: WmsProxyRequestOptions = {}
): Promise<string> => {
  const parameters = parseWmsRequestBody(requireNonEmptyWmsParameters(body));
  const semanticFilter = getSingleParameterValue(
    parameters,
    SEMANTIC_FILTER_PARAMETER_NAME
  );

  const sanitizedParameters = parameters.filter(
    (parameter) =>
      !isParameterNamed(parameter, SEMANTIC_FILTER_PARAMETER_NAME) &&
      !isParameterNamed(parameter, CQL_FILTER_PARAMETER_NAME)
  );

  if (semanticFilter?.trim()) {
    const semanticSolver = options.solveSemanticFilter ?? solveSemanticFilter;
    const cqlFilter = await semanticSolver(semanticFilter);

    if (cqlFilter.trim()) {
      sanitizedParameters.push(
        buildGeneratedWmsParameter(CQL_FILTER_PARAMETER_NAME, cqlFilter)
      );
    }
  }

  const sanitizedBody = serializeWmsRequestBody(sanitizedParameters);

  if (!sanitizedBody) {
    throw new WmsProxyInputError(
      "WMS request must include at least one forwardable parameter."
    );
  }

  return sanitizedBody;
};
