import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@scout/overlay';
import '@scout/control';
import type { DialogSize } from './types.js';

/**
 * `<scout-dialog>` — a modal dialog that displays content while disabling
 * interaction with the page behind it.
 *
 * Use for confirmations, simple flows, important actions, and timeout
 * warnings. The component renders its own scrim (`<scout-overlay>`) and
 * positions the dialog box centered on the viewport.
 *
 * @element scout-dialog
 *
 * @attr open                                  - When set, the dialog renders.
 * @attr {"small"|"medium"|"large"} size       - Dialog width preset.
 * @attr closable                              - When set (default), shows the X close button.
 *
 * @slot icon              - Optional decorative icon next to the title.
 * @slot title             - Title bar text.
 * @slot subtext           - Optional supporting text rendered directly below the title.
 * @slot alert             - Optional inline alert (e.g. <scout-inline-alert>).
 * @slot                   - Default slot: body copy.
 * @slot actions           - Buttons at the bottom of the dialog.
 *
 * @fires scout-dialog-close - Bubbles, composed; fired when the user dismisses.
 */
@customElement('scout-dialog')
export class ScoutDialog extends LitElement {
  static styles = css`
    :host {
      display: contents;
      font-family: var(--scout-font-family-inter);
    }
    .stage {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 2000;
      align-items: center;
      justify-content: center;
      padding: var(--scout-space-24);
      pointer-events: none;
    }
    :host([open]) .stage { display: flex; }

    .panel {
      position: relative;
      pointer-events: auto;
      background: var(--scout-surface-primary);
      color: var(--scout-text-display-primary);
      border-radius: var(--scout-radius-8);
      box-shadow: var(--scout-elevation-4);
      width: 100%;
      max-height: calc(100vh - var(--scout-space-48));
      display: flex;
      flex-direction: column;
      animation: cnx-dialog-in var(--scout-motion-duration-slow)
        var(--scout-motion-easing-enter) both;
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
      align-items: flex-start;
      gap: var(--scout-space-12);
      padding: var(--scout-space-16) var(--scout-space-24);
    }
    .icon[hidden] { display: none; }
    .icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      color: var(--scout-icon-display-primary);
    }
    .title-stack {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--scout-space-0);
    }
    /* Title row holds the title + X close button so the X stays vertically
       centered with the title text only — independent of any subtext that
       sits below it in the title-stack. */
    .title-row {
      display: flex;
      align-items: center;
      gap: var(--scout-space-12);
      margin-top: var(--scout-space-4);
    }
    .title {
      flex: 1;
      min-width: 0;
      margin: 0;
      font-family: var(--scout-font-family-literata);
      font-weight: var(--scout-font-weight-semibold);
      font-size: var(--scout-font-size-20);
      line-height: var(--scout-font-line-height-30);
    }
    .subtext {
      /* Zero browser default p margin and set the title→subtext gap
         explicitly. Reduced from ~16px (browser default) to space.8. */
      margin: var(--scout-space-8) 0 0 0;
      font-size: var(--scout-typography-body-small-font-size);
      line-height: var(--scout-typography-body-small-line-height);
      color: var(--scout-text-display-secondary);
    }
    .subtext[hidden] { display: none; }
    .close { flex-shrink: 0; margin: -8px; }

    .alert { padding: var(--scout-space-16) var(--scout-space-24) 0; }
    .alert[hidden] { display: none; }

    .body {
      padding: var(--scout-space-16) var(--scout-space-24);
      /* Extra space.8 below the main paragraph before the actions row. */
      padding-bottom: calc(var(--scout-space-16) + var(--scout-space-8));
      font-size: var(--scout-typography-body-font-size);
      line-height: var(--scout-typography-body-line-height);
      overflow-y: auto;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--scout-space-8);
      padding: var(--scout-space-16) var(--scout-space-24);
      border-top: var(--scout-border-width-1) solid var(--scout-border-secondary);
    }
    .actions[hidden] { display: none; }
  `;

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String, reflect: true }) size: DialogSize = 'medium';
  @property({ type: Boolean, reflect: true }) closable = true;

  @state() private _hasIcon = false;
  @state() private _hasAlert = false;
  @state() private _hasActions = false;
  @state() private _hasSubtext = false;

  private _onIconSlot = (e: Event) => { this._hasIcon = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0; };
  private _onAlertSlot = (e: Event) => { this._hasAlert = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0; };
  private _onActionsSlot = (e: Event) => { this._hasActions = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0; };
  private _onSubtextSlot = (e: Event) => { this._hasSubtext = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0; };

  private _close = () => {
    this.dispatchEvent(new CustomEvent('scout-dialog-close', { bubbles: true, composed: true }));
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
      <scout-overlay ?open=${this.open} @scout-overlay-click=${() => this.closable && this._close()}></scout-overlay>
      <div class="stage" role="dialog" aria-modal="true">
        <div class="panel">
          <div class="header">
            <span class="icon" ?hidden=${!this._hasIcon}>
              <slot name="icon" @slotchange=${this._onIconSlot}></slot>
            </span>
            <div class="title-stack">
              <div class="title-row">
                <h2 class="title"><slot name="title"></slot></h2>
                ${this.closable
                  ? html`<scout-control class="close" type="x-close" size="condensed" aria-label-override="Close dialog" @click=${this._close}></scout-control>`
                  : nothing}
              </div>
              <p class="subtext" ?hidden=${!this._hasSubtext}>
                <slot name="subtext" @slotchange=${this._onSubtextSlot}></slot>
              </p>
            </div>
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
    'scout-dialog': ScoutDialog;
  }
}
