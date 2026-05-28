/**
 * Callback used to resolve one parsed calculate_semantic_constraint(...) call.
 *
 * Arguments are provided in source order after trimming whitespace and removing
 * matching single or double quotes around each value.
 */
export type SemanticConstraintReplacer = (args: string[]) => Promise<string>;

export type MatchInfo = {
  match: string;
  args: string[];
  index: number;
  length: number;
};
