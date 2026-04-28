import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * `<connex-segment>` — single mutually-exclusive segment within a
 * `<connex-segmented-control>`.
 *
 * Anatomy: text label (default slot) + optional leading icon (slot="icon").
 * Selection is managed by the parent; consumers don't toggle `selected`
 * directly.
 *
 * @element connex-segment
 *
 * @attr value     - Identifier emitted on selection.
 * @attr disabled  - When set, the segment is dimmed and skipped from interaction.
 * @attr selected  - Reflects the active segment. Set by the parent.
 *
 * @slot      - Default: segment label.
 * @slot icon - Optional leading icon (sized 16×16).
 *
 * @fires connex-segment-select - Bubbles, composed; detail = `{ value }`.
 */
@customElement('connex-segment')
export class ConnexSegment extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      flex: 1;
      font-family: var(--connex-font-family-inter);
    }
    :host([disabled]) { pointer-events: none; }

    button {
      appearance: none;
      flex: 1;
      width: 100%;
      background: transparent;
      border: 0;
      padding: var(--connex-space-4) var(--connex-space-12);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--connex-space-4);
      font: inherit;
      font-size: var(--connex-font-size-14);
      font-weight: var(--connex-font-weight-medium);
      line-height: var(--connex-font-line-height-21);
      color: var(--connex-text-display-secondary);
      cursor: pointer;
      border-radius: var(--connex-radius-4);
      white-space: nowrap;
      transition:
        background var(--connex-motion-duration-fast, 120ms)
          var(--connex-motion-easing-standard, ease),
        color var(--connex-motion-duration-fast, 120ms)
          var(--connex-motion-easing-standard, ease),
        box-shadow var(--connex-motion-duration-fast, 120ms)
          var(--connex-motion-easing-standard, ease);
    }

    /* Condensed sizing inherited from the parent */
    :host-context(connex-segmented-control[size='condensed']) button {
      padding: 2px var(--connex-space-8);
      font-size: var(--connex-font-size-12);
      line-height: var(--connex-font-line-height-18);
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
      background: var(--connex-fill-always-white);
      color: var(--connex-text-display-primary);
      font-weight: var(--connex-font-weight-semibold);
      box-shadow: var(--connex-elevation-1);
    }
    :host([selected]) button:hover:not(:disabled) {
      background: var(--connex-fill-always-white);
    }

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
      new CustomEvent<{ value: string }>('connex-segment-select', {
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
        role="radio"
        aria-checked=${String(this.selected)}
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
    'connex-segment': ConnexSegment;
  }
}
