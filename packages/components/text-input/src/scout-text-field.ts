import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import type { TextFieldVariant, TextInputSize } from './types.js';

/* eslint-disable max-len */
const ICONS = {
  search:   svg`<path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 4.51 11.78l4.234 4.232a.75.75 0 1 0 1.06-1.06l-4.232-4.232A6.75 6.75 0 0 0 10.5 3.75ZM5.25 10.5a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z" clip-rule="evenodd"/>`,
  xClear:   svg`<path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clip-rule="evenodd"/>`,
  eyeOn:    svg`<path fill-rule="evenodd" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .644C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178ZM15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clip-rule="evenodd"/>`,
  eyeOff:   svg`<path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.244 7.244L19.5 19.5m-3.378-3.378-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.243 4.243L9.879 9.88" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  check:    svg`<path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd"/>`,
  calendar: svg`<path fill-rule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3a.75.75 0 0 1 1.5 0v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75ZM3.75 18.75V9h16.5v9.75a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5Z" clip-rule="evenodd"/>`,
  clock:    svg`<path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clip-rule="evenodd"/>`,
};
/* eslint-enable max-len */

/**
 * `<scout-text-field>` — single-line text input with eleven variants.
 *
 * The variant attr drives input type, formatting, and the trailing/leading
 * affordances (icons, masking, popover triggers). Use the same component
 * for every kind of field; layout, focus, and error states stay identical
 * across variants for a coherent form surface.
 *
 * @element scout-text-field
 *
 * @attr {TextFieldVariant} variant            - Field variant. Default `text`.
 * @attr {"default"|"condensed"} size           - Density preset.
 * @attr label                                  - Field label rendered above the input.
 * @attr placeholder                            - Placeholder text.
 * @attr value                                  - Current text value.
 * @attr helper                                 - Helper text rendered below the input.
 * @attr error                                  - Error message; switches the field to invalid styling.
 * @attr disabled                               - Disables interaction.
 * @attr name                                   - Form field name.
 * @attr required                               - Marks the field as required.
 * @attr optional                               - When set, renders an "(Optional)" hint next to the label.
 *                                                 Mutually exclusive with `required` — if both are set, `required` wins.
 * @attr {string} confirm-target                - For `variant="confirmation"`: CSS selector for another text-field
 *                                                 whose value must match. When set, the trailing checkmark appears
 *                                                 only when both fields agree.
 *
 * @fires input  - Native; bubbles, composed; emitted on every keystroke.
 * @fires change - Native; bubbles, composed; emitted on commit (blur or Enter).
 * @fires scout-text-field-trigger - Bubbles, composed; fires when the trailing
 *                                     picker icon (date / month / time) is clicked.
 *                                     detail = `{ variant }`.
 */
@customElement('scout-text-field')
export class ScoutTextField extends LitElement {
  static formAssociated = true;

