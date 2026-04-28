import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { LinkSize, LinkType } from './types.js';

/* Heroicons arrow-top-right-on-square (24/solid) — used for hyperlink type. */
const EXTERNAL_ICON = svg`<path d="M15.75 2.25H21a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0V4.81L8.03 17.03a.75.75 0 0 1-1.06-1.06L19.19 3.75h-3.44a.75.75 0 0 1 0-1.5Z"/><path d="M5.25 6.75A2.25 2.25 0 0 0 3 9v9.75A2.25 2.25 0 0 0 5.25 21h9.75A2.25 2.25 0 0 0 17.25 18.75V13.5a.75.75 0 0 0-1.5 0v5.25c0 .414-.336.75-.75.75H5.25a.75.75 0 0 1-.75-.75V9c0-.414.336-.75.75-.75h5.25a.75.75 0 0 0 0-1.5H5.25Z"/>`;

/**
 * `<connex-link>` — anchor for navigation between files and external pages.
 *
 * @element connex-link
 *
 * @attr href                                          - URL to link to.
 * @attr {"inline"|"standalone"|"hyperlink"} type      - Visual treatment.
 * @attr {"default"|"condensed"} size
 * @attr disabled                                       - Disables the link (inert + de-emphasized).
 * @attr target                                         - Defaults to "_blank" for `type="hyperlink"`.
 *
 * @slot              - Label content.
 * @slot icon-leading - Optional leading icon.
 * @slot icon-trailing - Optional trailing icon. Auto-rendered for `hyperlink` if no slot is provided.
 */
@customElement('connex-link')
export class ConnexLink extends LitElement {
  static styles = css`
    :host {
      display: inline;
      font-family: var(--connex-font-family-inter);
      --_link-fs: var(--connex-font-size-14);
      --_link-icon-size: 14px;
    }
    :host([size='condensed']) {
      --_link-fs: var(--connex-font-size-12);
      --_link-icon-size: 12px;
    }
    :host([disabled]) {
      pointer-events: none;
      opacity: 0.5;
    }

    a {
      display: inline-flex;
      align-items: center;
      gap: var(--connex-space-4);
      color: var(--connex-text-interactive-primary);
      cursor: pointer;
      transition:
        color var(--connex-motion-duration-fast) var(--connex-motion-easing-standard),
        text-decoration-color var(--connex-motion-duration-fast) var(--connex-motion-easing-standard);
    }

    /* Type: inline — always underlined, inherits parent font-size */
    :host([type='inline']) {
      display: inline;
    }
    :host([type='inline']) a {
      display: inline;
      text-decoration: underline;
      text-underline-offset: 0.15em;
      font-size: inherit;
    }
    :host([type='inline']) a:hover {
      color: var(--connex-interactive-background-brand-strong-hover);
    }
    :host([type='inline']) a:active {
      color: var(--connex-interactive-background-brand-strong-pressed);
    }

    /* Type: standalone — no underline default, hover underline */
    :host([type='standalone']) a,
    :host(:not([type])) a {
      font-size: var(--_link-fs);
      font-weight: var(--connex-font-weight-medium);
      text-decoration: none;
    }
    :host([type='standalone']) a:hover,
    :host(:not([type])) a:hover {
      text-decoration: underline;
      text-underline-offset: 0.15em;
      color: var(--connex-interactive-background-brand-strong-hover);
    }
    :host([type='standalone']) a:active,
    :host(:not([type])) a:active {
      color: var(--connex-interactive-background-brand-strong-pressed);
    }

    /* Type: hyperlink — like inline but with external icon */
    :host([type='hyperlink']) {
      display: inline;
    }
    :host([type='hyperlink']) a {
      display: inline-flex;
      vertical-align: baseline;
      text-decoration: underline;
      text-underline-offset: 0.15em;
      font-size: inherit;
    }
    :host([type='hyperlink']) a:hover {
      color: var(--connex-interactive-background-brand-strong-hover);
    }
    :host([type='hyperlink']) a:active {
      color: var(--connex-interactive-background-brand-strong-pressed);
    }

    a:focus-visible {
      outline: var(--connex-focus-ring-width) solid var(--connex-focus-ring-color);
      outline-offset: var(--connex-focus-ring-offset);
      border-radius: var(--connex-radius-2);
    }

    .icon {
      width: var(--_link-icon-size);
      height: var(--_link-icon-size);
      flex-shrink: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      a { transition: none; }
    }
  `;

  @property() href = '#';
  @property({ type: String, reflect: true }) type: LinkType = 'standalone';
  @property({ type: String, reflect: true }) size: LinkSize = 'default';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property() target: string | null = null;
  @property() rel: string | null = null;

  @state() private _hasLeading = false;
  @state() private _hasTrailing = false;

  private _onLeadingSlot = (e: Event) => {
    this._hasLeading = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };
  private _onTrailingSlot = (e: Event) => {
    this._hasTrailing = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };

  render() {
    const isHyperlink = this.type === 'hyperlink';
    // Hyperlinks default to opening in a new tab safely
    const target = this.target ?? (isHyperlink ? '_blank' : null);
    const rel = this.rel ?? (isHyperlink ? 'noopener noreferrer' : null);
    // Auto-render external icon for hyperlink when no custom trailing slot is provided
    const showAutoExternalIcon = isHyperlink && !this._hasTrailing;

    return html`
      <a
        href=${this.disabled ? '' : this.href}
        target=${target ?? (nothing as any)}
        rel=${rel ?? (nothing as any)}
        aria-disabled=${this.disabled ? 'true' : (nothing as any)}
        tabindex=${this.disabled ? '-1' : (nothing as any)}
      >
        <slot name="icon-leading" @slotchange=${this._onLeadingSlot}></slot>
        <slot></slot>
        <slot name="icon-trailing" @slotchange=${this._onTrailingSlot}></slot>
        ${showAutoExternalIcon
          ? html`<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              ${EXTERNAL_ICON}
            </svg>`
          : nothing}
      </a>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-link': ConnexLink;
  }
}
