import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { FilterChipSize } from './types.js';

const CHEVRON_DOWN = svg`<path fill-rule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clip-rule="evenodd"/>`;

const CHECK_ICON = svg`<path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd"/>`;

/**
 * `<scout-filter-chip>` — selectable tag for filtering content.
 *
 * Click toggles the `selected` state (and dispatches a `scout-filter-chip-change`
 * event). When `menu` is set, the chip renders a chevron and dispatches a
 * `scout-filter-chip-menu` event for the consumer to open a popover; the
 * chip's selected state is then driven externally.
 *
 * @element scout-filter-chip
 *
 * @attr {"default"|"condensed"} size
 * @attr selected - Selected/active filter state.
 * @attr menu     - Renders a trailing chevron and treats clicks as menu triggers
 *                  (selected is no longer toggled internally; consumer manages).
 * @attr disabled
 *
 * @slot - Filter label.
 *
 * @fires scout-filter-chip-change - Bubbling, composed; detail = `{ selected }`. Fired in toggle mode.
 * @fires scout-filter-chip-menu   - Bubbling, composed. Fired in menu mode.
 */
@customElement('scout-filter-chip')
export class ScoutFilterChip extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      font-family: var(--scout-font-family-inter);
      --_chip-padding-block: 6px;
      --_chip-padding-inline: var(--scout-space-12);
      --_chip-fs: var(--scout-font-size-14);
      --_chip-icon-size: 14px;
      --_chip-gap: var(--scout-space-4);
    }
    :host([size='condensed']) {
      --_chip-padding-block: 2px;
      --_chip-padding-inline: var(--scout-space-8);
      --_chip-fs: var(--scout-font-size-12);
      --_chip-icon-size: 12px;
    }

    .chip {
      appearance: none;
      display: inline-flex;
      align-items: center;
      gap: var(--_chip-gap);
      padding: var(--_chip-padding-block) var(--_chip-padding-inline);
      background: var(--scout-surface-primary);
      color: var(--scout-text-display-primary);
      border: var(--scout-border-width-1) solid var(--scout-border-primary);
      border-radius: var(--scout-radius-999);
      font-family: inherit;
      font-size: var(--_chip-fs);
      font-weight: var(--scout-font-weight-medium);
      line-height: 1.2;
      cursor: pointer;
      white-space: nowrap;
      transition:
        background var(--scout-motion-duration-fast) var(--scout-motion-easing-standard),
        border-color var(--scout-motion-duration-fast) var(--scout-motion-easing-standard),
        color var(--scout-motion-duration-fast) var(--scout-motion-easing-standard);
    }
    .chip:hover:not(:disabled) {
      background: var(--scout-interactive-background-hover);
      border-color: var(--scout-text-interactive-primary);
    }
    .chip:active:not(:disabled) {
      background: var(--scout-interactive-background-pressed);
    }
    .chip:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: 1px;
    }
    .chip:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Selected — uses brand-aligned blue tint */
    :host([selected]) .chip {
      background: var(--scout-color-blue-100);
      color: var(--scout-color-blue-700);
      border-color: var(--scout-text-interactive-primary);
    }
    :host([selected]) .chip:hover:not(:disabled) {
      background: var(--scout-color-blue-200);
    }
    :host([selected]) .chip:active:not(:disabled) {
      background: var(--scout-color-blue-300);
    }

    .icon {
      width: var(--_chip-icon-size);
      height: var(--_chip-icon-size);
      flex-shrink: 0;
    }
    .menu-caret {
      transition: transform var(--scout-motion-duration-fast) var(--scout-motion-easing-standard);
    }
    :host([data-menu-open]) .menu-caret {
      transform: rotate(180deg);
    }

    @media (prefers-reduced-motion: reduce) {
      .chip, .menu-caret { transition: none; }
    }
  `;

  @property({ type: String, reflect: true }) size: FilterChipSize = 'default';
  @property({ type: Boolean, reflect: true }) selected = false;
  @property({ type: Boolean, reflect: true }) menu = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  private _onClick = () => {
    if (this.disabled) return;
    if (this.menu) {
      this.dispatchEvent(
        new CustomEvent('scout-filter-chip-menu', { bubbles: true, composed: true }),
      );
    } else {
      this.selected = !this.selected;
      this.dispatchEvent(
        new CustomEvent<{ selected: boolean }>('scout-filter-chip-change', {
          bubbles: true,
          composed: true,
          detail: { selected: this.selected },
        }),
      );
    }
  };

  render() {
    return html`
      <button
        class="chip"
        type="button"
        ?disabled=${this.disabled}
        aria-pressed=${this.menu ? (nothing as any) : String(this.selected)}
        aria-haspopup=${this.menu ? 'true' : (nothing as any)}
        @click=${this._onClick}
      >
        ${this.selected && !this.menu
          ? html`<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${CHECK_ICON}</svg>`
          : nothing}
        <slot></slot>
        ${this.menu
          ? html`<svg class="icon menu-caret" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${CHEVRON_DOWN}</svg>`
          : nothing}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-filter-chip': ScoutFilterChip;
  }
}
