/**
 * Visual hierarchy of the button.
 *
 * - `primary` — the single most important action on a view.
 * - `secondary` — a supporting action paired with primary.
 * - `tertiary` — text-only, lowest visual emphasis.
 * - `action` — high-emphasis affirmative action (e.g. "Add", "Approve"). Green-anchored.
 * - `critical` — destructive or irreversible action. Red-anchored.
 * - `critical-tertiary` — low-emphasis destructive (text-only red).
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'action'
  | 'critical'
  | 'critical-tertiary';

/**
 * Size aligns with the system's density model.
 * - `default` — matches `[data-density="default"]` page surfaces.
 * - `condensed` — matches `[data-density="condensed"]` data-dense surfaces.
 */
export type ButtonSize = 'default' | 'condensed';

/** Form-association behavior. */
export type ButtonType = 'button' | 'submit' | 'reset';
