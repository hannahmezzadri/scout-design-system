import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SkeletonShape } from './types.js';

/**
 * `<scout-skeleton>` — placeholder shape that animates while content loads.
 *
 * Use to reserve space for content that hasn't arrived yet. The animated
 * shimmer telegraphs activity without committing to a spinner; reserving the
 * dimensions prevents the layout shift when the real content lands.
 *
 * Anatomy: a single rounded rectangle ("background") that fills the supplied
 * width / height. Three shape presets cover the common cases (line, block,
 * circle); attributes override any of them.
 *
 * @element scout-skeleton
 *
 * @attr {"line"|"block"|"circle"} shape - Convenience preset:
 *   - `line` (default): full width, 14px tall, small radius — for text rows.
 *   - `block`:           full width, 96px tall, medium radius — for cards / images.
 *   - `circle`:          square, fully rounded — for avatars and dots.
 * @attr width   - Explicit width override (any CSS length).
 * @attr height  - Explicit height override (any CSS length).
 * @attr radius  - Explicit border-radius override (any CSS length).
 *
 * @cssprop --scout-skeleton-base   - Background color of the resting fill.
 * @cssprop --scout-skeleton-shimmer - Highlight color used by the shimmer pass.
 */
@customElement('scout-skeleton')
export class ScoutSkeleton extends LitElement {
  static styles = css`
    :host {
      display: block;
      /* Tokens: anchored to the cool-gray scale. Consumers can override these
         CSS custom properties to tint the skeleton (e.g. on dark surfaces). */
      --_sk-base: var(--scout-skeleton-base, var(--scout-color-cool-gray-100));
      --_sk-shimmer: var(--scout-skeleton-shimmer, var(--scout-color-cool-gray-200));
      --_sk-radius: var(--scout-radius-4);
      --_sk-w: 100%;
      --_sk-h: 14px;
    }
    /* Dark theme — cool-gray.100/200 are bright on light surfaces but blow
       out against dark surfaces. Drop the base/shimmer down a few steps so
       the skeleton reads as a subtle placeholder instead of a glaring slab.
       :host-context pierces the shadow boundary to read the theme attribute
       on <html>; consumers can still override via the public custom props. */
    :host-context([data-theme='dark']) {
      --_sk-base: var(--scout-skeleton-base, var(--scout-color-cool-gray-800));
      --_sk-shimmer: var(--scout-skeleton-shimmer, var(--scout-color-cool-gray-700));
    }

    /* ---- Shape presets ---- */
    :host([shape='line'])   { --_sk-w: 100%;  --_sk-h: 14px; --_sk-radius: var(--scout-radius-4); }
    :host([shape='block'])  { --_sk-w: 100%;  --_sk-h: 96px; --_sk-radius: var(--scout-radius-8); }
    :host([shape='circle']) {
      --_sk-w: 40px;
      --_sk-h: 40px;
      --_sk-radius: var(--scout-radius-999);
      display: inline-block;
    }

    .bg {
      width: var(--_sk-w);
      height: var(--_sk-h);
      border-radius: var(--_sk-radius);
      background:
        linear-gradient(
          90deg,
          var(--_sk-base) 0%,
          var(--_sk-shimmer) 50%,
          var(--_sk-base) 100%
        );
      background-size: 200% 100%;
      /* Anchor the shimmer cycle to a multiple of the slowest motion token
         (deliberate = 600ms × 3 ≈ 1800ms). The shimmer is an ambient,
         indefinite loop — using a single tier of deliberate makes it twitchy
         and demands attention; tripling gives a calm, low-distraction pulse
         that better signals "loading, not interactive." */
      animation: shimmer
        calc(var(--scout-motion-duration-deliberate, 600ms) * 3)
        var(--scout-motion-easing-standard, ease-in-out) infinite;
    }

    @keyframes shimmer {
      0%   { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }

    /* Honor reduced-motion preference: keep the shape, drop the shimmer */
    @media (prefers-reduced-motion: reduce) {
      .bg {
        animation: none;
        background: var(--_sk-base);
      }
    }
  `;

  @property({ reflect: true }) shape: SkeletonShape = 'line';
  @property({ reflect: true }) width = '';
  @property({ reflect: true }) height = '';
  @property({ reflect: true }) radius = '';

  /** Attribute overrides applied as inline styles on the inner background. */
  private _styleString() {
    const parts: string[] = [];
    if (this.width)  parts.push(`--_sk-w: ${this.width}`);
    if (this.height) parts.push(`--_sk-h: ${this.height}`);
    if (this.radius) parts.push(`--_sk-radius: ${this.radius}`);
    return parts.join('; ');
  }

  render() {
    return html`
      <div
        class="bg"
        part="background"
        style=${this._styleString()}
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label="Loading"
      ></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-skeleton': ScoutSkeleton;
  }
}
