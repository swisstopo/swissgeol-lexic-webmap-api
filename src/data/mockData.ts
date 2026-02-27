/**
 * Mock dataset definitions for the WebMap API.
 * This file centralizes all hard-coded data returned by the mock endpoints.
 */

export type FilterId =
  | "f-chronostrat-term"
  | "f-tectonic-term"
  | "f-lithostrat-term"
  | "f-lithology-term"
  | "f-byAttribute";

export interface FilterDefinition {
  id: FilterId;
  name: string;
  description: string;
}

export interface LayerDefinition {
  id: string;
  name: string;
  filterable: boolean;
  filterIds: FilterId[];
  attributes: string[];
}

export interface VocabularyDefinition {
  id: string;
  name: string;
}

export interface WmsResponse {
  url: string;
  mimeType: string;
  note: string;
}

export const WEBMAP_ID = "SwissTopoMap";

export const FILTER_CATALOG: Record<FilterId, FilterDefinition> = {
  "f-chronostrat-term": {
    id: "f-chronostrat-term",
    name: "Filter by Chronostratigraphy term",
    description: "Filter by chronostratigraphic intervals",
  },
  "f-tectonic-term": {
    id: "f-tectonic-term",
    name: "Filter by Tectonic Units term",
    description: "Filter by tectonic units",
  },
  "f-lithostrat-term": {
    id: "f-lithostrat-term",
    name: "Filter by Lithostratigraphy term",
    description: "Filter by lithostratigraphic units",
  },
  "f-lithology-term": {
    id: "f-lithology-term",
    name: "Filter by Lithology term",
    description: "Filter by lithology classes",
  },
  "f-byAttribute": {
    id: "f-byAttribute",
    name: "Filter by Attribute",
    description: "Filter by attribute key/value",
  },
};

export const FILTER_ATTRIBUTE_MAP: Record<FilterId, string[]> = {
  "f-chronostrat-term": ["chrono_from_lexic", "chrono_to_lexic"],
  "f-tectonic-term": ["tecto_lexic"],
  "f-lithostrat-term": ["litstrat_lexic"],
  "f-lithology-term": ["litho_lexic_1", "litho_lexic_2", "litho_lexic_3"],
  "f-byAttribute": [],
};

export const LAYERS: LayerDefinition[] = [
  {
    id: "TK500",
    name: "TK500",
    filterable: false,
    filterIds: [],
    attributes: [],
  },
  {
    id: "Tecto_Lines",
    name: "Tectonic Lines",
    filterable: false,
    filterIds: [],
    attributes: [],
  },
  {
    id: "Quat_Surfaces",
    name: "Quat Surfaces",
    filterable: false,
    filterIds: [],
    attributes: [],
  },
  {
    id: "tecto_units_augm",
    name: "Tectonic Units",
    filterable: true,
    filterIds: ["f-chronostrat-term", "f-tectonic-term", "f-byAttribute"],
    attributes: [
      "fid",
      "litho_en",
      "lith_en",
    ],
  },
  {
    id: "geocover",
    name: "GeoCover - Vektordaten",
    filterable: false,
    filterIds: [],
    attributes: [],
  },
  {
    id: "gc_bedrock",
    name: "GC_BEDROCK",
    filterable: true,
    filterIds: [
      "f-chronostrat-term",
      "f-tectonic-term",
      "f-lithostrat-term",
      "f-lithology-term",
      "f-byAttribute",
    ],
    attributes: [
      "uuid",
      "fmat_litstrat",
      "objectid",
      "kind",
      "rbed_orig_descr",
      "form_att",
      "fmat_litstrat_code",
    ],
  },
  {
    id: "gc_unco_deposits",
    name: "GC_UNCO_DEPOSITS",
    filterable: true,
    filterIds: ["f-chronostrat-term", "f-byAttribute"],
    attributes: [
      "objectid",
      "kind",
      "runc_litho",
      "runc_structur",
      "runc_orig_descr",
      "uuid",
      "runc_litho_code",
      "runc_chrono_b_code",
      "runc_chrono_t_code",
      "runc_glac_typ_code",
      "runc_morpholo_code",
    ],
  },
  {
    id: "fgdi",
    name: "Federal Geo Data Infrastructure",
    filterable: false,
    filterIds: [],
    attributes: [],
  },
  {
    id: "geologie-geocover",
    name: "geologie-geocover",
    filterable: false,
    filterIds: [],
    attributes: [],
  },
  {
    id: "osm",
    name: "OpenStreetMap (OSM)",
    filterable: false,
    filterIds: [],
    attributes: [],
  },
];

