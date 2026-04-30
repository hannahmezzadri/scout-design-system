import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@scout/control';
import type { SnackbarStatus } from './types.js';

const STATUS_ICONS: Record<SnackbarStatus, ReturnType<typeof svg>> = {
  success: svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd"/>`,
  warning: svg`<path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>`,
  critical: svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm9.75-3.75a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>`,
};

/**
 * `<scout-snackbar>` — temporary, low-impact toast notification.
 *
 * Snackbars confirm an action the application has performed. Use them for
 * brief feedback like "Account created" or "Connection lost — retrying".
 *
 * Dismiss model:
 *   - `success` and `warning` auto-dismiss after `duration` ms (default 4000)
 *     and render an X dismiss control so the user can dismiss earlier.
 *   - `critical` does **not** auto-dismiss and does **not** render a dismiss
 *     control. Critical messages persist until the application removes them
 *     — the user has to acknowledge by acting on the underlying issue.
 *
 * @element scout-snackbar
 *
 * @attr {"success"|"warning"|"critical"} status - Status of the message.
 * @attr {number} duration - Auto-dismiss after N ms. Ignored when `status="critical"`.
 *                            Default `4000` for non-critical; `0` to disable.
 *
 * @slot - Description text.
 *
 * @fires scout-snackbar-dismiss - Fires when the snackbar is removed (auto or user).
 */
@customElement('scout-snackbar')
export class ScoutSnackbar extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      max-width: 420px;
    }

    .snackbar {
      display: flex;
      align-items: center;
      gap: var(--scout-space-12);
      padding: var(--scout-space-12) var(--scout-space-16);
      /* All snackbar statuses share the inverse surface — the status icon
         color does the semantic lifting instead of the background. The
         text/icon inverse tokens flip in dark mode so the snackbar stays
         readable on its (now-light) inverse surface. */
      background: var(--scout-surface-inverse);
      color: var(--scout-text-inverse-primary);
      border-radius: var(--scout-radius-8);
      box-shadow: var(--scout-elevation-3);
      font-family: var(--scout-font-family-inter);
      font-size: var(--scout-typography-body-font-size);
      line-height: var(--scout-typography-body-line-height);
    }

    .status-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    /* Status icon carries the semantic color since the background is now
       always the inverse surface. */
    :host([status='success'])  .status-icon { color: var(--scout-fill-success-bold); }
    :host([status='warning'])  .status-icon { color: var(--scout-fill-warning-bold); }
    :host([status='critical']) .status-icon { color: var(--scout-fill-critical-bold); }

    .description {
      flex: 1;
      min-width: 0;
    }

    /* X dismiss control — sits on the inverse surface, so it pulls from the
       icon.inverse + interactive.background tokens that auto-flip in dark
       mode (where surface.inverse becomes a light tone). */
    .dismiss {
      flex-shrink: 0;
      --_control-fg: var(--scout-icon-inverse-secondary);
      --_control-fg-hover: var(--scout-icon-inverse-primary);
    }
    .dismiss::part(button):hover {
      background: var(--scout-interactive-background-hover);
    }
  `;

  @property({ type: String, reflect: true }) status: SnackbarStatus = 'success';
  @property({ type: Number }) duration = 4000;

  private _timer: number | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this._scheduleDismiss();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._timer != null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('duration') || changed.has('status')) this._scheduleDismiss();
  }

  /** Critical snackbars never auto-dismiss — they persist until the app
   *  removes them. Success / warning auto-dismiss after `duration` ms. */
  private _scheduleDismiss() {
    if (this._timer != null) clearTimeout(this._timer);
    if (this.status === 'critical') return;
    if (this.duration <= 0) return;
    this._timer = window.setTimeout(() => this._dismiss(), this.duration);
  }

  private _dismiss = () => {
    this.dispatchEvent(
      new CustomEvent('scout-snackbar-dismiss', { bubbles: true, composed: true }),
    );
    this.remove();
  };

  render() {
    const showDismiss = this.status !== 'critical';
    return html`
      <div class="snackbar" role="status" aria-live="polite">
        <svg class="status-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          ${STATUS_ICONS[this.status]}
        </svg>
        <div class="description"><slot></slot></div>
        ${showDismiss
          ? html`<scout-control
              class="dismiss"
              type="x-close"
              size="condensed"
              aria-label-override="Dismiss"
              @click=${this._dismiss}
            ></scout-control>`
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-snackbar': ScoutSnackbar;
  }
}
