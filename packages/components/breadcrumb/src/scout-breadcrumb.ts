import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * `<scout-breadcrumb>` — hierarchy navigation showing the user's location.
 *
 * Two configurations:
 * - **Multi (3+)**: a chain of `<scout-breadcrumb-item>` children, separated by chevrons.
 *   The last item should have the `current` attribute and is rendered as plain text.
 * - **Back (1)**: when `back` is set on the parent, render a single back link with a leading
 *   arrow. Use this when there's only one level "up" to return to.
 *
 * @element scout-breadcrumb
 *
 * @attr back - Switches to single back-link mode with a leading arrow icon.
 *
 * @slot - One or more `<scout-breadcrumb-item>` elements.
 */
@customElement('scout-breadcrumb')
export class ScoutBreadcrumb extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    nav { display: block; }
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0;
    }
    .back-arrow {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      margin-right: var(--scout-space-4);
      color: var(--scout-text-interactive-primary);
    }
    :host([back]) ::slotted(scout-breadcrumb-item) {
      /* The single back-link item shouldn't render its trailing chevron */
    }
  `;

  @property({ type: Boolean, reflect: true }) back = false;

  private _onSlotChange = (e: Event) => {
    const slot = e.target as HTMLSlotElement;
    const items = slot
      .assignedElements()
      .filter((n) => n.tagName === 'SCOUT-BREADCRUMB-ITEM') as HTMLElement[];
    items.forEach((item, i) => {
      item.toggleAttribute('data-last', i === items.length - 1);
      item.toggleAttribute('data-back', this.back);
    });
  };

  updated() {
    // When `back` toggles, refresh markers on items
    const items = Array.from(
      this.querySelectorAll('scout-breadcrumb-item'),
    ) as HTMLElement[];
    items.forEach((item, i) => {
      item.toggleAttribute('data-last', i === items.length - 1);
      item.toggleAttribute('data-back', this.back);
    });
  }

  render() {
    return html`
      <nav aria-label="Breadcrumb">
        <ol class="list">
          ${this.back
            ? html`<span class="back-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.78 5.22a.75.75 0 0 1 0 1.06L7.06 11h12.69a.75.75 0 0 1 0 1.5H7.06l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z" />
                </svg>
              </span>`
            : nothing}
          <slot @slotchange=${this._onSlotChange}></slot>
        </ol>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-breadcrumb': ScoutBreadcrumb;
  }
}
