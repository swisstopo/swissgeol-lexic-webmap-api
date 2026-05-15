/**
 * @fileoverview Stores the SPARQL query templates reused from the original sandbox GraphDB integration.
 */

import { getGraphDbVocabularyDefinition } from "./vocabularyDefinitions";
import type { PublicVocabularyId, VocabularyQueryConfig } from "./types";

const PREFIX_PLACEHOLDER = /\$\{prefix\}/g;
type NarrowerVocabularyId = Exclude<PublicVocabularyId, "chronostratigraphy">;

const buildVocabularyQueryConfig = (uriSegment: string): VocabularyQueryConfig => ({
  allConcept:
    "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
    `PREFIX ex: <\${prefix}/${uriSegment}/>\n\n` +
    "SELECT ?term ?prefLabel\n" +
    "WHERE {\n" +
    " ?term a skos:Concept . \n" +
    " ?term skos:prefLabel ?prefLabel . \n" +
    " FILTER(LANG(?prefLabel) = 'en') \n" +
    "}",
  allTermData:
    "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n\n" +
    "SELECT ?term ?predicate ?object\n" +
    "WHERE {\n" +
    "  ?term a skos:Concept .\n" +
    "  ?term ?predicate ?object .\n" +
    "  FILTER(?predicate IN (skos:prefLabel, skos:definition, skos:broader))\n" +
    "}",
  queryBreadcrumbs:
    "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
    `PREFIX ex: <\${prefix}/${uriSegment}/>\n\n` +
    "SELECT ?narrowerConcept\n" +
    "WHERE {\n" +
    "  ex:${term} skos:broader+ ?narrowerConcept.\n" +
    "}",
  queryVocabolo:
    "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
    `PREFIX ex: <\${prefix}/${uriSegment}/>\n\n` +
    "SELECT ?predicate ?object\n" +
    "WHERE {\n" +
    "  ex:${term} ?predicate ?object .\n" +
    "}",
});

const resolvePrefixPlaceholder = (
  query: string,
  vocabularyPrefixUrl: string
): string =>
  query.replace(
    PREFIX_PLACEHOLDER,
    vocabularyPrefixUrl.replace(/\/+$/, "")
  );

/**
 * Builds the SPARQL query set for one public vocabulary and resolves the shared
 * `${prefix}` placeholder against the configured vocabulary base URI.
 */
export const resolveGraphDbQueryConfig = (
  vocabulary: PublicVocabularyId,
  vocabularyPrefixUrl: string
): VocabularyQueryConfig => {
  const definition = getGraphDbVocabularyDefinition(vocabulary);
  const queryConfig = buildVocabularyQueryConfig(definition.uriSegment);

  return {
    allConcept: resolvePrefixPlaceholder(queryConfig.allConcept, vocabularyPrefixUrl),
    allTermData: resolvePrefixPlaceholder(
      queryConfig.allTermData,
      vocabularyPrefixUrl
    ),
    queryBreadcrumbs: resolvePrefixPlaceholder(
      queryConfig.queryBreadcrumbs,
      vocabularyPrefixUrl
    ),
    queryVocabolo: resolvePrefixPlaceholder(
      queryConfig.queryVocabolo,
      vocabularyPrefixUrl
    ),
  };
};

/**
 * Shared semantic query used by chronostratigraphy filters to resolve all
 * younger intervals compatible with a selected term.
 */
export const CHRONOSTRATIGRAPHY_QUERY_YOUNGER = `
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX time: <http://www.w3.org/2006/time#>
  PREFIX ex: <\${prefix}/Chronostratigraphy/>
  
  SELECT DISTINCT ?concept
  WHERE {
    BIND(ex:\${term} AS ?subject)
    {
      ?subject time:intervalMeets+ ?concept .
    }
    UNION {
      ?subject time:intervalFinishedBy+ ?narrower .
      ?narrower time:intervalMeets+ ?concept .
    }
    UNION {
      ?subject skos:broader+ ?broader .
      ?broader time:intervalMeets+ ?concept .
    }
    UNION {
      {
        ?subject time:intervalMeets+ ?intermediateObject .
      }
      UNION {
        ?subject time:intervalFinishedBy+ ?narrower .
        ?narrower time:intervalMeets+ ?intermediateObject .
      }
      UNION {
        ?subject skos:broader+ ?broader .
        ?broader time:intervalMeets+ ?intermediateObject .
      }
      ?intermediateObject skos:narrower+ ?concept .
    }
  }`;

