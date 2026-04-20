/**
 * @fileoverview Executes SPARQL queries against a configured GraphDB repository and collects the streamed bindings.
 */

import RDFMimeType from "graphdb/lib/http/rdf-mime-type";
import SparqlXmlResultParser from "graphdb/lib/parser/sparql-xml-result-parser";
import GetQueryPayload from "graphdb/lib/query/get-query-payload";
import QueryType from "graphdb/lib/query/query-type";
import RepositoryClientConfig from "graphdb/lib/repository/repository-client-config";
import GraphDBClient from "./GraphDBClient";

const GRAPHDB_TIMEOUT_MS = 50_000;
const EMPTY_PARSER_CONFIG: Record<string, never> = {};
const DEFAULT_QUERY_LIMIT = 2000;

interface QueryExecutionOptions {
  limit?: number | null;
}

interface QueryResultStream<TBinding> extends NodeJS.ReadableStream {
  on(event: "data", listener: (binding: TBinding) => void): this;
  on(event: "end", listener: () => void): this;
  on(event: "error", listener: (error: Error) => void): this;
}

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

class QueryExecutor {
  private readonly graphDBClient: GraphDBClient;
  private readonly repositoryId: string;
  private readonly repositoryConfig: RepositoryClientConfig;

  constructor(
    graphDBClient: GraphDBClient,
    repositoryId: string,
    baseUrl: string,
    username: string,
    password: string,
    repositoryUrl: string
  ) {
    this.graphDBClient = graphDBClient;
    this.repositoryId = repositoryId;
    const repositoryConfig = new RepositoryClientConfig(baseUrl)
      .setEndpoints([repositoryUrl])
      .setReadTimeout(GRAPHDB_TIMEOUT_MS)
      .setWriteTimeout(GRAPHDB_TIMEOUT_MS)
      .setHeaders({
        Accept: RDFMimeType.SPARQL_RESULTS_XML,
      })
      .setKeepAlive(true);

    if (username || password) {
      repositoryConfig.useBasicAuthentication(username, password);
    }

    this.repositoryConfig = repositoryConfig;
  }

  /**
   * Executes a SPARQL SELECT query and collects the full result stream in memory.
   * When `options.limit` is `null`, no explicit GraphDB limit is applied.
   */
  public async executeSparqlQuery<TBinding>(
    sparqlQuery: string,
    options: QueryExecutionOptions = {}
  ): Promise<TBinding[]> {
    try {
      const repository = await this.graphDBClient
        .getClient()
        .getRepository(this.repositoryId, this.repositoryConfig);
      repository.registerParser(new SparqlXmlResultParser(EMPTY_PARSER_CONFIG));

      const payload = new GetQueryPayload()
        .setQuery(sparqlQuery)
        .setQueryType(QueryType.SELECT)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_XML)
        .setTimeout(GRAPHDB_TIMEOUT_MS);

      const limit =
        options.limit === undefined ? DEFAULT_QUERY_LIMIT : options.limit;
      if (limit !== null) {
        payload.setLimit(limit);
      }

      const queryStream = (await repository.query(payload)) as QueryResultStream<TBinding>;

      return await new Promise<TBinding[]>((resolve, reject) => {
        const results: TBinding[] = [];

        queryStream.on("data", (binding) => {
          results.push(binding);
        });

        queryStream.on("end", () => {
          resolve(results);
        });

        queryStream.on("error", (error) => {
          reject(error);
        });
      });
    } catch (error) {
      throw new Error(
        `Failed to execute GraphDB query for repository '${this.repositoryId}': ${toErrorMessage(
          error
        )}`
      );
    }
  }
}

export default QueryExecutor;