  static styles = css`
    :host {
      display: block;
      font-family: var(--scout-font-family-inter);
      --_tf-h: 36px;
      --_tf-fs: var(--scout-font-size-14);
      --_tf-px: var(--scout-space-12);
    }
    :host([size='condensed']),
    :host-context([data-density='condensed']) {
      --_tf-h: 28px;
      --_tf-fs: var(--scout-font-size-12);
      --_tf-px: var(--scout-space-8);
    }
    :host([disabled]) { opacity: 0.5; pointer-events: none; }

    .label {
      display: block;
      font-size: var(--scout-typography-label-font-size);
      line-height: var(--scout-typography-label-line-height);
      font-weight: var(--scout-typography-label-font-weight);
      color: var(--scout-text-display-primary);
      margin-bottom: var(--scout-space-4);
    }
    :host([size='condensed']) .label {
      font-size: var(--scout-typography-label-small-font-size);
      line-height: var(--scout-typography-label-small-line-height);
    }
    /* Optional hint sits inline with the label, regular weight + secondary
       color so it reads as supporting metadata, not part of the label name. */
    .label .optional {
      margin-left: var(--scout-space-4);
      font-weight: var(--scout-font-weight-regular);
      color: var(--scout-text-display-secondary);
    }

    .field {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--scout-space-4);
      height: var(--_tf-h);
      padding: 0 var(--_tf-px);
      background: var(--scout-surface-primary);
      border: var(--scout-border-width-1) solid var(--scout-border-primary);
      border-radius: var(--scout-radius-4);
      transition:
        border-color var(--scout-motion-duration-fast, 120ms)
          var(--scout-motion-easing-standard, ease),
        background var(--scout-motion-duration-fast, 120ms)
          var(--scout-motion-easing-standard, ease);
    }
    .field:hover {
      border-color: var(--scout-text-interactive-primary);
    }
    .field:focus-within {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: var(--scout-focus-ring-offset);
      border-color: var(--scout-text-interactive-primary);
    }
    /* Pressed / active — input has content + is not focused */
    :host([data-active]:not(:focus-within)) .field {
      border-color: var(--scout-text-display-primary);
    }
    :host([invalid]) .field {
      border-color: var(--scout-border-critical);
    }
    :host([invalid]) .field:focus-within {
      outline-color: var(--scout-focus-ring-critical-color);
    }

    input {
      flex: 1;
      min-width: 0;
      appearance: none;
      border: none;
      outline: none;
      background: transparent;
      font: inherit;
      font-size: var(--_tf-fs);
      color: var(--scout-text-display-primary);
      padding: 0;
    }
    input::placeholder { color: var(--scout-text-display-secondary); }

    .leading,
    .trailing {
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-4);
      color: var(--scout-text-display-secondary);
      flex-shrink: 0;
    }
    .leading svg, .trailing svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
    .currency-prefix {
      color: var(--scout-text-display-secondary);
      font-size: var(--_tf-fs);
      flex-shrink: 0;
      user-select: none;
    }

    /* Inline icon buttons (clear, eye toggle, picker triggers) */
    .icon-btn {
      appearance: none;
      background: transparent;
      border: none;
      padding: 2px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--scout-radius-2);
      cursor: pointer;
      color: var(--scout-text-display-secondary);
    }
    .icon-btn:hover { color: var(--scout-text-display-primary); background: var(--scout-interactive-background-hover); }
    .icon-btn:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: 1px;
    }

    .check-match { color: var(--scout-text-display-success); }

    /* Helper / error text */
    .msg {
      display: block;
      font-size: var(--scout-font-size-12);
      line-height: var(--scout-font-line-height-18);
      color: var(--scout-text-display-secondary);
      margin-top: var(--scout-space-4);
    }
    .msg.error { color: var(--scout-text-display-critical); }

    @media (prefers-reduced-motion: reduce) {
      .field { transition: none; }
    }
  `;

