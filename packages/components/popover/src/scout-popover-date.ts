import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { DatePickerType, DayCellState } from './types.js';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTH_LABELS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/* Hero Icon paths only — wrap in `svg` template tag at the call site.
   Previously these were full markup strings injected via `.innerHTML`,
   which Lit only applies to the existing element instance — when a
   re-render swapped the parent <button> the new <span> sometimes ended
   up empty and the chevron disappeared. Native lit `svg` templates are
   re-rendered every pass and stay reliable. */
const CHEVRON_LEFT = svg`<path fill-rule="evenodd" d="M15.78 4.72a.75.75 0 0 1 0 1.06L9.56 12l6.22 6.22a.75.75 0 1 1-1.06 1.06l-6.75-6.75a.75.75 0 0 1 0-1.06l6.75-6.75a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd"/>`;
const CHEVRON_RIGHT = svg`<path fill-rule="evenodd" d="M8.22 4.72a.75.75 0 0 0 0 1.06L14.44 12l-6.22 6.22a.75.75 0 1 0 1.06 1.06l6.75-6.75a.75.75 0 0 0 0-1.06L9.28 4.72a.75.75 0 0 0-1.06 0Z" clip-rule="evenodd"/>`;
const CHEVRON_DOWN = svg`<path fill-rule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clip-rule="evenodd"/>`;

interface DayMark {
  /** ISO date string yyyy-mm-dd */
  date: string;
  state: DayCellState;
}

/**
 * `<scout-popover-date>` — date / month / year picker rendered as a popover.
 *
 * Supports four modes: single-date, range, month-only, year-only. Day cells
 * carry rich functional states (due, late, statement, etc.) supplied via
 * the `marks` property — used for credit-card servicing scenarios where
 * a date isn't merely "selected" but "the statement date" or "past due".
 *
 * @element scout-popover-date
 *
 * @attr label                                          - Field label shown above the calendar.
 * @attr {"single"|"range"|"month"|"year"} type         - Picker mode.
 * @attr value                                          - Selected ISO date (single/month/year) or `start..end` (range).
 * @attr min                                            - Earliest selectable ISO date.
 * @attr max                                            - Latest selectable ISO date.
 * @attr extended                                       - Renders the optional key/legend below the grid.
 * @attr open                                           - Programmatic open state.
 *
 * @prop marks - `Array<{date: 'yyyy-mm-dd', state: DayCellState}>` — applies functional state classes to specific cells.
 *
 * @slot trigger - The control that opens the picker (e.g., a control button with calendar icon).
 *
 * @fires scout-popover-date-change - Bubbles, composed; detail = `{ value }`.
 */
