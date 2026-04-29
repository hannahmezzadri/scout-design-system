import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@scout/checkbox';
import '@scout/radio';
import type { AddressOrientation, AddressSelectTool, AddressSize } from './types.js';

/**
 * `<scout-address>` — pre-formatted display of a postal address.
 *
 * Composes optional label, favorite indicator, selector (checkbox/radio),
 * body copy, meta copy, and a "do not disclose" privacy banner.
 *
 * @element scout-address
 *
 * @attr label                            - Optional label rendered above the body (e.g. "Home address").
 * @attr {"full"|"condensed"|"single-line"} size - Layout density. Single-line collapses to one row.
 * @attr {"none"|"checkbox"|"radio"} select-tool - When set, renders a checkbox or radio selector.
 * @attr {"stacked"|"inline"} orientation - Stacked = label above body. Inline = label and body share a row.
 * @attr favorite                         - When present, renders a star next to the label.
 * @attr do-not-disclose                  - When present, renders a privacy banner above the address.
 * @attr selected                         - Toggles the select-tool's checked state.
 * @attr disabled                         - Disables interaction; visually de-emphasizes the card.
 * @attr name                             - Form name (passed to the internal selector input).
 * @attr value                            - Form value (passed to the internal selector input).
 *
 * @slot - Body copy (the address itself). Use line breaks for multi-line layouts.
 * @slot meta - Secondary meta copy (e.g. "Last verified Mar 2024 · Primary").
 *
 * @fires scout-address-change - Bubbling, composed event with `{ selected, value }` detail.
 */
@customElement('scout-address')
export class ScoutAddress extends LitElement {
  static styles = css`
    :host {
      display: block;
      --_cnx-address-body-font-size: var(--scout-typography-body-font-size);
      --_cnx-address-body-line-height: var(--scout-typography-body-line-height);
    }
    :host([size='condensed']) {
      --_cnx-address-body-font-size: var(--scout-typography-body-small-font-size);
      --_cnx-address-body-line-height: var(--scout-typography-body-small-line-height);
    }
    :host([size='single-line']) {
      --_cnx-address-body-font-size: var(--scout-typography-body-font-size);
      --_cnx-address-body-line-height: var(--scout-typography-body-line-height);
    }

    .container {
      display: flex;
      flex-direction: column;
      gap: var(--scout-space-8);
      background: var(--scout-surface-primary);
      border-radius: var(--scout-radius-0);
    }
    :host([disabled]) .container {
      opacity: 0.5;
      pointer-events: none;
    }

    /* Privacy banner */
    .dnd-banner {
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-4);
      align-self: flex-start;
      padding: 2px var(--scout-space-8);
      font-size: var(--scout-font-size-10);
      font-weight: var(--scout-font-weight-semibold);

      background: var(--scout-color-red-100);
      color: var(--scout-text-display-error);
      border-radius: var(--scout-radius-2);
    }
    .dnd-icon {
      width: 12px;
      height: 12px;
      flex-shrink: 0;
    }

    /* Row holds optional select tool + content */
    .row {
      display: flex;
      gap: var(--scout-space-8);
      align-items: flex-start;
    }
    :host([select-tool='none']) .select-cell {
      display: none;
    }
    .select-cell {
      display: flex;
      align-items: flex-start;
    }

    .content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--scout-space-4);
    }

    /* Inline orientation: label and body share a baseline */
    :host([orientation='inline']) .content {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--scout-space-4) var(--scout-space-12);
    }

    /* Header (label + favorite) */
    .header {
      display: flex;
      align-items: center;
      gap: var(--scout-space-8);
    }
    .label {
      font-family: var(--scout-font-family-inter);
      font-size: var(--scout-font-size-12);
      font-weight: var(--scout-font-weight-semibold);
      color: var(--scout-text-display-primary);
    }
    .favorite-icon {
      width: 14px;
      height: 14px;
      color: var(--scout-color-yellow-500);
      flex-shrink: 0;
    }
    .header[hidden] {
      display: none;
    }

    /* Body */
    .body {
      font-family: var(--scout-font-family-inter);
      font-style: normal;
      font-size: var(--_cnx-address-body-font-size);
      line-height: var(--_cnx-address-body-line-height);
      color: var(--scout-text-display-primary);
      margin: 0;
    }
    :host([size='single-line']) .body {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }
    :host([size='single-line']) ::slotted(br) {
      display: none;
    }

    /* Meta */
    .meta {
      font-size: var(--scout-font-size-12);
      line-height: var(--scout-font-line-height-18);
      color: var(--scout-text-display-secondary);
    }
    .meta[hidden] {
      display: none;
    }

  `;

