import { LitElement, html, css, svg } from 'lit';
import { customElement, state } from 'lit/decorators.js';

/**
 * Default placeholder illustration — a dashed-frame box with an
 * "Illustration" caption inside. Designers can swap in a real SVG
 * illustration via the `illustration` slot.
 */
const PLACEHOLDER = svg`
  <rect x="0.5" y="0.5" width="159" height="119" rx="8" fill="none" stroke="currentColor" stroke-dasharray="4 4" opacity="0.4"/>
  <text x="80" y="56" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" fill="currentColor" opacity="0.6" text-anchor="middle">Illustration</text>
  <text x="80" y="74" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" fill="currentColor" opacity="0.4" text-anchor="middle">placeholder</text>
`;

/**
 * `<connex-error-state>` — full-application error display.
 *
 * Use when an error has occurred that impacts the entire app or the entire
 * page (failed network bootstrap, 5xx response, blocking auth issue).
 * For inline, contextual errors prefer `<connex-inline-alert status="critical">`.
 *
 * @element connex-error-state
 *
 * @slot illustration - Optional illustration. Defaults to a placeholder.
 * @slot header       - The error headline (e.g. "Something went wrong").
 * @slot              - The default slot: a longer message explaining what happened.
 * @slot link         - Optional anchor or button (e.g. "Contact support", "Try again").
 */
@customElement('connex-error-state')
export class ConnexErrorState extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--connex-font-family-inter);
      color: var(--connex-text-display-primary);
    }
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--connex-space-16);
      padding: var(--connex-space-64) var(--connex-space-24);
      text-align: center;
      max-width: 560px;
      margin: 0 auto;
    }
    .illustration {
      color: var(--connex-text-display-secondary);
      width: 160px;
      height: 120px;
    }
    .header {
      font-family: var(--connex-font-family-literata);
      font-weight: var(--connex-font-weight-semibold);
      font-size: var(--connex-font-size-32);
      line-height: var(--connex-font-line-height-40);
    }
    .header[hidden] { display: none; }
    .message {
      font-size: var(--connex-font-size-16);
      line-height: var(--connex-font-line-height-24);
      color: var(--connex-text-display-secondary);
      max-width: 48ch;
    }
    .link {
      margin-top: var(--connex-space-8);
    }
    .link[hidden] { display: none; }
    ::slotted(a) {
      color: var(--connex-text-interactive-primary);
      font-weight: var(--connex-font-weight-semibold);
      text-decoration: underline;
    }
    ::slotted(a:hover) { text-decoration: none; }
  `;

  @state() private _hasHeader = false;
  @state() private _hasLink = false;

  private _onHeaderSlot = (e: Event) => {
    this._hasHeader = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };
  private _onLinkSlot = (e: Event) => {
    this._hasLink = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };

  render() {
    return html`
      <div class="container" role="alert">
        <div class="illustration">
          <slot name="illustration">
            <svg viewBox="0 0 160 120" width="160" height="120" aria-hidden="true">
              ${PLACEHOLDER}
            </svg>
          </slot>
        </div>
        <h2 class="header" ?hidden=${!this._hasHeader}>
          <slot name="header" @slotchange=${this._onHeaderSlot}></slot>
        </h2>
        <p class="message"><slot></slot></p>
        <div class="link" ?hidden=${!this._hasLink}>
          <slot name="link" @slotchange=${this._onLinkSlot}></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-error-state': ConnexErrorState;
  }
}