/**
 * Shared semantic query used by chronostratigraphy filters to resolve all
 * older intervals compatible with a selected term.
 */
export const CHRONOSTRATIGRAPHY_QUERY_OLDER = `
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX time: <http://www.w3.org/2006/time#>
  PREFIX ex: <\${prefix}/Chronostratigraphy/>
  
  SELECT DISTINCT ?concept
  WHERE {
    BIND(ex:\${term} AS ?subject)
    {
      ?subject time:intervalMetBy+ ?concept .
    }
    UNION {
      ?subject time:intervalStartedBy+ ?narrower .
      ?narrower time:intervalMetBy+ ?concept .
    }
    UNION {
      ?subject skos:broader+ ?broader .
      ?broader time:intervalMetBy+ ?concept .
    }
    UNION {
      {
        ?subject time:intervalMetBy+ ?intermediateObject .
      }
      UNION {
        ?subject time:intervalStartedBy+ ?narrower .
        ?narrower time:intervalMetBy+ ?intermediateObject .
      }
      UNION {
        ?subject skos:broader+ ?broader .
        ?broader time:intervalMetBy+ ?intermediateObject .
      }
      ?intermediateObject skos:narrower+ ?concept .
    }
    UNION {
      {
        ?subject time:intervalMetBy+ ?intervalFinishes .
      }
      UNION {
        ?subject time:intervalStartedBy+ ?narrower .
        ?narrower time:intervalMetBy+ ?intervalFinishes .
      }
      UNION {
        ?subject skos:broader+ ?broader .
        ?broader time:intervalMetBy+ ?intervalFinishes .
      }
      ?intervalFinishes time:intervalFinishes ?concept .
    }
  }`;

/**
 * Shared semantic query used by chronostratigraphy filters to resolve all
 * intervals included between an older and a younger selected term.
 */
export const CHRONOSTRATIGRAPHY_QUERY_BETWEEN = `
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX time: <http://www.w3.org/2006/time#>
  PREFIX ex: <\${prefix}/Chronostratigraphy/>

  SELECT DISTINCT ?concept
  WHERE {
    BIND(ex:\${termOlder} AS ?olderSub)
    BIND(ex:\${termYounger} AS ?youngerSub)

    {
      {
        {
          ?olderSub time:intervalMeets* ?concept2 .
        } UNION {
          ?olderSub time:intervalMeets* ?younger .
          ?younger skos:narrower* ?concept2 .
        } UNION {
          ?olderSub time:intervalStarts* ?concept2 .
        } UNION {
          ?olderSub skos:broader+ ?broaderOld .
          ?broaderOld time:intervalMeets+ ?concept2 .
        }
        ?concept2 skos:narrower* ?concept .
      }
      FILTER EXISTS {
        {
          ?youngerSub time:intervalMetBy* ?concept2 .
        } UNION {
          ?youngerSub time:intervalMetBy* ?older .
          ?older skos:narrower* ?concept2 .
        } UNION {
          ?youngerSub time:intervalFinishes* ?concept2 .
        } UNION {
          ?youngerSub skos:broader+ ?broaderYoung .
          ?broaderYoung time:intervalMetBy+ ?concept2 .
        }
        ?concept2 skos:narrower* ?concept .
      }
    }
  }`;

/**
 * Builds the `narrower` query used by the term-based semantic filters when
 * `includeNarrowers` is enabled for a selected vocabulary term.
 */
export const buildTermFilterNarrowersQuery = (
  vocabularyId: NarrowerVocabularyId
): string => {
  const { uriSegment } = getGraphDbVocabularyDefinition(vocabularyId);

  return (
    "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
    `PREFIX ex: <\${prefix}/${uriSegment}/>\n\n` +
    "SELECT ?concept\n\n" +
    "WHERE { \n" +
    "ex:${term} skos:narrower+ ?concept.\n" +
    "}"
  );
};

/**
 * Builds the scheme-label query used by `/vocabularies` to resolve the public
 * vocabulary name from the configured `skos:ConceptScheme`.
 */
export const buildVocabularyListingSchemeLabelsQuery = (
  schemeUri: string
): string =>
  "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n\n" +
  "SELECT ?prefLabel\n" +
  "WHERE {\n" +
  `  <${schemeUri}> skos:prefLabel ?prefLabel .\n` +
  "}";