export const VOCABULARIES: VocabularyDefinition[] = [
  { id: "chronostratigraphy", name: "Chronostratigraphy" },
  { id: "tectonic-units", name: "Tectonic Units" },
  { id: "lithostratigraphy", name: "Lithostratigraphy" },
  { id: "lithology", name: "Lithology" },
];

export const VOCABULARY_TERMS: Record<string, string[]> = {
  "chronostratigraphy": [
    "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Phanerozoic",
    "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Paleozoic",
    "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Cenozoic",
    "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Mesozoic",
    "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Proterozoic",
    "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Paleogene",
    "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Quaternary",
    "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Neogene",
    "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Tertiary",
    "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Cretaceous",
  ],
  "tectonic-units": [
    "https://dev-lexic.swissgeol.ch/TectonicUnits/AutochthonousNorthAlpineForeland",
    "https://dev-lexic.swissgeol.ch/TectonicUnits/BresseGraben",
    "https://dev-lexic.swissgeol.ch/TectonicUnits/UpperRhineGraben",
    "https://dev-lexic.swissgeol.ch/TectonicUnits/SouthGermanPlatform",
    "https://dev-lexic.swissgeol.ch/TectonicUnits/TransitionZoneBetweenDetachedAndAutochthonousNorthAlpineForeland",
    "https://dev-lexic.swissgeol.ch/TectonicUnits/DetachedNorthAlpineForeland",
    "https://dev-lexic.swissgeol.ch/TectonicUnits/ExternalFoldedJura",
    "https://dev-lexic.swissgeol.ch/TectonicUnits/SubalpineMolasse",
    "https://dev-lexic.swissgeol.ch/TectonicUnits/InternalFoldedJuraAndForelandPlateau",
    "https://dev-lexic.swissgeol.ch/TectonicUnits/HegauVolcanicSuite",
  ],
  "lithostratigraphy": [
    "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Servino",
    "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Grenzposidonienschichten",
    "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch2",
    "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch3",
    "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch4",
    "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch5",
    "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch2a",
    "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch2b",
    "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch3a",
    "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch3b",
  ],
  "lithology": [
    "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite",
    "https://dev-lexic.swissgeol.ch/Lithology/RockMafic",
    "https://dev-lexic.swissgeol.ch/Lithology/AmphiboliteBanded",
    "https://dev-lexic.swissgeol.ch/Lithology/AmphiboliteGarnet",
    "https://dev-lexic.swissgeol.ch/Lithology/AmphiboliteHornblende",
    "https://dev-lexic.swissgeol.ch/Lithology/AmphiboliteMigmatitic",
    "https://dev-lexic.swissgeol.ch/Lithology/RockCrystalline",
    "https://dev-lexic.swissgeol.ch/Lithology/Eclogite",
    "https://dev-lexic.swissgeol.ch/Lithology/Serpentinite",
    "https://dev-lexic.swissgeol.ch/Lithology/Prasinite",
  ],
};

export const VOCABULARY_FILTER_MAP: Record<string, FilterId> = {
  "chronostratigraphy": "f-chronostrat-term",
  "tectonic-units": "f-tectonic-term",
  "lithostratigraphy": "f-lithostrat-term",
  "lithology": "f-lithology-term",
};

export const WMS_RESPONSE_TEMPLATE: WmsResponse = {
  url: "https://wms.example.com/geoserver/wms?service=WMS&version=1.3.0&request=GetMap&layers={{LAYER_ID}}&crs=EPSG:3857&bbox=700000,100000,800000,200000&width=256&height=256&format=image/png&transparent=true&CQL_FILTER=1=1",
  mimeType: "image/png",
  note: "The WMS URL includes encoded semantic query parameters.",
};
