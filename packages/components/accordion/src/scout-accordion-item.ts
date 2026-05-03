import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * `<scout-accordion-item>` — a single expandable row within an accordion.
 *
 * Anatomy: trigger button (icon + label) + collapsible content region.
 *
 * @element scout-accordion-item
 *
 * @attr label   - Header label rendered next to the chevron.
 * @attr expanded - Whether the content is visible. Reflects to the attribute.
 * @attr disabled - When set, the item cannot be toggled and skips tab order.
 *
 * @slot - Content shown when expanded.
 *
 * @fires scout-accordion-toggle - Bubbling, composed event with `{ expanded }` detail.
 */
@customElement('scout-accordion-item')
export class ScoutAccordionItem extends LitElement {
  static styles = css`
    :host {
      display: block;
      border-bottom: var(--_cnx-accordion-divider-width, 0) solid
        var(--scout-border-secondary);
    }
    :host(:last-of-type) {
      border-bottom: none;
    }

    .trigger {
      appearance: none;
      display: flex;
      align-items: center;
      gap: var(--scout-space-12);
      width: 100%;
      padding: var(--_cnx-accordion-padding-block, 12px)
        var(--_cnx-accordion-padding-inline, 16px);
      background: transparent;
      border: none;
      border-radius: var(--scout-radius-4);
      color: var(--scout-text-display-primary);
      font-family: var(--scout-font-family-inter);
      font-size: var(--_cnx-accordion-font-size, 16px);
      line-height: var(--_cnx-accordion-line-height, 24px);
      font-weight: var(--scout-font-weight-semibold);
      text-align: start;
      cursor: pointer;
      transition: background var(--scout-motion-duration-hover)
        var(--scout-motion-easing-gentle);
    }
    .trigger:hover:not(:disabled) {
      background: var(--scout-interactive-background-hover);
    }
    .trigger:active:not(:disabled) {
      background: var(--scout-interactive-background-pressed);
    }
    .trigger:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: -2px;
    }
    .trigger:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .label {
      flex: 1;
      min-width: 0;
    }

    .icon {
      flex-shrink: 0;
      order: var(--_cnx-accordion-icon-order, 1);
      width: var(--_cnx-accordion-icon-size, 20px);
      height: var(--_cnx-accordion-icon-size, 20px);
      color: var(--scout-icon-display-secondary);
      transition: transform var(--scout-motion-duration-base)
        var(--scout-motion-easing-gentle);
    }
    :host([expanded]) .icon {
      transform: rotate(180deg);
    }

    /* Smooth height animation via CSS Grid (no max-height hack) */
    .content {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows var(--scout-motion-duration-base)
        var(--scout-motion-easing-gentle);
    }
    :host([expanded]) .content {
      grid-template-rows: 1fr;
    }
    .content-inner {
      overflow: hidden;
      padding: 0 var(--_cnx-accordion-padding-inline, 16px);
      color: var(--scout-text-display-secondary);
      font-size: var(--scout-typography-body-font-size);
      line-height: var(--scout-typography-body-line-height);
    }
    :host([expanded]) .content-inner {
      padding-bottom: var(--_cnx-accordion-padding-block, 12px);
    }

    @media (prefers-reduced-motion: reduce) {
      .icon,
      .content,
      .trigger {
        transition: none;
      }
    }
  `;

  @property({ type: String }) label = '';
  @property({ type: Boolean, reflect: true }) expanded = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  private _toggle() {
    if (this.disabled) return;
    this.expanded = !this.expanded;
    this.dispatchEvent(
      new CustomEvent<{ expanded: boolean }>('scout-accordion-toggle', {
        bubbles: true,
        composed: true,
        detail: { expanded: this.expanded },
      }),
    );
  }

  render() {
    return html`
      <button
        class="trigger"
        id="trigger"
        part="trigger"
        aria-expanded=${String(this.expanded)}
        aria-controls="content"
        ?disabled=${this.disabled}
        @click=${this._toggle}
      >
        <svg class="icon" part="icon" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M5 7.5l5 5 5-5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span class="label" part="label">${this.label}</span>
      </button>
      <div
        class="content"
        id="content"
        part="content"
        role="region"
        aria-labelledby="trigger"
        aria-hidden=${String(!this.expanded)}
      >
        <div class="content-inner" part="content-inner">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-accordion-item': ScoutAccordionItem;
  }
}
