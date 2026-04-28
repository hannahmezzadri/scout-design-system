import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@connex/badge';
import '@connex/show-more';
import type { CardBackground } from './types.js';

/**
 * `<connex-card>` — stylized container for AI summaries and extracted content.
 *
 * @element connex-card
 *
 * @attr {"white"|"cool-gray-100"|"warm-gray-100"} background - Card background color.
 * @attr accent-bar - When set, renders a 4px brand-colored bar along the card's left edge.
 * @attr ai-callout - When set, renders an "AI summary" callout banner above the body.
 * @attr show-more - When set, truncates the body and reveals a Show more / Show less toggle.
 * @attr expanded - Reflects the show-more expansion state.
 *
 * @slot - The card body. Any content; AI plain-text summaries are the canonical use.
 * @slot ai-label - Optional override for the AI callout label (default: "AI summary").
 *
 * @fires connex-card-toggle - Bubbles when the show-more state changes; detail `{ expanded }`.
 */
@customElement('connex-card')
export class ConnexCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      --_card-bg: var(--connex-color-white);
    }
    :host([background='cool-gray-100']) {
      --_card-bg: var(--connex-color-cool-gray-100);
    }
    :host([background='warm-gray-100']) {
      --_card-bg: var(--connex-color-warm-gray-100);
    }

    /* Dark theme — primitive backgrounds (white / cool-gray-100 / warm-gray-100)
       don't theme-shift on their own, so remap each variant to a semantic
       surface token when the document opts into dark. :host-context pierces
       the shadow boundary to read the theme attribute set on <html>. */
    :host-context([data-theme='dark']) {
      --_card-bg: var(--connex-surface-primary);
    }
    :host-context([data-theme='dark'])[background='cool-gray-100'],
    :host-context([data-theme='dark'])[background='warm-gray-100'] {
      --_card-bg: var(--connex-surface-page);
    }

    .card {
      position: relative;
      display: flex;
      background: var(--_card-bg);
      border: var(--connex-border-width-1) solid var(--connex-border-secondary);
      border-radius: var(--connex-radius-8);
      overflow: hidden;
      font-family: var(--connex-font-family-inter);
    }

    /* Left accent bar */
    .left-bar {
      width: 4px;
      flex-shrink: 0;
      background: var(--connex-text-interactive-primary);
    }

    .body-wrap {
      flex: 1;
      min-width: 0;
      padding: var(--connex-space-16) var(--connex-space-16) var(--connex-space-16) var(--connex-space-16);
    }

    /* AI callout — uses the ai-summary badge variant */
    .ai-callout {
      display: block;
      margin-bottom: var(--connex-space-8);
    }

    /* Body */
    .body {
      position: relative;
      font-size: var(--connex-font-size-14);
      line-height: var(--connex-font-line-height-21);
      color: var(--connex-text-display-primary);
    }

    /* Show-more truncation */
    :host([show-more]:not([expanded])) .body {
      max-height: calc(var(--connex-font-line-height-21) * 3);
      overflow: hidden;
    }
    :host([show-more]:not([expanded])) .body::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: calc(var(--connex-font-line-height-21) * 1.2);
      background: linear-gradient(to bottom, transparent 0%, var(--_card-bg) 100%);
      pointer-events: none;
    }

    /* The show-more affordance is the connex-show-more component; we just
       give the slotted instance some breathing room from the body copy. */
    connex-show-more {
      margin-top: var(--connex-space-8);
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

  /** Bridge the connex-show-more toggle event to the card's own state +
   *  re-emit it as connex-card-toggle so existing consumers stay compatible. */
  private _onShowMoreToggle = (e: Event) => {
    const detail = (e as CustomEvent<{ expanded: boolean }>).detail;
    this.expanded = detail.expanded;
    this.dispatchEvent(
      new CustomEvent<{ expanded: boolean }>('connex-card-toggle', {
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
                <connex-badge type="ai-summary" emphasis="low">
                  <slot name="ai-label">AI summary</slot>
                </connex-badge>
              </div>`
            : nothing}
          <div class="body"><slot></slot></div>
          ${this.showMore
            ? html`<connex-show-more
                ?expanded=${this.expanded}
                @connex-show-more-toggle=${this._onShowMoreToggle}
              ></connex-show-more>`
            : nothing}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-card': ConnexCard;
  }
}
