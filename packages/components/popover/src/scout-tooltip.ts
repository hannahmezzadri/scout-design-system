import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { TipAlignment, TipPlacement, TooltipTrigger, TooltipVariant } from './types.js';

const INFO_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="16" height="16"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.732 2.923.305-.158a.75.75 0 0 1 .67 1.34l-.32.165c-1.146.573-2.437-.463-2.126-1.706l.732-2.923-.305.158a.75.75 0 1 1-.67-1.34l.32-.165ZM12 8.25a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" clip-rule="evenodd"/></svg>`;

/**
 * `<scout-tooltip>` — popover tooltip anchored to a trigger.
 *
 * Trigger: text (default) or info-icon. Hover or focus opens the tooltip.
 * Two variants: `simple` (plain text, max ~3 lines) and `advanced` (rich content,
 * via slot — supports inline alerts, language tabs, etc.).
 *
 * @element scout-tooltip
 *
 * @attr {"simple"|"advanced"} variant         - Visual variant.
 * @attr {"text"|"info-icon"} trigger          - Trigger type.
 * @attr {"top"|"bottom"|"left"|"right"} placement - Tip side relative to the trigger.
 * @attr {"start"|"center"|"end"} alignment    - Cross-axis alignment of the popover.
 * @attr title-text                            - Optional title shown above the body.
 * @attr open                                  - When set, the tooltip is forced open (for previews).
 * @attr disabled                              - Disables the trigger.
 *
 * @slot trigger - Trigger content (used when trigger is "text"). Defaults to slotted text.
 * @slot        - Default slot: tooltip body (advanced) or plain text (simple).
 *
 * @fires scout-tooltip-open  - Bubbles, composed; detail = `{ open: true }`.
 * @fires scout-tooltip-close - Bubbles, composed; detail = `{ open: false }`.
 */
