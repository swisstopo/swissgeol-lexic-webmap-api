/**
 * @fileoverview Verifies language preservation and query options over the GraphDB HTTP boundary.
 */

import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { GraphDBClient, QueryExecutor } from "../../src/libs/graphdb_connector";

const SPARQL_QUERY = "SELECT ?label WHERE { ?term ?predicate ?label }";
const LABELS = [
  { language: "de", value: "Gestein" },
  { language: "en", value: "Rock" },
  { language: "fr", value: "Roche" },
  { language: "it", value: "Roccia" },
];

interface LabelBinding {
  label: { termType: string; value: string; language: string };
}

for (const queryCase of [
  { name: "default limit", options: {}, expectedLimit: "2000" },
  { name: "explicit limit", options: { limit: 7 }, expectedLimit: "7" },
  { name: "unlimited results", options: { limit: null }, expectedLimit: null },
]) {
  test(`GraphDB preserves four literal languages with ${queryCase.name}`, async (context) => {
    const requests: URL[] = [];
    const queryRequests: URLSearchParams[] = [];
    const server = createServer((request, response) => {
      const url = new URL(request.url || "/", "http://localhost");
      requests.push(url);

      if (url.pathname === "/rest/repositories") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify([{ id: "vocabulary" }]));
        return;
      }

      if (url.pathname === "/repositories/vocabulary") {
        let body = "";
        request.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });
        request.on("end", () => {
          queryRequests.push(new URLSearchParams(body));
          response.writeHead(200, { "content-type": "application/sparql-results+xml" });
          response.end(`<?xml version="1.0"?>
          <sparql xmlns="http://www.w3.org/2005/sparql-results#">
            <head><variable name="label"/></head>
            <results>${LABELS.map(({ language, value }) =>
              `<result><binding name="label"><literal xml:lang="${language}">${value}</literal></binding></result>`
            ).join("")}</results>
          </sparql>`);
        });
        return;
      }

      response.writeHead(404);
      response.end();
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    context.after(() => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }));

    const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const client = new GraphDBClient(baseUrl, "", "");
    const executor = new QueryExecutor(
      client, "vocabulary", baseUrl, "", "", `${baseUrl}/repositories/vocabulary`
    );
    const bindings = await executor.executeSparqlQuery<LabelBinding>(SPARQL_QUERY, queryCase.options);

    assert.deepEqual(bindings.map(({ label }) => ({
      language: label.language,
      value: label.value,
    })), LABELS);
    assert.ok(bindings.every(({ label }) => label.termType === "Literal"));
    assert.ok(requests.some(({ pathname }) => pathname === "/rest/repositories"));
    const queryRequest = queryRequests[0];
    assert.ok(queryRequest);
    assert.equal(queryRequest.get("query"), SPARQL_QUERY);
    assert.equal(queryRequest.get("limit"), queryCase.expectedLimit);
    assert.equal(queryRequest.get("timeout"), "50000");
  });
}
