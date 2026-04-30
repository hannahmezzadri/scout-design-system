import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DataUnavailableSize } from './types.js';

/**
 * Cloud-with-slash icon — visual cue that the data couldn't be fetched.
 * Distinct from a generic error icon: this signals "the service is the
 * problem, not your input".
 */
/* Heroicons solid `exclamation-triangle` — flags the surface as having a
   data fetch problem the user should notice. */
const ICON = svg`<path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>`;

/**
 * `<scout-data-unavailable>` — inline placeholder for surfaces whose data
 * couldn't be fetched. Use when a service call fails — never for empty
 * states (use the empty-state pattern instead) or for input errors (use
 * scout-inline-alert / scout-text-field error).
 *
 * Anatomy: exclamation-triangle icon + label. The label defaults to
 * `"Data unavailable"`; override per surface ("Couldn't load statements",
 * "Activity unavailable") so the agent knows what's missing.
 *
 * @element scout-data-unavailable
 *
 * @attr label                                          - Message text. Default: `"Data unavailable"`.
 * @attr {"small"|"medium"|"large"} size                 - Density preset.
 *
 * @slot - Optional. Slot content overrides the `label` attr — use when the
 *         message needs richer markup (a link, a status dot, etc.).
 */
@customElement('scout-data-unavailable')
export class ScoutDataUnavailable extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-8);
      font-family: var(--scout-font-family-inter);
      color: var(--scout-text-display-secondary);

      /* Sizing tokens — overridden per [size] below. */
      --_du-icon: 20px;
      --_du-fs: var(--scout-typography-body-font-size);
      --_du-lh: var(--scout-typography-body-line-height);
    }

    :host([size='small']) {
      --_du-icon: 16px;
      --_du-fs: var(--scout-font-size-12);
      --_du-lh: var(--scout-font-line-height-18);
      gap: var(--scout-space-4);
    }
    :host([size='large']) {
      --_du-icon: 24px;
      --_du-fs: var(--scout-font-size-16);
      --_du-lh: var(--scout-font-line-height-24);
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
    'scout-data-unavailable': ScoutDataUnavailable;
  }
}
