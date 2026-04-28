/**
 * Layout of the Show / Hide toggle.
 *
 *  - `icon-label` (default) — eye icon + the word "Show" / "Hide"
 *  - `icon-only`            — just the icon, with an aria-label
 *  - `label-only`           — just the word, no glyph
 *
 * One of icon or label MUST be visible — there is no "no-affordance" mode.
 */
export type SensitiveDataLayout = 'icon-label' | 'icon-only' | 'label-only';