@customElement('scout-tooltip')
export class ScoutTooltip extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      position: relative;
      font-family: var(--scout-font-family-inter);
      --_tip-size: 8px;
    }

    .trigger {
      appearance: none;
      background: transparent;
      border: none;
      padding: 0;
      font: inherit;
      color: var(--scout-text-interactive-primary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-4);
      border-radius: var(--scout-radius-2);
    }
    :host([trigger='text']) .trigger {
      text-decoration: underline;
      text-decoration-style: dotted;
      text-underline-offset: 3px;
    }
    .trigger:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: var(--scout-focus-ring-offset);
    }
    :host([disabled]) .trigger {
      color: var(--scout-text-display-disabled, var(--scout-color-cool-gray-400));
      cursor: not-allowed;
      pointer-events: none;
    }

    /* Popover surface */
    .popover {
      position: absolute;
      z-index: 1000;
      background: var(--scout-color-cool-gray-800, #2a3340);
      color: var(--scout-color-white);
      border-radius: var(--scout-radius-4);
      padding: var(--scout-space-8) var(--scout-space-12);
      font-size: var(--scout-font-size-12);
      line-height: var(--scout-font-line-height-15);
      box-shadow: var(--scout-elevation-2);
      max-width: 240px;
      pointer-events: none;
      opacity: 0;
      transform: translateY(2px);
      transition: opacity var(--scout-motion-duration-fast, 120ms)
          var(--scout-motion-easing-standard, ease),
        transform var(--scout-motion-duration-fast, 120ms)
          var(--scout-motion-easing-standard, ease);
    }
    :host([variant='advanced']) .popover {
      background: var(--scout-surface-primary);
      color: var(--scout-text-display-primary);
      border: var(--scout-border-width-1) solid var(--scout-border-secondary);
      max-width: 320px;
      font-size: var(--scout-font-size-14);
      line-height: var(--scout-font-line-height-21);
      padding: var(--scout-space-12) var(--scout-space-16);
    }

    :host([open]) .popover,
    :host(:hover) .popover,
    :host(:focus-within) .popover {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    /* Placement */
    :host([placement='top']) .popover    { bottom: calc(100% + var(--_tip-size)); }
    :host([placement='bottom']) .popover { top:    calc(100% + var(--_tip-size)); }
    :host([placement='left']) .popover   { right:  calc(100% + var(--_tip-size)); top: 50%; transform: translateY(-50%); }
    :host([placement='right']) .popover  { left:   calc(100% + var(--_tip-size)); top: 50%; transform: translateY(-50%); }

    /* Cross-axis alignment for top/bottom */
    :host([placement='top']) .popover,
    :host([placement='bottom']) .popover {
      left: 50%;
      transform: translateX(-50%) translateY(2px);
    }
    :host([placement='top'][alignment='start']) .popover,
    :host([placement='bottom'][alignment='start']) .popover { left: 0; transform: translateY(2px); }
    :host([placement='top'][alignment='end']) .popover,
    :host([placement='bottom'][alignment='end']) .popover   { left: auto; right: 0; transform: translateY(2px); }

    :host([open][placement='top']) .popover,
    :host([open][placement='bottom']) .popover,
    :host(:hover[placement='top']) .popover,
    :host(:hover[placement='bottom']) .popover,
    :host(:focus-within[placement='top']) .popover,
    :host(:focus-within[placement='bottom']) .popover {
      transform: translateX(-50%) translateY(0);
    }
    :host([open][placement='top'][alignment='start']) .popover,
    :host([open][placement='bottom'][alignment='start']) .popover,
    :host([open][placement='top'][alignment='end']) .popover,
    :host([open][placement='bottom'][alignment='end']) .popover {
      transform: translateY(0);
    }

    /* Tip — drawn as a rotated square anchored to the popover edge */
    .tip {
      position: absolute;
      width: var(--_tip-size);
      height: var(--_tip-size);
      background: inherit;
      transform: rotate(45deg);
      border: inherit;
      border-color: inherit;
    }
    :host([placement='top']) .tip    { bottom: calc(var(--_tip-size) / -2); left: 50%; margin-left: calc(var(--_tip-size) / -2); border-top: 0; border-left: 0; }
    :host([placement='bottom']) .tip { top:    calc(var(--_tip-size) / -2); left: 50%; margin-left: calc(var(--_tip-size) / -2); border-bottom: 0; border-right: 0; }
    :host([placement='left']) .tip   { right:  calc(var(--_tip-size) / -2); top:  50%; margin-top:  calc(var(--_tip-size) / -2); border-bottom: 0; border-left: 0; }
    :host([placement='right']) .tip  { left:   calc(var(--_tip-size) / -2); top:  50%; margin-top:  calc(var(--_tip-size) / -2); border-top: 0; border-right: 0; }

    .title {
      font-weight: var(--scout-font-weight-semibold);
      margin-bottom: var(--scout-space-4);
    }
    :host([variant='simple']) .body {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `;

  @property() variant: TooltipVariant = 'simple';
  @property({ reflect: true }) trigger: TooltipTrigger = 'text';
  @property({ reflect: true }) placement: TipPlacement = 'top';
  @property({ reflect: true }) alignment: TipAlignment = 'center';
  @property({ attribute: 'title-text' }) titleText = '';
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  @state() private _id = `tt-${Math.random().toString(36).slice(2, 9)}`;

  private _emit(name: 'open' | 'close') {
    this.dispatchEvent(
      new CustomEvent(`scout-tooltip-${name}`, {
        bubbles: true,
        composed: true,
        detail: { open: name === 'open' },
      }),
    );
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('open')) this._emit(this.open ? 'open' : 'close');
  }

  render() {
    const triggerContent =
      this.trigger === 'info-icon'
        ? html`<span class="icon" .innerHTML=${INFO_ICON}></span>`
        : html`<slot name="trigger">Trigger</slot>`;

    return html`
      <button
        class="trigger"
        type="button"
        aria-describedby=${this._id}
        ?disabled=${this.disabled}
      >
        ${triggerContent}
      </button>
      <div class="popover" role="tooltip" id=${this._id}>
        <span class="tip" aria-hidden="true"></span>
        ${this.titleText ? html`<div class="title">${this.titleText}</div>` : nothing}
        <div class="body"><slot></slot></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-tooltip': ScoutTooltip;
  }
}
