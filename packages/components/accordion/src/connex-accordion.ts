import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ConnexAccordionItem } from './connex-accordion-item.js';
import type { AccordionIconPosition, AccordionMode, AccordionSize } from './types.js';

/**
 * `<connex-accordion>` — vertically stacked rows that reveal or hide content.
 *
 * Coordinates expand/collapse mode (single vs. multi) across child
 * `<connex-accordion-item>` elements and propagates size, icon position,
 * and divider styling via CSS custom properties so children re-theme without
 * extra wiring.
 *
 * @element connex-accordion
 *
 * @attr {"single"|"multi"} mode      - Expansion behavior. `single` collapses peers; `multi` allows many open at once.
 * @attr {"sm"|"md"|"lg"}   size      - Density preset propagated to all child items.
 * @attr {"left"|"right"}   icon-position - Where the chevron sits relative to the label.
 * @attr divider                       - When present, renders a 1px rule between items.
 *
 * @slot - One or more `<connex-accordion-item>` children.
 *
 * @fires connex-accordion-toggle - Bubbles from a child item; detail = `{ expanded }`.
 */
@customElement('connex-accordion')
export class ConnexAccordion extends LitElement {
  static styles = css`
    :host {
      display: block;
      /* Size defaults (md) */
      --_cnx-accordion-padding-block: var(--connex-space-12);
      --_cnx-accordion-padding-inline: var(--connex-space-16);
      --_cnx-accordion-font-size: var(--connex-font-size-16);
      --_cnx-accordion-line-height: var(--connex-font-line-height-24);
      --_cnx-accordion-icon-size: 20px;
      --_cnx-accordion-icon-order: 1;
      --_cnx-accordion-divider-width: 0px;
    }
    :host([size='sm']) {
      --_cnx-accordion-padding-block: var(--connex-space-8);
      --_cnx-accordion-padding-inline: var(--connex-space-12);
      --_cnx-accordion-font-size: var(--connex-font-size-14);
      --_cnx-accordion-line-height: var(--connex-font-line-height-21);
      --_cnx-accordion-icon-size: 16px;
    }
    :host([size='lg']) {
      --_cnx-accordion-padding-block: var(--connex-space-16);
      --_cnx-accordion-padding-inline: var(--connex-space-24);
      --_cnx-accordion-font-size: var(--connex-font-size-20);
      --_cnx-accordion-line-height: var(--connex-font-line-height-30);
      --_cnx-accordion-icon-size: 24px;
    }
    :host([icon-position='left']) {
      --_cnx-accordion-icon-order: -1;
    }
    :host([divider]) {
      --_cnx-accordion-divider-width: var(--connex-border-width-1);
    }
  `;

  /** Expansion behavior. */
  @property({ type: String, reflect: true }) mode: AccordionMode = 'multi';

  /** Density preset. */
  @property({ type: String, reflect: true }) size: AccordionSize = 'md';

  /** Icon placement relative to the label. */
  @property({ type: String, reflect: true, attribute: 'icon-position' })
  iconPosition: AccordionIconPosition = 'right';

  /** Render a 1px divider between items. */
  @property({ type: Boolean, reflect: true }) divider = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('connex-accordion-toggle', this._handleToggle as EventListener);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('connex-accordion-toggle', this._handleToggle as EventListener);
  }

  private _handleToggle = (e: CustomEvent<{ expanded: boolean }>) => {
    if (this.mode !== 'single' || !e.detail.expanded) return;
    const items = this.querySelectorAll<ConnexAccordionItem>('connex-accordion-item');
    items.forEach((item) => {
      if (item !== e.target) item.expanded = false;
    });
  };

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-accordion': ConnexAccordion;
  }
}
