import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * `<scout-segment>` — single mutually-exclusive segment within a
 * `<scout-segmented-control>`.
 *
 * Anatomy: text label (default slot) + optional leading icon (slot="icon").
 * Selection is managed by the parent; consumers don't toggle `selected`
 * directly.
 *
 * @element scout-segment
 *
 * @attr value     - Identifier emitted on selection.
 * @attr disabled  - When set, the segment is dimmed and skipped from interaction.
 * @attr selected  - Reflects the active segment. Set by the parent.
 *
 * @slot      - Default: segment label.
 * @slot icon - Optional leading icon (sized 16×16).
 *
 * @fires scout-segment-select - Bubbles, composed; detail = `{ value }`.
 */
@customElement('scout-segment')
export class ScoutSegment extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      flex: 1;
      font-family: var(--scout-font-family-inter);
    }
    :host([disabled]) { pointer-events: none; }

    button {
      appearance: none;
      flex: 1;
      width: 100%;
      background: transparent;
      border: 0;
      padding: var(--scout-space-4) var(--scout-space-12);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--scout-space-4);
      font: inherit;
      font-size: var(--scout-font-size-14);
      font-weight: var(--scout-font-weight-semibold);
      line-height: var(--scout-font-line-height-21);
      color: var(--scout-text-display-secondary);
      cursor: pointer;
      border-radius: var(--scout-radius-4);
      white-space: nowrap;
      transition:
        background var(--scout-motion-duration-fast, 120ms)
          var(--scout-motion-easing-standard, ease),
        color var(--scout-motion-duration-fast, 120ms)
          var(--scout-motion-easing-standard, ease),
        box-shadow var(--scout-motion-duration-fast, 120ms)
          var(--scout-motion-easing-standard, ease);
    }

    /* Condensed sizing inherited from the parent */
    :host-context(scout-segmented-control[size='condensed']) button {
      padding: 2px var(--scout-space-8);
      font-size: var(--scout-font-size-12);
      line-height: var(--scout-font-line-height-18);
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
      background: var(--scout-fill-always-white);
      color: var(--scout-text-display-primary);
      font-weight: var(--scout-font-weight-semibold);
      box-shadow: var(--scout-elevation-1);
    }
    :host([selected]) button:hover:not(:disabled) {
      background: var(--scout-fill-always-white);
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
      new CustomEvent<{ value: string }>('scout-segment-select', {
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
    'scout-segment': ScoutSegment;
  }
}
