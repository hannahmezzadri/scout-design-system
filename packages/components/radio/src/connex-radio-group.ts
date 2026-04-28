import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ConnexRadio } from './connex-radio.js';
import type { RadioGroupOrientation } from './types.js';

const ERROR_ICON = svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm9.75-3.75a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>`;

let GROUP_SEQ = 0;

/**
 * `<connex-radio-group>` — wraps a set of `<connex-radio>` items with a shared
 * legend, helper text, error, orientation, and `name`.
 *
 * The group propagates its `name` to every child radio (so they share the
 * mutual-exclusion namespace) and tracks the currently-selected `value`.
 *
 * @element connex-radio-group
 *
 * @attr label                                  - Group/field label rendered as a fieldset legend.
 * @attr helper                                 - Group secondary text rendered below the legend.
 * @attr error                                  - Error message; marks all child radios invalid.
 * @attr {"vertical"|"horizontal"} orientation  - Layout direction of children. Vertical is the default.
 * @attr disabled                               - Disables every child radio.
 * @attr name                                   - Shared form name. Auto-generated if omitted.
 * @attr value                                  - The selected radio's value. Reflects to attribute.
 *
 * @slot - One or more `<connex-radio>` children.
 * @slot helper - Override the helper attribute with rich content.
 * @slot error  - Override the error attribute with rich content.
 *
 * @fires connex-radio-change - Bubbles, composed; detail = `{ value }`.
 */
@customElement('connex-radio-group')
export class ConnexRadioGroup extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--connex-font-family-inter);
    }
    .group {
      display: flex;
      flex-direction: column;
      gap: var(--connex-space-8);
      margin: 0;
      padding: 0;
      border: none;
      min-width: 0;
    }
    .label {
      font-size: var(--connex-font-size-14);
      font-weight: var(--connex-font-weight-semibold);
      color: var(--connex-text-display-primary);
      padding: 0;
      margin: 0;
    }
    .helper {
      font-size: var(--connex-font-size-12);
      line-height: var(--connex-font-line-height-18);
      color: var(--connex-text-display-secondary);
    }
    .helper[hidden] { display: none; }

    .items {
      display: flex;
      flex-direction: column;
      gap: var(--connex-space-12);
      margin-top: var(--connex-space-4);
    }
    :host([orientation='horizontal']) .items {
      flex-direction: row;
      flex-wrap: wrap;
      gap: var(--connex-space-24);
    }

    .message {
      display: inline-flex;
      align-items: flex-start;
      gap: var(--connex-space-4);
      font-size: var(--connex-font-size-12);
      line-height: var(--connex-font-line-height-18);
      margin-top: var(--connex-space-4);
      color: var(--connex-text-display-error);
    }
    .message[hidden] { display: none; }
    .message svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      margin-top: 2px;
    }
  `;

  @property() label = '';
  @property() helper = '';
  @property() error = '';
  @property({ type: String, reflect: true })
  orientation: RadioGroupOrientation = 'vertical';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ reflect: true }) name = `cnx-radio-${++GROUP_SEQ}`;
  @property({ reflect: true }) value = '';

  connectedCallback(): void {
    super.connectedCallback();
    // `change` from any child radio bubbles up — track the selected value.
    this.addEventListener('change', this._onChildChange as EventListener);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('change', this._onChildChange as EventListener);
  }

  private _onChildChange = (e: Event) => {
    const target = e.target as ConnexRadio | null;
    if (!target || target.tagName.toLowerCase() !== 'connex-radio') return;
    if (!target.checked) return;
    this.value = target.value || '';
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('connex-radio-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  };

  private _syncChildren() {
    const items = this.querySelectorAll<ConnexRadio>('connex-radio');
    items.forEach((c) => {
      // Share the group's name so native radio mutual-exclusion works
      if (this.name) c.setAttribute('name', this.name);
      c.toggleAttribute('invalid', !!this.error);
      if (this.disabled) c.setAttribute('disabled', '');
      c.checked = this.value !== '' && c.value === this.value;
    });
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('error') || changed.has('disabled') || changed.has('name') || changed.has('value')) {
      this._syncChildren();
    }
  }

  /** Re-sync whenever the slotted content changes (children added/removed). */
  private _onSlotChange = () => this._syncChildren();

  render() {
    return html`
      <fieldset class="group" ?disabled=${this.disabled}>
        ${this.label
          ? html`<legend class="label">${this.label}</legend>`
          : nothing}
        <div class="helper" ?hidden=${!this.helper}><slot name="helper">${this.helper}</slot></div>
        <div class="items" role="radiogroup" aria-label=${this.label || nothing}>
          <slot @slotchange=${this._onSlotChange}></slot>
        </div>
        <div class="message" role="alert" ?hidden=${!this.error}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ERROR_ICON}</svg>
          <slot name="error">${this.error}</slot>
        </div>
      </fieldset>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-radio-group': ConnexRadioGroup;
  }
}
