"""
Smoke test script for the WebMap API local server.
The server must be running and reachable via BASE_URL.
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000/v1").rstrip("/")

EXPECTED_WEBMAP_ID = "SwissTopoMap"
EXPECTED_GEOSERVER_BASE_URL = os.environ.get(
    "GEOSERVER_BASE_URL",
    "https://dev-ogcservices.swissgeol.ch/geoserver/swisstopo",
).rstrip("/")

FILTER_CATALOG = {
    "f-chronostrat-term": {"id": "f-chronostrat-term", "name": "Chronostratigraphy", "title": "Filter by Chronostratigraphy term", "description": "Filter by chronostratigraphy terms"},
    "f-tectonic-term": {"id": "f-tectonic-term", "name": "Tectonic Units", "title": "Filter by Tectonic Units term", "description": "Filter by tectonic unit terms"},
    "f-lithostrat-term": {"id": "f-lithostrat-term", "name": "Lithostratigraphy", "title": "Filter by Lithostratigraphy term", "description": "Filter by lithostratigraphy terms"},
    "f-lithology-term": {"id": "f-lithology-term", "name": "Lithology", "title": "Filter by Lithology term", "description": "Filter by lithology terms"},
    "f-byAttribute": {"id": "f-byAttribute", "name": "Attribute", "title": "Filter by Attribute", "description": "Filter by attributes"},
}

LAYERS = [
    {"id": "TK500", "name": "TK500", "filterable": False, "filters": [], "attributes": []},
    {"id": "Tecto_Lines", "name": "Tectonic Lines", "filterable": False, "filters": [], "attributes": []},
    {"id": "Quat_Surfaces", "name": "Quat Surfaces", "filterable": False, "filters": [], "attributes": []},
    {"id": "tecto_units_augm", "name": "Tectonic Units", "filterable": True, "filters": ["f-chronostrat-term", "f-tectonic-term", "f-byAttribute"], "attributes": ["fid", "litho_en", "lith_en", "tecto_lexic", "chrono_from_lexic", "chrono_to_lexic"]},
    {"id": "geocover", "name": "GeoCover - Vektordaten", "filterable": False, "filters": [], "attributes": []},
    {"id": "gc_bedrock", "name": "GC_BEDROCK", "filterable": True, "filters": ["f-chronostrat-term", "f-tectonic-term", "f-lithostrat-term", "f-lithology-term", "f-byAttribute"], "attributes": ["uuid", "litstrat_lexic", "objectid", "chrono_to_lexic", "chrono_from_lexic", "tecto_lexic", "litho_lexic_1", "litho_lexic_2", "litho_lexic_3", "geol_mapping_unit_code"]},
    {"id": "gc_unco_deposits", "name": "GC_UNCO_DEPOSITS", "filterable": True, "filters": ["f-chronostrat-term", "f-byAttribute"], "attributes": ["objectid", "kind", "chrono_to_lexic", "chrono_from_lexic", "runc_litho", "runc_structur", "runc_orig_descr", "uuid", "runc_litho_code", "runc_chrono_b_code", "runc_chrono_t_code", "runc_glac_typ_code", "runc_morpholo_code"]},
    {"id": "fgdi", "name": "Federal Geo Data Infrastructure", "filterable": False, "filters": [], "attributes": []},
    {"id": "geologie-geocover", "name": "geologie-geocover", "filterable": False, "filters": [], "attributes": []},
    {"id": "osm", "name": "OpenStreetMap (OSM)", "filterable": False, "filters": [], "attributes": []},
]

VOCABULARIES = [
    {"id": "chronostratigraphy", "name": "Chronostratigraphy"},
    {"id": "tectonic-units", "name": "Tectonic Units"},
    {"id": "lithostratigraphy", "name": "Lithostratigraphic Units"},
    {"id": "lithology", "name": "Lithology"},
]

VOCABULARIES_ITALIAN = [
    {"id": "chronostratigraphy", "name": "Cronostratigrafia"},
    {"id": "tectonic-units", "name": "Unità tettoniche"},
    {"id": "lithostratigraphy", "name": "Lithostratigraphic Units"},
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

TERM_RESPONSE_SAMPLES = {
    "chronostratigraphy": {
        "default": {
            "term": "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Phanerozoic",
            "label": "Phanerozoic",
            "description": "The Phanerozoic (approx. from 539 Ma ago to the Present) is the main (though not the longest) eon of Earth history, encompassing the Paleozoic, Mesozoic and Cenonoic eras.",
            "breadcrumbs": {},
        },
        "italian": {
            "term": "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Neogene",
            "label": "Neogene",
            "description": "The Neogene (approx. from 23 to 2,6 Ma; formal name for the «late Tertiary») is the middle geochronologic period of the Cenozoic, starting with the Aquitanian age (at the transition from the Paleogene period) and ending with the Piacenzian age (at the transition to the Quaternary period). It is subdivided into two epochs (Miocene and Pliocene).",
            "breadcrumbs": {"0": "Fanerozoico", "1": "Cenozoico"},
        },
        "german": {
            "term": "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Neogene",
            "label": "Neogen",
            "description": "The Neogene (approx. from 23 to 2,6 Ma; formal name for the «late Tertiary») is the middle geochronologic period of the Cenozoic, starting with the Aquitanian age (at the transition from the Paleogene period) and ending with the Piacenzian age (at the transition to the Quaternary period). It is subdivided into two epochs (Miocene and Pliocene).",
            "breadcrumbs": {"0": "Phanerozoikum", "1": "Känozoikum"},
        },
        "french": {
            "term": "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Neogene",
            "label": "Néogène",
            "description": "The Neogene (approx. from 23 to 2,6 Ma; formal name for the «late Tertiary») is the middle geochronologic period of the Cenozoic, starting with the Aquitanian age (at the transition from the Paleogene period) and ending with the Piacenzian age (at the transition to the Quaternary period). It is subdivided into two epochs (Miocene and Pliocene).",
            "breadcrumbs": {"0": "Phanérozoïque", "1": "Cénozoïque"},
        },
    },
    "tectonic-units": {
        "default": {
            "term": "https://dev-lexic.swissgeol.ch/TectonicUnits/AutochthonousNorthAlpineForeland",
            "label": "Autochthonous North Alpine Foreland",
            "description": "The Autochthonous North Alpine Foreland consists of the European platform with its Cenozoic graben structures of eastern France, southwestern Germany and northern Switzerland. The boundary between the Autochthonous North Alpine Foreland and the Detached North Alpine Foreland marks the northernmost limit of significant Alpine compressional deformation.",
            "breadcrumbs": {"0": "North Alpine Foreland"},
        },
        "italian": {
            "term": "https://dev-lexic.swissgeol.ch/TectonicUnits/AutochthonousNorthAlpineForeland",
            "label": "Avampaese nordalpino autoctono",
            "description": "The Autochthonous North Alpine Foreland consists of the European platform with its Cenozoic graben structures of eastern France, southwestern Germany and northern Switzerland. The boundary between the Autochthonous North Alpine Foreland and the Detached North Alpine Foreland marks the northernmost limit of significant Alpine compressional deformation.",
            "breadcrumbs": {"0": "Avampaese nordalpino"},
        },
        "german": {
            "term": "https://dev-lexic.swissgeol.ch/TectonicUnits/AutochthonousNorthAlpineForeland",
            "label": "Autochthones Nordalpines Vorland",
            "description": "The Autochthonous North Alpine Foreland consists of the European platform with its Cenozoic graben structures of eastern France, southwestern Germany and northern Switzerland. The boundary between the Autochthonous North Alpine Foreland and the Detached North Alpine Foreland marks the northernmost limit of significant Alpine compressional deformation.",
            "breadcrumbs": {"0": "Nordalpines Vorland"},
        },
        "french": {
            "term": "https://dev-lexic.swissgeol.ch/TectonicUnits/AutochthonousNorthAlpineForeland",
            "label": "Avant-pays nord-alpin autochtone",
            "description": "The Autochthonous North Alpine Foreland consists of the European platform with its Cenozoic graben structures of eastern France, southwestern Germany and northern Switzerland. The boundary between the Autochthonous North Alpine Foreland and the Detached North Alpine Foreland marks the northernmost limit of significant Alpine compressional deformation.",
            "breadcrumbs": {"0": "Avant-pays nord-alpin"},
        },
    },
    "lithostratigraphy": {
        "default": {
            "term": "https://dev-lexic.swissgeol.ch/Lithostratigraphy/KaiseraugstFormation",
            "label": "Kaiseraugst Formation",
            "description": "",
            "breadcrumbs": {"0": "European Plate"},
        },
        "italian": {
            "term": "https://dev-lexic.swissgeol.ch/Lithostratigraphy/KaiseraugstFormation",
            "label": "Formazione di Kaiseraugst",
            "description": "",
            "breadcrumbs": {"0": "Piatto europeano"},
        },
        "german": {
            "term": "https://dev-lexic.swissgeol.ch/Lithostratigraphy/KaiseraugstFormation",
            "label": "Kaiseraugst-Formation",
            "description": "",
            "breadcrumbs": {"0": "Europäische Platte"},
        },
        "french": {
            "term": "https://dev-lexic.swissgeol.ch/Lithostratigraphy/KaiseraugstFormation",
            "label": "Formation de Kaiseraugst",
            "description": "",
            "breadcrumbs": {"0": "Plaque européenne"},
        },
    },
    "lithology": {
        "default": {
            "term": "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite",
            "label": "amphibolite",
            "description": "mafic high-grade metamorphic rock essentially composed of minerals of the amphibole (>30%) and plagioclase groups",
            "breadcrumbs": {"0": "rock", "1": "rock: crystalline", "2": "rock: mafic"},
        },
        "italian": {
            "term": "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite",
            "label": "anfibolite",
            "description": "mafic high-grade metamorphic rock essentially composed of minerals of the amphibole (>30%) and plagioclase groups",
            "breadcrumbs": {"0": "roccia", "1": "roccia: cristallino", "2": "roccia: mafico"},
        },
        "german": {
            "term": "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite",
            "label": "Amphibolit",
            "description": "mafic high-grade metamorphic rock essentially composed of minerals of the amphibole (>30%) and plagioclase groups",
            "breadcrumbs": {"0": "Gestein", "1": "Gestein: kristallin", "2": "Gestein: mafisch"},
        },
        "french": {
            "term": "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite",
            "label": "amphibolite",
            "description": "mafic high-grade metamorphic rock essentially composed of minerals of the amphibole (>30%) and plagioclase groups",
            "breadcrumbs": {"0": "roche", "1": "roche: cristallin", "2": "roche: mafique"},
        },
    },
}

EXPECTED_WMS_RESPONSE = {
    "url": "https://dev-webmap-api.swissgeol.ch/v1/wms",
    "body": 'REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image/png&STYLES=swisstopo:filtered&TRANSPARENT=true&LAYERS=tecto_units_augm&TILED=true&SEMANTIC_FILTER=calculate_semantic_constraint( "tecto_units_augm" , "f-tectonic-term" , "https://dev-lexic.swissgeol.ch/TectonicUnits/AutochthonousNorthAlpineForeland" , "true" )&CRS=EPSG:2056',
    "mimeType": "image/png",
    "note": "The WMS URL includes encoded semantic query parameters.",
}

EXPECTED_WMS_BY_ATTRIBUTE_RESPONSE = {
    "url": "https://dev-webmap-api.swissgeol.ch/v1/wms",
    "body": 'REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image/png&STYLES=swisstopo:filtered&TRANSPARENT=true&LAYERS=tecto_units_augm&TILED=true&SEMANTIC_FILTER=calculate_semantic_constraint( "tecto_units_augm" , "f-byAttribute" , "litho_en" , "ignored" )&CRS=EPSG:2056',
    "mimeType": "image/png",
    "note": "The WMS URL includes encoded semantic query parameters.",
}

EXPECTED_WMTS_RESPONSE = {
    "layerId": "gc_bedrock",
    "source": {
        "urlWMTS": f"{EXPECTED_GEOSERVER_BASE_URL}/gc_bedrock/gwc/service/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities",
        "paramsWMTS": {
            "layer": "gc_bedrock",
            "style": "swisstopo:gc_bedrock",
            "matrixSet": "EPSG:2056",
            "format": "image/png",
        },
        "serverType": "geoserver",
        "crossOrigin": "anonymous",
    },
}


def canonical_json(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def http_get(path):
    with urllib.request.urlopen(BASE_URL + path) as response:
        body = response.read().decode("utf-8")
        return json.loads(body)


def http_get_error(path):
    try:
        with urllib.request.urlopen(BASE_URL + path) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body)
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8")
        return error.code, json.loads(body)


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


def http_post_error(path, payload=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {} if payload is None else {"Content-Type": "application/json"}
    req = urllib.request.Request(
        BASE_URL + path,
        data=data,
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body)
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8")
        return error.code, json.loads(body)


def http_post_form_error(path, payload):
    data = urllib.parse.urlencode(payload).encode("utf-8")
    req = urllib.request.Request(
        BASE_URL + path,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body)
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8")
        return error.code, json.loads(body)


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
        if not layer["filterable"]:
            continue
        available_filters = [
            {
                "id": fid,
                "name": FILTER_CATALOG[fid]["name"],
                "title": FILTER_CATALOG[fid]["title"],
                "description": FILTER_CATALOG[fid]["description"],
            }
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
        if not layer["filterable"]:
            continue
        if filter_id in layer["filters"]:
            layers.append({"id": layer["id"], "name": layer["name"]})
    return {"layers": layers}


def build_expected_default_filters_response(layer_id, term):
    if "/Chronostratigraphy/" in term:
        return {"layerId": layer_id, "filters": []}

    vocabulary_to_filter_id = {
        "/TectonicUnits/": "f-tectonic-term",
        "/Lithostratigraphy/": "f-lithostrat-term",
        "/Lithology/": "f-lithology-term",
    }
    for marker, filter_id in vocabulary_to_filter_id.items():
        if marker in term:
            return {
                "layerId": layer_id,
                "filters": [
                    {
                        "filterId": filter_id,
                        "parameters": {
                            "term": term,
                            "includeNarrowers": True,
                        },
                    }
                ],
            }

    raise AssertionError(f"Unsupported term marker for test fixture: {term}")


def assert_sorted_terms(response, label):
    term_uris = [term["term"] for term in response["terms"]]
    assert_equal(term_uris, sorted(term_uris), label)


def assert_terms_response_shape(response, label):
    if not isinstance(response.get("terms"), list) or len(response["terms"]) == 0:
        print(f"FAILED: {label}")
        print("Response does not contain a non-empty terms list.")
        sys.exit(1)

    for term in response["terms"]:
        if not isinstance(term.get("term"), str):
            print(f"FAILED: {label}")
            print("Term URI is not a string:", term)
            sys.exit(1)
        if not isinstance(term.get("label"), str):
            print(f"FAILED: {label}")
            print("Term label is not a string:", term)
            sys.exit(1)
        if not isinstance(term.get("description"), str):
            print(f"FAILED: {label}")
            print("Term description is not a string:", term)
            sys.exit(1)
        if not isinstance(term.get("breadcrumbs"), dict):
            print(f"FAILED: {label}")
            print("Term breadcrumbs is not an object:", term)
            sys.exit(1)

    assert_sorted_terms(response, f"{label} ordering")


def assert_term_present(response, expected_term, label):
    match = next(
        (term for term in response["terms"] if term["term"] == expected_term["term"]),
        None,
    )
    if match is None:
        print(f"FAILED: {label}")
        print("Expected term not found:", json.dumps(expected_term, indent=2, sort_keys=True))
        sys.exit(1)

    assert_equal(match, expected_term, label)


TERM_LANGUAGE_CASES = [
    ("default", "", "default language"),
    ("italian", "it", "italian language"),
    ("german", "de", "german language"),
    ("french", "fr", "french language"),
]


def run():
    layers_response = http_get("/layers?lang=it")
    expected_layers = build_expected_layers_response()
    assert_equal(layers_response, expected_layers, "GET /layers")

    wmts_response = http_get("/wmts?layerId=gc_bedrock")
    assert_equal(wmts_response, EXPECTED_WMTS_RESPONSE, "GET /wmts")

    for layer in LAYERS:
        if layer["filterable"]:
            filters_resp = http_get(f"/layers/{layer['id']}/filters?lang=it")
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
            continue

        status_code, error_body = http_get_error(f"/layers/{layer['id']}/filters?lang=it")
        assert_equal(
            {"statusCode": status_code, "body": error_body},
            {
                "statusCode": 404,
                "body": {"code": 404, "message": "Layer not found"},
            },
            f"GET /layers/{layer['id']}/filters not configured",
        )

        status_code, error_body = http_get_error(f"/layers/{layer['id']}/attributeList")
        assert_equal(
            {"statusCode": status_code, "body": error_body},
            {
                "statusCode": 404,
                "body": {"code": 404, "message": "Layer not found"},
            },
            f"GET /layers/{layer['id']}/attributeList not configured",
        )

    vocab_response = http_get("/vocabularies")
    assert_equal(vocab_response, {"vocabularies": VOCABULARIES}, "GET /vocabularies")

    italian_vocab_response = http_get("/vocabularies?lang=it")
    assert_equal(
        italian_vocab_response,
        {"vocabularies": VOCABULARIES_ITALIAN},
        "GET /vocabularies italian language",
    )

    for vocab in VOCABULARIES:
        for sample_key, lang_code, label_suffix in TERM_LANGUAGE_CASES:
            query_suffix = "" if not lang_code else f"?lang={lang_code}"
            terms_resp = http_get(f"/vocabularies/{vocab['id']}/terms{query_suffix}")
            assert_terms_response_shape(
                terms_resp,
                f"GET /vocabularies/{vocab['id']}/terms {label_suffix}",
            )
            assert_term_present(
                terms_resp,
                TERM_RESPONSE_SAMPLES[vocab["id"]][sample_key],
                f"GET /vocabularies/{vocab['id']}/terms {sample_key} sample",
            )

        vocab_layers_resp = http_get(f"/vocabularies/{vocab['id']}/layers")
        assert_equal(
            vocab_layers_resp,
            build_expected_vocabulary_layers_response(vocab["id"]),
            f"GET /vocabularies/{vocab['id']}/layers",
        )

    default_filters_cases = [
        (
            "gc_bedrock",
            VOCAB_TERMS["chronostratigraphy"][0],
            build_expected_default_filters_response(
                "gc_bedrock", VOCAB_TERMS["chronostratigraphy"][0]
            ),
            "GET /layers/gc_bedrock/defaultFilters chronostratigraphy",
        ),
        (
            "gc_bedrock",
            VOCAB_TERMS["lithology"][0],
            build_expected_default_filters_response(
                "gc_bedrock", VOCAB_TERMS["lithology"][0]
            ),
            "GET /layers/gc_bedrock/defaultFilters lithology",
        ),
        (
            "tecto_units_augm",
            VOCAB_TERMS["tectonic-units"][2],
            build_expected_default_filters_response(
                "tecto_units_augm", VOCAB_TERMS["tectonic-units"][2]
            ),
            "GET /layers/tecto_units_augm/defaultFilters tectonic-units",
        ),
        (
            "gc_bedrock",
            "https://dev-lexic.swissgeol.ch/Lithology/CustomLithology",
            build_expected_default_filters_response(
                "gc_bedrock",
                "https://dev-lexic.swissgeol.ch/Lithology/CustomLithology",
            ),
            "GET /layers/gc_bedrock/defaultFilters custom lithology term",
        ),
    ]

    for layer_id, term, expected_response, label in default_filters_cases:
        response = http_get(
            f"/layers/{layer_id}/defaultFilters?term={urllib.parse.quote(term, safe='')}"
        )
        assert_equal(response, expected_response, label)

    error_cases = [
        (
            "TK500",
            VOCAB_TERMS["chronostratigraphy"][0],
            404,
            {
                "code": 404,
                "message": "Layer not found",
            },
            "GET /layers/TK500/defaultFilters layer not configured",
        ),
        (
            "gc_unco_deposits",
            VOCAB_TERMS["lithology"][0],
            400,
            {
                "code": 400,
                "message": "Layer does not support the vocabulary inferred from the provided term",
            },
            "GET /layers/gc_unco_deposits/defaultFilters unsupported vocabulary",
        ),
        (
            "gc_bedrock",
            "https://dev-lexic.swissgeol.ch/UnknownVocabulary/Nope",
            400,
            {
                "code": 400,
                "message": "Layer does not support the vocabulary inferred from the provided term",
            },
            "GET /layers/gc_bedrock/defaultFilters unknown term",
        ),
        (
            "gc_bedrock",
            "https://evil.example/Lithology/CustomLithology",
            400,
            {
                "code": 400,
                "message": "Layer does not support the vocabulary inferred from the provided term",
            },
            "GET /layers/gc_bedrock/defaultFilters external vocabulary URI",
        ),
    ]

    for layer_id, term, expected_status, expected_body, label in error_cases:
        status, body = http_get_error(
            f"/layers/{layer_id}/defaultFilters?term={urllib.parse.quote(term, safe='')}"
        )
        assert_equal(status, expected_status, f"{label} status")
        assert_equal(body, expected_body, label)

    status, body = http_get_error("/layers/gc_bedrock/defaultFilters")
    assert_equal(status, 400, "GET /layers/gc_bedrock/defaultFilters missing term status")
    assert_equal(
        body,
        {
            "code": 400,
            "message": "Missing required query parameter 'term'",
        },
        "GET /layers/gc_bedrock/defaultFilters missing term",
    )

    wms_body = {
        "webmapId": EXPECTED_WEBMAP_ID,
        "layerId": "tecto_units_augm",
        "filters": [
            {
                "filterId": "f-tectonic-term",
                "parameters": {
                    "term": "https://dev-lexic.swissgeol.ch/TectonicUnits/AutochthonousNorthAlpineForeland",
                    "includeNarrowers": True,
                },
            }
        ],
    }
    wms_resp = http_post("/generateWmsRequest", wms_body)
    assert_equal(wms_resp, EXPECTED_WMS_RESPONSE, "POST /generateWmsRequest")

    wms_neutral_body = {
        "webmapId": EXPECTED_WEBMAP_ID,
        "layerId": "tecto_units_augm",
        "filters": [
            {
                "filterId": "f-byAttribute",
                "parameters": {
                    "attribute": "litho_en",
                    "value": "ignored",
                },
            }
        ],
    }
    wms_neutral_resp = http_post("/generateWmsRequest", wms_neutral_body)
    assert_equal(
        wms_neutral_resp,
        EXPECTED_WMS_BY_ATTRIBUTE_RESPONSE,
        "POST /generateWmsRequest by-attribute response",
    )


if __name__ == "__main__":
    run()
    print("All smoke tests passed.")
