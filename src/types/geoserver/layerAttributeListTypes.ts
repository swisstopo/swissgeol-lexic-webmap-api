import type { FastifyBaseLogger } from "fastify";

export type AttributeListLogger = Pick<FastifyBaseLogger, "info" | "warn" | "error">;
