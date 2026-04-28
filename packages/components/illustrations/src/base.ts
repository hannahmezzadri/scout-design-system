import { LitElement, css, html, nothing, type TemplateResult, type SVGTemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { IllustrationSize } from './types.js';

/**
 * `ConnexIllustrationBase` — the contract every Connex illustration extends.
 *
 * Provides:
 *   - The four color slots (`--_illust-{primary,secondary,accent,surface}`)
 *     wired to the brand-aware semantic illustration tokens.
 *   - The four canonical sizes (small / medium / large / x-large).
 *   - One-shot enter motion: when the host scrolls into view for the first
 *     time, an IntersectionObserver toggles a `visible` attribute and the
 *     CSS transitions the illustration in. `prefers-reduced-motion: reduce`
 *     collapses the transition to zero duration.
 *
 * Subclasses override `renderArtwork()` and supply a 200×200 viewBox SVG.
 * Path fills reference `var(--_illust-primary)` etc. so brand and theme
 * changes re-tint without re-exporting.
 */
export class ConnexIllustrationBase extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      flex-shrink: 0;
      vertical-align: middle;
      line-height: 0;

      /* Color slots — wired to brand-aware semantic tokens. Override per host
         instance with inline style if a single illustration needs a custom
         palette. */
      --_illust-primary:   var(--connex-illustration-primary);
      --_illust-secondary: var(--connex-illustration-secondary);
      --_illust-accent:    var(--connex-illustration-accent);
      --_illust-surface:   var(--connex-illustration-surface);

      /* Default size (medium). Per-size overrides below. */
      --_illust-size: 128px;
      width: var(--_illust-size);
      height: var(--_illust-size);

      /* One-shot enter motion. Host opts into the gated enter state via
         data-enter (set in connectedCallback only when the host is actually
         laid out). When the IntersectionObserver flips the visible attribute,
         the transition runs once. Hosts inside a display:none ancestor
         (page-router) skip the gate entirely so they render normally when
         their page becomes visible later. */
      transition:
        opacity var(--connex-motion-duration-deliberate, 600ms)
          var(--connex-motion-easing-enter, cubic-bezier(0, 0, 0.2, 1)),
        transform var(--connex-motion-duration-deliberate, 600ms)
          var(--connex-motion-easing-enter, cubic-bezier(0, 0, 0.2, 1));
    }
    :host([data-enter]:not([visible])) {
      opacity: 0;
      transform: translateY(8px);
    }

    :host([size='small'])   { --_illust-size: 64px; }
    :host([size='medium'])  { --_illust-size: 128px; }
    :host([size='large'])   { --_illust-size: 240px; }
    :host([size='x-large']) { --_illust-size: 320px; }

    svg {
      width: 100%;
      height: 100%;
      display: block;
      overflow: visible;
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        transition: none;
        opacity: 1;
        transform: none;
      }
    }
  `;

  /** Density preset. Default `medium`. */
  @property({ reflect: true }) size: IllustrationSize = 'medium';

  /**
   * Optional accessible label. Illustrations are decorative by default
   * (aria-hidden) but consumers can mark them informative by setting `label`.
   */
  @property() label = '';

  @state() private _visible = false;
  private _observer?: IntersectionObserver;

  connectedCallback(): void {
    super.connectedCallback();
    if (typeof IntersectionObserver === 'undefined') {
      this._show();
      return;
    }
    // Only opt into the enter animation if the host has actual layout (i.e.
    // it's not inside a hidden ancestor like a `display: none` page-router
    // section). For hidden hosts we skip the gate entirely so that when the
    // page becomes visible later, illustrations render normally.
    requestAnimationFrame(() => {
      const laidOut = this.offsetParent !== null || this.getClientRects().length > 0;
      if (!laidOut) {
        this._show();
        return;
      }
      this.setAttribute('data-enter', '');
      this._observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              this._show();
              this._observer?.disconnect();
              this._observer = undefined;
              break;
            }
          }
        },
        { threshold: 0.1 },
      );
      this._observer.observe(this);
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
  }

  private _show() {
    this._visible = true;
    this.toggleAttribute('visible', true);
  }

  /** Subclasses override to provide the SVG body. Default = empty. */
  protected renderArtwork(): SVGTemplateResult | TemplateResult | typeof nothing {
    return nothing;
  }

  render() {
    return html`
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        role=${this.label ? 'img' : 'presentation'}
        aria-hidden=${this.label ? 'false' : 'true'}
        aria-label=${this.label || ''}
      >
        ${this.renderArtwork()}
      </svg>
    `;
  }
}
