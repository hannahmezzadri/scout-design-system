import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import type { ScoutDropdownOption } from './scout-dropdown-option.js';
import type { DropdownSize } from './types.js';

const CHEVRON_DOWN = svg`<path fill-rule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clip-rule="evenodd"/>`;

const ERROR_ICON = svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm9.75-3.75a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>`;

/**
 * `<scout-dropdown-select>` — single-select dropdown with optional helper /
 * error messages. Wraps `<scout-dropdown-option>` children.
 *
 * @element scout-dropdown-select
 *
 * @attr label                   - Label rendered above the field.
 * @attr placeholder             - Text shown when no value is selected.
 * @attr value                   - Currently-selected value (matches a child option's value attribute).
 * @attr helper                  - Helper text rendered below the field.
 * @attr error                   - Error message; renders error icon + red border.
 * @attr {"default"|"condensed"} size
 * @attr disabled
 * @attr name                    - Form field name.
 *
 * @slot - One or more `<scout-dropdown-option>` children.
 *
 * @fires scout-dropdown-change - Bubbles, composed; detail = `{ value }`.
 */
@customElement('scout-dropdown-select')
export class ScoutDropdownSelect extends LitElement {
  static formAssociated = true;

  static styles = css`
    :host {
      display: inline-block;
      width: 100%;
      max-width: 320px;
      font-family: var(--scout-font-family-inter);
      --_dropdown-h: 36px;
      --_dropdown-fs: var(--scout-font-size-14);
    }
    :host([size='condensed']),
    :host-context([data-density='condensed']) {
      --_dropdown-h: 28px;
      --_dropdown-fs: var(--scout-font-size-12);
    }

    .field { position: relative; display: flex; flex-direction: column; gap: var(--scout-space-4); }

    label {
      font-size: var(--scout-font-size-12);
      font-weight: var(--scout-font-weight-semibold);
      color: var(--scout-text-display-primary);
    }

    .trigger {
      appearance: none;
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--scout-space-8);
      width: 100%;
      min-height: var(--_dropdown-h);
      padding: 0 var(--scout-space-12);
      background: var(--scout-surface-primary);
      border: var(--scout-border-width-1) solid var(--scout-border-primary);
      border-radius: var(--scout-radius-4);
      font-family: inherit;
      font-size: var(--_dropdown-fs);
      color: var(--scout-text-display-primary);
      text-align: start;
      cursor: pointer;
      transition: border-color var(--scout-motion-duration-fast) var(--scout-motion-easing-standard);
    }
    .trigger:hover:not(:disabled) {
      border-color: var(--scout-text-interactive-primary);
    }
    .trigger:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: 1px;
    }
    .trigger:active:not(:disabled) {
      background: var(--scout-color-cool-gray-100);
    }
    .trigger:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    :host([invalid]) .trigger { border-color: var(--scout-border-error); }

    .value { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .value.placeholder { color: var(--scout-text-display-secondary); }

    .caret {
      width: 16px;
      height: 16px;
      color: var(--scout-icon-display-secondary);
      transition: transform var(--scout-motion-duration-fast) var(--scout-motion-easing-standard);
      flex-shrink: 0;
    }
    .field[data-open='true'] .caret { transform: rotate(180deg); }

    .menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: var(--scout-space-4);
      background: var(--scout-surface-primary);
      border: var(--scout-border-width-1) solid var(--scout-border-secondary);
      border-radius: var(--scout-radius-4);
      box-shadow: var(--scout-elevation-2);
      max-height: 240px;
      overflow-y: auto;
      z-index: 1000;
      padding: var(--scout-space-4) 0;
    }
    .menu[hidden] { display: none; }

    .helper, .error-msg {
      font-size: var(--scout-font-size-12);
      line-height: var(--scout-font-line-height-18);
    }
    .helper { color: var(--scout-text-display-secondary); }
    .error-msg {
      color: var(--scout-text-display-error);
      display: inline-flex;
      align-items: flex-start;
      gap: var(--scout-space-4);
    }
    .error-msg svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 2px; }

    @media (prefers-reduced-motion: reduce) {
      .trigger, .caret { transition: none; }
    }
  `;

  @property() label = '';
  @property() placeholder = 'Select…';
  @property() value = '';
  @property() helper = '';
  @property() error = '';
  @property({ type: String, reflect: true }) size: DropdownSize = 'default';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) invalid = false;
  @property() name = '';

  @state() private _open = false;
  @state() private _activeIndex = -1;

  @query('.trigger') private _triggerEl!: HTMLButtonElement;

  private readonly _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('mousedown', this._onDocClick);
    this.addEventListener('click', this._onOptionClick);
    this.addEventListener('keydown', this._onKeyDown);
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('mousedown', this._onDocClick);
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('value') || changed.has('error')) this._syncOptions();
    this.invalid = !!this.error;
    this._internals.setFormValue(this.value || null);
  }

  private get _options(): ScoutDropdownOption[] {
    return Array.from(this.querySelectorAll('scout-dropdown-option'));
  }

  private _syncOptions() {
    this._options.forEach((opt, i) => {
      opt.selected = opt.value === this.value;
      opt.active = i === this._activeIndex;
    });
  }

  private _toggle() {
    if (this.disabled) return;
    this._open = !this._open;
    if (this._open) {
      const idx = this._options.findIndex(o => o.selected);
      this._activeIndex = idx >= 0 ? idx : 0;
      this._syncOptions();
    }
  }

  private _close() { this._open = false; this._syncOptions(); }

  private _onDocClick = (e: MouseEvent) => {
    if (!this._open) return;
    if (!this.contains(e.target as Node) && !this.shadowRoot?.contains(e.target as Node)) {
      this._close();
    }
  };

  private _onOptionClick = (e: Event) => {
    const target = (e.target as HTMLElement).closest('scout-dropdown-option') as ScoutDropdownOption | null;
    if (!target || target.disabled) return;
    this._select(target.value);
  };

  private _select(value: string) {
    this.value = value;
    this._close();
    this.dispatchEvent(new CustomEvent('scout-dropdown-change', {
      bubbles: true, composed: true, detail: { value },
    }));
  }

  private _onKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) return;
    if (!this._open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      this._toggle();
      return;
    }
    if (!this._open) return;
    if (e.key === 'Escape') { e.preventDefault(); this._close(); this._triggerEl?.focus(); }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._activeIndex = Math.min(this._options.length - 1, this._activeIndex + 1);
      this._syncOptions();
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._activeIndex = Math.max(0, this._activeIndex - 1);
      this._syncOptions();
    }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = this._options[this._activeIndex];
      if (opt && !opt.disabled) this._select(opt.value);
    }
  };

  private get _selectedLabel(): string {
    const opt = this._options.find(o => o.value === this.value);
    return opt?.textContent?.trim() || '';
  }

  render() {
    const showPlaceholder = !this.value;
    return html`
      <div class="field" data-open=${String(this._open)}>
        ${this.label ? html`<label>${this.label}</label>` : nothing}
        <button
          class="trigger"
          type="button"
          ?disabled=${this.disabled}
          aria-haspopup="listbox"
          aria-expanded=${String(this._open)}
          aria-invalid=${this.invalid ? 'true' : (nothing as any)}
          @click=${this._toggle}
        >
          <span class="value ${showPlaceholder ? 'placeholder' : ''}">
            ${showPlaceholder ? this.placeholder : this._selectedLabel}
          </span>
          <svg class="caret" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            ${CHEVRON_DOWN}
          </svg>
        </button>
        <div class="menu" role="listbox" ?hidden=${!this._open}>
          <slot @slotchange=${() => this._syncOptions()}></slot>
        </div>
        ${this.error
          ? html`<div class="error-msg" role="alert">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ERROR_ICON}</svg>
              <span>${this.error}</span>
            </div>`
          : this.helper
          ? html`<div class="helper">${this.helper}</div>`
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-dropdown-select': ScoutDropdownSelect;
  }
}
