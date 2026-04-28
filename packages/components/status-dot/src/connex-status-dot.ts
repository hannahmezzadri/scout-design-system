import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { StatusDotSize, StatusDotType } from './types.js';

/**
 * `<connex-status-dot>` — colored dot + adjacent text used to communicate
 * status inline (e.g., next to an account name, payment row, or queue item).
 *
 * Anatomy: a small filled circle on the left, the slotted text on the right.
 *
 * **Use only for status.** This component is not for general categorization,
 * call-outs, or decorative tags. For those, reach for `<connex-badge>`.
 *
 * @element connex-status-dot
 *
 * @attr {"informational"|"neutral"|"success"|"warning"|"critical"} type - Semantic status.
 * @attr {"default"|"condensed"} size - Density preset.
 *
 * @slot - The status text.
 */
@customElement('connex-status-dot')
export class ConnexStatusDot extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--connex-space-8);
      font-family: var(--connex-font-family-inter);
      --_sd-dot-size: 8px;
      --_sd-fs: var(--connex-font-size-14);
      --_sd-lh: var(--connex-font-line-height-21);
      --_sd-fill: var(--connex-color-cool-gray-700);
    }
    :host([size='condensed']) {
      --_sd-dot-size: 6px;
      --_sd-fs: var(--connex-font-size-12);
      --_sd-lh: var(--connex-font-line-height-18);
      gap: var(--connex-space-4);
    }

    /* === Per-status fill === */
    :host([type='informational']) { --_sd-fill: var(--connex-text-interactive-primary); }
    :host([type='neutral'])       { --_sd-fill: var(--connex-color-cool-gray-700); }
    :host([type='success'])       { --_sd-fill: var(--connex-color-green-600); }
    :host([type='warning'])       { --_sd-fill: var(--connex-color-yellow-600); }
    :host([type='critical'])      { --_sd-fill: var(--connex-color-red-600); }

    .dot {
      width: var(--_sd-dot-size);
      height: var(--_sd-dot-size);
      border-radius: 50%;
      background: var(--_sd-fill);
      flex-shrink: 0;
    }
    .text {
      font-size: var(--_sd-fs);
      line-height: var(--_sd-lh);
      color: var(--connex-text-display-primary);
    }
  `;

  @property({ reflect: true }) type: StatusDotType = 'neutral';
  @property({ reflect: true }) size: StatusDotSize = 'default';

  render() {
    return html`
      <span class="dot" part="dot" aria-hidden="true"></span>
      <span class="text" part="text"><slot></slot></span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-status-dot': ConnexStatusDot;
  }
}
