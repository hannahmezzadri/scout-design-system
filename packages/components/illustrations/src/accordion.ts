import { svg } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ScoutIllustrationBase } from './base.js';

/**
 * `<scout-illustration-accordion>` — three stacked panels with the middle
 * panel expanded showing content lines. Visual metaphor for the accordion's
 * disclosure pattern: rows reveal nested content on demand.
 *
 * Composition:
 *   - Soft surface circle behind the stack (accent slot)
 *   - Three panel rectangles (primary slot for the active panel; secondary
 *     for the resting panels)
 *   - Tiny content lines inside the active panel
 *   - A chevron rotated downward on the active panel
 */
@customElement('scout-illustration-accordion')
export class ScoutIllustrationAccordion extends ScoutIllustrationBase {
  protected renderArtwork() {
    return svg`
      <!-- Backdrop: soft accent halo so the stack reads against the surface -->
      <circle cx="100" cy="100" r="86" fill="var(--_illust-accent)" opacity="0.45" />

      <!-- Top panel — collapsed -->
      <rect x="42" y="50" width="116" height="22" rx="6"
            fill="var(--_illust-surface)"
            stroke="var(--_illust-secondary)" stroke-width="1.5" />
      <line x1="56" y1="61" x2="100" y2="61"
            stroke="var(--_illust-secondary)" stroke-width="2.5" stroke-linecap="round" />
      <!-- top chevron, pointing right -->
      <polyline points="142,57 148,61 142,65"
                fill="none" stroke="var(--_illust-secondary)" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" />

      <!-- Middle panel — expanded -->
      <rect x="42" y="78" width="116" height="58" rx="8"
            fill="var(--_illust-primary)" />
      <line x1="56" y1="89" x2="110" y2="89"
            stroke="var(--_illust-surface)" stroke-width="3" stroke-linecap="round" />
      <!-- chevron pointing down on active row -->
      <polyline points="138,87 145,93 152,87"
                fill="none" stroke="var(--_illust-surface)" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round" />
      <!-- content lines -->
      <line x1="56" y1="106" x2="140" y2="106"
            stroke="var(--_illust-surface)" stroke-width="2" stroke-linecap="round" opacity="0.7" />
      <line x1="56" y1="116" x2="124" y2="116"
            stroke="var(--_illust-surface)" stroke-width="2" stroke-linecap="round" opacity="0.7" />
      <line x1="56" y1="126" x2="92"  y2="126"
            stroke="var(--_illust-surface)" stroke-width="2" stroke-linecap="round" opacity="0.7" />

      <!-- Bottom panel — collapsed -->
      <rect x="42" y="142" width="116" height="22" rx="6"
            fill="var(--_illust-surface)"
            stroke="var(--_illust-secondary)" stroke-width="1.5" />
      <line x1="56" y1="153" x2="92" y2="153"
            stroke="var(--_illust-secondary)" stroke-width="2.5" stroke-linecap="round" />
      <polyline points="142,149 148,153 142,157"
                fill="none" stroke="var(--_illust-secondary)" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-illustration-accordion': ScoutIllustrationAccordion;
  }
}