  /** Optional label (e.g. "Home address"). */
  @property() label = '';

  /** Layout density. */
  @property({ type: String, reflect: true }) size: AddressSize = 'full';

  /** Optional selector (checkbox or radio). */
  @property({ type: String, reflect: true, attribute: 'select-tool' })
  selectTool: AddressSelectTool = 'none';

  /** Layout direction. */
  @property({ type: String, reflect: true }) orientation: AddressOrientation = 'stacked';

  /** Renders a star next to the label. */
  @property({ type: Boolean, reflect: true }) favorite = false;

  /** Renders a "Do not disclose" privacy banner. */
  @property({ type: Boolean, reflect: true, attribute: 'do-not-disclose' })
  doNotDisclose = false;

  /** Toggles the select-tool's checked state. */
  @property({ type: Boolean, reflect: true }) selected = false;

  /** Disables interaction. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Form name (for the internal selector input). */
  @property() name = '';

  /** Form value (for the internal selector input). */
  @property() value = '';

  /** Whether meta-slot has assigned content. */
  @state() private _hasMeta = false;

  private _onSelect = (e: Event) => {
    const target = e.currentTarget as HTMLElement & { checked: boolean };
    this.selected = !!target.checked;
    this.dispatchEvent(
      new CustomEvent<{ selected: boolean; value: string }>('scout-address-change', {
        bubbles: true,
        composed: true,
        detail: { selected: this.selected, value: this.value },
      }),
    );
  };

  private _onMetaSlotChange = (e: Event) => {
    const slot = e.target as HTMLSlotElement;
    this._hasMeta = slot.assignedNodes({ flatten: true }).length > 0;
  };

  private _renderHeader() {
    const showHeader = !!this.label || this.favorite;
    return html`
      <div class="header" ?hidden=${!showHeader}>
        ${this.label ? html`<span class="label">${this.label}</span>` : nothing}
        ${this.favorite
          ? html`<svg
              class="favorite-icon"
              viewBox="0 0 14 14"
              aria-hidden="true"
              role="img"
            >
              <title>Favorite</title>
              <path
                d="M7 1l1.854 3.756 4.146.602-3 2.924.708 4.128L7 10.456l-3.708 1.954.708-4.128-3-2.924 4.146-.602z"
                fill="currentColor"
              />
            </svg>`
          : nothing}
      </div>
    `;
  }

  private _renderSelectTool() {
    if (this.selectTool === 'none') return nothing;
    const ariaLabel = this.label ? `Select ${this.label}` : 'Select address';
    if (this.selectTool === 'radio') {
      return html`
        <div class="select-cell">
          <scout-radio
            name=${this.name || nothing}
            value=${this.value || nothing}
            ?checked=${this.selected}
            ?disabled=${this.disabled}
            aria-label=${ariaLabel}
            @change=${this._onSelect}
          ></scout-radio>
        </div>
      `;
    }
    return html`
      <div class="select-cell">
        <scout-checkbox
          name=${this.name || nothing}
          value=${this.value || nothing}
          ?checked=${this.selected}
          ?disabled=${this.disabled}
          aria-label=${ariaLabel}
          @change=${this._onSelect}
        ></scout-checkbox>
      </div>
    `;
  }

  render() {
    return html`
      <div class="container">
        ${this.doNotDisclose
          ? html`<div class="dnd-banner" role="note">
              <svg class="dnd-icon" viewBox="0 0 12 12" aria-hidden="true">
                <path
                  d="M3 5V3.5a3 3 0 0 1 6 0V5h.5A.5.5 0 0 1 10 5.5v5a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-5a.5.5 0 0 1 .5-.5H3zm1 0h4V3.5a2 2 0 1 0-4 0V5z"
                  fill="currentColor"
                />
              </svg>
              <span>Do not disclose</span>
            </div>`
          : nothing}

        <div class="row">
          ${this._renderSelectTool()}
          <div class="content">
            ${this._renderHeader()}
            <address class="body"><slot></slot></address>
            <div class="meta" ?hidden=${!this._hasMeta}>
              <slot name="meta" @slotchange=${this._onMetaSlotChange}></slot>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-address': ScoutAddress;
  }
}
