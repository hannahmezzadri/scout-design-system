import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

const CHECK_ICON = svg`<path d="M3.5 8l3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
const INDETERMINATE_ICON = svg`<path d="M3.5 8h9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;

/**
 * `<scout-checkbox>` — single checkbox with optional label and secondary text.
 *
 * Form-associated via ElementInternals so it participates in native `<form>`
 * submission with the host's name/value.
 *
 * @element scout-checkbox
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
@customElement('scout-checkbox')
export class ScoutCheckbox extends LitElement {
  static formAssociated = true;

  static styles = css`
    :host {
      display: inline-block;
      font-family: var(--scout-font-family-inter);
    }
    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .row {
      display: inline-flex;
      /* Align the control to the label's first line — when secondary text
         is present, we don't want the control to drop to the vertical
         midpoint of the whole text stack. The 24px control matches the
         body line-height so flex-start lines them up flush. */
      align-items: flex-start;
      gap: var(--scout-space-8);
      cursor: pointer;
      user-select: none;
    }
    :host([disabled]) .row {
      cursor: not-allowed;
    }

    .control {
      position: relative;
      display: inline-flex;
      width: var(--scout-font-size-20);
      height: var(--scout-font-size-20);
      flex-shrink: 0;
      /* Body line-height (~22-24px) is taller than the 20px control;
         flex-start would leave the control sitting above the text's
         cap height. A 2px margin-top centers the visible square on the
         label's first-line cap so they read as visually flush. */
      margin-top: 2px;
    }

    input {
      position: absolute;
      inset: 0;
      appearance: none;
      margin: 0;
      width: 100%;
      height: 100%;
      border: var(--scout-border-width-1) solid var(--scout-border-primary);
      border-radius: var(--scout-radius-2);
      background: var(--scout-surface-primary);
      cursor: inherit;
      transition:
        background var(--scout-motion-duration-fast)
          var(--scout-motion-easing-standard),
        border-color var(--scout-motion-duration-fast)
          var(--scout-motion-easing-standard);
    }
    input:hover:not(:disabled) {
      border-color: var(--scout-interactive-background-brand-strong-pressed);
    }
    input:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: var(--scout-focus-ring-offset);
    }
    input:active:not(:disabled) {
      background: var(--scout-color-cool-gray-100);
    }
    input:checked,
    input:indeterminate {
      background: var(--scout-interactive-background-brand-strong-pressed);
      border-color: var(--scout-interactive-background-brand-strong-pressed);
    }
    input:checked:active,
    input:indeterminate:active {
      background: var(--scout-interactive-background-brand-strong-pressed);
    }

    :host([invalid]) input:not(:checked):not(:indeterminate) {
      border-color: var(--scout-border-critical);
    }

    .icon {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      color: var(--scout-color-white);
      pointer-events: none;
      opacity: 0;
      transition: opacity var(--scout-motion-duration-fast)
        var(--scout-motion-easing-standard);
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
    /* When there's no slotted label and no secondary text, drop the .text
       wrapper so the .row's flex gap doesn't reserve 8px of empty space
       to the right of the control (matters in data-table select cells). */
    .text[hidden] { display: none; }
    .label {
      font-size: var(--scout-typography-body-font-size);
      line-height: var(--scout-typography-body-line-height);
      color: var(--scout-text-display-primary);
    }
    .secondary {
      font-size: var(--scout-font-size-12);
      line-height: var(--scout-font-line-height-18);
      color: var(--scout-text-display-secondary);
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

  @state() private _hasLabel = false;

  private _onLabelSlot = (e: Event) => {
    this._hasLabel = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };

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
        <span class="text" ?hidden=${!this._hasLabel && !this.secondary}>
          <span class="label"><slot @slotchange=${this._onLabelSlot}></slot></span>
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
    'scout-checkbox': ScoutCheckbox;
  }
}
