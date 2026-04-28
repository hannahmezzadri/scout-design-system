/**
 * Semantic status colors. Mirrors badge type names for cross-component
 * consistency, minus the special-purpose ones (`neutral-knockout`,
 * `ai-summary`) that don't make sense as a single dot.
 */
export type StatusDotType =
  | 'informational'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'critical';

export type StatusDotSize = 'default' | 'condensed';
