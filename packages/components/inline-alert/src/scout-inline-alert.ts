import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@scout/control';
import type { InlineAlertSize, InlineAlertStatus } from './types.js';

/* Hero Icons (24-solid) used to indicate status. Embedded inline so the
 * component has no runtime icon dependency. */
const STATUS_ICONS: Record<InlineAlertStatus, ReturnType<typeof svg>> = {
  informational: svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.732 2.923.305-.158a.75.75 0 0 1 .67 1.34l-.32.165c-1.146.573-2.437-.463-2.126-1.706l.732-2.923-.305.158a.75.75 0 1 1-.67-1.34l.32-.165ZM12 8.25a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" clip-rule="evenodd"/>`,
  favorable: svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd"/>`,
  warning: svg`<path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>`,
  critical: svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.689-4.03a.75.75 0 0 1 1.06 0L12 8.94l.001-.97a.75.75 0 0 1 1.061 0l.97.97-.97.97a.75.75 0 0 1-1.061 0L12 9.061v3.689a.75.75 0 0 1-1.5 0V9.061l-.561.561a.75.75 0 0 1-1.06-1.061l1.06-1.061ZM12 15a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Z" clip-rule="evenodd"/>`,
};

/**
 * `<scout-inline-alert>` — contextual alert embedded in the page flow.
 *
 * @element scout-inline-alert
 *
 * @attr {"informational"|"favorable"|"warning"|"critical"} status - Visual + semantic status.
 * @attr {"default"|"condensed"} size - Padding density.
 * @attr closable - When set, renders a close button that fires `scout-inline-alert-close` and removes the host.
 *
 * @slot title   - Optional title rendered above the message.
 * @slot         - Default slot: the message body.
 * @slot action  - Optional action link or button.
 *
 * @fires scout-inline-alert-close - Bubbles, composed.
 */
@customElement('scout-inline-alert')
export class ScoutInlineAlert extends LitElement {
  static styles = css`
    :host {
      display: block;
      --_cnx-alert-padding-block: var(--scout-space-12);
      --_cnx-alert-padding-inline: var(--scout-space-16);
      --_cnx-alert-icon-size: 20px;
    }
    :host([size='condensed']) {
      --_cnx-alert-padding-block: var(--scout-space-8);
      --_cnx-alert-padding-inline: var(--scout-space-12);
      --_cnx-alert-icon-size: 16px;
    }

    .alert {
      display: flex;
      align-items: flex-start;
      gap: var(--scout-space-12);
      padding: var(--_cnx-alert-padding-block) var(--_cnx-alert-padding-inline);
      border: var(--scout-border-width-1) solid var(--scout-border-secondary);
      border-left-width: 4px;
      border-radius: var(--scout-radius-4);
      font-family: var(--scout-font-family-inter);
      color: var(--scout-text-display-primary);
    }

    /* Status colors: tinted background + colored left border + colored icon */
    :host([status='informational']) .alert {
      background: var(--scout-color-blue-100);
      border-color: var(--scout-border-info);
    }
    :host([status='informational']) .status-icon { color: var(--scout-text-display-info); }

    :host([status='favorable']) .alert {
      background: var(--scout-color-green-100);
      border-color: var(--scout-border-success);
    }
    :host([status='favorable']) .status-icon { color: var(--scout-text-display-success); }

    :host([status='warning']) .alert {
      background: var(--scout-color-yellow-100);
      border-color: var(--scout-border-warning);
    }
    :host([status='warning']) .status-icon { color: var(--scout-text-display-warning); }

    :host([status='critical']) .alert {
      background: var(--scout-color-red-100);
      border-color: var(--scout-border-error);
    }
    :host([status='critical']) .status-icon { color: var(--scout-text-display-error); }

    .status-icon {
      width: var(--_cnx-alert-icon-size);
      height: var(--_cnx-alert-icon-size);
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
      font-size: var(--scout-font-size-14);
      line-height: var(--scout-font-line-height-21);
      font-weight: var(--scout-font-weight-semibold);
    }
    .title[hidden] { display: none; }
    .message {
      font-size: var(--scout-font-size-14);
      line-height: var(--scout-font-line-height-21);
    }
    .action {
      margin-top: var(--scout-space-8);
    }
    .action[hidden] { display: none; }

    .close {
      flex-shrink: 0;
      margin: -4px;
    }
  `;

  @property({ type: String, reflect: true }) status: InlineAlertStatus = 'informational';
  @property({ type: String, reflect: true }) size: InlineAlertSize = 'default';
  @property({ type: Boolean, reflect: true }) closable = false;

  @state() private _hasTitle = false;
  @state() private _hasAction = false;

  private _close = () => {
    this.dispatchEvent(
      new CustomEvent('scout-inline-alert-close', { bubbles: true, composed: true }),
    );
    this.remove();
  };

  private _onTitleSlot = (e: Event) => {
    this._hasTitle = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };
  private _onActionSlot = (e: Event) => {
    this._hasAction = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };

  render() {
    return html`
      <div class="alert" role="alert">
        <svg class="status-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          ${STATUS_ICONS[this.status]}
        </svg>
        <div class="content">
          <div class="title" ?hidden=${!this._hasTitle}>
            <slot name="title" @slotchange=${this._onTitleSlot}></slot>
          </div>
          <div class="message"><slot></slot></div>
          <div class="action" ?hidden=${!this._hasAction}>
            <slot name="action" @slotchange=${this._onActionSlot}></slot>
          </div>
        </div>
        ${this.closable
          ? html`<scout-control
              class="close"
              type="x-close"
              size="condensed"
              aria-label-override="Close alert"
              @click=${this._close}
            ></scout-control>`
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-inline-alert': ScoutInlineAlert;
  }
}
