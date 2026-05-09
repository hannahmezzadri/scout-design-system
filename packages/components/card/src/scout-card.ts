import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@scout-ds/badge';
import '@scout-ds/show-more';
import type { CardBackground } from './types.js';

/**
 * `<scout-card>` — stylized container for AI summaries and extracted content.
 *
 * @element scout-card
 *
 * @attr {"white"|"cool-gray-100"|"cool-gray-200"} background - Card background color.
 * @attr accent-bar - When set, renders a 4px brand-colored bar along the card's left edge.
 * @attr ai-callout - When set, renders an "AI summary" callout banner above the body.
 * @attr show-more - When set, truncates the body and reveals a Show more / Show less toggle.
 * @attr expanded - Reflects the show-more expansion state.
 *
 * @slot - The card body. Any content; AI plain-text summaries are the canonical use.
 * @slot ai-label - Optional override for the AI callout label (default: "AI summary").
 *
 * @fires scout-card-toggle - Bubbles when the show-more state changes; detail `{ expanded }`.
 */
@customElement('scout-card')
export class ScoutCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      --_card-bg: var(--scout-color-white);
    }
    :host([background='cool-gray-100']) {
      --_card-bg: var(--scout-color-cool-gray-100);
    }
    :host([background='cool-gray-200']) {
      --_card-bg: var(--scout-color-cool-gray-200);
    }

    /* Dark theme — promote each variant to a clearly elevated cool-gray
       surface so the card reads as raised against the darker page chrome
       (cool-gray.950). Selector chains :host-context to :host so the
       per-background overrides actually win against the base rule. */
    :host-context([data-theme='dark']) {
      --_card-bg: var(--scout-color-cool-gray-700);
    }
    :host-context([data-theme='dark']):host([background='cool-gray-100']) {
      --_card-bg: var(--scout-color-cool-gray-800);
    }
    :host-context([data-theme='dark']):host([background='cool-gray-200']) {
      --_card-bg: var(--scout-color-cool-gray-900);
    }

    .card {
      position: relative;
      display: flex;
      background: var(--_card-bg);
      border: var(--scout-border-width-1) solid var(--scout-border-secondary);
      border-radius: var(--scout-radius-8);
      overflow: hidden;
      font-family: var(--scout-font-family-inter);
    }

    /* Left accent bar */
    .left-bar {
      width: 4px;
      flex-shrink: 0;
      background: var(--scout-color-cool-gray-300);
    }

    .body-wrap {
      flex: 1;
      min-width: 0;
      padding: var(--scout-space-16) var(--scout-space-16) var(--scout-space-16) var(--scout-space-16);
    }

    /* AI callout — uses the ai-summary badge variant */
    .ai-callout {
      display: block;
      margin-bottom: var(--scout-space-8);
    }

    /* Body */
    .body {
      position: relative;
      font-size: var(--scout-typography-body-font-size);
      line-height: var(--scout-typography-body-line-height);
      color: var(--scout-text-display-primary);
    }

    /* Show-more truncation */
    :host([show-more]:not([expanded])) .body {
      max-height: calc(var(--scout-typography-body-line-height) * 3);
      overflow: hidden;
    }
    :host([show-more]:not([expanded])) .body::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: calc(var(--scout-font-line-height-21) * 1.2);
      background: linear-gradient(to bottom, transparent 0%, var(--_card-bg) 100%);
      pointer-events: none;
    }

    /* The show-more affordance is the scout-show-more component; we just
       give the slotted instance some breathing room from the body copy. */
    scout-show-more {
      margin-top: var(--scout-space-8);
    }
  `;

  @property({ type: String, reflect: true }) background: CardBackground = 'white';

  @property({ type: Boolean, reflect: true, attribute: 'accent-bar' })
  accentBar = false;

  @property({ type: Boolean, reflect: true, attribute: 'ai-callout' })
  aiCallout = false;

  @property({ type: Boolean, reflect: true, attribute: 'show-more' })
  showMore = false;

  @property({ type: Boolean, reflect: true }) expanded = false;

  /** Bridge the scout-show-more toggle event to the card's own state +
   *  re-emit it as scout-card-toggle so existing consumers stay compatible. */
  private _onShowMoreToggle = (e: Event) => {
    const detail = (e as CustomEvent<{ expanded: boolean }>).detail;
    this.expanded = detail.expanded;
    this.dispatchEvent(
      new CustomEvent<{ expanded: boolean }>('scout-card-toggle', {
        bubbles: true,
        composed: true,
        detail: { expanded: this.expanded },
      }),
    );
  };

  render() {
    return html`
      <div class="card" part="container">
        ${this.accentBar
          ? html`<div class="left-bar" aria-hidden="true"></div>`
          : nothing}
        <div class="body-wrap">
          ${this.aiCallout
            ? html`<div class="ai-callout" role="note">
                <scout-badge type="ai-summary" emphasis="low">
                  <slot name="ai-label">AI summary</slot>
                </scout-badge>
              </div>`
            : nothing}
          <div class="body"><slot></slot></div>
          ${this.showMore
            ? html`<scout-show-more
                ?expanded=${this.expanded}
                @scout-show-more-toggle=${this._onShowMoreToggle}
              ></scout-show-more>`
            : nothing}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-card': ScoutCard;
  }
}
