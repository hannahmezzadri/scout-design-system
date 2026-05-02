import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@scout/skeleton';
import type { TileFunctionalState } from './types.js';

/**
 * `<scout-tile-button>` — interactive single-action tile.
 *
 * Use for static information cards on overview / dashboard pages, or as a
 * single click target. The whole tile is the click target — never house links,
 * footer buttons, or header buttons inside one.
 *
 * Anatomy: header, optional subhead, body content (slotted).
 *
 * @element scout-tile-button
 *
 * @attr header   - Header label.
 * @attr subhead  - Optional subhead under the header.
 * @attr disabled - Disables the click target.
 * @attr {"default"|"loading"|"error"} state - Functional state.
 *
 * @slot              - Body content.
 * @slot illustration - Optional spot illustration rendered above the header.
 *
 * @fires scout-tile-click - Bubbles, composed; fired when a non-disabled tile is clicked.
 */
@customElement('scout-tile-button')
export class ScoutTileButton extends LitElement {
  static styles = css`
    :host {
      display: block;
      /* Stretch to row height when the host sits inside a grid (e.g., the
         docs overview pages). Block display + the grid's default stretch
         alignment lets the host take the full row height; min-height 100%
         ensures the inner button fills it edge-to-edge. */
      min-height: 100%;
      font-family: var(--scout-font-family-inter);
    }
    :host([disabled]) { pointer-events: none; }

    button {
      appearance: none;
      width: 100%;
      /* Match the host's stretched height so every tile in a grid row ends at
         the same y. Use a flex column so the body slot can grow naturally. */
      min-height: 100%;
      display: flex;
      flex-direction: column;
      text-align: left;
      /* Theme-aware surface + border (auto-flip in dark mode). */
      background: var(--scout-surface-primary);
      border: var(--scout-border-width-1) var(--scout-stroke-solid)
        var(--scout-border-primary);
      border-radius: var(--scout-radius-8);
      padding: var(--scout-space-16);
      font: inherit;
      color: var(--scout-text-display-primary);
      cursor: pointer;
      transition:
        background var(--scout-motion-duration-fast, 120ms)
          var(--scout-motion-easing-standard, ease),
        border-color var(--scout-motion-duration-fast, 120ms)
          var(--scout-motion-easing-standard, ease),
        box-shadow var(--scout-motion-duration-fast, 120ms)
          var(--scout-motion-easing-standard, ease);
    }
    /* Per spec: hover lifts the tile via elevation.2 instead of changing fill. */
    button:hover:not(:disabled) {
      box-shadow: var(--scout-elevation-2);
    }
    /* Per spec: focus replaces the cool-gray.200 border with a blue.700
       border at the same 1px width — no extra outline. The box-shadow
       reinforces focus for users who can't see color. */
    button:focus-visible {
      outline: none;
      border-color: var(--scout-interactive-background-brand-strong-pressed);
      box-shadow: var(--scout-elevation-2);
    }
    button:active:not(:disabled) {
      background: var(--scout-interactive-background-pressed);
    }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .header {
      font-size: var(--scout-font-size-16);
      font-weight: var(--scout-font-weight-semibold);
      line-height: var(--scout-font-line-height-24);
      color: var(--scout-text-display-primary);
    }
    .subhead {
      font-size: var(--scout-font-size-12);
      color: var(--scout-text-display-secondary);
      margin-top: 2px;
    }
    .body {
      margin-top: var(--scout-space-12);
      font-size: var(--scout-font-size-14);
      line-height: var(--scout-font-line-height-21);
      color: var(--scout-text-display-secondary);
    }

    /* Loading state — replace body with a stack of skeleton lines */
    .loading {
      display: flex;
      flex-direction: column;
      gap: var(--scout-space-8);
      margin-top: var(--scout-space-12);
    }
    /* Error state — error icon + message stand in for the body */
    .error {
      margin-top: var(--scout-space-12);
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-8);
      color: var(--scout-text-display-critical);
      font-size: var(--scout-font-size-14);
    }
    .error svg { width: 20px; height: 20px; flex-shrink: 0; fill: currentColor; }
  `;

  @property() header = '';
  @property() subhead = '';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ reflect: true }) state: TileFunctionalState = 'default';

  private _onClick = () => {
    if (this.disabled || this.state !== 'default') return;
    this.dispatchEvent(new CustomEvent('scout-tile-click', { bubbles: true, composed: true }));
  };

  private _renderBody() {
    if (this.state === 'loading') {
      return html`<div class="loading">
        <scout-skeleton shape="line" width="80%"></scout-skeleton>
        <scout-skeleton shape="line"></scout-skeleton>
        <scout-skeleton shape="line" width="60%"></scout-skeleton>
      </div>`;
    }
    if (this.state === 'error') {
      return html`<div class="error" role="alert">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm9.75-3.75a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>
        </svg>
        <span><slot name="error-message">Couldn't load this tile.</slot></span>
      </div>`;
    }
    return html`<div class="body"><slot></slot></div>`;
  }

  render() {
    return html`
      <button type="button" ?disabled=${this.disabled} @click=${this._onClick}>
        <slot name="illustration"></slot>
        <div class="header">${this.header}</div>
        ${this.subhead ? html`<div class="subhead">${this.subhead}</div>` : nothing}
        ${this._renderBody()}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-tile-button': ScoutTileButton;
  }
}
