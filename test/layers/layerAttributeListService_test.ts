/**
 * @fileoverview Verifies the GeoServer-backed attribute-list resolution flow.
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDescribeFeatureTypeUrl,
  extractAttributeNamesFromDescribeFeatureType,
  getLiveLayerAttributesResponse,
} from "../../src/services/layerAttributeListService";

const TECTO_UNITS_DFT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:gml="http://www.opengis.net/gml" xmlns:swisstopo="https://www.swisstopo.admin.ch" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <xsd:complexType name="tecto_units_augmType">
    <xsd:complexContent>
      <xsd:extension base="gml:AbstractFeatureType">
        <xsd:sequence>
          <xsd:element name="id" type="xsd:long"/>
          <xsd:element name="litho_en" type="xsd:string"/>
          <xsd:element name="lith_en" type="xsd:string"/>
          <xsd:element name="tecto_lexic" type="xsd:string"/>
          <xsd:element name="chrono_from_lexic" type="xsd:string"/>
          <xsd:element name="chrono_to_lexic" type="xsd:string"/>
          <xsd:element name="color_id" type="xsd:string"/>
          <xsd:element name="geom" type="gml:SurfacePropertyType"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
</xsd:schema>`;

test("builds the DescribeFeatureType URL from the GeoServer base URL", () => {
  const url = buildDescribeFeatureTypeUrl(
    "https://geoserver.example/geoserver/swisstopo",
    "gc_bedrock"
  );

  assert.equal(
    url,
    "https://geoserver.example/geoserver/swisstopo/wfs?service=WFS&version=1.1.0&request=DescribeFeatureType&typeName=gc_bedrock"
  );
});

test("extracts attribute names and filters technical fields from DescribeFeatureType XML", () => {
  assert.deepEqual(extractAttributeNamesFromDescribeFeatureType(TECTO_UNITS_DFT_XML), [
    "litho_en",
    "lith_en",
    "tecto_lexic",
    "chrono_from_lexic",
    "chrono_to_lexic",
  ]);
});

test("loads attribute names for a configured layer from GeoServer", async () => {
  const originalFetch = global.fetch;
  process.env.GEOSERVER_BASE_URL = "https://geoserver.example/geoserver/swisstopo";

  global.fetch = async (input: string | URL | Request) => {
    assert.equal(
      input.toString(),
      "https://geoserver.example/geoserver/swisstopo/wfs?service=WFS&version=1.1.0&request=DescribeFeatureType&typeName=tecto_units_augm"
    );

    return new Response(TECTO_UNITS_DFT_XML, {
      status: 200,
      headers: { "content-type": "application/xml" },
    });
  };

  try {
    assert.deepEqual(await getLiveLayerAttributesResponse("tecto_units_augm"), {
      layerId: "tecto_units_augm",
      attributes: [
        "litho_en",
        "lith_en",
        "tecto_lexic",
        "chrono_from_lexic",
        "chrono_to_lexic",
      ],
    });
  } finally {
    global.fetch = originalFetch;
    delete process.env.GEOSERVER_BASE_URL;
  }
});

test("returns fallback results for failing and unknown layers", async () => {
  const originalFetch = global.fetch;
  process.env.GEOSERVER_BASE_URL = "https://geoserver.example/geoserver/swisstopo";
  global.fetch = async () => {
    throw new Error("network down");
  };

  try {
    assert.deepEqual(await getLiveLayerAttributesResponse("gc_bedrock"), {
      layerId: "gc_bedrock",
      attributes: [],
    });
    assert.equal(await getLiveLayerAttributesResponse("TK500"), null);
    assert.equal(await getLiveLayerAttributesResponse("missing-layer"), null);
  } finally {
    global.fetch = originalFetch;
    delete process.env.GEOSERVER_BASE_URL;
  }
});
