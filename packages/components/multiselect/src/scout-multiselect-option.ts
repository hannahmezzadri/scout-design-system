import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

const CHECK_PATH = svg`<path d="M3.5 8l3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

/**
 * `<scout-multiselect-option>` — a single selectable option for use inside
 * `<scout-multiselect>`. Renders with an inline checkbox indicator.
 *
 * @element scout-multiselect-option
 *
 * @attr value    - The form value submitted when this option is selected.
 * @attr selected - Reflects parent multiselect's selection state.
 * @attr disabled
 * @attr active   - Set during keyboard navigation to highlight the option.
 * @attr hidden   - Set by the parent when filtered out.
 *
 * @slot - Option label.
 */
@customElement('scout-multiselect-option')
export class ScoutMultiselectOption extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--scout-font-family-inter);
    }
    :host([hidden]) { display: none; }
    .row {
      display: flex;
      align-items: center;
      gap: var(--scout-space-8);
      padding: var(--scout-space-8) var(--scout-space-12);
      cursor: pointer;
      user-select: none;
      transition: background var(--scout-motion-duration-hover) var(--scout-motion-easing-gentle);
    }
    .row:hover { background: var(--scout-interactive-background-hover); }
    .row:active { background: var(--scout-interactive-background-pressed); }
    :host([active]) .row { background: var(--scout-color-cool-gray-100); }
    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }

    .check {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      border: var(--scout-border-width-1) solid var(--scout-border-primary);
      border-radius: var(--scout-radius-2);
      background: var(--scout-surface-primary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: transparent;
      transition: background var(--scout-motion-duration-hover) var(--scout-motion-easing-gentle),
                  border-color var(--scout-motion-duration-hover) var(--scout-motion-easing-gentle);
    }
    :host([selected]) .check {
      background: var(--scout-text-interactive-primary);
      border-color: var(--scout-text-interactive-primary);
      color: var(--scout-color-white);
    }

    .label {
      flex: 1;
      min-width: 0;
      font-size: var(--scout-font-size-14);
      line-height: var(--scout-font-line-height-21);
      color: var(--scout-text-display-primary);
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
    'scout-multiselect-option': ScoutMultiselectOption;
  }
}
