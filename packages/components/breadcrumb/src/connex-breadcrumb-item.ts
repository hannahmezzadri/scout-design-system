import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * `<connex-breadcrumb-item>` — a single crumb in a breadcrumb chain.
 *
 * Renders as a native `<a>` when `href` is set, a non-clickable `<span>` with
 * `aria-current="page"` when `current` is set (the last crumb), or a disabled
 * span when `disabled` is set.
 *
 * @element connex-breadcrumb-item
 *
 * @attr href      - When set, renders the item as a link to this URL.
 * @attr current   - Marks the item as the current page; renders as non-clickable text.
 * @attr disabled  - Renders the item as non-clickable, de-emphasized text.
 *
 * @slot - The crumb's label.
 */
@customElement('connex-breadcrumb-item')
export class ConnexBreadcrumbItem extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      font-family: var(--connex-font-family-inter);
      font-size: var(--connex-font-size-14);
      line-height: var(--connex-font-line-height-21);
    }

    /* Trailing chevron separator. Skipped on the current item, the last item,
       and when the parent breadcrumb is in back mode (only one item rendered). */
    :host::after {
      content: '';
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      margin: 0 var(--connex-space-4);
      flex-shrink: 0;
      color: var(--connex-text-display-secondary);
      background-color: currentColor;
      mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor'><path d='M5.97 3.47a.75.75 0 0 1 1.06 0l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 1 1-1.06-1.06L9.44 8 5.97 4.53a.75.75 0 0 1 0-1.06Z'/></svg>");
      -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor'><path d='M5.97 3.47a.75.75 0 0 1 1.06 0l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 1 1-1.06-1.06L9.44 8 5.97 4.53a.75.75 0 0 1 0-1.06Z'/></svg>");
      mask-repeat: no-repeat;
      mask-position: center;
      mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-position: center;
      -webkit-mask-size: contain;
    }
    :host([current])::after,
    :host([data-last])::after,
    :host([data-back])::after {
      display: none;
    }

    /* Link */
    .link {
      color: var(--connex-text-interactive-primary);
      text-decoration: none;
      padding: var(--connex-space-4);
      margin: calc(-1 * var(--connex-space-4));
      border-radius: var(--connex-radius-2);
      transition:
        background var(--connex-motion-duration-fast)
          var(--connex-motion-easing-standard),
        color var(--connex-motion-duration-fast) var(--connex-motion-easing-standard);
    }
    .link:hover {
      background: var(--connex-interactive-background-hover);
      text-decoration: underline;
    }
    .link:active {
      background: var(--connex-interactive-background-pressed);
    }
    .link:focus-visible {
      outline: var(--connex-focus-ring-width) solid var(--connex-focus-ring-color);
      outline-offset: var(--connex-focus-ring-offset);
    }

    /* Current page (last crumb) */
    .current {
      color: var(--connex-text-display-primary);
      font-weight: var(--connex-font-weight-semibold);
    }

    /* Disabled */
    .disabled {
      color: var(--connex-text-display-secondary);
      cursor: not-allowed;
      padding: var(--connex-space-4);
      margin: calc(-1 * var(--connex-space-4));
    }

    @media (prefers-reduced-motion: reduce) {
      .link { transition: none; }
    }
  `;

  @property() href = '';
  @property({ type: Boolean, reflect: true }) current = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  render() {
    if (this.current) {
      return html`<span class="current" aria-current="page"><slot></slot></span>`;
    }
    if (this.disabled) {
      return html`<span class="disabled" aria-disabled="true"><slot></slot></span>`;
    }
    return html`<a class="link" href=${this.href || '#'}><slot></slot></a>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-breadcrumb-item': ConnexBreadcrumbItem;
  }
}
