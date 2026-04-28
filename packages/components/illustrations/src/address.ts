import { svg } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ScoutIllustrationBase } from './base.js';

/**
 * `<scout-illustration-address>` — an envelope with a pin marker hovering
 * above and three address-line strokes peeking out the top. Visual metaphor
 * for the postal-address surface: location + correspondence.
 *
 * Composition:
 *   - Soft surface oval as the ground shadow
 *   - Envelope body (primary slot) with a flap fold (secondary)
 *   - Three letter-content lines suggesting the address fields
 *   - A pin marker floating above (accent + primary) — the location pin
 *     pattern is well-recognized for "address" without showing a map.
 */
@customElement('scout-illustration-address')
export class ScoutIllustrationAddress extends ScoutIllustrationBase {
  protected renderArtwork() {
    return svg`
      <!-- Backdrop halo -->
      <circle cx="100" cy="118" r="82" fill="var(--_illust-accent)" opacity="0.45" />

      <!-- Envelope body -->
      <rect x="40" y="100" width="120" height="74" rx="6"
            fill="var(--_illust-primary)" />

      <!-- Envelope flap (folded top) -->
      <path d="M40 106 L100 142 L160 106"
            fill="none"
            stroke="var(--_illust-surface)"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round" />

      <!-- Letter peeking out from inside the envelope (top edge) -->
      <rect x="58" y="76" width="84" height="32" rx="4"
            fill="var(--_illust-surface)"
            stroke="var(--_illust-secondary)" stroke-width="1.5" />
      <line x1="68" y1="86" x2="118" y2="86"
            stroke="var(--_illust-secondary)" stroke-width="2" stroke-linecap="round" />
      <line x1="68" y1="94" x2="132" y2="94"
            stroke="var(--_illust-secondary)" stroke-width="2" stroke-linecap="round" />
      <line x1="68" y1="102" x2="100" y2="102"
            stroke="var(--_illust-secondary)" stroke-width="2" stroke-linecap="round" />

      <!-- Pin marker floating above the envelope -->
      <!-- Pin shadow under marker -->
      <ellipse cx="124" cy="76" rx="14" ry="3" fill="var(--_illust-secondary)" opacity="0.35" />
      <!-- Pin body (teardrop) -->
      <path d="M124 28
               C112 28, 104 38, 104 50
               C104 62, 124 74, 124 74
               C124 74, 144 62, 144 50
               C144 38, 136 28, 124 28 Z"
            fill="var(--_illust-primary)" />
      <!-- Pin inner dot (accent) -->
      <circle cx="124" cy="48" r="6" fill="var(--_illust-surface)" />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-illustration-address': ScoutIllustrationAddress;
  }
}
