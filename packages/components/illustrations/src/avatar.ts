import { svg } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ConnexIllustrationBase } from './base.js';

/**
 * `<connex-illustration-avatar>` — abstract shoulders-up figure with a
 * small notification dot. Featureless head (no eyes / mouth) keeps the
 * representation generic; the silhouette reads as "user" without implying
 * a specific gender, age, or identity.
 *
 * Composition:
 *   - Soft surface circle behind the figure (accent slot)
 *   - Abstract head circle (primary)
 *   - Shoulder + torso shape (primary, slightly darker via opacity)
 *   - Tiny notification dot at top-right (accent slot, primary outline)
 */
@customElement('connex-illustration-avatar')
export class ConnexIllustrationAvatar extends ConnexIllustrationBase {
  protected renderArtwork() {
    return svg`
      <!-- Backdrop halo -->
      <circle cx="100" cy="100" r="86" fill="var(--_illust-accent)" opacity="0.5" />

      <!-- Inner surface ring so the figure stands out from the halo -->
      <circle cx="100" cy="100" r="68" fill="var(--_illust-surface)" />

      <!-- Shoulders / torso (curved bottom mass clipped by the surface ring) -->
      <!-- We draw a path that rounds up like a bust silhouette. -->
      <path d="M52 168
               C52 132, 70 116, 100 116
               C130 116, 148 132, 148 168 Z"
            fill="var(--_illust-primary)" />

      <!-- Head -->
      <circle cx="100" cy="92" r="28" fill="var(--_illust-primary)" />

      <!-- Subtle highlight on the head — gives the illustration its
           "soft shading" feel without using a real gradient. -->
      <ellipse cx="92" cy="84" rx="9" ry="5"
               fill="var(--_illust-surface)" opacity="0.18" />

      <!-- Notification dot (accent slot, with a surface-colored inner ring
           so it reads correctly on every brand). -->
      <circle cx="148" cy="64" r="11" fill="var(--_illust-surface)" />
      <circle cx="148" cy="64" r="8"  fill="var(--_illust-primary)" />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-illustration-avatar': ConnexIllustrationAvatar;
  }
}