@customElement('scout-popover-date')
export class ScoutPopoverDate extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      position: relative;
      font-family: var(--scout-font-family-inter);
      --_cell: 32px;
    }

    .surface {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      z-index: 1000;
      width: max-content;
      background: var(--scout-surface-primary);
      border: var(--scout-border-width-1) solid var(--scout-border-secondary);
      border-radius: var(--scout-radius-8);
      box-shadow: var(--scout-elevation-3);
      padding: var(--scout-space-12);
      opacity: 0;
      pointer-events: none;
      transform: translateY(2px);
      transition: opacity var(--scout-motion-duration-hover, 120ms) ease,
        transform var(--scout-motion-duration-hover, 120ms) ease;
    }
    :host([open]) .surface {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .label {
      display: block;
      /* Indented by space.8 so the label's text edge aligns with the
         month/year dropdown's text edge below (.header-label has 8px
         horizontal padding). Bumped one level up to 14px. */
      padding-left: var(--scout-space-8);
      font-size: var(--scout-font-size-14);
      font-weight: var(--scout-font-weight-semibold);
      color: var(--scout-text-display-primary);
      margin-bottom: var(--scout-space-8);
    }

    /* Header: month-year dropdown + nav chevrons */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--scout-space-8);
      margin-bottom: var(--scout-space-8);
    }
    .header-label {
      appearance: none;
      background: transparent;
      border: none;
      padding: var(--scout-space-4) var(--scout-space-8);
      font: inherit;
      font-weight: var(--scout-font-weight-semibold);
      font-size: var(--scout-font-size-14);
      color: var(--scout-text-display-primary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-4);
      border-radius: var(--scout-radius-4);
    }
    .header-label:hover { background: var(--scout-interactive-background-hover); }
    /* SVG chevron sits as inline-baseline by default, which floats it
       above the cap height of the month/year label. Drop it 2px and
       render as block so it visually centers with the text. */
    .header-label svg {
      display: block;
      margin-top: 2px;
    }
    .nav-buttons { display: inline-flex; gap: 2px; }
    .nav-btn {
      appearance: none;
      background: transparent;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: var(--scout-radius-4);
      cursor: pointer;
      color: var(--scout-text-display-primary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .nav-btn:hover { background: var(--scout-interactive-background-hover); }
    .nav-btn:active { background: var(--scout-interactive-background-pressed); }
    .nav-btn:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: var(--scout-focus-ring-offset);
    }
    .nav-btn:disabled {
      color: var(--scout-text-display-disabled, var(--scout-color-cool-gray-400));
      cursor: not-allowed;
    }
    /* Inline SVGs default to baseline-aligned, which floats them above
       the button's vertical center. Render as block + nudge down 2px so
       they sit centered inside the 28px button and the hover background. */
    .nav-btn svg {
      display: block;
      margin-top: 2px;
    }

    /* Day-of-week row */
    .dow-row {
      display: grid;
      grid-template-columns: repeat(7, var(--_cell));
      gap: 2px;
      margin-bottom: 2px;
    }
    .dow {
      width: var(--_cell);
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: var(--scout-font-size-12);
      font-weight: var(--scout-font-weight-semibold);
      color: var(--scout-text-display-secondary);
    }

    /* Day grid */
    .grid {
      display: grid;
      grid-template-columns: repeat(7, var(--_cell));
      gap: 2px;
    }
    .cell {
      appearance: none;
      background: transparent;
      border: 0;
      width: var(--_cell);
      height: var(--_cell);
      border-radius: var(--scout-radius-4);
      font: inherit;
      font-size: var(--scout-font-size-14);
      color: var(--scout-text-display-primary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: background var(--scout-motion-duration-hover, 120ms) ease,
        color var(--scout-motion-duration-hover, 120ms) ease;
    }
    .cell.outside { color: var(--scout-text-display-disabled, var(--scout-color-cool-gray-400)); }
    .cell.past    { color: var(--scout-text-display-secondary); }
    .cell.unavailable { color: var(--scout-text-display-disabled, var(--scout-color-cool-gray-400)); cursor: not-allowed; text-decoration: line-through; }
    .cell:hover:not(.unavailable):not(.selected) {
      background: var(--scout-interactive-background-hover);
    }
    .cell.late-hover:hover {
      background: var(--scout-fill-critical-subtle);
    }
    .cell:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: var(--scout-focus-ring-offset);
    }
    .cell:active:not(.unavailable):not(.selected) {
      background: var(--scout-interactive-background-pressed);
    }
    .cell.selected {
      background: var(--scout-text-interactive-primary);
      color: var(--scout-color-white);
    }
    .cell.range {
      background: var(--scout-fill-info-subtle);
      color: var(--scout-text-display-info);
      border-radius: 0;
    }
    .cell.range.range-start { border-top-left-radius: var(--scout-radius-4); border-bottom-left-radius: var(--scout-radius-4); }
    .cell.range.range-end   { border-top-right-radius: var(--scout-radius-4); border-bottom-right-radius: var(--scout-radius-4); }

    /* Functional/credit-card states — small dot indicator under the number */
    .cell.due::after,
    .cell.late::after,
    .cell.yellow::after,
    .cell.red::after,
    .cell.green::after,
    .cell.statement::after {
      content: '';
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      border-radius: 50%;
    }
    .cell.due::after       { background: var(--scout-text-interactive-primary); }
    .cell.late::after      { background: var(--scout-text-display-critical, var(--scout-interactive-background-critical-strong-hover)); }
    .cell.yellow::after    { background: var(--scout-fill-warning-bold); }
    .cell.red::after       { background: var(--scout-interactive-background-critical-strong-hover); }
    .cell.green::after     { background: var(--scout-interactive-background-success-strong); }
    .cell.statement::after { background: var(--scout-color-cool-gray-700); }

    /* Late + selected: keep the dot visible against the dark fill */
    .cell.late.selected::after { background: var(--scout-color-white); }

    /* Month / year grids */
    .grid-mo, .grid-yr {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--scout-space-4);
    }
    .grid-mo .cell, .grid-yr .cell {
      width: auto;
      height: 40px;
      padding: 0 var(--scout-space-12);
    }

    /* Key / legend */
    .key {
      margin-top: var(--scout-space-12);
      padding-top: var(--scout-space-12);
      border-top: var(--scout-border-width-1) solid var(--scout-border-secondary);
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--scout-space-4) var(--scout-space-12);
      font-size: var(--scout-font-size-12);
      color: var(--scout-text-display-secondary);
    }
    .key-row { display: inline-flex; align-items: center; gap: var(--scout-space-8); }
    .key-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .key-dot.due { background: var(--scout-text-interactive-primary); }
    .key-dot.late { background: var(--scout-interactive-background-critical-strong-hover); }
    .key-dot.yellow { background: var(--scout-fill-warning-bold); }
    .key-dot.green { background: var(--scout-interactive-background-success-strong); }
    .key-dot.statement { background: var(--scout-color-cool-gray-700); }
  `;

  @property() label = '';
  @property({ reflect: true }) type: DatePickerType = 'single';
  @property() value = '';
  @property() min = '';
  @property() max = '';
  @property({ type: Boolean, reflect: true }) extended = false;
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ attribute: false }) marks: DayMark[] = [];

  /** Visible month/year cursor (independent of selection). */
  @state() private _cursor = (() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  })();

  /** Sub-view inside the popover when user clicks the header label. */
  @state() private _view: 'days' | 'months' | 'years' = 'days';

  private get _markMap(): Map<string, DayCellState> {
    return new Map(this.marks.map((m) => [m.date, m.state]));
  }

  private _iso(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  private _today() {
    const t = new Date();
    return this._iso(t.getFullYear(), t.getMonth(), t.getDate());
  }

  private _onTriggerSlot = (e: Event) => {
    const slot = e.target as HTMLSlotElement;
    for (const t of slot.assignedElements()) {
      t.addEventListener('click', this._toggle as EventListener);
    }
  };

  private _toggle = (e: Event) => {
    e.stopPropagation();
    this.open = !this.open;
    // When opening for month/year-only modes, jump straight to that view
    if (this.open) {
      this._view = this.type === 'month' ? 'months' : this.type === 'year' ? 'years' : 'days';
    }
  };

  private _onDocClick = (e: Event) => {
    if (!this.open) return;
    if (!this.contains(e.target as Node)) this.open = false;
  };

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('mousedown', this._onDocClick);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('mousedown', this._onDocClick);
  }

  private _emit() {
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('scout-popover-date-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  private _selectDay(y: number, m: number, d: number) {
    const iso = this._iso(y, m, d);
    if (this.type === 'range') {
      const [start, end] = this.value.split('..');
      if (!start || (start && end)) {
        this.value = `${iso}..`;
      } else if (iso < start) {
        this.value = `${iso}..${start}`;
      } else {
        this.value = `${start}..${iso}`;
      }
    } else {
      this.value = iso;
      this.open = false;
    }
    this._emit();
  }

  private _selectMonth(idx: number) {
    this._cursor = { ...this._cursor, month: idx };
    if (this.type === 'month') {
      this.value = `${this._cursor.year}-${String(idx + 1).padStart(2, '0')}`;
      this._emit();
      this.open = false;
    } else {
      this._view = 'days';
    }
  }

  private _selectYear(y: number) {
    this._cursor = { ...this._cursor, year: y };
    if (this.type === 'year') {
      this.value = String(y);
      this._emit();
      this.open = false;
    } else {
      this._view = 'months';
    }
  }

  private _shiftMonth(delta: number) {
    let { year, month } = this._cursor;
    month += delta;
    while (month < 0) { month += 12; year -= 1; }
    while (month > 11) { month -= 12; year += 1; }
    this._cursor = { year, month };
  }

  private _renderHeader() {
    const { year, month } = this._cursor;
    const headerText =
      this._view === 'years' ? `${year - 6} – ${year + 5}` :
      this._view === 'months' ? `${year}` :
      `${MONTH_LABELS_LONG[month]} ${year}`;
    return html`
      <div class="header">
        <button
          class="header-label"
          type="button"
          @click=${() => {
            this._view =
              this._view === 'days' ? 'months' :
              this._view === 'months' ? 'years' : 'days';
          }}
        >
          ${headerText}
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">${CHEVRON_DOWN}</svg>
        </button>
        <div class="nav-buttons">
          <button class="nav-btn" type="button" aria-label="Previous"
            @click=${() => {
              if (this._view === 'years') this._cursor = { ...this._cursor, year: year - 12 };
              else if (this._view === 'months') this._cursor = { ...this._cursor, year: year - 1 };
              else this._shiftMonth(-1);
            }}
          ><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">${CHEVRON_LEFT}</svg></button>
          <button class="nav-btn" type="button" aria-label="Next"
            @click=${() => {
              if (this._view === 'years') this._cursor = { ...this._cursor, year: year + 12 };
              else if (this._view === 'months') this._cursor = { ...this._cursor, year: year + 1 };
              else this._shiftMonth(1);
            }}
          ><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">${CHEVRON_RIGHT}</svg></button>
        </div>
      </div>
    `;
  }

  private _renderDays() {
    const { year, month } = this._cursor;
    const first = new Date(year, month, 1);
    const startDow = first.getDay(); // 0..6
    const lastDay = new Date(year, month + 1, 0).getDate();
    const today = this._today();
    const marks = this._markMap;

    // Build 6 weeks of cells (42 cells) including leading/trailing days from prev/next month
    const cells: { y: number; m: number; d: number; outside: boolean }[] = [];
    const prevLast = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      cells.push({ y: month === 0 ? year - 1 : year, m: (month + 11) % 12, d: prevLast - i, outside: true });
    }
    for (let d = 1; d <= lastDay; d++) cells.push({ y: year, m: month, d, outside: false });
    while (cells.length < 42) {
      const d = cells.length - (startDow + lastDay) + 1;
      cells.push({ y: month === 11 ? year + 1 : year, m: (month + 1) % 12, d, outside: true });
    }

    const [rangeStart, rangeEnd] = this.value.split('..');
    const inRange = (iso: string) =>
      this.type === 'range' && rangeStart && rangeEnd && iso > rangeStart && iso < rangeEnd;
    const isSelected = (iso: string) =>
      this.type === 'single'
        ? iso === this.value
        : iso === rangeStart || iso === rangeEnd;

    return html`
      <div class="dow-row">
        ${DAY_LABELS.map((d) => html`<div class="dow">${d}</div>`)}
      </div>
      <div class="grid" role="grid">
        ${cells.map(({ y, m, d, outside }) => {
          const iso = this._iso(y, m, d);
          const past = iso < today && !outside;
          const mark = marks.get(iso);
          const sel = isSelected(iso);
          const isRange = inRange(iso);
          const classes = [
            'cell',
            outside ? 'outside' : '',
            past ? 'past' : '',
            mark ?? '',
            sel ? 'selected' : '',
            isRange ? 'range' : '',
            sel && this.type === 'range' && iso === rangeStart ? 'range-start' : '',
            sel && this.type === 'range' && iso === rangeEnd ? 'range-end' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const disabled = mark === 'unavailable' || (this.min && iso < this.min) || (this.max && iso > this.max);
          return html`
            <button
              class=${classes}
              type="button"
              ?disabled=${!!disabled}
              aria-label=${`${MONTH_LABELS_LONG[m]} ${d}, ${y}`}
              aria-current=${iso === today ? 'date' : nothing}
              @click=${() => this._selectDay(y, m, d)}
            >
              ${d}
            </button>
          `;
        })}
      </div>
    `;
  }

  private _renderMonths() {
    return html`
      <div class="grid-mo">
        ${MONTH_LABELS.map((m, i) => html`
          <button
            class=${`cell ${i === this._cursor.month ? 'selected' : ''}`}
            type="button"
            @click=${() => this._selectMonth(i)}
          >${m}</button>
        `)}
      </div>
    `;
  }

  private _renderYears() {
    const start = this._cursor.year - 6;
    return html`
      <div class="grid-yr">
        ${Array.from({ length: 12 }, (_, i) => start + i).map((y) => html`
          <button
            class=${`cell ${y === this._cursor.year ? 'selected' : ''}`}
            type="button"
            @click=${() => this._selectYear(y)}
          >${y}</button>
        `)}
      </div>
    `;
  }

  private _renderKey() {
    if (!this.extended) return nothing;
    return html`
      <div class="key">
        <div class="key-row"><span class="key-dot due"></span> Due</div>
        <div class="key-row"><span class="key-dot late"></span> Late / past due</div>
        <div class="key-row"><span class="key-dot statement"></span> Statement date</div>
        <div class="key-row"><span class="key-dot yellow"></span> Pending</div>
        <div class="key-row"><span class="key-dot green"></span> Cleared</div>
      </div>
    `;
  }

  render() {
    return html`
      <slot name="trigger" @slotchange=${this._onTriggerSlot}></slot>
      <div class="surface" role="dialog">
        ${this.label ? html`<span class="label">${this.label}</span>` : nothing}
        ${this._renderHeader()}
        ${this._view === 'days' ? this._renderDays() :
          this._view === 'months' ? this._renderMonths() :
          this._renderYears()}
        ${this._renderKey()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-popover-date': ScoutPopoverDate;
  }
}
