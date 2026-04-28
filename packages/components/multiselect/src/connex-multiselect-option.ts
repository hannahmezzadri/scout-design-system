import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

const CHECK_PATH = svg`<path d="M3.5 8l3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

/**
 * `<connex-multiselect-option>` — a single selectable option for use inside
 * `<connex-multiselect>`. Renders with an inline checkbox indicator.
 *
 * @element connex-multiselect-option
 *
 * @attr value    - The form value submitted when this option is selected.
 * @attr selected - Reflects parent multiselect's selection state.
 * @attr disabled
 * @attr active   - Set during keyboard navigation to highlight the option.
 * @attr hidden   - Set by the parent when filtered out.
 *
 * @slot - Option label.
 */
@customElement('connex-multiselect-option')
export class ConnexMultiselectOption extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--connex-font-family-inter);
    }
    :host([hidden]) { display: none; }
    .row {
      display: flex;
      align-items: center;
      gap: var(--connex-space-8);
      padding: var(--connex-space-8) var(--connex-space-12);
      cursor: pointer;
      user-select: none;
      transition: background var(--connex-motion-duration-fast) var(--connex-motion-easing-standard);
    }
    .row:hover { background: var(--connex-interactive-background-hover); }
    .row:active { background: var(--connex-interactive-background-pressed); }
    :host([active]) .row { background: var(--connex-color-cool-gray-100); }
    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }

    .check {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      border: var(--connex-border-width-1) solid var(--connex-border-primary);
      border-radius: var(--connex-radius-2);
      background: var(--connex-surface-primary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: transparent;
      transition: background var(--connex-motion-duration-fast) var(--connex-motion-easing-standard),
                  border-color var(--connex-motion-duration-fast) var(--connex-motion-easing-standard);
    }
    :host([selected]) .check {
      background: var(--connex-text-interactive-primary);
      border-color: var(--connex-text-interactive-primary);
      color: var(--connex-color-white);
    }

    .label {
      flex: 1;
      min-width: 0;
      font-size: var(--connex-font-size-14);
      line-height: var(--connex-font-line-height-21);
      color: var(--connex-text-display-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `;

  @property() value = '';
  @property({ type: Boolean, reflect: true }) selected = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) active = false;

  render() {
    return html`
      <div class="row" role="option" aria-selected=${String(this.selected)}>
        <span class="check" aria-hidden="true">
          <svg viewBox="0 0 16 16">${CHECK_PATH}</svg>
        </span>
        <span class="label"><slot></slot></span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-multiselect-option': ConnexMultiselectOption;
  }
}
