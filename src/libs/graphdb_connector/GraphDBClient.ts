/**
 * @fileoverview Wraps the GraphDB server client setup so the rest of the backend can reuse a single connection contract.
 */

import RDFMimeType from "graphdb/lib/http/rdf-mime-type";
import GraphDBServerClient from "graphdb/lib/server/graphdb-server-client";
import ServerClientConfig from "graphdb/lib/server/server-client-config";

const GRAPHDB_TIMEOUT_MS = 50_000;

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

class GraphDBClient {
  private readonly serverClient: GraphDBServerClient;

  constructor(serverUrl: string, username: string, password: string) {
    const serverConfig = new ServerClientConfig(serverUrl)
      .setTimeout(GRAPHDB_TIMEOUT_MS)
      .setHeaders({
        Accept: RDFMimeType.SPARQL_RESULTS_XML,
      })
      .setKeepAlive(true);

    if (username || password) {
      serverConfig.useBasicAuthentication(username, password);
    }

    this.serverClient = new GraphDBServerClient(serverConfig);
  }

  public async getRepositoryIds(): Promise<string[]> {
    try {
      return await this.serverClient.getRepositoryIDs();
    } catch (error) {
      throw new Error(
        `Failed to load GraphDB repository ids: ${toErrorMessage(error)}`
      );
    }
  }

  public getClient(): GraphDBServerClient {
    return this.serverClient;
  }
}

export default GraphDBClient;
