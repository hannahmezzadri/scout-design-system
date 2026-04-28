import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DataUnavailableSize } from './types.js';

/**
 * Cloud-with-slash icon — visual cue that the data couldn't be fetched.
 * Distinct from a generic error icon: this signals "the service is the
 * problem, not your input".
 */
const ICON = svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm15.59-5.59a.75.75 0 0 0-1.06-1.06L5.59 16.84a.75.75 0 1 0 1.06 1.06l11.19-11.19ZM7.5 12a4.5 4.5 0 0 1 7.348-3.488l-1.07 1.07A3 3 0 0 0 9 12h-1.5Zm5.652 2.418A3 3 0 0 1 9.582 11.4l-1.07 1.07A4.5 4.5 0 0 0 14.91 15.34l-1.758-.922Z" clip-rule="evenodd"/>`;

/**
 * `<connex-data-unavailable>` — inline placeholder for surfaces whose data
 * couldn't be fetched. Use when a service call fails — never for empty
 * states (use the empty-state pattern instead) or for input errors (use
 * connex-inline-alert / connex-text-field error).
 *
 * Anatomy: cloud-with-slash icon + label. The label defaults to
 * `"Data unavailable"`; override per surface ("Couldn't load statements",
 * "Activity unavailable") so the agent knows what's missing.
 *
 * @element connex-data-unavailable
 *
 * @attr label                                          - Message text. Default: `"Data unavailable"`.
 * @attr {"small"|"medium"|"large"} size                 - Density preset.
 *
 * @slot - Optional. Slot content overrides the `label` attr — use when the
 *         message needs richer markup (a link, a status dot, etc.).
 */
@customElement('connex-data-unavailable')
export class ConnexDataUnavailable extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--connex-space-8);
      font-family: var(--connex-font-family-inter);
      color: var(--connex-text-display-secondary);

      /* Sizing tokens — overridden per [size] below. */
      --_du-icon: 20px;
      --_du-fs: var(--connex-font-size-14);
      --_du-lh: var(--connex-font-line-height-21);
    }

    :host([size='small']) {
      --_du-icon: 16px;
      --_du-fs: var(--connex-font-size-12);
      --_du-lh: var(--connex-font-line-height-18);
      gap: var(--connex-space-4);
    }
    :host([size='large']) {
      --_du-icon: 24px;
      --_du-fs: var(--connex-font-size-16);
      --_du-lh: var(--connex-font-line-height-24);
    }

    .icon {
      width: var(--_du-icon);
      height: var(--_du-icon);
      flex-shrink: 0;
      fill: currentColor;
    }
    .label {
      font-size: var(--_du-fs);
      line-height: var(--_du-lh);
    }
  `;

  @property() label = 'Data unavailable';
  @property({ reflect: true }) size: DataUnavailableSize = 'medium';

  render() {
    return html`
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICON}</svg>
      <span class="label" role="status">
        <slot>${this.label}</slot>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-data-unavailable': ConnexDataUnavailable;
  }
}
