import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * `<scout-tab>` — single tab within a `<scout-tabs>` list.
 *
 * Anatomy: text + optional leading icon. Selection state is managed by the
 * parent `<scout-tabs>`; consumers don't toggle `selected` directly.
 *
 * @element scout-tab
 *
 * @attr value     - Identifier emitted on selection. Defaults to the slotted text.
 * @attr disabled  - When set, the tab is dimmed and skipped from interaction.
 * @attr selected  - Reflects the currently-active tab. Set by parent.
 *
 * @slot      - Default: tab label.
 * @slot icon - Optional leading icon.
 *
 * @fires scout-tab-select - Bubbles, composed; detail = `{ value }`.
 */
@customElement('scout-tab')
export class ScoutTab extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      font-family: var(--scout-font-family-inter);
    }
    :host([disabled]) { pointer-events: none; }

    button {
      appearance: none;
      background: transparent;
      border: none;
      padding: var(--scout-space-12) var(--scout-space-16);
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-8);
      font: inherit;
      font-size: var(--scout-font-size-14);
      font-weight: var(--scout-font-weight-semibold);
      line-height: var(--scout-font-line-height-21);
      color: var(--scout-text-display-secondary);
      cursor: pointer;
      position: relative;
      white-space: nowrap;
      /* Transparent bottom border that becomes the selection indicator */
      border-bottom: 2px solid transparent;
      transition:
        color var(--scout-motion-duration-hover, 120ms)
          var(--scout-motion-easing-gentle, ease),
        background var(--scout-motion-duration-hover, 120ms)
          var(--scout-motion-easing-gentle, ease),
        border-color var(--scout-motion-duration-hover, 120ms)
          var(--scout-motion-easing-gentle, ease);
    }

    /* === Interactive states === */
    button:hover:not(:disabled) {
      color: var(--scout-text-display-primary);
      background: var(--scout-interactive-background-hover);
    }
    button:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: -2px;
    }
    button:active:not(:disabled) {
      background: var(--scout-interactive-background-pressed);
    }
    button:disabled {
      color: var(--scout-text-display-disabled, var(--scout-color-cool-gray-400));
      cursor: not-allowed;
    }

    /* === Selected — functional state === */
    :host([selected]) button {
      color: var(--scout-text-interactive-primary);
      border-bottom-color: var(--scout-text-interactive-primary);
      font-weight: var(--scout-font-weight-semibold);
    }

    /* Icon slot */
    ::slotted([slot='icon']) {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      button { transition: none; }
    }
  `;

  @property() value = '';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) selected = false;

  private _onClick = () => {
    if (this.disabled) return;
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('scout-tab-select', {
        bubbles: true,
        composed: true,
        detail: { value: this.value || (this.textContent ?? '').trim() },
      }),
    );
  };

  render() {
    return html`
      <button
        type="button"
        role="tab"
        aria-selected=${String(this.selected)}
        ?disabled=${this.disabled}
        tabindex=${this.selected && !this.disabled ? 0 : -1}
        @click=${this._onClick}
      >
        <slot name="icon"></slot>
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-tab': ScoutTab;
  }
}
