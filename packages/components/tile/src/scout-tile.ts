import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@scout/skeleton';
import '@scout/show-more';
import '@scout/divider';
import type { TileFooter, TileFunctionalState } from './types.js';

/**
 * `<scout-tile>` — rich container with multi-part header and
 * optional footer. Used on overview / dashboard pages for static information
 * or to house multiple interactive elements (links, buttons, tables).
 *
 * Header anatomy (all slots optional except the title prop):
 *   - eyebrow      — small uppercase line above the title
 *   - title        — `header` prop
 *   - tooltip      — slot for a `<scout-tooltip>` next to the title
 *   - badge        — slot for a `<scout-badge>` next to the title
 *   - subhead      — `subhead` prop
 *   - header-button — slot for a button (e.g., overflow menu) on the header right
 *
 * Body: default slot — any content.
 *
 * Footer (controlled by `footer` attr):
 *   - none            — no footer
 *   - button-tertiary — slot a tertiary action button
 *   - show-more       — built-in `<scout-show-more>` toggle
 *
 * @element scout-tile
 *
 * @attr header                                                  - Title text.
 * @attr subhead                                                  - Optional subhead under the title.
 * @attr {"default"|"loading"|"error"} state                       - Functional state.
 * @attr {"none"|"button-tertiary"|"show-more"} footer             - Footer affordance.
 * @attr expanded                                                  - When `footer="show-more"`, reflects the open state.
 *
 * @slot eyebrow        - Eyebrow line above the title (typically text in uppercase).
 * @slot tooltip        - Inline tooltip next to the title.
 * @slot badge          - Badge next to the title.
 * @slot header-button  - Header right-side action.
 * @slot                - Body content.
 * @slot footer         - Footer content when `footer="button-tertiary"`.
 *
 * @fires scout-tile-show-more-toggle - Bubbles when show-more footer is toggled. detail = `{ expanded }`.
 */
@customElement('scout-tile')
export class ScoutTile extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--scout-font-family-inter);
    }

    .tile {
      /* Theme-aware surface + border. Both tokens flip in dark mode so we
         don't need a separate :host-context override. */
      background: var(--scout-surface-primary);
      border: var(--scout-border-width-1) var(--scout-stroke-solid)
        var(--scout-border-primary);
      border-radius: var(--scout-radius-8);
      padding: var(--scout-space-16);
      display: flex;
      flex-direction: column;
      gap: var(--scout-space-12);
    }

    /* Header --------------------------------------------------------- */
    .eyebrow {
      font-size: var(--scout-typography-caption-font-size);
      line-height: var(--scout-typography-caption-line-height);
      font-weight: var(--scout-font-weight-semibold);
      color: var(--scout-text-display-secondary);
    }
    .title-row {
      display: flex;
      align-items: flex-start;
      gap: var(--scout-space-8);
    }
    .title {
      flex: 1;
      min-width: 0;
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-8);
      font-size: var(--scout-font-size-16);
      font-weight: var(--scout-font-weight-semibold);
      line-height: var(--scout-font-line-height-24);
      color: var(--scout-text-display-primary);
    }
    .title h3 {
      margin: 0;
      font: inherit;
    }
    .header-button {
      flex-shrink: 0;
    }
    .subhead {
      font-size: var(--scout-font-size-12);
      color: var(--scout-text-display-secondary);
    }

    /* Body ----------------------------------------------------------- */
    .body {
      font-size: var(--scout-font-size-14);
      line-height: var(--scout-font-line-height-21);
      color: var(--scout-text-display-primary);
    }
    /* When show-more is the footer and the tile is collapsed, clamp the body */
    :host([footer='show-more']:not([expanded])) .body {
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Footer --------------------------------------------------------- */
    /* Divider above the footer extends past the tile's 16px padding so it
       runs flush from edge to edge of the tile container. */
    .footer-divider {
      margin-left: calc(-1 * var(--scout-space-16));
      margin-right: calc(-1 * var(--scout-space-16));
      width: calc(100% + (2 * var(--scout-space-16)));
    }
    .footer { display: flex; align-items: center; justify-content: center; }

    /* Loading -------------------------------------------------------- */
    .loading {
      display: flex;
      flex-direction: column;
      gap: var(--scout-space-8);
    }
    /* Error ---------------------------------------------------------- */
    .error {
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-8);
      color: var(--scout-text-display-error);
      font-size: var(--scout-font-size-14);
    }
    .error svg { width: 20px; height: 20px; fill: currentColor; flex-shrink: 0; }
  `;

  @property() header = '';
  @property() subhead = '';
  @property({ reflect: true }) state: TileFunctionalState = 'default';
  @property({ reflect: true }) footer: TileFooter = 'none';
  @property({ type: Boolean, reflect: true }) expanded = false;

  private _onShowMoreToggle = (e: Event) => {
    const detail = (e as CustomEvent<{ expanded: boolean }>).detail;
    this.expanded = detail.expanded;
    this.dispatchEvent(
      new CustomEvent<{ expanded: boolean }>('scout-tile-show-more-toggle', {
        bubbles: true,
        composed: true,
        detail: { expanded: this.expanded },
      }),
    );
  };

  private _renderBody() {
    if (this.state === 'loading') {
      return html`<div class="loading">
        <scout-skeleton shape="line"></scout-skeleton>
        <scout-skeleton shape="line"></scout-skeleton>
        <scout-skeleton shape="line" width="70%"></scout-skeleton>
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

  private _renderFooter() {
    if (this.state !== 'default') return nothing;
    if (this.footer === 'none') return nothing;
    if (this.footer === 'show-more') {
      return html`
        <scout-divider class="footer-divider"></scout-divider>
        <div class="footer">
          <scout-show-more
            ?expanded=${this.expanded}
            @scout-show-more-toggle=${this._onShowMoreToggle}
          ></scout-show-more>
        </div>
      `;
    }
    // button-tertiary — consumer slots their own button
    return html`
      <scout-divider class="footer-divider"></scout-divider>
      <div class="footer"><slot name="footer"></slot></div>
    `;
  }

  render() {
    return html`
      <div class="tile">
        <div class="eyebrow"><slot name="eyebrow"></slot></div>
        <div class="title-row">
          <span class="title">
            <h3>${this.header}</h3>
            <slot name="tooltip"></slot>
            <slot name="badge"></slot>
          </span>
          <span class="header-button"><slot name="header-button"></slot></span>
        </div>
        ${this.subhead ? html`<div class="subhead">${this.subhead}</div>` : nothing}
        ${this._renderBody()}
        ${this._renderFooter()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-tile': ScoutTile;
  }
}
