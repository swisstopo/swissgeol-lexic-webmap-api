"""
Smoke test script for the WebMap API mock server.
The server must be running and reachable via BASE_URL.
"""

import json
import os
import sys
import urllib.request

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000/v1").rstrip("/")

EXPECTED_WEBMAP_ID = "SwissTopoMap"

FILTER_CATALOG = {
    "f-chronostrat-term": {"id": "f-chronostrat-term", "name": "Filter by Chronostratigraphy term", "description": "Filter by chronostratigraphic intervals"},
    "f-tectonic-term": {"id": "f-tectonic-term", "name": "Filter by Tectonic Units term", "description": "Filter by tectonic units"},
    "f-lithostrat-term": {"id": "f-lithostrat-term", "name": "Filter by Lithostratigraphy term", "description": "Filter by lithostratigraphic units"},
    "f-lithology-term": {"id": "f-lithology-term", "name": "Filter by Lithology term", "description": "Filter by lithology classes"},
    "f-byAttribute": {"id": "f-byAttribute", "name": "Filter by Attribute", "description": "Filter by attribute key/value"},
}

LAYERS = [
    {"id": "TK500", "name": "TK500", "filterable": False, "filters": [], "attributes": []},
    {"id": "Tecto_Lines", "name": "Tectonic Lines", "filterable": False, "filters": [], "attributes": []},
    {"id": "Quat_Surfaces", "name": "Quat Surfaces", "filterable": False, "filters": [], "attributes": []},
    {"id": "tecto_units_augm", "name": "Tectonic Units", "filterable": True, "filters": ["f-chronostrat-term", "f-tectonic-term", "f-byAttribute"], "attributes": ["fid", "litho_en", "lith_en"]},
    {"id": "geocover", "name": "GeoCover - Vektordaten", "filterable": False, "filters": [], "attributes": []},
    {"id": "gc_bedrock", "name": "GC_BEDROCK", "filterable": True, "filters": ["f-chronostrat-term", "f-tectonic-term", "f-lithostrat-term", "f-lithology-term", "f-byAttribute"], "attributes": ["uuid", "fmat_litstrat", "objectid", "kind", "rbed_orig_descr", "form_att", "fmat_litstrat_code"]},
    {"id": "gc_unco_deposits", "name": "GC_UNCO_DEPOSITS", "filterable": True, "filters": ["f-chronostrat-term", "f-byAttribute"], "attributes": ["objectid", "kind", "runc_litho", "runc_structur", "runc_orig_descr", "uuid", "runc_litho_code", "runc_chrono_b_code", "runc_chrono_t_code", "runc_glac_typ_code", "runc_morpholo_code"]},
    {"id": "fgdi", "name": "Federal Geo Data Infrastructure", "filterable": False, "filters": [], "attributes": []},
    {"id": "geologie-geocover", "name": "geologie-geocover", "filterable": False, "filters": [], "attributes": []},
    {"id": "osm", "name": "OpenStreetMap (OSM)", "filterable": False, "filters": [], "attributes": []},
]

VOCABULARIES = [
    {"id": "chronostratigraphy", "name": "Chronostratigraphy"},
    {"id": "tectonic-units", "name": "Tectonic Units"},
    {"id": "lithostratigraphy", "name": "Lithostratigraphy"},
    {"id": "lithology", "name": "Lithology"},
]

VOCAB_TERMS = {
    "chronostratigraphy": ["https://dev-lexic.swissgeol.ch/Chronostratigraphy/Phanerozoic", "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Paleozoic", "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Cenozoic", "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Mesozoic", "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Proterozoic", "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Paleogene", "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Quaternary", "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Neogene", "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Tertiary", "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Cretaceous"],
    "tectonic-units": ["https://dev-lexic.swissgeol.ch/TectonicUnits/AutochthonousNorthAlpineForeland", "https://dev-lexic.swissgeol.ch/TectonicUnits/BresseGraben", "https://dev-lexic.swissgeol.ch/TectonicUnits/UpperRhineGraben", "https://dev-lexic.swissgeol.ch/TectonicUnits/SouthGermanPlatform", "https://dev-lexic.swissgeol.ch/TectonicUnits/TransitionZoneBetweenDetachedAndAutochthonousNorthAlpineForeland", "https://dev-lexic.swissgeol.ch/TectonicUnits/DetachedNorthAlpineForeland", "https://dev-lexic.swissgeol.ch/TectonicUnits/ExternalFoldedJura", "https://dev-lexic.swissgeol.ch/TectonicUnits/SubalpineMolasse", "https://dev-lexic.swissgeol.ch/TectonicUnits/InternalFoldedJuraAndForelandPlateau", "https://dev-lexic.swissgeol.ch/TectonicUnits/HegauVolcanicSuite"],
    "lithostratigraphy": ["https://dev-lexic.swissgeol.ch/Lithostratigraphy/Servino", "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Grenzposidonienschichten", "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch2", "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch3", "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch4", "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch5", "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch2a", "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch2b", "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch3a", "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch3b"],
    "lithology": ["https://dev-lexic.swissgeol.ch/Lithology/Amphibolite", "https://dev-lexic.swissgeol.ch/Lithology/RockMafic", "https://dev-lexic.swissgeol.ch/Lithology/AmphiboliteBanded", "https://dev-lexic.swissgeol.ch/Lithology/AmphiboliteGarnet", "https://dev-lexic.swissgeol.ch/Lithology/AmphiboliteHornblende", "https://dev-lexic.swissgeol.ch/Lithology/AmphiboliteMigmatitic", "https://dev-lexic.swissgeol.ch/Lithology/RockCrystalline", "https://dev-lexic.swissgeol.ch/Lithology/Eclogite", "https://dev-lexic.swissgeol.ch/Lithology/Serpentinite", "https://dev-lexic.swissgeol.ch/Lithology/Prasinite"],
}

