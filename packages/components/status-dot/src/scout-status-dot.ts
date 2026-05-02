import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { StatusDotSize, StatusDotType } from './types.js';

/**
 * `<scout-status-dot>` — colored dot + adjacent text used to communicate
 * status inline (e.g., next to an account name, payment row, or queue item).
 *
 * Anatomy: a small filled circle on the left, the slotted text on the right.
 *
 * **Use only for status.** This component is not for general categorization,
 * call-outs, or decorative tags. For those, reach for `<scout-badge>`.
 *
 * @element scout-status-dot
 *
 * @attr {"informational"|"neutral"|"success"|"warning"|"critical"} type - Semantic status.
 * @attr {"default"|"condensed"} size - Density preset.
 *
 * @slot - The status text.
 */
@customElement('scout-status-dot')
export class ScoutStatusDot extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-8);
      font-family: var(--scout-font-family-inter);
      --_sd-dot-size: 10px;
      --_sd-fs: var(--scout-typography-body-font-size);
      --_sd-lh: var(--scout-typography-body-line-height);
      --_sd-fill: var(--scout-color-cool-gray-700);
    }
    :host([size='condensed']),
    :host-context([data-density='condensed']) {
      --_sd-dot-size: 8px;
      --_sd-fs: var(--scout-typography-body-small-font-size);
      --_sd-lh: var(--scout-typography-body-small-line-height);
      gap: var(--scout-space-4);
    }

    /* === Per-status fill === */
    :host([type='informational']) { --_sd-fill: var(--scout-fill-info-bold); }
    :host([type='neutral'])       { --_sd-fill: var(--scout-color-cool-gray-500); }
    :host([type='success'])       { --_sd-fill: var(--scout-fill-success-bold); }
    :host([type='warning'])       { --_sd-fill: var(--scout-fill-warning-bold); }
    :host([type='critical'])      { --_sd-fill: var(--scout-fill-critical-bold); }

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
      color: var(--scout-text-display-primary);
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
    'scout-status-dot': ScoutStatusDot;
  }
}
