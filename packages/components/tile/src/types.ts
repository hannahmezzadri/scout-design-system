/** Functional state shared by every tile variant. */
export type TileFunctionalState = 'default' | 'loading' | 'error';

/** Footer affordance for tile. */
export type TileFooter = 'none' | 'button-tertiary' | 'show-more';

/**
 * Header state for the workflow tile. Each maps to a specific status
 * affordance:
 *   - not-started        — empty circle with the step number
 *   - active             — focused / current step (blue ring)
 *   - completed-editable — blue check + edit button
 *   - completed-locked   — gray check, no edit button
 */
export type WorkflowHeaderState =
  | 'not-started'
  | 'active'
  | 'completed-editable'
  | 'completed-locked';
