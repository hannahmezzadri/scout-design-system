import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * `<connex-dropdown-option>` — a single selectable option inside a
 * `<connex-dropdown-select>` or `<connex-dropdown-searchable>`.
 *
 * The parent dropdown reads `value` and listens for clicks; you don't
 * need to wire anything beyond placing options in the slot.
 *
 * @element connex-dropdown-option
 *
 * @attr value      - The form value submitted when this option is chosen.
 * @attr selected   - Reflects the parent dropdown's current selection.
 * @attr disabled   - Disables this specific option.
 * @attr hidden     - Set by the searchable parent when the option is filtered out.
 *
 * @slot - The label content shown in the menu.
 */
@customElement('connex-dropdown-option')
export class ConnexDropdownOption extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--connex-font-family-inter);
    }
    :host([hidden]) {
      display: none;
    }
    .option {
      display: flex;
      align-items: center;
      padding: var(--connex-space-8) var(--connex-space-12);
      font-size: var(--connex-font-size-14);
      line-height: var(--connex-font-line-height-21);
      color: var(--connex-text-display-primary);
      cursor: pointer;
      user-select: none;
      transition: background var(--connex-motion-duration-fast)
        var(--connex-motion-easing-standard);
    }
    .option:hover {
      background: var(--connex-interactive-background-hover);
    }
    .option:active {
      background: var(--connex-interactive-background-pressed);
    }
    :host([selected]) .option {
      background: var(--connex-color-blue-100);
      color: var(--connex-text-interactive-primary);
      font-weight: var(--connex-font-weight-semibold);
    }
    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }
    :host([active]) .option {
      background: var(--connex-color-cool-gray-100);
    }
  `;

  @property() value = '';
  @property({ type: Boolean, reflect: true }) selected = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  /** Set by parent during keyboard navigation to highlight the current option. */
  @property({ type: Boolean, reflect: true }) active = false;

  render() {
    return html`<div class="option" role="option" aria-selected=${String(this.selected)}>
      <slot></slot>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-dropdown-option': ConnexDropdownOption;
  }
}
