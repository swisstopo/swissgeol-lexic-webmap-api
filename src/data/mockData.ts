/**
 * Mock dataset definitions for the WebMap API.
 * This file centralizes all hard-coded data returned by the mock endpoints.
 */

import type {
  FilterDefinition,
  FilterId,
} from "../types/filters/mockFilterTypes";
import type { LayerDefinition } from "../types/layers/mockLayerTypes";
import type {
  VocabularyDefinition,
  VocabularyFilterMap,
  VocabularyTermDefinition,
} from "../types/vocabularies/vocabularyMockTypes";
export type {
  FilterDefinition,
  FilterId,
} from "../types/filters/mockFilterTypes";
export type { LayerDefinition } from "../types/layers/mockLayerTypes";
export type { VocabularyLanguage } from "../types/vocabularies/vocabularyLanguageTypes";
export type {
  VocabularyBreadcrumbMap,
  VocabularyDefinition,
  VocabularyFilterMap,
  VocabularyTermDefinition,
  VocabularyTermLocalization,
  VocabularyTermTranslations,
} from "../types/vocabularies/vocabularyMockTypes";

export const WEBMAP_ID = "SwissTopoMap";

export const FILTER_CATALOG: Record<FilterId, FilterDefinition> = {
  "f-chronostrat-term": {
    id: "f-chronostrat-term",
    name: "Chronostratigraphy",
    title: "Filter by Chronostratigraphy term",
    description: "Filter by chronostratigraphy terms",
  },
  "f-tectonic-term": {
    id: "f-tectonic-term",
    name: "Tectonic Units",
    title: "Filter by Tectonic Units term",
    description: "Filter by tectonic unit terms",
  },
  "f-lithostrat-term": {
    id: "f-lithostrat-term",
    name: "Lithostratigraphy",
    title: "Filter by Lithostratigraphy term",
    description: "Filter by lithostratigraphy terms",
  },
  "f-lithology-term": {
    id: "f-lithology-term",
    name: "Lithology",
    title: "Filter by Lithology term",
    description: "Filter by lithology terms",
  },
  "f-byAttribute": {
    id: "f-byAttribute",
    name: "Attribute",
    title: "Filter by Attribute",
    description: "Filter by attributes",
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

export const VOCABULARY_TERM_DETAILS: Record<string, VocabularyTermDefinition[]> = {
  "chronostratigraphy": [
    {
      term: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Phanerozoic",
      translations: {
        en: {
          label: "Phanerozoic",
          description: "Mock description for the Phanerozoic chronostratigraphy term.",
          breadcrumbs: {"0": "Chronostratigraphy", "1": "Phanerozoic"},
        },
        it: {
          label: "Fanerozoico",
          description: "Descrizione mock per il termine cronostratigrafico Phanerozoic.",
          breadcrumbs: {"0": "Cronostratigrafia", "1": "Phanerozoic"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Paleozoic",
      translations: {
        en: {
          label: "Paleozoic",
          description: "Mock description for the Paleozoic chronostratigraphy term.",
          breadcrumbs: {"0": "Chronostratigraphy", "1": "Paleozoic"},
        },
        it: {
          label: "Paleozoico",
          description: "Descrizione mock per il termine cronostratigrafico Paleozoic.",
          breadcrumbs: {"0": "Cronostratigrafia", "1": "Paleozoic"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Cenozoic",
      translations: {
        en: {
          label: "Cenozoic",
          description: "Mock description for the Cenozoic chronostratigraphy term.",
          breadcrumbs: {"0": "Chronostratigraphy", "1": "Cenozoic"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Mesozoic",
      translations: {
        en: {
          label: "Mesozoic",
          description: "Mock description for the Mesozoic chronostratigraphy term.",
          breadcrumbs: {"0": "Chronostratigraphy", "1": "Mesozoic"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Proterozoic",
      translations: {
        en: {
          label: "Proterozoic",
          description: "Mock description for the Proterozoic chronostratigraphy term.",
          breadcrumbs: {"0": "Chronostratigraphy", "1": "Proterozoic"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Paleogene",
      translations: {
        en: {
          label: "Paleogene",
          description: "Mock description for the Paleogene chronostratigraphy term.",
          breadcrumbs: {"0": "Chronostratigraphy", "1": "Paleogene"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Quaternary",
      translations: {
        en: {
          label: "Quaternary",
          description: "Mock description for the Quaternary chronostratigraphy term.",
          breadcrumbs: {"0": "Chronostratigraphy", "1": "Quaternary"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Neogene",
      translations: {
        en: {
          label: "Neogene",
          description: "Mock description for the Neogene chronostratigraphy term.",
          breadcrumbs: {"0": "Chronostratigraphy", "1": "Neogene"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Tertiary",
      translations: {
        en: {
          label: "Tertiary",
          description: "Mock description for the Tertiary chronostratigraphy term.",
          breadcrumbs: {"0": "Chronostratigraphy", "1": "Tertiary"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Cretaceous",
      translations: {
        en: {
          label: "Cretaceous",
          description: "Mock description for the Cretaceous chronostratigraphy term.",
          breadcrumbs: {"0": "Chronostratigraphy", "1": "Cretaceous"},
        },
      },
    },
  ],
  "tectonic-units": [
    {
      term: "https://dev-lexic.swissgeol.ch/TectonicUnits/AutochthonousNorthAlpineForeland",
      translations: {
        en: {
          label: "AutochthonousNorthAlpineForeland",
          description:
            "Mock description for the AutochthonousNorthAlpineForeland tectonic units term.",
          breadcrumbs: {"0": "Tectonic Units", "1": "AutochthonousNorthAlpineForeland"},
        },
        it: {
          label: "AutochthonousNorthAlpineForeland",
          description:
            "Descrizione mock per il termine di unita tettoniche AutochthonousNorthAlpineForeland.",
          breadcrumbs: {"0": "Unita tettoniche", "1": "AutochthonousNorthAlpineForeland"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/TectonicUnits/BresseGraben",
      translations: {
        en: {
          label: "BresseGraben",
          description: "Mock description for the BresseGraben tectonic units term.",
          breadcrumbs: {"0": "Tectonic Units", "1": "BresseGraben"},
        },
        it: {
          label: "BresseGraben",
          description: "Descrizione mock per il termine di unita tettoniche BresseGraben.",
          breadcrumbs: {"0": "Unita tettoniche", "1": "BresseGraben"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/TectonicUnits/UpperRhineGraben",
      translations: {
        en: {
          label: "UpperRhineGraben",
          description: "Mock description for the UpperRhineGraben tectonic units term.",
          breadcrumbs: {"0": "Tectonic Units", "1": "UpperRhineGraben"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/TectonicUnits/SouthGermanPlatform",
      translations: {
        en: {
          label: "SouthGermanPlatform",
          description: "Mock description for the SouthGermanPlatform tectonic units term.",
          breadcrumbs: {"0": "Tectonic Units", "1": "SouthGermanPlatform"},
        },
      },
    },
    {
      term:
        "https://dev-lexic.swissgeol.ch/TectonicUnits/TransitionZoneBetweenDetachedAndAutochthonousNorthAlpineForeland",
      translations: {
        en: {
          label: "TransitionZoneBetweenDetachedAndAutochthonousNorthAlpineForeland",
          description:
            "Mock description for the TransitionZoneBetweenDetachedAndAutochthonousNorthAlpineForeland tectonic units term.",
          breadcrumbs: {
            "0": "Tectonic Units",
            "1": "TransitionZoneBetweenDetachedAndAutochthonousNorthAlpineForeland",
          },
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/TectonicUnits/DetachedNorthAlpineForeland",
      translations: {
        en: {
          label: "DetachedNorthAlpineForeland",
          description:
            "Mock description for the DetachedNorthAlpineForeland tectonic units term.",
          breadcrumbs: {"0": "Tectonic Units", "1": "DetachedNorthAlpineForeland"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/TectonicUnits/ExternalFoldedJura",
      translations: {
        en: {
          label: "ExternalFoldedJura",
          description: "Mock description for the ExternalFoldedJura tectonic units term.",
          breadcrumbs: {"0": "Tectonic Units", "1": "ExternalFoldedJura"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/TectonicUnits/SubalpineMolasse",
      translations: {
        en: {
          label: "SubalpineMolasse",
          description: "Mock description for the SubalpineMolasse tectonic units term.",
          breadcrumbs: {"0": "Tectonic Units", "1": "SubalpineMolasse"},
        },
      },
    },
    {
      term:
        "https://dev-lexic.swissgeol.ch/TectonicUnits/InternalFoldedJuraAndForelandPlateau",
      translations: {
        en: {
          label: "InternalFoldedJuraAndForelandPlateau",
          description:
            "Mock description for the InternalFoldedJuraAndForelandPlateau tectonic units term.",
          breadcrumbs: {
            "0": "Tectonic Units",
            "1": "InternalFoldedJuraAndForelandPlateau",
          },
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/TectonicUnits/HegauVolcanicSuite",
      translations: {
        en: {
          label: "HegauVolcanicSuite",
          description: "Mock description for the HegauVolcanicSuite tectonic units term.",
          breadcrumbs: {"0": "Tectonic Units", "1": "HegauVolcanicSuite"},
        },
      },
    },
  ],
  "lithostratigraphy": [
    {
      term: "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Servino",
      translations: {
        en: {
          label: "Servino",
          description: "Mock description for the Servino lithostratigraphy term.",
          breadcrumbs: {"0": "Lithostratigraphy", "1": "Servino"},
        },
        it: {
          label: "Servino",
          description: "Descrizione mock per il termine litostratigrafico Servino.",
          breadcrumbs: {"0": "Litostratigrafia", "1": "Servino"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Grenzposidonienschichten",
      translations: {
        en: {
          label: "Grenzposidonienschichten",
          description:
            "Mock description for the Grenzposidonienschichten lithostratigraphy term.",
          breadcrumbs: {"0": "Lithostratigraphy", "1": "Grenzposidonienschichten"},
        },
        it: {
          label: "Grenzposidonienschichten",
          description:
            "Descrizione mock per il termine litostratigrafico Grenzposidonienschichten.",
          breadcrumbs: {"0": "Litostratigrafia", "1": "Grenzposidonienschichten"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch2",
      translations: {
        en: {
          label: "Flysch2",
          description: "Mock description for the Flysch2 lithostratigraphy term.",
          breadcrumbs: {"0": "Lithostratigraphy", "1": "Flysch2"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch3",
      translations: {
        en: {
          label: "Flysch3",
          description: "Mock description for the Flysch3 lithostratigraphy term.",
          breadcrumbs: {"0": "Lithostratigraphy", "1": "Flysch3"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch4",
      translations: {
        en: {
          label: "Flysch4",
          description: "Mock description for the Flysch4 lithostratigraphy term.",
          breadcrumbs: {"0": "Lithostratigraphy", "1": "Flysch4"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch5",
      translations: {
        en: {
          label: "Flysch5",
          description: "Mock description for the Flysch5 lithostratigraphy term.",
          breadcrumbs: {"0": "Lithostratigraphy", "1": "Flysch5"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch2a",
      translations: {
        en: {
          label: "Flysch2a",
          description: "Mock description for the Flysch2a lithostratigraphy term.",
          breadcrumbs: {"0": "Lithostratigraphy", "1": "Flysch2a"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch2b",
      translations: {
        en: {
          label: "Flysch2b",
          description: "Mock description for the Flysch2b lithostratigraphy term.",
          breadcrumbs: {"0": "Lithostratigraphy", "1": "Flysch2b"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch3a",
      translations: {
        en: {
          label: "Flysch3a",
          description: "Mock description for the Flysch3a lithostratigraphy term.",
          breadcrumbs: {"0": "Lithostratigraphy", "1": "Flysch3a"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Flysch3b",
      translations: {
        en: {
          label: "Flysch3b",
          description: "Mock description for the Flysch3b lithostratigraphy term.",
          breadcrumbs: {"0": "Lithostratigraphy", "1": "Flysch3b"},
        },
      },
    },
  ],
  "lithology": [
    {
      term: "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite",
      translations: {
        en: {
          label: "Amphibolite",
          description: "Mock description for the Amphibolite lithology term.",
          breadcrumbs: {"0": "Lithology", "1": "Amphibolite"},
        },
        it: {
          label: "Anfibolite",
          description: "Descrizione mock per il termine litologico Amphibolite.",
          breadcrumbs: {"0": "Litologia", "1": "Amphibolite"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithology/RockMafic",
      translations: {
        en: {
          label: "RockMafic",
          description: "Mock description for the RockMafic lithology term.",
          breadcrumbs: {"0": "Lithology", "1": "RockMafic"},
        },
        it: {
          label: "Roccia mafica",
          description: "Descrizione mock per il termine litologico RockMafic.",
          breadcrumbs: {"0": "Litologia", "1": "RockMafic"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithology/AmphiboliteBanded",
      translations: {
        en: {
          label: "AmphiboliteBanded",
          description: "Mock description for the AmphiboliteBanded lithology term.",
          breadcrumbs: {"0": "Lithology", "1": "AmphiboliteBanded"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithology/AmphiboliteGarnet",
      translations: {
        en: {
          label: "AmphiboliteGarnet",
          description: "Mock description for the AmphiboliteGarnet lithology term.",
          breadcrumbs: {"0": "Lithology", "1": "AmphiboliteGarnet"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithology/AmphiboliteHornblende",
      translations: {
        en: {
          label: "AmphiboliteHornblende",
          description: "Mock description for the AmphiboliteHornblende lithology term.",
          breadcrumbs: {"0": "Lithology", "1": "AmphiboliteHornblende"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithology/AmphiboliteMigmatitic",
      translations: {
        en: {
          label: "AmphiboliteMigmatitic",
          description: "Mock description for the AmphiboliteMigmatitic lithology term.",
          breadcrumbs: {"0": "Lithology", "1": "AmphiboliteMigmatitic"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithology/RockCrystalline",
      translations: {
        en: {
          label: "RockCrystalline",
          description: "Mock description for the RockCrystalline lithology term.",
          breadcrumbs: {"0": "Lithology", "1": "RockCrystalline"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithology/Eclogite",
      translations: {
        en: {
          label: "Eclogite",
          description: "Mock description for the Eclogite lithology term.",
          breadcrumbs: {"0": "Lithology", "1": "Eclogite"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithology/Serpentinite",
      translations: {
        en: {
          label: "Serpentinite",
          description: "Mock description for the Serpentinite lithology term.",
          breadcrumbs: {"0": "Lithology", "1": "Serpentinite"},
        },
      },
    },
    {
      term: "https://dev-lexic.swissgeol.ch/Lithology/Prasinite",
      translations: {
        en: {
          label: "Prasinite",
          description: "Mock description for the Prasinite lithology term.",
          breadcrumbs: {"0": "Lithology", "1": "Prasinite"},
        },
      },
    },
  ],
};

export const VOCABULARY_TERMS: Record<string, string[]> = Object.fromEntries(
  Object.entries(VOCABULARY_TERM_DETAILS).map(([vocabularyId, terms]) => [
    vocabularyId,
    terms.map((termDefinition) => termDefinition.term),
  ])
) as Record<string, string[]>;

export const VOCABULARY_FILTER_MAP: VocabularyFilterMap = {
  "chronostratigraphy": "f-chronostrat-term",
  "tectonic-units": "f-tectonic-term",
  "lithostratigraphy": "f-lithostrat-term",
  "lithology": "f-lithology-term",
};
