import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

const CHECK_ICON = svg`<path d="M3.5 8l3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
const INDETERMINATE_ICON = svg`<path d="M3.5 8h9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;

/**
 * `<connex-checkbox>` — single checkbox with optional label and secondary text.
 *
 * Form-associated via ElementInternals so it participates in native `<form>`
 * submission with the host's name/value.
 *
 * @element connex-checkbox
 *
 * @attr checked       - Selected state.
 * @attr indeterminate - Indeterminate state (visual dash). Cleared on user interaction.
 * @attr disabled      - Disables interaction; skips tab order.
 * @attr invalid       - Renders an error border. Auto-set by parent group when error is set.
 * @attr name          - Form field name.
 * @attr value         - Form value to submit when checked. Defaults to "on".
 * @attr secondary     - Optional secondary text rendered under the label.
 *
 * @slot - Checkbox label content.
 *
 * @fires change - Bubbles, composed; the host's checked state has been toggled by the user.
 */
@customElement('connex-checkbox')
export class ConnexCheckbox extends LitElement {
  static formAssociated = true;

  static styles = css`
    :host {
      display: inline-block;
      font-family: var(--connex-font-family-inter);
    }
    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .row {
      display: inline-flex;
      align-items: flex-start;
      gap: var(--connex-space-8);
      cursor: pointer;
      user-select: none;
    }
    :host([disabled]) .row {
      cursor: not-allowed;
    }

    .control {
      position: relative;
      display: inline-flex;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    input {
      position: absolute;
      inset: 0;
      appearance: none;
      margin: 0;
      width: 100%;
      height: 100%;
      border: var(--connex-border-width-1) solid var(--connex-border-primary);
      border-radius: var(--connex-radius-2);
      background: var(--connex-surface-primary);
      cursor: inherit;
      transition:
        background var(--connex-motion-duration-fast)
          var(--connex-motion-easing-standard),
        border-color var(--connex-motion-duration-fast)
          var(--connex-motion-easing-standard);
    }
    input:hover:not(:disabled) {
      border-color: var(--connex-text-interactive-primary);
    }
    input:focus-visible {
      outline: var(--connex-focus-ring-width) solid var(--connex-focus-ring-color);
      outline-offset: var(--connex-focus-ring-offset);
    }
    input:active:not(:disabled) {
      background: var(--connex-color-cool-gray-100);
    }
    input:checked,
    input:indeterminate {
      background: var(--connex-text-interactive-primary);
      border-color: var(--connex-text-interactive-primary);
    }
    input:checked:active,
    input:indeterminate:active {
      background: var(--connex-interactive-background-brand-strong-pressed);
    }

    :host([invalid]) input:not(:checked):not(:indeterminate) {
      border-color: var(--connex-border-error);
    }

    .icon {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      color: var(--connex-color-white);
      pointer-events: none;
      opacity: 0;
      transition: opacity var(--connex-motion-duration-fast)
        var(--connex-motion-easing-standard);
    }
    input:checked ~ .check {
      opacity: 1;
    }
    input:indeterminate:not(:checked) ~ .indeterminate {
      opacity: 1;
    }

    .text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .label {
      font-size: var(--connex-font-size-14);
      line-height: var(--connex-font-line-height-21);
      color: var(--connex-text-display-primary);
    }
    .secondary {
      font-size: var(--connex-font-size-12);
      line-height: var(--connex-font-line-height-18);
      color: var(--connex-text-display-secondary);
    }

    @media (prefers-reduced-motion: reduce) {
      input,
      .icon {
        transition: none;
      }
    }
  `;

  @property({ type: Boolean, reflect: true }) checked = false;
  @property({ type: Boolean, reflect: true }) indeterminate = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) invalid = false;
  @property() name = '';
  @property() value = '';
  @property() secondary = '';

  private readonly _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  private _onChange = (e: Event) => {
    if (this.disabled) return;
    const input = e.currentTarget as HTMLInputElement;
    this.checked = input.checked;
    this.indeterminate = false;
    this._setFormValue();
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  };

  private _setFormValue() {
    this._internals.setFormValue(this.checked ? this.value || 'on' : null);
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('checked') || changed.has('value')) this._setFormValue();
    const input = this.shadowRoot?.querySelector('input');
    if (input) input.indeterminate = this.indeterminate && !this.checked;
  }

  render() {
    return html`
      <label class="row">
        <span class="control" part="control">
          <input
            type="checkbox"
            ?checked=${this.checked}
            ?disabled=${this.disabled}
            name=${this.name || nothing}
            value=${this.value || nothing}
            aria-invalid=${this.invalid ? 'true' : (nothing as any)}
            @change=${this._onChange}
          />
          <svg class="icon check" viewBox="0 0 16 16" aria-hidden="true">${CHECK_ICON}</svg>
          <svg class="icon indeterminate" viewBox="0 0 16 16" aria-hidden="true">${INDETERMINATE_ICON}</svg>
        </span>
        <span class="text">
          <span class="label"><slot></slot></span>
          ${this.secondary
            ? html`<span class="secondary">${this.secondary}</span>`
            : nothing}
        </span>
      </label>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-checkbox': ConnexCheckbox;
  }
}
