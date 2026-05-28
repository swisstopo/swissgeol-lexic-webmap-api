/**
 * @fileoverview Verifies runtime filter request validation before semantic
 * resolution or map-service URL construction happens.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { validateFilterRequest } from "../../src/services/filters/validation/filterRequestValidationService";

test("returns 404 when the requested layer is not configured", () => {
  assert.deepEqual(validateFilterRequest("unknown_layer", []), {
    error: {
      statusCode: 404,
      message: "Layer not found",
    },
  });
});

test("accepts an omitted filter list as an empty filter list", () => {
  const result = validateFilterRequest("gc_bedrock");

  assert.equal(result.error, undefined);
  assert.equal(result.layer?.id, "gc_bedrock");
  assert.deepEqual(result.filters, []);
});

test("returns 400 when the filter list is not an array", () => {
  assert.deepEqual(validateFilterRequest("gc_bedrock", "invalid"), {
    error: {
      statusCode: 400,
      message: "Filters must be an array",
    },
  });
});

test("returns 400 when a filter id is missing or unsupported", () => {
  assert.deepEqual(validateFilterRequest("gc_bedrock", [{}]), {
    error: {
      statusCode: 400,
      message: "Filter id is required and must be supported",
    },
  });

  assert.deepEqual(
    validateFilterRequest("gc_bedrock", [
      {
        filterId: "unknown-filter",
        parameters: {},
      },
    ]),
    {
      error: {
        statusCode: 400,
        message: "Filter id is required and must be supported",
      },
    }
  );
});

test("returns 400 when the layer does not support the submitted filter", () => {
  assert.deepEqual(
    validateFilterRequest("gc_unco_deposits", [
      {
        filterId: "f-lithology-term",
        parameters: {
          term: "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite",
          includeNarrowers: true,
        },
      },
    ]),
    {
      error: {
        statusCode: 400,
        message: "Layer does not support filter 'f-lithology-term'",
      },
    }
  );
});

test("returns 400 when filter parameters are missing", () => {
  assert.deepEqual(
    validateFilterRequest("gc_bedrock", [
      {
        filterId: "f-lithology-term",
      },
    ]),
    {
      error: {
        statusCode: 400,
        message: "Filter 'f-lithology-term' requires parameters",
      },
    }
  );
});

test("returns 400 when a term filter has invalid parameters", () => {
  assert.deepEqual(
    validateFilterRequest("gc_bedrock", [
      {
        filterId: "f-lithology-term",
        parameters: {
          includeNarrowers: true,
        },
      },
    ]),
    {
      error: {
        statusCode: 400,
        message: "Filter 'f-lithology-term' requires a term parameter",
      },
    }
  );

  assert.deepEqual(
    validateFilterRequest("gc_bedrock", [
      {
        filterId: "f-lithology-term",
        parameters: {
          term: "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite",
          includeNarrowers: "true",
        },
      },
    ]),
    {
      error: {
        statusCode: 400,
        message: "Filter 'f-lithology-term' includeNarrowers parameter must be boolean",
      },
    }
  );
});

test("returns 400 when a chronostratigraphy filter has invalid parameters", () => {
  assert.deepEqual(
    validateFilterRequest("gc_bedrock", [
      {
        filterId: "f-chronostrat-term",
        parameters: {
          type: "Invalid",
        },
      },
    ]),
    {
      error: {
        statusCode: 400,
        message: "Chronostratigraphy filter requires type Younger, Older, or From-To",
      },
    }
  );

  assert.deepEqual(
    validateFilterRequest("gc_bedrock", [
      {
        filterId: "f-chronostrat-term",
        parameters: {
          type: "Younger",
        },
      },
    ]),
    {
      error: {
        statusCode: 400,
        message: "Chronostratigraphy Younger filter requires a to parameter",
      },
    }
  );

  assert.deepEqual(
    validateFilterRequest("gc_bedrock", [
      {
        filterId: "f-chronostrat-term",
        parameters: {
          type: "Older",
        },
      },
    ]),
    {
      error: {
        statusCode: 400,
        message: "Chronostratigraphy Older filter requires a from parameter",
      },
    }
  );

  assert.deepEqual(
    validateFilterRequest("gc_bedrock", [
      {
        filterId: "f-chronostrat-term",
        parameters: {
          type: "From-To",
          from: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Jurassic",
        },
      },
    ]),
    {
      error: {
        statusCode: 400,
        message: "Chronostratigraphy From-To filter requires from and to parameters",
      },
    }
  );
});

test("returns 400 when a by-attribute filter has invalid parameters", () => {
  assert.deepEqual(
    validateFilterRequest("gc_bedrock", [
      {
        filterId: "f-byAttribute",
        parameters: {
          attribute: "kind",
        },
      },
    ]),
    {
      error: {
        statusCode: 400,
        message: "Filter 'f-byAttribute' requires attribute and value parameters",
      },
    }
  );

  assert.deepEqual(
    validateFilterRequest("gc_bedrock", [
      {
        filterId: "f-byAttribute",
        parameters: {
          attribute: "",
          value: "sedimentary",
        },
      },
    ]),
    {
      error: {
        statusCode: 400,
        message: "Filter 'f-byAttribute' requires attribute and value parameters",
      },
    }
  );

  assert.deepEqual(
    validateFilterRequest("gc_bedrock", [
      {
        filterId: "f-byAttribute",
        parameters: {
          attribute: "chrono_from_lexic",
          value: "Jurassic",
        },
      },
    ]),
    {
      error: {
        statusCode: 400,
        message:
          "Filter 'f-byAttribute' cannot use excluded attribute 'chrono_from_lexic'",
      },
    }
  );

  assert.deepEqual(
    validateFilterRequest("gc_bedrock", [
      {
        filterId: "f-byAttribute",
        parameters: {
          attribute: " chrono_from_lexic ",
          value: "Jurassic",
        },
      },
    ]),
    {
      error: {
        statusCode: 400,
        message:
          "Filter 'f-byAttribute' cannot use excluded attribute 'chrono_from_lexic'",
      },
    }
  );
});

test("accepts string number and boolean values for by-attribute filters", () => {
  const result = validateFilterRequest("gc_bedrock", [
    {
      filterId: "f-byAttribute",
      parameters: {
        attribute: "kind",
        value: "sedimentary",
      },
    },
    {
      filterId: "f-byAttribute",
      parameters: {
        attribute: "objectid",
        value: 123,
      },
    },
    {
      filterId: "f-byAttribute",
      parameters: {
        attribute: "form_att",
        value: false,
      },
    },
  ]);

  assert.equal(result.error, undefined);
  assert.deepEqual(result.filters, [
    {
      filterId: "f-byAttribute",
      parameters: {
        attribute: "kind",
        value: "sedimentary",
      },
    },
    {
      filterId: "f-byAttribute",
      parameters: {
        attribute: "objectid",
        value: 123,
      },
    },
    {
      filterId: "f-byAttribute",
      parameters: {
        attribute: "form_att",
        value: false,
      },
    },
  ]);
});

test("returns configured layer id and normalized filters for valid input", () => {
  const result = validateFilterRequest("gc_bedrock", [
    {
      filterId: "f-tectonic-term",
      parameters: {
        term: "https://dev-lexic.swissgeol.ch/TectonicUnits/UpperRhineGraben",
        includeNarrowers: false,
      },
    },
    {
      filterId: "f-lithostrat-term",
      parameters: {
        term: "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Servino",
      },
    },
    {
      filterId: "f-lithology-term",
      parameters: {
        term: "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite",
        includeNarrowers: true,
      },
    },
    {
      filterId: "f-chronostrat-term",
      parameters: {
        type: "From-To",
        from: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Jurassic",
        to: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Cretaceous",
      },
    },
    {
      filterId: "f-byAttribute",
      parameters: {
        attribute: "kind",
        value: false,
      },
    },
  ]);

  assert.equal(result.error, undefined);
  assert.equal(result.layer?.id, "gc_bedrock");
  assert.deepEqual(result.filters, [
    {
      filterId: "f-tectonic-term",
      parameters: {
        term: "https://dev-lexic.swissgeol.ch/TectonicUnits/UpperRhineGraben",
        includeNarrowers: false,
      },
    },
    {
      filterId: "f-lithostrat-term",
      parameters: {
        term: "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Servino",
        includeNarrowers: undefined,
      },
    },
    {
      filterId: "f-lithology-term",
      parameters: {
        term: "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite",
        includeNarrowers: true,
      },
    },
    {
      filterId: "f-chronostrat-term",
      parameters: {
        type: "From-To",
        from: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Jurassic",
        to: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Cretaceous",
      },
    },
    {
      filterId: "f-byAttribute",
      parameters: {
        attribute: "kind",
        value: false,
      },
    },
  ]);
});
