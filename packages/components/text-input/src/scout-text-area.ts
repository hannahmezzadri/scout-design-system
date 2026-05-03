import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { TextInputSize } from './types.js';

/**
 * `<scout-text-area>` — multi-line text input with a resize gripper.
 *
 * Anatomy: label, placeholder, value, helper text, optional error, plus
 * the native bottom-right resize gripper that lets the user grow / shrink
 * the field height.
 *
 * @element scout-text-area
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
 * @attr optional                     - When set, renders an "(Optional)" hint next to the label.
 *
 * @fires input  - Native, bubbles, composed.
 * @fires change - Native, bubbles, composed.
 */
@customElement('scout-text-area')
export class ScoutTextArea extends LitElement {
  static formAssociated = true;

  static styles = css`
    :host {
      display: block;
      font-family: var(--scout-font-family-inter);
      --_ta-fs: var(--scout-font-size-14);
      --_ta-px: var(--scout-space-12);
      --_ta-py: var(--scout-space-8);
    }
    :host([size='condensed']),
    :host-context([data-density='condensed']) {
      --_ta-fs: var(--scout-font-size-12);
      --_ta-px: var(--scout-space-8);
      --_ta-py: var(--scout-space-4);
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

    textarea {
      display: block;
      width: 100%;
      box-sizing: border-box;
      padding: var(--_ta-py) var(--_ta-px);
      background: var(--scout-surface-primary);
      border: var(--scout-border-width-1) solid var(--scout-border-primary);
      border-radius: var(--scout-radius-4);
      color: var(--scout-text-display-primary);
      font-family: inherit;
      font-size: var(--_ta-fs);
      line-height: var(--scout-font-line-height-21);
      resize: vertical;
      transition: border-color var(--scout-motion-duration-fast, 120ms)
        var(--scout-motion-easing-standard, ease);
    }
    :host([resize='none']) textarea { resize: none; }
    :host([resize='both']) textarea { resize: both; }

    textarea::placeholder { color: var(--scout-text-display-secondary); }
    textarea:hover { border-color: var(--scout-text-interactive-primary); }
    textarea:focus {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: var(--scout-focus-ring-offset);
      border-color: var(--scout-text-interactive-primary);
    }
    :host([invalid]) textarea {
      border-color: var(--scout-border-critical);
    }
    :host([invalid]) textarea:focus {
      outline-color: var(--scout-focus-ring-critical-color);
    }

    .msg {
      display: block;
      font-size: var(--scout-font-size-12);
      line-height: var(--scout-font-line-height-18);
      color: var(--scout-text-display-secondary);
      margin-top: var(--scout-space-4);
    }
    .msg.error { color: var(--scout-text-display-critical); }
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
  @property({ type: Boolean, reflect: true }) optional = false;

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
      ${this.label
        ? html`<label class="label" for=${id}>
            ${this.label}${this.optional
              ? html`<span class="optional">(Optional)</span>`
              : nothing}
          </label>`
        : nothing}
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
    'scout-text-area': ScoutTextArea;
  }
}
