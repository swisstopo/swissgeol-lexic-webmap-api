/**
 * @fileoverview Error response helpers to keep error formatting consistent.
 */

import { FastifyReply } from "fastify";

/**
 * Canonical error payload returned by API endpoints.
 */
export interface ErrorResponse {
  code: number;
  message: string;
}

/**
 * Sends a standardized error response with status code and message.
 * @param reply Fastify reply object.
 * @param statusCode HTTP status code to be applied to the response.
 * @param message Human-readable error message.
 * @returns Fastify reply carrying the standardized error payload.
 */
export const sendError = (
  reply: FastifyReply,
  statusCode: number,
  message: string
) => reply.status(statusCode).send({ code: statusCode, message });
