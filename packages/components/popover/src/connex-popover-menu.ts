import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state, queryAssignedElements } from 'lit/decorators.js';
import type { TipAlignment, TipPlacement } from './types.js';

/**
 * `<connex-popover-menu>` — single-select menu launched from a trigger.
 *
 * Anchors a list of `<connex-popover-menu-item>` to a slotted trigger. The popover
 * tip points back to the trigger (placement + alignment).
 *
 * @element connex-popover-menu
 *
 * @attr label                                          - Optional menu header label.
 * @attr {"top"|"bottom"|"left"|"right"} placement      - Tip side relative to the trigger.
 * @attr {"start"|"center"|"end"} alignment             - Cross-axis alignment.
 * @attr open                                           - Programmatic open state.
 *
 * @slot trigger - The control that opens the menu (e.g., a button).
 * @slot        - Default slot: `<connex-popover-menu-item>` children.
 *
 * @fires connex-popover-menu-select - Bubbles, composed; detail = `{ value }`.
 * @fires connex-popover-menu-open  - Bubbles, composed.
 * @fires connex-popover-menu-close - Bubbles, composed.
 */
@customElement('connex-popover-menu')
export class ConnexPopoverMenu extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      position: relative;
      font-family: var(--connex-font-family-inter);
      --_tip-size: 8px;
    }

    .trigger-wrap {
      display: inline-flex;
    }

    .surface {
      position: absolute;
      z-index: 1000;
      min-width: 180px;
      background: var(--connex-surface-primary);
      color: var(--connex-text-display-primary);
      border: var(--connex-border-width-1) solid var(--connex-border-secondary);
      border-radius: var(--connex-radius-8);
      box-shadow: var(--connex-elevation-3);
      padding: var(--connex-space-4) 0;
      opacity: 0;
      pointer-events: none;
      transform: translateY(2px);
      transition: opacity var(--connex-motion-duration-fast, 120ms)
          var(--connex-motion-easing-standard, ease),
        transform var(--connex-motion-duration-fast, 120ms)
          var(--connex-motion-easing-standard, ease);
    }
    :host([open]) .surface {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    /* Placement */
    :host([placement='top']) .surface    { bottom: calc(100% + var(--_tip-size)); left: 50%; transform: translateX(-50%) translateY(2px); }
    :host([placement='bottom']) .surface { top:    calc(100% + var(--_tip-size)); left: 50%; transform: translateX(-50%) translateY(2px); }
    :host([placement='left']) .surface   { right:  calc(100% + var(--_tip-size)); top: 0; }
    :host([placement='right']) .surface  { left:   calc(100% + var(--_tip-size)); top: 0; }

    :host([placement='top'][alignment='start']) .surface,
    :host([placement='bottom'][alignment='start']) .surface { left: 0; transform: translateY(2px); }
    :host([placement='top'][alignment='end']) .surface,
    :host([placement='bottom'][alignment='end']) .surface   { left: auto; right: 0; transform: translateY(2px); }

    :host([open][placement='top']) .surface,
    :host([open][placement='bottom']) .surface { transform: translateX(-50%) translateY(0); }
    :host([open][placement='top'][alignment='start']) .surface,
    :host([open][placement='top'][alignment='end']) .surface,
    :host([open][placement='bottom'][alignment='start']) .surface,
    :host([open][placement='bottom'][alignment='end']) .surface { transform: translateY(0); }

    /* Tip */
    .tip {
      position: absolute;
      width: var(--_tip-size);
      height: var(--_tip-size);
      background: var(--connex-surface-primary);
      border: var(--connex-border-width-1) solid var(--connex-border-secondary);
      transform: rotate(45deg);
    }
    :host([placement='top']) .tip    { bottom: calc(var(--_tip-size) / -2); left: 50%; margin-left: calc(var(--_tip-size) / -2); border-top: 0; border-left: 0; }
    :host([placement='bottom']) .tip { top:    calc(var(--_tip-size) / -2); left: 50%; margin-left: calc(var(--_tip-size) / -2); border-bottom: 0; border-right: 0; }
    :host([placement='left']) .tip   { right:  calc(var(--_tip-size) / -2); top: 18px; margin-top: calc(var(--_tip-size) / -2); border-bottom: 0; border-left: 0; }
    :host([placement='right']) .tip  { left:   calc(var(--_tip-size) / -2); top: 18px; margin-top: calc(var(--_tip-size) / -2); border-top: 0; border-right: 0; }

    .header {
      padding: var(--connex-space-8) var(--connex-space-12);
      font-size: var(--connex-font-size-12);
      font-weight: var(--connex-font-weight-semibold);
      color: var(--connex-text-display-secondary);

      border-bottom: var(--connex-border-width-1) solid var(--connex-border-secondary);
    }
  `;

  @property() label = '';
  @property({ reflect: true }) placement: TipPlacement = 'bottom';
  @property({ reflect: true }) alignment: TipAlignment = 'start';
  @property({ type: Boolean, reflect: true }) open = false;

  @queryAssignedElements({ slot: 'trigger', flatten: true })
  private _triggerEls!: HTMLElement[];

  private _onTriggerSlotChange = () => {
    for (const t of this._triggerEls) {
      t.setAttribute('aria-haspopup', 'menu');
      t.setAttribute('aria-expanded', String(this.open));
      t.addEventListener('click', this._toggle, { once: false });
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

  private _onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.open) this.open = false;
  };

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('mousedown', this._onDocClick);
    document.addEventListener('keydown', this._onKey);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('mousedown', this._onDocClick);
    document.removeEventListener('keydown', this._onKey);
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('open')) {
      for (const t of this._triggerEls ?? [])
        t.setAttribute('aria-expanded', String(this.open));
      this.dispatchEvent(
        new CustomEvent(`connex-popover-menu-${this.open ? 'open' : 'close'}`, {
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private _onItemSelect = (e: Event) => {
    const target = e.target as ConnexPopoverMenuItem | null;
    if (!target || target.tagName.toLowerCase() !== 'connex-popover-menu-item') return;
    if (target.disabled) return;
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('connex-popover-menu-select', {
        bubbles: true,
        composed: true,
        detail: { value: target.value },
      }),
    );
    this.open = false;
  };

  render() {
    return html`
      <div class="trigger-wrap">
        <slot name="trigger" @slotchange=${this._onTriggerSlotChange}></slot>
      </div>
      <div class="surface" role="menu">
        <span class="tip" aria-hidden="true"></span>
        ${this.label ? html`<div class="header">${this.label}</div>` : nothing}
        <slot @click=${this._onItemSelect}></slot>
      </div>
    `;
  }
}

/**
 * `<connex-popover-menu-item>` — single row inside a popover menu.
 *
 * @element connex-popover-menu-item
 *
 * @attr value     - Value emitted in the parent menu's select event.
 * @attr disabled  - When set, the item is dimmed and not selectable.
 * @attr selected  - When set, the item shows the selected indicator.
 *
 * @slot icon - Optional leading icon.
 * @slot      - Default: the item label.
 */
@customElement('connex-popover-menu-item')
export class ConnexPopoverMenuItem extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .row {
      display: flex;
      align-items: center;
      gap: var(--connex-space-8);
      padding: var(--connex-space-8) var(--connex-space-12);
      font-family: var(--connex-font-family-inter);
      font-size: var(--connex-font-size-14);
      color: var(--connex-text-display-primary);
      cursor: pointer;
      user-select: none;
      transition: background var(--connex-motion-duration-fast, 120ms)
        var(--connex-motion-easing-standard, ease);
    }
    .row:hover  { background: var(--connex-interactive-background-hover); }
    .row:active { background: var(--connex-interactive-background-pressed); }
    :host(:focus-within) .row,
    .row:focus-visible {
      outline: var(--connex-focus-ring-width) solid var(--connex-focus-ring-color);
      outline-offset: -2px;
    }
    :host([disabled]) .row {
      color: var(--connex-text-display-disabled, var(--connex-color-cool-gray-400));
      cursor: not-allowed;
      pointer-events: none;
    }
    :host([selected]) .row {
      color: var(--connex-text-interactive-primary);
      font-weight: var(--connex-font-weight-semibold);
    }
    ::slotted([slot='icon']) {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
  `;

  @property() value = '';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) selected = false;

  render() {
    return html`
      <div class="row" role="menuitem" tabindex=${this.disabled ? -1 : 0}>
        <slot name="icon"></slot>
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-popover-menu': ConnexPopoverMenu;
    'connex-popover-menu-item': ConnexPopoverMenuItem;
  }
}
