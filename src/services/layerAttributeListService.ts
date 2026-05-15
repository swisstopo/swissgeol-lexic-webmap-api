/**
 * @fileoverview GeoServer-backed attribute list resolution for `/layers/{layerId}/attributeList`.
 */

import type { FastifyBaseLogger } from "fastify";
import { readGeoServerEnvironmentConfig } from "../geoserver/configuration";
import { getConfigurationLayerById } from "../layers/configuration";
import type { LayerAttributesResponse } from "./layersService";

const EXCLUDED_ATTRIBUTE_NAMES = new Set(["geom", "id", "color_id"]);

type AttributeListLogger = Pick<FastifyBaseLogger, "info" | "warn" | "error">;

const buildGeoServerWfsPath = (pathname: string): string => {
  const normalizedPath = pathname.replace(/\/+$/, "");

  if (/\/wfs$/i.test(normalizedPath)) {
    return normalizedPath;
  }

  if (/\/wms$/i.test(normalizedPath)) {
    return normalizedPath.replace(/\/wms$/i, "/wfs");
  }

  return `${normalizedPath}/wfs`;
};

export const buildDescribeFeatureTypeUrl = (
  geoserverBaseUrl: string,
  typeName: string
): string => {
  const url = new URL(geoserverBaseUrl);
  url.pathname = buildGeoServerWfsPath(url.pathname);
  url.search = "";
  url.searchParams.set("service", "WFS");
  url.searchParams.set("version", "1.1.0");
  url.searchParams.set("request", "DescribeFeatureType");
  url.searchParams.set("typeName", typeName);

  return url.toString();
};

export const extractAttributeNamesFromDescribeFeatureType = (
  xmlText: string
): string[] => {
  const sequenceMatch = xmlText.match(
    /<([A-Za-z_][\w.-]*):sequence\b[^>]*>([\s\S]*?)<\/\1:sequence>/i
  );
  const schemaFragment = sequenceMatch ? sequenceMatch[2] : xmlText;
  const elementMatches = schemaFragment.matchAll(
    /<([A-Za-z_][\w.-]*):element\b[^>]*\bname="([^"]+)"[^>]*\/?>/gi
  );
  const attributeNames = Array.from(elementMatches, (match) => match[2]).filter(
    (attributeName) => !EXCLUDED_ATTRIBUTE_NAMES.has(attributeName)
  );

  return Array.from(new Set(attributeNames));
};

export const getLiveLayerAttributesResponse = async (
  layerId: string,
  logger?: AttributeListLogger
): Promise<LayerAttributesResponse | null> => {
  const layerConfiguration = getConfigurationLayerById(layerId);
  if (!layerConfiguration) {
    return null;
  }

  if (!layerConfiguration.attributeSource) {
    return {
      layerId: layerConfiguration.id,
      attributes: [],
    };
  }

  const environmentConfig = readGeoServerEnvironmentConfig();
  const describeUrl = buildDescribeFeatureTypeUrl(
    environmentConfig.baseUrl,
    layerConfiguration.attributeSource.typeName
  );

  logger?.info(
    {
      layerId: layerConfiguration.id,
      typeName: layerConfiguration.attributeSource.typeName,
      url: describeUrl,
    },
    "Fetching GeoServer DescribeFeatureType for layer attribute list."
  );

  try {
    const response = await fetch(describeUrl);
    if (!response.ok) {
      logger?.warn(
        {
          layerId: layerConfiguration.id,
          typeName: layerConfiguration.attributeSource.typeName,
          url: describeUrl,
          statusCode: response.status,
        },
        "GeoServer DescribeFeatureType request failed for layer attribute list."
      );

      return {
        layerId: layerConfiguration.id,
        attributes: [],
      };
    }

    const xmlText = await response.text();
    const attributes = extractAttributeNamesFromDescribeFeatureType(xmlText);

    logger?.info(
      {
        layerId: layerConfiguration.id,
        typeName: layerConfiguration.attributeSource.typeName,
        attributeCount: attributes.length,
      },
      "Resolved layer attribute list from GeoServer DescribeFeatureType."
    );

    return {
      layerId: layerConfiguration.id,
      attributes,
    };
  } catch (error) {
    logger?.error(
      {
        err: error,
        layerId: layerConfiguration.id,
        typeName: layerConfiguration.attributeSource.typeName,
        url: describeUrl,
      },
      "GeoServer DescribeFeatureType lookup failed for layer attribute list."
    );

    return {
      layerId: layerConfiguration.id,
      attributes: [],
    };
  }
};
