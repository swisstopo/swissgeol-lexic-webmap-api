/**
 * @file Parser for WMS SEMANTIC_FILTER expressions.
 *
 * The parser keeps all text outside calculate_semantic_constraint(...) calls
 * unchanged, resolves every matched call through the provided callback, and
 * rebuilds the filter string with the resolved CQL fragments.
 */
import type {
  MatchInfo,
  SemanticConstraintReplacer,
} from "../../types/wms/solveSemanticFilterTypes";

/**
 * Resolves every calculate_semantic_constraint(...) call in a semantic filter.
 *
 * Multiple constraint calls are resolved concurrently so independent GraphDB
 * lookups can run in parallel. If the input contains no constraint calls, the
 * original string is returned unchanged.
 *
 * @param filter_string - Semantic filter expression received from the WMS request.
 * @param replacer - Async resolver for each parsed semantic constraint call.
 * @returns The original filter string with semantic constraint calls replaced
 * by their resolved CQL fragments.
 */
export async function solve_semantic_filter(
  filter_string: string,
  replacer: SemanticConstraintReplacer
): Promise<string> {
  const globalPattern = /calculate_semantic_constraint\s*\(([^)]*)\)/gs;

  /*
   * This parser intentionally supports only the generated semantic constraint
   * call shape: comma-separated arguments with optional single or double quotes.
   * It leaves surrounding boolean text untouched so the caller can compose the
   * resolved fragments back into the original expression.
   */
  const parseArguments = (rawArgs: string): string[] => {
    if (rawArgs.trim() === "") return [];

    const args: string[] = [];
    let current = "";
    let quote: '"' | "'" | null = null;

    for (const char of rawArgs) {
      if ((char === '"' || char === "'") && quote === null) {
        quote = char;
        current += char;
        continue;
      }

      if (char === quote) {
        quote = null;
        current += char;
        continue;
      }

      if (char === "," && quote === null) {
        const cleanedArgument = cleanArgument(current);
        if (cleanedArgument !== "") {
          args.push(cleanedArgument);
        }
        current = "";
        continue;
      }

      current += char;
    }

    const cleanedArgument = cleanArgument(current);
    if (cleanedArgument !== "") {
      args.push(cleanedArgument);
    }
    return args;
  };

  const cleanArgument = (arg: string): string => {
    const trimmed = arg.trim();
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];

    if (
      trimmed.length >= 2 &&
      ((first === '"' && last === '"') || (first === "'" && last === "'"))
    ) {
      return trimmed.slice(1, -1);
    }

    return trimmed;
  };

  const matches: MatchInfo[] = [];
  let result: RegExpExecArray | null;

  // Reset lastIndex defensively.
  globalPattern.lastIndex = 0;

  while ((result = globalPattern.exec(filter_string)) !== null) {
    const rawArgs = result[1] ?? "";

    matches.push({
      match: result[0],
      args: parseArguments(rawArgs),
      index: result.index,
      length: result[0].length,
    });

    // Avoid infinite loops on zero-length matches.
    if (result[0].length === 0) {
      globalPattern.lastIndex++;
    }
  }

  if (matches.length === 0) return filter_string;

  // Run all replacements concurrently.
  const replacements = await Promise.all(
    matches.map(({ args }) => replacer(args))
  );

  // Rebuild the string by replacing each matched call.
  let output = "";
  let cursor = 0;

  for (let i = 0; i < matches.length; i++) {
    let match: MatchInfo;
    if (matches[i] !== undefined) {
      match = matches[i] as MatchInfo;
      const { index, length } = match;
      // Add the source segment before the match.
      output += filter_string.slice(cursor, index);
      // Add the replacement string.
      output += replacements[i] ?? "";
      cursor = index + length;
    }
  }

  // Add the final source segment after the last match.
  output += filter_string.slice(cursor);

  return output;
}
