import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@scout/control';
import type { TipAlignment, TipPlacement, TooltipTrigger, TooltipVariant } from './types.js';

const INFO_ICON_OUTLINE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="16" height="16"><path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/></svg>`;
const INFO_ICON_SOLID = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="16" height="16"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.732 2.923.305-.158a.75.75 0 0 1 .67 1.34l-.32.165c-1.146.573-2.437-.463-2.126-1.706l.732-2.923-.305.158a.75.75 0 1 1-.67-1.34l.32-.165ZM12 8.25a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" clip-rule="evenodd"/></svg>`;

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
    /* Info-icon trigger — outline by default, swap to solid on hover/focus
       so the affordance reads as active. Uses the dedicated control-icon
       token (icon.interactive.primary / cool-gray.800) instead of the
       brand-blue text token shared with the text trigger, so the icon
       reads as a neutral control affordance rather than a link. */
    .trigger-info {
      width: 24px;
      height: 24px;
      align-items: center;
      justify-content: center;
      position: relative;
      color: var(--scout-icon-interactive-primary);
    }
    .trigger-info span {
      position: absolute;
      inset: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: opacity var(--scout-motion-duration-hover, 120ms) ease;
    }
    .trigger-info .info-solid { opacity: 0; }
    .trigger-info:hover .info-outline,
    .trigger-info:focus-visible .info-outline { opacity: 0; }
    .trigger-info:hover .info-solid,
    .trigger-info:focus-visible .info-solid { opacity: 1; }

    /* Popover surface — width hugs the content (max-content) and only
       wraps once it would otherwise exceed the max-width cap. */
    .popover {
      position: absolute;
      z-index: 1000;
      background: var(--scout-color-cool-gray-800, #2a3340);
      color: var(--scout-color-white);
      border-radius: var(--scout-radius-4);
      padding: var(--scout-space-8) var(--scout-space-12);
      font-size: var(--scout-typography-body-small-font-size);
      line-height: var(--scout-typography-body-small-line-height);
      box-shadow: var(--scout-elevation-2);
      width: max-content;
      min-width: 0;
      max-width: 320px;
      pointer-events: none;
      opacity: 0;
      transform: translateY(2px);
      transition: opacity var(--scout-motion-duration-hover, 120ms)
          var(--scout-motion-easing-gentle, ease),
        transform var(--scout-motion-duration-hover, 120ms)
          var(--scout-motion-easing-gentle, ease);
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

    /* Simple tooltips reveal on hover/focus (or when forced open).
       Advanced tooltips reveal only on explicit open (click toggle). */
    :host([open]) .popover,
    :host([variant='simple']:hover) .popover,
    :host([variant='simple']:focus-within) .popover {
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
    :host([variant='simple']:hover[placement='top']) .popover,
    :host([variant='simple']:hover[placement='bottom']) .popover,
    :host([variant='simple']:focus-within[placement='top']) .popover,
    :host([variant='simple']:focus-within[placement='bottom']) .popover {
      transform: translateX(-50%) translateY(0);
    }
    /* Left / right placements need their own open-state override because
       the general transform: translateY(0) rule would clobber the
       translateY(-50%) that vertically centers the popover on the
       trigger, dropping it below the trigger's center. */
    :host([open][placement='left']) .popover,
    :host([open][placement='right']) .popover,
    :host([variant='simple']:hover[placement='left']) .popover,
    :host([variant='simple']:hover[placement='right']) .popover,
    :host([variant='simple']:focus-within[placement='left']) .popover,
    :host([variant='simple']:focus-within[placement='right']) .popover {
      transform: translateY(-50%);
    }
    :host([open][placement='top'][alignment='start']) .popover,
    :host([open][placement='bottom'][alignment='start']) .popover,
    :host([open][placement='top'][alignment='end']) .popover,
    :host([open][placement='bottom'][alignment='end']) .popover {
      transform: translateY(0);
    }


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
    /* Advanced-variant slot wrappers — alert sits above the title/body,
       link sits below. Each is hidden when its slot is empty. */
    .alert {
      margin-bottom: var(--scout-space-12);
    }
    .alert[hidden] { display: none; }
    .link {
      margin-top: var(--scout-space-8);
    }
    .link[hidden] { display: none; }
  `;

  @property() variant: TooltipVariant = 'simple';
  @property({ reflect: true }) trigger: TooltipTrigger = 'text';
  @property({ reflect: true }) placement: TipPlacement = 'top';
  @property({ reflect: true }) alignment: TipAlignment = 'center';
  @property({ attribute: 'title-text' }) titleText = '';
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  @state() private _id = `tt-${Math.random().toString(36).slice(2, 9)}`;
  @state() private _hasAlert = false;
  @state() private _hasLink = false;

  private _onAlertSlot = (e: Event) => {
    this._hasAlert = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };
  private _onLinkSlot = (e: Event) => {
    this._hasLink = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };

  private _onTriggerClick = () => {
    if (this.disabled) return;
    if (this.variant !== 'advanced') return;
    this.open = !this.open;
  };

  private _onDocumentClick = (e: MouseEvent) => {
    if (this.variant !== 'advanced' || !this.open) return;
    const path = e.composedPath();
    if (!path.includes(this)) this.open = false;
  };

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._onDocumentClick);
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocumentClick);
  }

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
    const trigger =
      this.trigger === 'info-icon'
        ? html`<button
            class="trigger trigger-info"
            type="button"
            aria-label="More info"
            aria-describedby=${this._id}
            ?disabled=${this.disabled}
            @click=${this._onTriggerClick}
          >
            <span class="info-outline" .innerHTML=${INFO_ICON_OUTLINE}></span>
            <span class="info-solid" .innerHTML=${INFO_ICON_SOLID}></span>
          </button>`
        : html`<button
            class="trigger"
            type="button"
            aria-describedby=${this._id}
            ?disabled=${this.disabled}
            @click=${this._onTriggerClick}
          >
            <slot name="trigger">Trigger</slot>
          </button>`;

    return html`
      ${trigger}
      <div class="popover" role="tooltip" id=${this._id}>
        <div class="alert" ?hidden=${!this._hasAlert}>
          <slot name="alert" @slotchange=${this._onAlertSlot}></slot>
        </div>
        ${this.titleText ? html`<div class="title">${this.titleText}</div>` : nothing}
        <div class="body"><slot></slot></div>
        <div class="link" ?hidden=${!this._hasLink}>
          <slot name="link" @slotchange=${this._onLinkSlot}></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-tooltip': ScoutTooltip;
  }
}
