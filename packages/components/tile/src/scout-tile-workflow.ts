import { LitElement, html, css, svg, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@scout/skeleton';
import '@scout/button';
import '@scout/divider';
import type { TileFunctionalState, WorkflowHeaderState } from './types.js';

const CHECK   = svg`<path d="M5 10.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
const EDIT    = svg`<path d="M16.475 5.408 14.592 3.525a1.875 1.875 0 0 0-2.652 0L4 11.466V14h2.535l7.94-7.94a1.875 1.875 0 0 0 0-2.652Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`;
/** Filled inner dot — marks the active step inside its ringed circle. */
const ACTIVE_DOT = svg`<circle cx="10" cy="10" r="3" fill="currentColor"/>`;
/** Short horizontal dash — marks a not-yet-started step inside its empty circle. */
const PENDING_DASH = svg`<path d="M6 10h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;

/**
 * `<scout-tile-workflow>` — collapsible workflow step.
 *
 * Stack several of these to walk an agent through servicing a customer. The
 * status icon + header state communicate where the agent is in the flow;
 * the body holds inputs, dropdowns, tables; the footer holds the navigation
 * buttons (Cancel / Save, Cancel / Submit, Cancel / Continue, Done).
 *
 * Anatomy: status icon (per state) + header / subhead, optional edit button
 * (when `state="completed-editable"`), body content (slot), footer slot.
 *
 * @element scout-tile-workflow
 *
 * @attr {number} step                                  - Step number rendered inside the status icon for not-started / active states.
 * @attr header                                          - Step title.
 * @attr subhead                                         - Optional subhead under the title.
 * @attr {WorkflowHeaderState} state                     - Header state. Default `not-started`.
 * @attr {"default"|"loading"|"error"} functional        - Functional state. Default `default`.
 * @attr expanded                                        - Reflects open/closed state (collapsed by default for non-active steps).
 * @attr disabled                                        - Disables the toggle and edit button.
 *
 * @slot       - Body content rendered when expanded.
 * @slot footer - Footer buttons (Cancel / Save, etc).
 *
 * @fires scout-workflow-toggle - Bubbles, composed; detail = `{ expanded }`.
 * @fires scout-workflow-edit   - Bubbles, composed; fired when the edit button is clicked.
 */
@customElement('scout-tile-workflow')
export class ScoutTileWorkflow extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--scout-font-family-inter);
      --_dot: var(--scout-space-24);
    }

    .tile {
      /* Theme-aware surface + border (auto-flip in dark mode). Matches
         scout-tile-button and scout-tile so the entire tile family shares
         one surface treatment. */
      background: var(--scout-surface-primary);
      border: var(--scout-border-width-1) var(--scout-stroke-solid)
        var(--scout-border-primary);
      border-radius: var(--scout-radius-8);
      padding: var(--scout-space-16);
    }
    /* Header row ----------------------------------------------------- */
    .head {
      display: flex;
      align-items: center;
      gap: var(--scout-space-12);
      width: 100%;
      text-align: left;
    }
    :host([disabled]) .head { opacity: 0.5; }

    /* Status icon — varies by state */
    .dot {
      width: var(--_dot);
      height: var(--_dot);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: var(--scout-surface-primary);
      border: var(--scout-border-width-2) solid var(--scout-border-primary);
      color: var(--scout-text-display-secondary);
      font-size: var(--scout-font-size-14);
      font-weight: var(--scout-font-weight-semibold);
    }
    .dot svg { width: 60%; height: 60%; }

    :host([state='active']) .dot {
      background: var(--scout-fill-info-subtle);
      border-color: var(--scout-text-interactive-primary);
      color: var(--scout-text-interactive-primary);
      box-shadow: 0 0 0 4px var(--scout-fill-info-subtle);
    }
    :host([state='completed-editable']) .dot {
      background: var(--scout-fill-success-bold);
      border-color: var(--scout-fill-success-bold);
      color: var(--scout-color-white);
    }
    :host([state='completed-locked']) .dot {
      background: var(--scout-color-green-200);
      border-color: var(--scout-color-green-200);
      color: var(--scout-fill-success-bold);
    }

    .text {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .header-line {
      font-size: var(--scout-font-size-16);
      font-weight: var(--scout-font-weight-semibold);
      color: var(--scout-text-display-primary);
    }
    :host([state='not-started']) .header-line { color: var(--scout-text-display-secondary); }
    :host([state='completed-locked']) .header-line { color: var(--scout-text-display-secondary); }

    .subhead {
      font-size: var(--scout-font-size-12);
      color: var(--scout-text-display-secondary);
    }

    .right {
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-4);
      flex-shrink: 0;
    }

    /* Edit affordance — a scout-button (variant="tertiary", size="condensed")
       with a leading pencil icon. Replaces the old icon-only edit button and
       the chevron toggle. The scout-button handles its own hover/focus/press
       chrome via tokens; we just size its leading icon here. */
    .edit-btn-cnx svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
    }

    /* Body ----------------------------------------------------------- */
    .body {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows var(--scout-motion-duration-base, 240ms)
        var(--scout-motion-easing-standard, ease);
    }
    :host([expanded]) .body { grid-template-rows: 1fr; }
    .body-inner {
      overflow: hidden;
      padding-top: var(--scout-space-16);
    }
    :host(:not([expanded])) .body-inner { padding-top: 0; }

    /* Footer --------------------------------------------------------- */
    .footer-divider {
      margin-top: var(--scout-space-16);
    }
    .footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--scout-space-8);
      margin-top: var(--scout-space-16);
    }
    :host(:not([expanded])) .footer,
    :host(:not([expanded])) .footer-divider { display: none; }

    /* "not-started" state hides the body and footer entirely so the row
       reads as a placeholder waiting to become active. */
    :host([state='not-started']) .body,
    :host([state='not-started']) .footer,
    :host([state='not-started']) .footer-divider { display: none; }

    /* Error / loading functional states replace the body content; the
       divider would only stack a stray rule under the message, so hide it. */
    :host([functional='error']) .footer-divider,
    :host([functional='loading']) .footer-divider { display: none; }

    /* Loading / Error ------------------------------------------------ */
    .loading {
      display: flex;
      flex-direction: column;
      gap: var(--scout-space-8);
    }
    .error {
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-8);
      color: var(--scout-text-display-critical);
      font-size: var(--scout-font-size-14);
    }
    .error svg { width: 20px; height: 20px; fill: currentColor; flex-shrink: 0; }

    @media (prefers-reduced-motion: reduce) {
      .body { transition: none; }
    }
  `;

  @property({ type: Number }) step = 1;
  @property({ type: Boolean, attribute: 'no-step', reflect: true }) noStep = false;
  @property({ type: Boolean, attribute: 'no-edit', reflect: true }) noEdit = false;
  @property() header = '';
  @property() subhead = '';
  @property({ reflect: true }) state: WorkflowHeaderState = 'not-started';
  @property({ reflect: true }) functional: TileFunctionalState = 'default';
  @property({ type: Boolean, reflect: true }) expanded = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** State drives expansion per spec: only `active` is expanded; every
   *  other state collapses. We sync `expanded` whenever `state` changes
   *  so consumers can't render an inconsistent (state, expanded) pair. */
  willUpdate(changed: PropertyValues<this>) {
    if (changed.has('state')) {
      this.expanded = this.state === 'active';
    }
  }

  private _onEdit = (e: Event) => {
    e.stopPropagation();
    if (this.disabled) return;
    // Per spec: clicking Edit on a completed-editable tile transitions it
    // to active. The owning app is responsible for moving the previously-
    // active tile back to completed-editable (only one tile may be active
    // at a time) — it can listen for `scout-workflow-edit` to coordinate.
    if (this.state === 'completed-editable') {
      this.state = 'active';
    }
    this.dispatchEvent(new CustomEvent('scout-workflow-edit', { bubbles: true, composed: true }));
  };

  private _renderDotContents() {
    switch (this.state) {
      case 'completed-editable':
      case 'completed-locked':
        return html`<svg viewBox="0 0 20 20">${CHECK}</svg>`;
      case 'active':
        return html`<svg viewBox="0 0 20 20">${ACTIVE_DOT}</svg>`;
      case 'not-started':
      default:
        return html`<svg viewBox="0 0 20 20">${PENDING_DASH}</svg>`;
    }
  }

  private _renderBody() {
    if (this.functional === 'loading') {
      return html`<div class="loading">
        <scout-skeleton shape="line"></scout-skeleton>
        <scout-skeleton shape="line"></scout-skeleton>
        <scout-skeleton shape="line" width="70%"></scout-skeleton>
      </div>`;
    }
    if (this.functional === 'error') {
      return html`<div class="error" role="alert">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm9.75-3.75a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>
        </svg>
        <span><slot name="error-message">Couldn't load this step.</slot></span>
      </div>`;
    }
    return html`<slot></slot>`;
  }

  render() {
    // Per spec the Edit button appears only in completed-editable. The
    // `no-edit` attribute suppresses the affordance for static / preview
    // tiles, and disabled hides it across the board.
    const showEdit = this.state === 'completed-editable' && !this.disabled && !this.noEdit;
    return html`
      <div class="tile">
        <div
          class="head"
          aria-expanded=${String(this.expanded)}
        >
          ${this.noStep ? nothing : html`<span class="dot" aria-hidden="true">${this._renderDotContents()}</span>`}
          <span class="text">
            <span class="header-line">${this.header}</span>
            ${this.subhead ? html`<span class="subhead">${this.subhead}</span>` : nothing}
          </span>
          <span class="right">
            ${showEdit
              ? html`<scout-button
                  class="edit-btn-cnx"
                  variant="tertiary"
                  size="condensed"
                  ?disabled=${this.disabled}
                  @click=${this._onEdit}
                >
                  <svg slot="icon-leading" viewBox="0 0 20 20" aria-hidden="true">${EDIT}</svg>
                  Edit
                </scout-button>`
              : nothing}
          </span>
        </div>
        <div class="body" aria-hidden=${String(!this.expanded)}>
          <div class="body-inner">
            ${this._renderBody()}
            <scout-divider class="footer-divider"></scout-divider>
            <div class="footer"><slot name="footer"></slot></div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-tile-workflow': ScoutTileWorkflow;
  }
}
