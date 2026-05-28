/**
 * Generates TypeScript types from the configured OpenAPI specification.
 */

import path from "path";
import { execFileSync } from "child_process";
import { assertOpenApiSpecExists } from "../src/configuration/openapi/configuration";

const specPath = assertOpenApiSpecExists();
const outputPath = path.resolve(__dirname, "..", "src", "types", "openapi.d.ts");
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

execFileSync(
  npxCommand,
  ["openapi-typescript", specPath, "-o", outputPath],
  {
    stdio: "inherit",
  }
);
