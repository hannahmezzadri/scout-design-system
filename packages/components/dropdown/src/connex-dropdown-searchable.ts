import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import type { ConnexDropdownOption } from './connex-dropdown-option.js';
import type { DropdownSize } from './types.js';

const CHEVRON_DOWN = svg`<path fill-rule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clip-rule="evenodd"/>`;

const ERROR_ICON = svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm9.75-3.75a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>`;

/**
 * `<connex-dropdown-searchable>` — single-select dropdown that allows the
 * user to type into the trigger to filter options.
 *
 * Functional menu states implemented:
 * - default            (no value, menu closed)
 * - active with menu   (no value, menu open)
 * - active typed with menu (typing, menu shows filtered results)
 * - filled             (a value is selected)
 * - error              (error attribute set)
 * - disabled           (disabled attribute set)
 *
 * @element connex-dropdown-searchable
 *
 * @attr label, placeholder, value, helper, error, name, size, disabled
 *
 * @slot - One or more `<connex-dropdown-option>` children.
 *
 * @fires connex-dropdown-change - Bubbles, composed; detail = `{ value }`.
 */
@customElement('connex-dropdown-searchable')
export class ConnexDropdownSearchable extends LitElement {
  static formAssociated = true;

  static styles = css`
    :host {
      display: inline-block;
      width: 100%;
      max-width: 320px;
      font-family: var(--connex-font-family-inter);
      --_dropdown-h: 36px;
      --_dropdown-fs: var(--connex-font-size-14);
    }
    :host([size='condensed']) {
      --_dropdown-h: 28px;
      --_dropdown-fs: var(--connex-font-size-12);
    }

    .field { position: relative; display: flex; flex-direction: column; gap: var(--connex-space-4); }

    label {
      font-size: var(--connex-font-size-12);
      font-weight: var(--connex-font-weight-semibold);
      color: var(--connex-text-display-primary);
    }

    .input-wrap {
      display: inline-flex;
      align-items: center;
      gap: var(--connex-space-8);
      min-height: var(--_dropdown-h);
      padding: 0 var(--connex-space-12);
      background: var(--connex-surface-primary);
      border: var(--connex-border-width-1) solid var(--connex-border-primary);
      border-radius: var(--connex-radius-4);
      transition: border-color var(--connex-motion-duration-fast) var(--connex-motion-easing-standard);
    }
    .input-wrap:hover:not(.disabled) {
      border-color: var(--connex-text-interactive-primary);
    }
    .input-wrap:focus-within {
      outline: var(--connex-focus-ring-width) solid var(--connex-focus-ring-color);
      outline-offset: 1px;
      border-color: var(--connex-text-interactive-primary);
    }
    .input-wrap.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
    :host([invalid]) .input-wrap { border-color: var(--connex-border-error); }

    input {
      flex: 1;
      min-width: 0;
      padding: 0;
      border: none;
      outline: none;
      background: transparent;
      font-family: inherit;
      font-size: var(--_dropdown-fs);
      color: var(--connex-text-display-primary);
    }
    input::placeholder { color: var(--connex-text-display-secondary); }

    .caret {
      width: 16px;
      height: 16px;
      color: var(--connex-icon-display-secondary);
      transition: transform var(--connex-motion-duration-fast) var(--connex-motion-easing-standard);
      flex-shrink: 0;
      cursor: pointer;
    }
    .field[data-open='true'] .caret { transform: rotate(180deg); }

    .menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: var(--connex-space-4);
      background: var(--connex-surface-primary);
      border: var(--connex-border-width-1) solid var(--connex-border-secondary);
      border-radius: var(--connex-radius-4);
      box-shadow: var(--connex-elevation-2);
      max-height: 240px;
      overflow-y: auto;
      z-index: 1000;
      padding: var(--connex-space-4) 0;
    }
    .menu[hidden] { display: none; }

    .empty {
      padding: var(--connex-space-12);
      font-size: var(--connex-font-size-12);
      color: var(--connex-text-display-secondary);
      text-align: center;
    }

    .helper, .error-msg {
      font-size: var(--connex-font-size-12);
      line-height: var(--connex-font-line-height-18);
    }
    .helper { color: var(--connex-text-display-secondary); }
    .error-msg {
      color: var(--connex-text-display-error);
      display: inline-flex;
      align-items: flex-start;
      gap: var(--connex-space-4);
    }
    .error-msg svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 2px; }

    @media (prefers-reduced-motion: reduce) {
      .input-wrap, .caret { transition: none; }
    }
  `;

  @property() label = '';
  @property() placeholder = 'Search…';
  @property() value = '';
  @property() helper = '';
  @property() error = '';
  @property({ type: String, reflect: true }) size: DropdownSize = 'default';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) invalid = false;
  @property() name = '';

  @state() private _open = false;
  @state() private _query = '';
  @state() private _activeIndex = -1;
  @state() private _matchCount = 0;

  @query('input') private _inputEl!: HTMLInputElement;

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

  updated() {
    this._syncOptions();
    this.invalid = !!this.error;
    this._internals.setFormValue(this.value || null);
  }

  private get _options(): ConnexDropdownOption[] {
    return Array.from(this.querySelectorAll('connex-dropdown-option'));
  }

  /** Apply filter, selection, and keyboard active states to the options. */
  private _syncOptions() {
    const q = this._query.trim().toLowerCase();
    let visibleIdx = -1;
    let count = 0;
    this._options.forEach((opt) => {
      const label = (opt.textContent || '').trim().toLowerCase();
      const match = !q || label.includes(q);
      opt.hidden = !match;
      opt.selected = opt.value === this.value;
      if (match) {
        visibleIdx++;
        opt.active = visibleIdx === this._activeIndex;
        count++;
      } else {
        opt.active = false;
      }
    });
    this._matchCount = count;
  }

  private _onInput = (e: Event) => {
    const v = (e.target as HTMLInputElement).value;
    this._query = v;
    this._open = true;
    this._activeIndex = 0;
    this._syncOptions();
  };

  private _onFocus = () => {
    if (!this.disabled) this._open = true;
  };

  private _toggle = () => {
    if (this.disabled) return;
    this._open = !this._open;
    if (this._open) this._inputEl?.focus();
  };

  private _close() {
    this._open = false;
    this._query = ''; // reset query so the input shows the selected label
    this._syncOptions();
  }

  private _onDocClick = (e: MouseEvent) => {
    if (!this._open) return;
    if (!this.contains(e.target as Node) && !this.shadowRoot?.contains(e.target as Node)) {
      this._close();
    }
  };

  private _onOptionClick = (e: Event) => {
    const target = (e.target as HTMLElement).closest('connex-dropdown-option') as ConnexDropdownOption | null;
    if (!target || target.disabled) return;
    this._select(target.value, (target.textContent || '').trim());
  };

  private _select(value: string, label: string) {
    this.value = value;
    this._query = label;
    this._open = false;
    if (this._inputEl) this._inputEl.value = label;
    this._syncOptions();
    this.dispatchEvent(new CustomEvent('connex-dropdown-change', {
      bubbles: true, composed: true, detail: { value },
    }));
  }

  private _visibleOptions(): ConnexDropdownOption[] {
    return this._options.filter(o => !o.hidden && !o.disabled);
  }

  private _onKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) return;
    if (e.key === 'Escape') { e.preventDefault(); this._close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!this._open) { this._open = true; }
      this._activeIndex = Math.min(this._visibleOptions().length - 1, this._activeIndex + 1);
      this._syncOptions();
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._activeIndex = Math.max(0, this._activeIndex - 1);
      this._syncOptions();
    }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = this._visibleOptions()[this._activeIndex];
      if (opt) this._select(opt.value, (opt.textContent || '').trim());
    }
  };

  /** Compute the input's displayed value: query when open/typing, selected label otherwise. */
  private get _displayValue(): string {
    if (this._open) return this._query;
    const opt = this._options.find(o => o.value === this.value);
    return opt?.textContent?.trim() || '';
  }

  render() {
    return html`
      <div class="field" data-open=${String(this._open)}>
        ${this.label ? html`<label>${this.label}</label>` : nothing}
        <div class="input-wrap ${this.disabled ? 'disabled' : ''}">
          <input
            type="text"
            .value=${this._displayValue}
            placeholder=${this.placeholder}
            ?disabled=${this.disabled}
            aria-haspopup="listbox"
            aria-expanded=${String(this._open)}
            aria-autocomplete="list"
            aria-invalid=${this.invalid ? 'true' : (nothing as any)}
            @input=${this._onInput}
            @focus=${this._onFocus}
          />
          <svg class="caret" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" @click=${this._toggle}>
            ${CHEVRON_DOWN}
          </svg>
        </div>
        <div class="menu" role="listbox" ?hidden=${!this._open}>
          <slot @slotchange=${() => this._syncOptions()}></slot>
          ${this._open && this._matchCount === 0
            ? html`<div class="empty">No matches for "${this._query}"</div>`
            : nothing}
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
    'connex-dropdown-searchable': ConnexDropdownSearchable;
  }
}
