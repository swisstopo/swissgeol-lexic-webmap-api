/**
 * Error response helpers to keep error formatting consistent.
 */

import { FastifyReply } from "fastify";

export interface ErrorResponse {
  code: number;
  message: string;
}

export const sendError = (
  reply: FastifyReply,
  statusCode: number,
  message: string
) => reply.status(statusCode).send({ code: statusCode, message });
