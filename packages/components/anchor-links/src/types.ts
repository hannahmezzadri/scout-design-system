export type AnchorLinksMode = 'auto-scroll' | 'manual';

export interface AnchorLinkItem {
  /** ID of the target section (without the leading #). */
  id: string;
  /** Visible label rendered in the menu. */
  label: string;
  /** When true, the item is rendered dimmed and skipped from interaction. */
  disabled?: boolean;
  /** Optional inline tag chip (e.g., "soon", "beta") shown after the label. */
  tag?: string;
}
