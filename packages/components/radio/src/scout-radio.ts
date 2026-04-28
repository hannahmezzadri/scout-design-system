import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

const WARNING_ICON = svg`<path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>`;

/**
 * `<scout-radio>` — single radio button with optional label, badge, secondary
 * text, and warning message.
 *
 * Form-associated via ElementInternals so the radio participates in native
 * `<form>` submission with the host's `name` / `value`. Mutual-exclusion is
 * handled by the parent `<scout-radio-group>` (or by sharing `name` across
 * radios in a form).
 *
 * @element scout-radio
 *
 * @attr checked    - Selected state.
 * @attr disabled   - Disables interaction; skips tab order.
 * @attr invalid    - Renders an error border. Auto-set by the parent group's `error`.
 * @attr name       - Form field name. Auto-propagated by the parent group.
 * @attr value      - Form value to submit when checked. Defaults to "on".
 * @attr secondary  - Optional secondary text rendered under the label.
 * @attr warning    - Optional warning message rendered under the label.
 *
 * @slot       - Default slot: the radio label content.
 * @slot badge - Optional badge rendered to the right of the label (e.g., a `<scout-badge>`).
 *
 * @fires change - Bubbles, composed; the host's checked state has been toggled by the user.
 */
@customElement('scout-radio')
export class ScoutRadio extends LitElement {
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
      align-items: flex-start;
      gap: var(--scout-space-8);
      cursor: pointer;
      user-select: none;
    }
    :host([disabled]) .row { cursor: not-allowed; }

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
      border: var(--scout-border-width-1) solid var(--scout-border-primary);
      border-radius: 50%;
      background: var(--scout-surface-primary);
      cursor: inherit;
      transition:
        background var(--scout-motion-duration-fast)
          var(--scout-motion-easing-standard),
        border-color var(--scout-motion-duration-fast)
          var(--scout-motion-easing-standard);
    }
    input:hover:not(:disabled) {
      border-color: var(--scout-text-interactive-primary);
    }
    input:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: var(--scout-focus-ring-offset);
    }
    input:active:not(:disabled) {
      background: var(--scout-color-cool-gray-100);
    }
    input:checked {
      border-color: var(--scout-text-interactive-primary);
      background: var(--scout-surface-primary);
    }
    /* Inner dot for the selected state. Kept inside the input via a ::after to
       avoid an extra DOM element; sized so it never touches the border. */
    input:checked::after {
      content: '';
      position: absolute;
      inset: 3px;
      border-radius: 50%;
      background: var(--scout-text-interactive-primary);
    }
    input:checked:active::after {
      background: var(--scout-interactive-background-brand-strong-pressed);
    }

    :host([invalid]) input:not(:checked) {
      border-color: var(--scout-border-error);
    }

    /* Text + label column */
    .text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .label-row {
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-8);
    }
    .label {
      font-size: var(--scout-font-size-14);
      line-height: var(--scout-font-line-height-21);
      color: var(--scout-text-display-primary);
    }
    .secondary {
      font-size: var(--scout-font-size-12);
      line-height: var(--scout-font-line-height-18);
      color: var(--scout-text-display-secondary);
    }
    .warning {
      display: inline-flex;
      align-items: flex-start;
      gap: var(--scout-space-4);
      font-size: var(--scout-font-size-12);
      line-height: var(--scout-font-line-height-18);
      color: var(--scout-text-display-warning);
      margin-top: 2px;
    }
    .warning svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      input { transition: none; }
    }
  `;

  @property({ type: Boolean, reflect: true }) checked = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) invalid = false;
  @property() name = '';
  @property() value = '';
  @property() secondary = '';
  @property() warning = '';

  private readonly _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  private _onChange = (e: Event) => {
    if (this.disabled) return;
    const input = e.currentTarget as HTMLInputElement;
    this.checked = input.checked;
    this._setFormValue();

    // Mutually exclude peers in the same group, mirroring native <input type="radio">
    // semantics. The parent <scout-radio-group> also listens for `change` and
    // updates its `value` accordingly.
    if (this.checked) {
      const root = this.getRootNode() as Document | ShadowRoot;
      const peers = root.querySelectorAll<ScoutRadio>(`scout-radio[name="${this.name}"]`);
      peers.forEach((p) => { if (p !== this) p.checked = false; });
    }
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  };

  private _setFormValue() {
    this._internals.setFormValue(this.checked ? (this.value || 'on') : null);
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('checked') || changed.has('value')) this._setFormValue();
  }

  render() {
    return html`
      <label class="row">
        <span class="control" part="control">
          <input
            type="radio"
            ?checked=${this.checked}
            ?disabled=${this.disabled}
            name=${this.name || nothing}
            value=${this.value || nothing}
            aria-invalid=${this.invalid ? 'true' : (nothing as any)}
            @change=${this._onChange}
          />
        </span>
        <span class="text">
          <span class="label-row">
            <span class="label"><slot></slot></span>
            <slot name="badge"></slot>
          </span>
          ${this.secondary
            ? html`<span class="secondary">${this.secondary}</span>`
            : nothing}
          ${this.warning
            ? html`<span class="warning" role="status">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${WARNING_ICON}</svg>
                ${this.warning}
              </span>`
            : nothing}
        </span>
      </label>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-radio': ScoutRadio;
  }
}
