import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { SensitiveDataLayout } from './types.js';

const EYE_ON  = svg`<path fill-rule="evenodd" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .644C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178ZM15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clip-rule="evenodd"/>`;
const EYE_OFF = svg`<path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.244 7.244L19.5 19.5m-3.378-3.378-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.243 4.243L9.879 9.88" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;

/**
 * `<connex-sensitive-data>` — masks the slotted value by default with a
 * Show / Hide toggle. Use for PII like Social Security numbers, account
 * numbers, and full card numbers that shouldn't be visible at rest.
 *
 * Anatomy: masked / revealed value (slotted) + a toggle control with one
 * of three layouts (icon + label, icon only, label only). One affordance
 * MUST be visible — the component refuses to render an empty toggle.
 *
 * Content rule: the toggle labels are always "Show" / "Hide". They are
 * NOT customizable; this is intentional and enforced.
 *
 * @element connex-sensitive-data
 *
 * @attr revealed                                                 - Reflects the visibility state.
 * @attr {"icon-label"|"icon-only"|"label-only"} layout          - Toggle affordance.
 * @attr disabled                                                  - Disables the toggle; the value stays masked.
 * @attr {string} mask-char                                       - Character used to render the mask. Default `•`.
 * @attr {number} mask-visible-tail                               - Number of trailing characters to leave un-masked
 *                                                                  (e.g., `4` → `••••••••1234`). Default `0` (mask all).
 *
 * @slot - The actual value. Plain text only — masking measures string length.
 *
 * @fires connex-sensitive-data-toggle - Bubbles, composed; detail = `{ revealed }`.
 */
@customElement('connex-sensitive-data')
export class ConnexSensitiveData extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--connex-space-8);
      font-family: var(--connex-font-family-inter);
      font-variant-numeric: tabular-nums;
    }

    .value {
      font-size: var(--connex-font-size-14);
      line-height: var(--connex-font-line-height-21);
      color: var(--connex-text-display-primary);
      letter-spacing: 0.02em;
    }
    /* When masked, the slot is hidden visually; we render the masked string in
       its place. The slot remains in the DOM so the value is accessible to
       parent JS via querySelector and so the masked length tracks live edits. */
    .slot-host { display: none; }
    :host([revealed]) .slot-host { display: inline; }
    :host([revealed]) .mask { display: none; }

    /* Toggle button — token-driven across all five interactive states */
    .toggle {
      appearance: none;
      background: transparent;
      border: none;
      padding: 2px var(--connex-space-4);
      display: inline-flex;
      align-items: center;
      gap: var(--connex-space-4);
      font-family: inherit;
      font-size: var(--connex-font-size-12);
      font-weight: var(--connex-font-weight-semibold);
      line-height: var(--connex-font-line-height-15);
      color: var(--connex-text-interactive-primary);
      border-radius: var(--connex-radius-2);
      cursor: pointer;
      transition: background var(--connex-motion-duration-fast, 120ms)
          var(--connex-motion-easing-standard, ease),
        color var(--connex-motion-duration-fast, 120ms)
          var(--connex-motion-easing-standard, ease);
    }
    .toggle:hover:not(:disabled) {
      background: var(--connex-interactive-background-brand-hover);
    }
    .toggle:focus-visible {
      outline: var(--connex-focus-ring-width) solid var(--connex-focus-ring-color);
      outline-offset: var(--connex-focus-ring-offset);
    }
    .toggle:active:not(:disabled) {
      background: var(--connex-interactive-background-brand-pressed);
      color: var(--connex-interactive-background-brand-strong-pressed);
    }
    .toggle:disabled {
      color: var(--connex-text-display-disabled, var(--connex-color-cool-gray-400));
      cursor: not-allowed;
    }

    .toggle svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      fill: currentColor;
    }
    /* Icon-only layout: square the click target */
    :host([layout='icon-only']) .toggle {
      padding: var(--connex-space-4);
    }
  `;

  @property({ type: Boolean, reflect: true }) revealed = false;
  @property({ reflect: true }) layout: SensitiveDataLayout = 'icon-label';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ attribute: 'mask-char' }) maskChar = '•';
  @property({ type: Number, attribute: 'mask-visible-tail' }) maskVisibleTail = 0;

  /** Plain-text representation of the slotted value. Tracks live changes. */
  @state() private _rawValue = '';

  private _onSlotChange = (e: Event) => {
    const slot = e.target as HTMLSlotElement;
    const text = slot
      .assignedNodes({ flatten: true })
      .map((n) => n.textContent ?? '')
      .join('');
    this._rawValue = text.trim();
  };

  private _toggle = () => {
    if (this.disabled) return;
    this.revealed = !this.revealed;
    this.dispatchEvent(
      new CustomEvent<{ revealed: boolean }>('connex-sensitive-data-toggle', {
        bubbles: true,
        composed: true,
        detail: { revealed: this.revealed },
      }),
    );
  };

  private get _maskedValue(): string {
    const raw = this._rawValue;
    const tail = Math.max(0, Math.min(raw.length, this.maskVisibleTail));
    const head = raw.length - tail;
    return this.maskChar.repeat(head) + raw.slice(head);
  }

  /** Per the spec, labels are NOT customizable. */
  private get _label(): string {
    return this.revealed ? 'Hide' : 'Show';
  }

  private _renderToggleContents() {
    const label = this._label;
    const icon = this.revealed
      ? html`<svg viewBox="0 0 24 24" aria-hidden="true">${EYE_OFF}</svg>`
      : html`<svg viewBox="0 0 24 24" aria-hidden="true">${EYE_ON}</svg>`;
    switch (this.layout) {
      case 'icon-only':
        return icon;
      case 'label-only':
        return html`<span>${label}</span>`;
      case 'icon-label':
      default:
        return html`${icon}<span>${label}</span>`;
    }
  }

  render() {
    return html`
      <span class="value" part="value">
        <span class="slot-host"><slot @slotchange=${this._onSlotChange}></slot></span>
        <span class="mask" aria-hidden="true">${this._maskedValue}</span>
      </span>
      <button
        class="toggle"
        type="button"
        part="toggle"
        ?disabled=${this.disabled}
        aria-pressed=${String(this.revealed)}
        aria-label=${this.layout === 'icon-only' ? this._label : (nothing as unknown as string)}
        @click=${this._toggle}
      >
        ${this._renderToggleContents()}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-sensitive-data': ConnexSensitiveData;
  }
}
