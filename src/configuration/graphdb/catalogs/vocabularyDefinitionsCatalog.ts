/**
 * Public vocabulary catalog used to bridge API vocabulary identifiers, GraphDB
 * repository environment variables, URI segments, and listing scheme metadata.
 */
export const GRAPHDB_VOCABULARY_DEFINITIONS = [
  {
    id: "chronostratigraphy",
    uriSegment: "Chronostratigraphy",
    repositoryEnvVar: "CHRONOSTRATIGRAPHY_REPO_ID",
    defaultNameEn: "Chronostratigraphy",
    vocabularyListingSchemeUri:
      "https://dev-lexic.swissgeol.ch/Chronostratigraphy",
  },
  {
    id: "tectonic-units",
    uriSegment: "TectonicUnits",
    repositoryEnvVar: "TECTONICUNITS_REPO_ID",
    defaultNameEn: "Tectonic Units",
    vocabularyListingSchemeUri: "https://dev-lexic.swissgeol.ch/TectonicUnits",
  },
  {
    id: "lithostratigraphy",
    uriSegment: "Lithostratigraphy",
    repositoryEnvVar: "LITHOSTRATIGRAPHY_REPO_ID",
    defaultNameEn: "Lithostratigraphy",
    vocabularyListingSchemeUri:
      "https://dev-lexic.swissgeol.ch/Lithostratigraphy/LithostratigraphicUnits",
  },
  {
    id: "lithology",
    uriSegment: "Lithology",
    repositoryEnvVar: "LITHOLOGY_REPO_ID",
    defaultNameEn: "Lithology",
    vocabularyListingSchemeUri: "https://dev-lexic.swissgeol.ch/Lithology/",
  },
] as const;