  @property({ reflect: true }) variant: TextFieldVariant = 'text';
  @property({ reflect: true }) size: TextInputSize = 'default';
  @property() label = '';
  @property() placeholder = '';
  @property() value = '';
  @property() helper = '';
  @property() error = '';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) invalid = false;
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean, reflect: true }) optional = false;
  @property() name = '';
  @property({ attribute: 'confirm-target' }) confirmTarget = '';

  /** Local visibility state for password / sensitive-data variants */
  @state() private _revealed = false;

  @query('input') private _input!: HTMLInputElement;

  private readonly _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('error')) this.invalid = !!this.error;
    if (changed.has('value')) {
      this._internals.setFormValue(this.value);
      this.toggleAttribute('data-active', !!this.value);
    }
  }

  // ---- Per-variant formatting helpers ----------------------------------

  private _formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    if (digits.length < 4) return digits;
    if (digits.length < 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  private _formatCurrency(raw: string): string {
    // Strip everything except digits and a single decimal point
    let s = raw.replace(/[^0-9.]/g, '');
    const firstDot = s.indexOf('.');
    if (firstDot !== -1) s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
    // Allow at most two decimals
    const [whole, frac] = s.split('.');
    return frac !== undefined ? `${whole}.${frac.slice(0, 2)}` : whole ?? '';
  }

  private _commitCurrencyFormat() {
    if (this.variant !== 'currency' || !this.value) return;
    const n = Number(this.value);
    if (!Number.isFinite(n)) return;
    this.value = n.toFixed(2);
  }

  // ---- Event wiring ----------------------------------------------------

  private _onInput = (e: Event) => {
    const raw = (e.currentTarget as HTMLInputElement).value;
    let next = raw;
    if (this.variant === 'phone') next = this._formatPhone(raw);
    else if (this.variant === 'currency') next = this._formatCurrency(raw);
    else if (this.variant === 'number') next = raw.replace(/[^0-9]/g, '');
    this.value = next;
    // Re-fire the input event from the host so consumers see it bubbling from the component
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  };

  private _onChange = () => {
    if (this.variant === 'currency') this._commitCurrencyFormat();
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  };

  private _toggleReveal = () => {
    this._revealed = !this._revealed;
  };

  private _clearValue = () => {
    this.value = '';
    this._input?.focus();
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  };

  private _firePickerTrigger = () => {
    this.dispatchEvent(
      new CustomEvent<{ variant: TextFieldVariant }>('scout-text-field-trigger', {
        bubbles: true,
        composed: true,
        detail: { variant: this.variant },
      }),
    );
  };

  /** Look up the partner field for `confirmation` variant and check equality. */
  private _confirmMatches(): boolean {
    if (this.variant !== 'confirmation' || !this.value) return false;
    if (!this.confirmTarget) return false;
    const root = this.getRootNode() as Document | ShadowRoot;
    const partner = root.querySelector<HTMLInputElement | ScoutTextField>(this.confirmTarget);
    if (!partner) return false;
    return (partner as ScoutTextField).value === this.value;
  }

  // ---- Render ----------------------------------------------------------

  private _inputType(): string {
    switch (this.variant) {
      case 'number':
      case 'currency':
      case 'phone':
        return 'text'; // we manage the format ourselves; type=text avoids browser quirks
      case 'password':
      case 'sensitive-data':
        return this._revealed ? 'text' : 'password';
      case 'date-picker':
      case 'month-picker':
      case 'time-picker':
      case 'search':
      case 'confirmation':
      case 'text':
      default:
        return 'text';
    }
  }

  private _renderLeading() {
    if (this.variant === 'search') {
      return html`<span class="leading"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS.search}</svg></span>`;
    }
    if (this.variant === 'currency') {
      return html`<span class="currency-prefix" aria-hidden="true">$</span>`;
    }
    return nothing;
  }

  private _renderTrailing() {
    switch (this.variant) {
      case 'search': {
        if (!this.value) return nothing;
        return html`<button class="icon-btn" type="button" aria-label="Clear" @click=${this._clearValue}>
          <svg viewBox="0 0 24 24" aria-hidden="true">${ICONS.xClear}</svg>
        </button>`;
      }
      case 'password':
      case 'sensitive-data': {
        const icon = this._revealed ? ICONS.eyeOff : ICONS.eyeOn;
        return html`<button class="icon-btn" type="button"
          aria-label=${this._revealed ? 'Hide' : 'Show'}
          aria-pressed=${String(this._revealed)}
          @click=${this._toggleReveal}
        ><svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg></button>`;
      }
      case 'confirmation': {
        if (!this._confirmMatches()) return nothing;
        return html`<span class="check-match" aria-label="Matches">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="16" height="16">${ICONS.check}</svg>
        </span>`;
      }
      case 'date-picker':
      case 'month-picker':
        return html`<button class="icon-btn" type="button" aria-label="Open calendar" @click=${this._firePickerTrigger}>
          <svg viewBox="0 0 24 24" aria-hidden="true">${ICONS.calendar}</svg>
        </button>`;
      case 'time-picker':
        return html`<button class="icon-btn" type="button" aria-label="Open time picker" @click=${this._firePickerTrigger}>
          <svg viewBox="0 0 24 24" aria-hidden="true">${ICONS.clock}</svg>
        </button>`;
      default:
        return nothing;
    }
  }

  render() {
    const id = `cnx-tf-${Math.random().toString(36).slice(2, 9)}`;
    return html`
      ${this.label
        ? html`<label class="label" for=${id}>
            ${this.label}${this.optional && !this.required
              ? html`<span class="optional">(Optional)</span>`
              : nothing}
          </label>`
        : nothing}
      <div class="field">
        ${this._renderLeading()}
        <input
          id=${id}
          type=${this._inputType()}
          .value=${this.value}
          placeholder=${this.placeholder || ''}
          ?disabled=${this.disabled}
          ?required=${this.required}
          name=${this.name || nothing}
          inputmode=${this.variant === 'number' || this.variant === 'currency'
            ? 'decimal'
            : this.variant === 'phone'
              ? 'tel'
              : (nothing as unknown as string)}
          aria-invalid=${this.invalid ? 'true' : (nothing as unknown as string)}
          @input=${this._onInput}
          @change=${this._onChange}
        />
        ${this._renderTrailing()}
      </div>
      ${this.error
        ? html`<span class="msg error" role="alert">${this.error}</span>`
        : this.helper
          ? html`<span class="msg">${this.helper}</span>`
          : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-text-field': ScoutTextField;
  }
}
