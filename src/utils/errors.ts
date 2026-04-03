/**
 * @fileoverview Error helpers to keep API error payloads consistent across controllers and hooks.
 */

/**
 * Canonical error payload returned by API endpoints.
 */
export interface ErrorResponse {
  code: number;
  message: string;
}

/**
 * Builds the standardized API error payload.
 */
export const buildErrorBody = (
  statusCode: number,
  message: string
): ErrorResponse => ({
  code: statusCode,
  message,
});
