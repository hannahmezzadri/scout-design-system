import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@scout/control';
import type { SystemOutageStatus } from './types.js';

const STATUS_ICONS: Record<SystemOutageStatus, ReturnType<typeof svg>> = {
  'platform-wide-outage': svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm9.75-3.75a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>`,
  'feature-outage': svg`<path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>`,
  'outage-restored': svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd"/>`,
};

/**
 * `<scout-system-outage>` — full-width system banner for outages and recovery.
 *
 * Use at the top of an app to surface platform-wide outages, feature degradation,
 * or restored service. The banner takes full container width and inverts its
 * background by status to be impossible to miss.
 *
 * @element scout-system-outage
 *
 * @attr {"platform-wide-outage"|"feature-outage"|"outage-restored"} status - Status of the system event.
 *
 * @slot title - Title text (e.g. "Ember is currently down").
 * @slot       - Description text (default slot).
 * @slot link  - Optional anchor or button to a status page or details.
 *
 * @fires scout-system-outage-close - Bubbles, composed.
 */
@customElement('scout-system-outage')
export class ScoutSystemOutage extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .banner {
      display: flex;
      align-items: flex-start;
      gap: var(--scout-space-12);
      padding: var(--scout-space-12) var(--scout-space-24);
      font-family: var(--scout-font-family-inter);
      color: var(--scout-color-white);
    }

    /* Status backgrounds */
    :host([status='platform-wide-outage']) .banner {
      background: var(--scout-color-red-700);
    }
    :host([status='feature-outage']) .banner {
      background: var(--scout-color-yellow-700);
    }
    :host([status='outage-restored']) .banner {
      background: var(--scout-color-green-700);
    }

    .status-icon {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--scout-space-4);
    }

    .title {
      font-size: var(--scout-font-size-16);
      line-height: var(--scout-font-line-height-24);
      font-weight: var(--scout-font-weight-semibold);
    }
    .title[hidden] { display: none; }

    .description {
      font-size: var(--scout-font-size-14);
      line-height: var(--scout-font-line-height-21);
    }

    .link {
      margin-top: var(--scout-space-4);
    }
    .link[hidden] { display: none; }
    ::slotted(a) {
      color: var(--scout-color-white);
      font-weight: var(--scout-font-weight-semibold);
      text-decoration: underline;
    }
    ::slotted(a:hover) { text-decoration: none; }

    /* The system outage banner is white-on-saturated, so we override the
       Control's primary blue with white via CSS custom property hooks
       exposed by Control. Falls back to ::part if needed. */
    .close {
      flex-shrink: 0;
      margin: -4px;
      color: var(--scout-color-white);
    }
    .close::part(button) {
      color: var(--scout-color-white);
    }
  `;

  @property({ type: String, reflect: true }) status: SystemOutageStatus = 'platform-wide-outage';
  @property({ type: Boolean, reflect: true }) closable = true;

  @state() private _hasTitle = false;
  @state() private _hasLink = false;

  private _close = () => {
    this.dispatchEvent(
      new CustomEvent('scout-system-outage-close', { bubbles: true, composed: true }),
    );
    this.remove();
  };

  private _onTitleSlot = (e: Event) => {
    this._hasTitle = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };
  private _onLinkSlot = (e: Event) => {
    this._hasLink = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };

  render() {
    const role = this.status === 'platform-wide-outage' ? 'alert' : 'status';
    return html`
      <div class="banner" role=${role} aria-live="polite">
        <svg class="status-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          ${STATUS_ICONS[this.status]}
        </svg>
        <div class="content">
          <div class="title" ?hidden=${!this._hasTitle}>
            <slot name="title" @slotchange=${this._onTitleSlot}></slot>
          </div>
          <div class="description"><slot></slot></div>
          <div class="link" ?hidden=${!this._hasLink}>
            <slot name="link" @slotchange=${this._onLinkSlot}></slot>
          </div>
        </div>
        ${this.closable
          ? html`<scout-control
              class="close"
              type="x-close"
              size="default"
              aria-label-override="Dismiss notice"
              @click=${this._close}
            ></scout-control>`
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-system-outage': ScoutSystemOutage;
  }
}
