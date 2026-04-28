import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * `<connex-tab>` — single tab within a `<connex-tabs>` list.
 *
 * Anatomy: text + optional leading icon. Selection state is managed by the
 * parent `<connex-tabs>`; consumers don't toggle `selected` directly.
 *
 * @element connex-tab
 *
 * @attr value     - Identifier emitted on selection. Defaults to the slotted text.
 * @attr disabled  - When set, the tab is dimmed and skipped from interaction.
 * @attr selected  - Reflects the currently-active tab. Set by parent.
 *
 * @slot      - Default: tab label.
 * @slot icon - Optional leading icon.
 *
 * @fires connex-tab-select - Bubbles, composed; detail = `{ value }`.
 */
@customElement('connex-tab')
export class ConnexTab extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      font-family: var(--connex-font-family-inter);
    }
    :host([disabled]) { pointer-events: none; }

    button {
      appearance: none;
      background: transparent;
      border: none;
      padding: var(--connex-space-12) var(--connex-space-16);
      display: inline-flex;
      align-items: center;
      gap: var(--connex-space-8);
      font: inherit;
      font-size: var(--connex-font-size-14);
      font-weight: var(--connex-font-weight-medium);
      line-height: var(--connex-font-line-height-21);
      color: var(--connex-text-display-secondary);
      cursor: pointer;
      position: relative;
      /* Transparent bottom border that becomes the selection indicator */
      border-bottom: 2px solid transparent;
      transition:
        color var(--connex-motion-duration-fast, 120ms)
          var(--connex-motion-easing-standard, ease),
        background var(--connex-motion-duration-fast, 120ms)
          var(--connex-motion-easing-standard, ease),
        border-color var(--connex-motion-duration-fast, 120ms)
          var(--connex-motion-easing-standard, ease);
    }

    /* === Interactive states === */
    button:hover:not(:disabled) {
      color: var(--connex-text-display-primary);
      background: var(--connex-interactive-background-hover);
    }
    button:focus-visible {
      outline: var(--connex-focus-ring-width) solid var(--connex-focus-ring-color);
      outline-offset: -2px;
    }
    button:active:not(:disabled) {
      background: var(--connex-interactive-background-pressed);
    }
    button:disabled {
      color: var(--connex-text-display-disabled, var(--connex-color-cool-gray-400));
      cursor: not-allowed;
    }

    /* === Selected — functional state === */
    :host([selected]) button {
      color: var(--connex-text-interactive-primary);
      border-bottom-color: var(--connex-text-interactive-primary);
      font-weight: var(--connex-font-weight-semibold);
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
      new CustomEvent<{ value: string }>('connex-tab-select', {
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
    'connex-tab': ConnexTab;
  }
}
