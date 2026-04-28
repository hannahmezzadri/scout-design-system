import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@connex/overlay';
import '@connex/control';
import type { DialogSize } from './types.js';

/**
 * `<connex-dialog>` — a modal dialog that displays content while disabling
 * interaction with the page behind it.
 *
 * Use for confirmations, simple flows, important actions, and timeout
 * warnings. The component renders its own scrim (`<connex-overlay>`) and
 * positions the dialog box centered on the viewport.
 *
 * @element connex-dialog
 *
 * @attr open                                  - When set, the dialog renders.
 * @attr {"small"|"medium"|"large"} size       - Dialog width preset.
 * @attr closable                              - When set (default), shows the X close button.
 *
 * @slot icon              - Optional decorative icon next to the title.
 * @slot title             - Title bar text.
 * @slot alert             - Optional inline alert (e.g. <connex-inline-alert>).
 * @slot                   - Default slot: body copy.
 * @slot actions           - Buttons at the bottom of the dialog.
 *
 * @fires connex-dialog-close - Bubbles, composed; fired when the user dismisses.
 */
@customElement('connex-dialog')
export class ConnexDialog extends LitElement {
  static styles = css`
    :host {
      display: contents;
      font-family: var(--connex-font-family-inter);
    }
    .stage {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 2000;
      align-items: center;
      justify-content: center;
      padding: var(--connex-space-24);
      pointer-events: none;
    }
    :host([open]) .stage { display: flex; }

    .panel {
      position: relative;
      pointer-events: auto;
      background: var(--connex-surface-primary);
      color: var(--connex-text-display-primary);
      border-radius: var(--connex-radius-8);
      box-shadow: var(--connex-elevation-4);
      width: 100%;
      max-height: calc(100vh - var(--connex-space-48));
      display: flex;
      flex-direction: column;
      animation: cnx-dialog-in var(--connex-motion-duration-slow)
        var(--connex-motion-easing-enter) both;
    }
    :host([size='small'])  .panel { max-width: 360px; }
    :host([size='medium']) .panel,
    :host(:not([size]))    .panel { max-width: 520px; }
    :host([size='large'])  .panel { max-width: 720px; }

    @keyframes cnx-dialog-in {
      from { opacity: 0; transform: translateY(8px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .panel { animation: none; }
    }

    .header {
      display: flex;
      align-items: center;
      gap: var(--connex-space-12);
      padding: var(--connex-space-16) var(--connex-space-24);
      border-bottom: var(--connex-border-width-1) solid var(--connex-border-secondary);
    }
    .icon[hidden] { display: none; }
    .icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      color: var(--connex-icon-display-primary);
    }
    .title {
      flex: 1;
      min-width: 0;
      font-family: var(--connex-font-family-literata);
      font-weight: var(--connex-font-weight-semibold);
      font-size: var(--connex-font-size-20);
      line-height: var(--connex-font-line-height-30);
    }
    .close { flex-shrink: 0; margin: -8px; }

    .alert { padding: var(--connex-space-16) var(--connex-space-24) 0; }
    .alert[hidden] { display: none; }

    .body {
      padding: var(--connex-space-16) var(--connex-space-24);
      font-size: var(--connex-font-size-14);
      line-height: var(--connex-font-line-height-21);
      overflow-y: auto;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--connex-space-8);
      padding: var(--connex-space-16) var(--connex-space-24);
      border-top: var(--connex-border-width-1) solid var(--connex-border-secondary);
    }
    .actions[hidden] { display: none; }
  `;

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String, reflect: true }) size: DialogSize = 'medium';
  @property({ type: Boolean, reflect: true }) closable = true;

  @state() private _hasIcon = false;
  @state() private _hasAlert = false;
  @state() private _hasActions = false;

  private _onIconSlot = (e: Event) => { this._hasIcon = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0; };
  private _onAlertSlot = (e: Event) => { this._hasAlert = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0; };
  private _onActionsSlot = (e: Event) => { this._hasActions = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0; };

  private _close = () => {
    this.dispatchEvent(new CustomEvent('connex-dialog-close', { bubbles: true, composed: true }));
  };

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this._onKey);
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._onKey);
  }
  private _onKey = (e: KeyboardEvent) => {
    if (this.open && this.closable && e.key === 'Escape') {
      e.preventDefault();
      this._close();
    }
  };

  render() {
    return html`
      <connex-overlay ?open=${this.open} @connex-overlay-click=${() => this.closable && this._close()}></connex-overlay>
      <div class="stage" role="dialog" aria-modal="true">
        <div class="panel">
          <div class="header">
            <span class="icon" ?hidden=${!this._hasIcon}>
              <slot name="icon" @slotchange=${this._onIconSlot}></slot>
            </span>
            <h2 class="title"><slot name="title"></slot></h2>
            ${this.closable
              ? html`<connex-control class="close" type="x-close" size="condensed" aria-label-override="Close dialog" @click=${this._close}></connex-control>`
              : nothing}
          </div>
          <div class="alert" ?hidden=${!this._hasAlert}>
            <slot name="alert" @slotchange=${this._onAlertSlot}></slot>
          </div>
          <div class="body">
            <slot></slot>
          </div>
          <div class="actions" ?hidden=${!this._hasActions}>
            <slot name="actions" @slotchange=${this._onActionsSlot}></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-dialog': ConnexDialog;
  }
}
