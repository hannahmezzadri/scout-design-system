import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import type { ScoutMultiselectOption } from './scout-multiselect-option.js';
import type { MultiselectSize } from './types.js';

const CHEVRON_DOWN = svg`<path fill-rule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clip-rule="evenodd"/>`;

const X_PATH = svg`<path d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"/>`;

const ERROR_ICON = svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm9.75-3.75a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>`;

/**
 * `<scout-multiselect>` — multi-select dropdown with searchable input,
 * chips for selected values, select-all, counter, and clear-all.
 *
 * @element scout-multiselect
 *
 * @attr label
 * @attr placeholder         - Shown when no values are selected.
 * @attr values              - Comma-separated list of selected values, or set via `.values = [...]` JS property.
 * @attr helper
 * @attr error               - When set, renders red border + error message; functional state = error.
 * @attr {"default"|"condensed"} size
 * @attr disabled
 * @attr show-counter        - Renders "{n} of {total} selected" inside the menu header.
 * @attr show-clear-all      - Renders a Clear all button inside the menu header.
 * @attr show-select-all     - Renders a Select all toggle inside the menu header. (Default: true)
 *
 * @slot - One or more `<scout-multiselect-option>` children.
 *
 * @fires scout-multiselect-change - Bubbling, composed; detail = `{ values: string[] }`.
 */
@customElement('scout-multiselect')
export class ScoutMultiselect extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 420px;
      font-family: var(--scout-font-family-inter);
      --_ms-min-h: 36px;
      --_ms-fs: var(--scout-font-size-14);
    }
    :host([size='condensed']),
    :host-context([data-density='condensed']) {
      --_ms-min-h: 28px;
      --_ms-fs: var(--scout-font-size-12);
    }

    .field {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--scout-space-4);
    }
    label.field-label {
      font-size: var(--scout-typography-label-font-size);
      line-height: var(--scout-typography-label-line-height);
      font-weight: var(--scout-typography-label-font-weight);
      color: var(--scout-text-display-primary);
    }
    :host([size='condensed']) label.field-label {
      font-size: var(--scout-typography-label-small-font-size);
      line-height: var(--scout-typography-label-small-line-height);
    }

    .input-wrap {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--scout-space-4);
      /* border-box matches scout-dropdown-select so min-height is the
         total rendered height (border + padding included). content-box
         was leaking padding + border on top of the 36px floor and
         making the empty multiselect render ~46px. */
      box-sizing: border-box;
      min-height: var(--_ms-min-h);
      padding: 4px var(--scout-space-12) 4px 4px;
      background: var(--scout-surface-primary);
      border: var(--scout-border-width-1) solid var(--scout-border-primary);
      border-radius: var(--scout-radius-4);
      transition: border-color var(--scout-motion-duration-hover) var(--scout-motion-easing-gentle);
      cursor: text;
    }
    .input-wrap:hover:not(.disabled) {
      border-color: var(--scout-text-interactive-primary);
    }
    .input-wrap:focus-within {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: 1px;
      border-color: var(--scout-text-interactive-primary);
    }
    :host([invalid]) .input-wrap { border-color: var(--scout-border-critical); }
    .input-wrap.disabled { opacity: 0.5; pointer-events: none; }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-4);
      padding: 2px 4px 2px 8px;
      background: var(--scout-fill-info-subtle);
      color: var(--scout-interactive-background-brand-strong-pressed);
      border-radius: var(--scout-radius-4);
      font-size: var(--scout-font-size-12);
      font-weight: var(--scout-font-weight-semibold);
      max-width: 200px;
    }
    .chip-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .chip-remove {
      appearance: none;
      background: transparent;
      border: none;
      padding: 2px;
      margin-left: 2px;
      color: inherit;
      cursor: pointer;
      border-radius: var(--scout-radius-2);
      display: inline-flex;
      align-items: center;
    }
    .chip-remove:hover { background: var(--scout-interactive-background-brand-pressed); }
    .chip-remove svg { width: 12px; height: 12px; display: block; }

    input {
      flex: 1;
      min-width: 60px;
      border: none;
      outline: none;
      background: transparent;
      /* Zero block padding — the input-wrap already supplies the
         vertical breathing room. Without this the native input added
         ~10px and pushed the empty-state multiselect to 46px tall
         (dropdown is 36px). */
      padding: 0 var(--scout-space-8);
      margin-left: var(--scout-space-4);
      line-height: var(--scout-typography-body-line-height);
      font-family: inherit;
      font-size: var(--_ms-fs);
      color: var(--scout-text-display-primary);
    }
    input::placeholder { color: var(--scout-text-display-secondary); }

    .caret {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      color: var(--scout-icon-display-secondary);
      transition: transform var(--scout-motion-duration-hover) var(--scout-motion-easing-gentle);
      cursor: pointer;
      align-self: center;
      margin-left: auto;
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
      max-height: 280px;
      overflow-y: auto;
      z-index: 1000;
      padding: 0;
    }
    .menu[hidden] { display: none; }

    .menu-header {
      display: flex;
      align-items: center;
      gap: var(--scout-space-12);
      padding: var(--scout-space-8) var(--scout-space-12);
      border-bottom: var(--scout-border-width-1) solid var(--scout-border-secondary);
      background: var(--scout-color-cool-gray-100);
      font-size: var(--scout-font-size-12);
    }
    .menu-header[hidden] { display: none; }

    .select-all {
      appearance: none;
      background: transparent;
      border: none;
      padding: 0;
      font-family: inherit;
      font-size: var(--scout-font-size-12);
      font-weight: var(--scout-font-weight-semibold);
      color: var(--scout-text-interactive-primary);
      cursor: pointer;
    }
    .select-all:hover { text-decoration: underline; }

    .counter {
      color: var(--scout-text-display-secondary);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    .clear-all {
      margin-left: auto;
      appearance: none;
      background: transparent;
      border: none;
      padding: 0;
      font-family: inherit;
      font-size: var(--scout-font-size-12);
      font-weight: var(--scout-font-weight-semibold);
      color: var(--scout-text-display-critical);
      cursor: pointer;
    }
    .clear-all:hover { text-decoration: underline; }

    .empty {
      padding: var(--scout-space-12);
      text-align: center;
      color: var(--scout-text-display-secondary);
      font-size: var(--scout-font-size-12);
    }

    .helper, .error-msg {
      font-size: var(--scout-font-size-12);
      line-height: var(--scout-font-line-height-18);
    }
    .helper { color: var(--scout-text-display-secondary); }
    .error-msg {
      color: var(--scout-text-display-critical);
      display: inline-flex;
      align-items: flex-start;
      gap: var(--scout-space-4);
    }
    .error-msg svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 2px; }

    @media (prefers-reduced-motion: reduce) {
      .caret, .input-wrap { transition: none; }
    }
  `;

  @property() label = '';
  @property() placeholder = 'Select…';
  @property() helper = '';
  @property() error = '';
  @property({ type: String, reflect: true }) size: MultiselectSize = 'default';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) invalid = false;
  @property() name = '';

  /** Selected values. Settable as comma-separated string OR JS array. */
  @property({
    converter: {
      fromAttribute: (v: string | null) => (v ? v.split(',').map(s => s.trim()).filter(Boolean) : []),
      toAttribute: (v: string[]) => (v && v.length ? v.join(',') : null),
    },
  })
  values: string[] = [];

  @property({ type: Boolean, attribute: 'show-counter' }) showCounter = false;
  @property({ type: Boolean, attribute: 'show-clear-all' }) showClearAll = false;
  @property({ type: Boolean, attribute: 'show-select-all' }) showSelectAll = true;

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

  static formAssociated = true;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('mousedown', this._onDocClick);
    this.addEventListener('click', this._onMenuClick);
    this.addEventListener('keydown', this._onKeyDown);
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('mousedown', this._onDocClick);
  }

  updated() {
    this.invalid = !!this.error;
    this._syncOptions();
    // Set form value as multiple FormData entries
    const fd = new FormData();
    for (const v of this.values) if (this.name) fd.append(this.name, v);
    this._internals.setFormValue(fd);
  }

  private get _options(): ScoutMultiselectOption[] {
    return Array.from(this.querySelectorAll('scout-multiselect-option'));
  }

  private _syncOptions() {
    const q = this._query.trim().toLowerCase();
    let visibleIdx = -1;
    let count = 0;
    this._options.forEach((opt) => {
      const label = (opt.textContent || '').trim().toLowerCase();
      const match = !q || label.includes(q);
      opt.hidden = !match;
      opt.selected = this.values.includes(opt.value);
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

  private _visibleOptions(): ScoutMultiselectOption[] {
    return this._options.filter(o => !o.hidden && !o.disabled);
  }

  private _onInput = (e: Event) => {
    this._query = (e.target as HTMLInputElement).value;
    this._open = true;
    this._activeIndex = 0;
    this._syncOptions();
  };

  private _onFocus = () => {
    if (!this.disabled) this._open = true;
  };

  private _onWrapClick = (e: Event) => {
    if (this.disabled) return;
    // Clicking the wrap focuses the input — but ignore clicks on chips
    if ((e.target as HTMLElement).closest('.chip')) return;
    this._inputEl?.focus();
    this._open = true;
  };

  private _onDocClick = (e: MouseEvent) => {
    if (!this._open) return;
    if (!this.contains(e.target as Node) && !this.shadowRoot?.contains(e.target as Node)) {
      this._open = false;
      this._query = '';
      this._syncOptions();
    }
  };

  private _onMenuClick = (e: Event) => {
    const target = (e.target as HTMLElement).closest('scout-multiselect-option') as ScoutMultiselectOption | null;
    if (!target || target.disabled) return;
    this._toggleValue(target.value);
  };

  private _toggleValue(v: string) {
    const i = this.values.indexOf(v);
    this.values = i >= 0
      ? this.values.filter(x => x !== v)
      : [...this.values, v];
    this._syncOptions();
    this._fireChange();
    this._inputEl?.focus();
  }

  private _removeChip(v: string) {
    this.values = this.values.filter(x => x !== v);
    this._syncOptions();
    this._fireChange();
  }

  private _onSelectAll = () => {
    const visible = this._visibleOptions();
    const allSelected = visible.every(o => this.values.includes(o.value));
    if (allSelected) {
      // Deselect all visible
      const visibleVals = new Set(visible.map(o => o.value));
      this.values = this.values.filter(v => !visibleVals.has(v));
    } else {
      // Add all visible
      const visibleVals = visible.map(o => o.value);
      const merged = new Set([...this.values, ...visibleVals]);
      this.values = Array.from(merged);
    }
    this._syncOptions();
    this._fireChange();
  };

  private _onClearAll = () => {
    this.values = [];
    this._syncOptions();
    this._fireChange();
  };

  private _fireChange() {
    this.dispatchEvent(new CustomEvent<{ values: string[] }>('scout-multiselect-change', {
      bubbles: true, composed: true, detail: { values: [...this.values] },
    }));
  }

  private _onKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this._open = false;
      this._query = '';
      this._syncOptions();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!this._open) this._open = true;
      this._activeIndex = Math.min(this._visibleOptions().length - 1, this._activeIndex + 1);
      this._syncOptions();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._activeIndex = Math.max(0, this._activeIndex - 1);
      this._syncOptions();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = this._visibleOptions()[this._activeIndex];
      if (opt) this._toggleValue(opt.value);
    } else if (e.key === 'Backspace' && !this._query && this.values.length > 0) {
      // Remove the last chip when backspacing on empty input
      e.preventDefault();
      this._removeChip(this.values[this.values.length - 1]!);
    }
  };

  private _labelFor(value: string): string {
    const opt = this._options.find(o => o.value === value);
    return opt?.textContent?.trim() || value;
  }

  private _renderChip(value: string) {
    return html`
      <span class="chip">
        <span class="chip-label">${this._labelFor(value)}</span>
        <button
          class="chip-remove"
          type="button"
          aria-label="Remove ${this._labelFor(value)}"
          @click=${(e: Event) => { e.stopPropagation(); this._removeChip(value); }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${X_PATH}</svg>
        </button>
      </span>
    `;
  }

  private _allVisibleSelected(): boolean {
    const visible = this._visibleOptions();
    return visible.length > 0 && visible.every(o => this.values.includes(o.value));
  }

  render() {
    const totalOptions = this._options.length;
    const showHeader = this._open && (this.showSelectAll || this.showCounter || (this.showClearAll && this.values.length > 0));
    const placeholder = this.values.length > 0 ? '' : this.placeholder;
    const allSelected = this._allVisibleSelected();

    return html`
      <div class="field" data-open=${String(this._open)}>
        ${this.label ? html`<label class="field-label">${this.label}</label>` : nothing}
        <div
          class="input-wrap ${this.disabled ? 'disabled' : ''}"
          @click=${this._onWrapClick}
        >
          ${this.values.map(v => this._renderChip(v))}
          <input
            type="text"
            .value=${this._query}
            placeholder=${placeholder}
            ?disabled=${this.disabled}
            aria-haspopup="listbox"
            aria-expanded=${String(this._open)}
            aria-autocomplete="list"
            aria-invalid=${this.invalid ? 'true' : (nothing as any)}
            @input=${this._onInput}
            @focus=${this._onFocus}
          />
          <svg class="caret" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${CHEVRON_DOWN}</svg>
        </div>
        <div class="menu" role="listbox" aria-multiselectable="true" ?hidden=${!this._open}>
          <div class="menu-header" ?hidden=${!showHeader}>
            ${this.showSelectAll
              ? html`<button class="select-all" type="button" @click=${this._onSelectAll}>
                  ${allSelected ? 'Deselect all' : 'Select all'}
                </button>`
              : nothing}
            ${this.showCounter
              ? html`<span class="counter">${this.values.length} of ${totalOptions}</span>`
              : nothing}
            ${this.showClearAll && this.values.length > 0
              ? html`<button class="clear-all" type="button" @click=${this._onClearAll}>Clear all</button>`
              : nothing}
          </div>
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
    'scout-multiselect': ScoutMultiselect;
  }
}
