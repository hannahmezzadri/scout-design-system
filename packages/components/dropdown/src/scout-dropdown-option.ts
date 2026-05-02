import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * `<scout-dropdown-option>` — a single selectable option inside a
 * `<scout-dropdown-select>` or `<scout-dropdown-searchable>`.
 *
 * The parent dropdown reads `value` and listens for clicks; you don't
 * need to wire anything beyond placing options in the slot.
 *
 * @element scout-dropdown-option
 *
 * @attr value      - The form value submitted when this option is chosen.
 * @attr selected   - Reflects the parent dropdown's current selection.
 * @attr disabled   - Disables this specific option.
 * @attr hidden     - Set by the searchable parent when the option is filtered out.
 *
 * @slot - The label content shown in the menu.
 */
@customElement('scout-dropdown-option')
export class ScoutDropdownOption extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--scout-font-family-inter);
    }
    :host([hidden]) {
      display: none;
    }
    .option {
      display: flex;
      align-items: center;
      padding: var(--scout-space-8) var(--scout-space-12);
      font-size: var(--scout-font-size-14);
      line-height: var(--scout-font-line-height-21);
      color: var(--scout-text-display-primary);
      cursor: pointer;
      user-select: none;
      transition: background var(--scout-motion-duration-fast)
        var(--scout-motion-easing-standard);
    }
    .option:hover {
      background: var(--scout-interactive-background-hover);
    }
    .option:active {
      background: var(--scout-interactive-background-pressed);
    }
    :host([selected]) .option {
      background: var(--scout-fill-info-subtle);
      color: var(--scout-text-interactive-primary);
      font-weight: var(--scout-font-weight-semibold);
    }
    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }
    :host([active]) .option {
      background: var(--scout-color-cool-gray-100);
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
    'scout-dropdown-option': ScoutDropdownOption;
  }
}
