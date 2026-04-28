import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * `<connex-popover-time>` — hour / minute / AM-PM picker rendered as a popover.
 *
 * Three scroll columns (hours, minutes, AM/PM). Each column scrolls
 * independently; the selected row is highlighted. Mirrors the iOS-style
 * picker for predictability.
 *
 * @element connex-popover-time
 *
 * @attr label                                - Field label shown above the picker.
 * @attr value                                - Selected time, format `hh:mm AM` or `hh:mm PM`.
 * @attr {"5"|"15"|"30"|"60"} minute-step    - Granularity of the minute column.
 * @attr open                                 - Programmatic open state.
 *
 * @slot trigger - The control that opens the picker.
 *
 * @fires connex-popover-time-change - Bubbles, composed; detail = `{ value }`.
 */
@customElement('connex-popover-time')
export class ConnexPopoverTime extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      position: relative;
      font-family: var(--connex-font-family-inter);
    }

    .surface {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      z-index: 1000;
      background: var(--connex-surface-primary);
      border: var(--connex-border-width-1) solid var(--connex-border-secondary);
      border-radius: var(--connex-radius-8);
      box-shadow: var(--connex-elevation-3);
      padding: var(--connex-space-12);
      opacity: 0;
      pointer-events: none;
      transform: translateY(2px);
      transition: opacity var(--connex-motion-duration-fast, 120ms) ease,
        transform var(--connex-motion-duration-fast, 120ms) ease;
    }
    :host([open]) .surface {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .label {
      display: block;
      font-size: var(--connex-font-size-12);
      font-weight: var(--connex-font-weight-semibold);
      color: var(--connex-text-display-secondary);
      margin-bottom: var(--connex-space-8);

    }

    .columns {
      display: flex;
      align-items: stretch;
      gap: var(--connex-space-8);
      position: relative;
    }
    .columns::before {
      /* Highlight band for the selected row across all columns */
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      height: 32px;
      transform: translateY(-50%);
      background: var(--connex-color-cool-gray-100);
      border-radius: var(--connex-radius-4);
      pointer-events: none;
    }

    .col {
      width: 56px;
      height: 160px;
      overflow-y: scroll;
      scroll-snap-type: y mandatory;
      scrollbar-width: thin;
      padding: 64px 0;
    }
    .col::-webkit-scrollbar {
      width: 6px;
    }
    .col::-webkit-scrollbar-thumb {
      background: var(--connex-color-cool-gray-200);
      border-radius: 3px;
    }
    .col-row {
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      scroll-snap-align: center;
      font-size: var(--connex-font-size-14);
      font-weight: var(--connex-font-weight-medium);
      color: var(--connex-text-display-primary);
      cursor: pointer;
      border-radius: var(--connex-radius-4);
      user-select: none;
      transition: background var(--connex-motion-duration-fast, 120ms) ease,
        color var(--connex-motion-duration-fast, 120ms) ease;
    }
    .col-row:hover { background: var(--connex-interactive-background-hover); }
    .col-row:active { background: var(--connex-interactive-background-pressed); }
    .col-row[aria-selected='true'] {
      color: var(--connex-text-interactive-primary);
      font-weight: var(--connex-font-weight-semibold);
    }
    .col-row[aria-disabled='true'] {
      color: var(--connex-text-display-disabled, var(--connex-color-cool-gray-400));
      cursor: not-allowed;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--connex-space-8);
      margin-top: var(--connex-space-12);
    }
    .actions button {
      appearance: none;
      background: transparent;
      border: var(--connex-border-width-1) solid var(--connex-border-primary);
      border-radius: var(--connex-radius-4);
      padding: var(--connex-space-4) var(--connex-space-12);
      font: inherit;
      font-size: var(--connex-font-size-12);
      cursor: pointer;
    }
    .actions button.primary {
      background: var(--connex-text-interactive-primary);
      border-color: var(--connex-text-interactive-primary);
      color: var(--connex-color-white);
    }
  `;

  @property() label = '';
  @property() value = '12:00 PM';
  @property({ attribute: 'minute-step', type: Number }) minuteStep = 5;
  @property({ type: Boolean, reflect: true }) open = false;

  @state() private _h = 12;
  @state() private _m = 0;
  @state() private _p: 'AM' | 'PM' = 'PM';

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('value')) {
      const m = /^(\d{1,2}):(\d{2})\s+(AM|PM)$/i.exec(this.value.trim());
      if (m) {
        this._h = Math.min(12, Math.max(1, Number(m[1])));
        this._m = Math.min(59, Math.max(0, Number(m[2])));
        this._p = (m[3] ?? 'PM').toUpperCase() as 'AM' | 'PM';
      }
    }
  }

  private _commit() {
    this.value = `${String(this._h).padStart(2, '0')}:${String(this._m).padStart(2, '0')} ${this._p}`;
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('connex-popover-time-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
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

  private _renderColumn<T>(items: T[], current: T, onPick: (v: T) => void) {
    return html`
      <div class="col" role="listbox">
        ${items.map((it) => html`
          <div
            class="col-row"
            role="option"
            tabindex="0"
            aria-selected=${it === current ? 'true' : 'false'}
            @click=${() => onPick(it)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(it); }
            }}
          >${it}</div>
        `)}
      </div>
    `;
  }

  render() {
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: Math.floor(60 / this.minuteStep) }, (_, i) => i * this.minuteStep);
    return html`
      <slot name="trigger" @slotchange=${this._onTriggerSlot}></slot>
      <div class="surface" role="dialog">
        ${this.label ? html`<span class="label">${this.label}</span>` : nothing}
        <div class="columns">
          ${this._renderColumn(hours, this._h, (h) => { this._h = h; this._commit(); })}
          ${this._renderColumn(
            minutes.map((m) => String(m).padStart(2, '0')),
            String(this._m).padStart(2, '0'),
            (mm) => { this._m = Number(mm); this._commit(); },
          )}
          ${this._renderColumn(['AM', 'PM'] as const, this._p, (p) => { this._p = p; this._commit(); })}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-popover-time': ConnexPopoverTime;
  }
}
