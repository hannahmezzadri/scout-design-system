import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { TextInputSize } from './types.js';

/**
 * `<connex-text-area>` — multi-line text input with a resize gripper.
 *
 * Anatomy: label, placeholder, value, helper text, optional error, plus
 * the native bottom-right resize gripper that lets the user grow / shrink
 * the field height.
 *
 * @element connex-text-area
 *
 * @attr {"default"|"condensed"} size - Density preset.
 * @attr label                        - Field label.
 * @attr placeholder                  - Placeholder text.
 * @attr value                        - Current text value.
 * @attr helper                       - Helper text rendered below the field.
 * @attr error                        - Error message; switches the field to invalid styling.
 * @attr disabled                     - Disables interaction.
 * @attr {number} rows                - Initial visible row count. Default 4.
 * @attr {string} resize              - One of `vertical` (default), `none`, `both`.
 * @attr name                         - Form field name.
 *
 * @fires input  - Native, bubbles, composed.
 * @fires change - Native, bubbles, composed.
 */
@customElement('connex-text-area')
export class ConnexTextArea extends LitElement {
  static formAssociated = true;

  static styles = css`
    :host {
      display: block;
      font-family: var(--connex-font-family-inter);
      --_ta-fs: var(--connex-font-size-14);
      --_ta-px: var(--connex-space-12);
      --_ta-py: var(--connex-space-8);
    }
    :host([size='condensed']) {
      --_ta-fs: var(--connex-font-size-12);
      --_ta-px: var(--connex-space-8);
      --_ta-py: var(--connex-space-4);
    }
    :host([disabled]) { opacity: 0.5; pointer-events: none; }

    .label {
      display: block;
      font-size: var(--connex-font-size-12);
      font-weight: var(--connex-font-weight-semibold);
      color: var(--connex-text-display-primary);
      margin-bottom: var(--connex-space-4);
    }

    textarea {
      display: block;
      width: 100%;
      box-sizing: border-box;
      padding: var(--_ta-py) var(--_ta-px);
      background: var(--connex-surface-primary);
      border: var(--connex-border-width-1) solid var(--connex-border-primary);
      border-radius: var(--connex-radius-4);
      color: var(--connex-text-display-primary);
      font-family: inherit;
      font-size: var(--_ta-fs);
      line-height: var(--connex-font-line-height-21);
      resize: vertical;
      transition: border-color var(--connex-motion-duration-fast, 120ms)
        var(--connex-motion-easing-standard, ease);
    }
    :host([resize='none']) textarea { resize: none; }
    :host([resize='both']) textarea { resize: both; }

    textarea::placeholder { color: var(--connex-text-display-secondary); }
    textarea:hover { border-color: var(--connex-text-interactive-primary); }
    textarea:focus {
      outline: var(--connex-focus-ring-width) solid var(--connex-focus-ring-color);
      outline-offset: var(--connex-focus-ring-offset);
      border-color: var(--connex-text-interactive-primary);
    }
    :host([invalid]) textarea {
      border-color: var(--connex-border-error);
    }
    :host([invalid]) textarea:focus {
      outline-color: var(--connex-focus-ring-error-color);
    }

    .msg {
      display: block;
      font-size: var(--connex-font-size-12);
      line-height: var(--connex-font-line-height-18);
      color: var(--connex-text-display-secondary);
      margin-top: var(--connex-space-4);
    }
    .msg.error { color: var(--connex-text-display-error); }
  `;

  @property({ reflect: true }) size: TextInputSize = 'default';
  @property() label = '';
  @property() placeholder = '';
  @property() value = '';
  @property() helper = '';
  @property() error = '';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) invalid = false;
  @property({ type: Number }) rows = 4;
  @property({ reflect: true }) resize: 'vertical' | 'none' | 'both' = 'vertical';
  @property() name = '';

  private readonly _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('error')) this.invalid = !!this.error;
    if (changed.has('value')) this._internals.setFormValue(this.value);
  }

  private _onInput = (e: Event) => {
    this.value = (e.currentTarget as HTMLTextAreaElement).value;
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  };

  private _onChange = () => {
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  };

  render() {
    const id = `cnx-ta-${Math.random().toString(36).slice(2, 9)}`;
    return html`
      ${this.label ? html`<label class="label" for=${id}>${this.label}</label>` : nothing}
      <textarea
        id=${id}
        rows=${this.rows}
        .value=${this.value}
        placeholder=${this.placeholder || ''}
        ?disabled=${this.disabled}
        name=${this.name || nothing}
        aria-invalid=${this.invalid ? 'true' : (nothing as unknown as string)}
        @input=${this._onInput}
        @change=${this._onChange}
      ></textarea>
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
    'connex-text-area': ConnexTextArea;
  }
}