VOCAB_FILTER_MAP = {
    "chronostratigraphy": "f-chronostrat-term",
    "tectonic-units": "f-tectonic-term",
    "lithostratigraphy": "f-lithostrat-term",
    "lithology": "f-lithology-term",
}

EXPECTED_WMS_RESPONSE = {
    "url": "https://wms.example.com/geoserver/wms?service=WMS&version=1.3.0&request=GetMap&layers=gc_bedrock&crs=EPSG:3857&bbox=700000,100000,800000,200000&width=256&height=256&format=image/png&transparent=true&CQL_FILTER=1=1",
    "mimeType": "image/png",
    "note": "The WMS URL includes encoded semantic query parameters.",
}


def canonical_json(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def http_get(path):
    with urllib.request.urlopen(BASE_URL + path) as response:
        body = response.read().decode("utf-8")
        return json.loads(body)


def http_post(path, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        BASE_URL + path,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as response:
        body = response.read().decode("utf-8")
        return json.loads(body)


def assert_equal(actual, expected, label):
    if canonical_json(actual) != canonical_json(expected):
        print(f"FAILED: {label}")
        print("Expected:", json.dumps(expected, indent=2, sort_keys=True))
        print("Actual:", json.dumps(actual, indent=2, sort_keys=True))
        sys.exit(1)
    print(f"OK: {label}")


def build_expected_layers_response():
    layer_summaries = []
    for layer in LAYERS:
        available_filters = [
            {"id": fid, "name": FILTER_CATALOG[fid]["name"]}
            for fid in layer["filters"]
        ]
        layer_summaries.append(
            {
                "id": layer["id"],
                "name": layer["name"],
                "filterable": layer["filterable"],
                "availableFilters": available_filters,
            }
        )
    return {"webmapId": EXPECTED_WEBMAP_ID, "layers": layer_summaries}

def build_expected_vocabulary_layers_response(vocabulary_id):
    filter_id = VOCAB_FILTER_MAP[vocabulary_id]
    layers = []
    for layer in LAYERS:
        if filter_id in layer["filters"]:
            layers.append({"id": layer["id"], "name": layer["name"]})
    return {"layers": layers}


def run():
    layers_response = http_get("/layers")
    expected_layers = build_expected_layers_response()
    assert_equal(layers_response, expected_layers, "GET /layers")

    for layer in LAYERS:
        filters_resp = http_get(f"/layers/{layer['id']}/filters")
        expected_filters = [FILTER_CATALOG[fid] for fid in layer["filters"]]
        assert_equal(
            filters_resp,
            {"layerId": layer["id"], "filters": expected_filters},
            f"GET /layers/{layer['id']}/filters",
        )

        attributes_resp = http_get(f"/layers/{layer['id']}/attributeList")
        assert_equal(
            attributes_resp,
            {"layerId": layer["id"], "attributes": layer["attributes"]},
            f"GET /layers/{layer['id']}/attributeList",
        )

    vocab_response = http_get("/vocabularies")
    assert_equal(vocab_response, {"vocabularies": VOCABULARIES}, "GET /vocabularies")

    for vocab in VOCABULARIES:
        terms_resp = http_get(f"/vocabularies/{vocab['id']}/terms")
        assert_equal(
            terms_resp,
            {"terms": VOCAB_TERMS[vocab["id"]]},
            f"GET /vocabularies/{vocab['id']}/terms",
        )

        vocab_layers_resp = http_get(f"/vocabularies/{vocab['id']}/layers")
        assert_equal(
            vocab_layers_resp,
            build_expected_vocabulary_layers_response(vocab["id"]),
            f"GET /vocabularies/{vocab['id']}/layers",
        )

    wms_body = {
        "webmapId": EXPECTED_WEBMAP_ID,
        "layerId": "gc_bedrock",
        "filters": [],
    }
    wms_resp = http_post("/wms", wms_body)
    assert_equal(wms_resp, EXPECTED_WMS_RESPONSE, "POST /wms")


if __name__ == "__main__":
    run()
    print("All smoke tests passed.")
