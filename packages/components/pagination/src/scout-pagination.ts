import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@scout/dropdown';
import type { PaginationLayout, PaginationSize } from './types.js';

const CHEVRON_LEFT = svg`<path fill-rule="evenodd" d="M15.78 4.72a.75.75 0 0 1 0 1.06L9.56 12l6.22 6.22a.75.75 0 1 1-1.06 1.06l-6.75-6.75a.75.75 0 0 1 0-1.06l6.75-6.75a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd"/>`;
const CHEVRON_RIGHT = svg`<path fill-rule="evenodd" d="M8.22 4.72a.75.75 0 0 0 0 1.06L14.44 12l-6.22 6.22a.75.75 0 1 0 1.06 1.06l6.75-6.75a.75.75 0 0 0 0-1.06L9.28 4.72a.75.75 0 0 0-1.06 0Z" clip-rule="evenodd"/>`;

/**
 * `<scout-pagination>` — page navigation for tables and paged content.
 *
 * Provides an items-per-page dropdown, range readout, chevron prev/next, and
 * numbered page buttons with ellipses. All visual states (hover, focus,
 * pressed, disabled) are token-driven.
 *
 * @element scout-pagination
 *
 * @attr {number} page                                          - Current page (1-based).
 * @attr {number} page-size                                     - Items per page.
 * @attr {number} total                                         - Total item count.
 * @attr {string} page-size-options                             - JSON array of page-size options, e.g. `[10,25,50]`.
 * @attr {"item-dropdown"|"page-numbers"|"both"} layout         - Which controls to render.
 * @attr {"default"|"condensed"} size                           - Density.
 * @attr disabled                                               - Disables all controls.
 *
 * @fires scout-pagination-change - Bubbles, composed; detail = `{ page, pageSize }`.
 */
@customElement('scout-pagination')
export class ScoutPagination extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-16);
      flex-wrap: wrap;
      font-family: var(--scout-font-family-inter);
      color: var(--scout-text-display-primary);
      --_pg-control-size: 32px;
      --_pg-fs: var(--scout-font-size-14);
      --_pg-gap: var(--scout-space-4);
    }
    /* When both groups are shown, fill the container and push the page-nav
       group to the far right so the layout reads: items-per-page (left) /
       page numbers (right). */
    :host([layout='both']) {
      display: flex;
      width: 100%;
    }
    :host([layout='both']) .nav {
      margin-left: auto;
    }
    :host([size='condensed']),
    :host-context([data-density='condensed']) {
      --_pg-control-size: 24px;
      --_pg-fs: var(--scout-font-size-12);
      --_pg-gap: var(--scout-space-2, 2px);
    }

    /* === Item dropdown group === */
    .items {
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-8);
      font-size: var(--_pg-fs);
      color: var(--scout-text-display-secondary);
      white-space: nowrap;
    }
    .items scout-dropdown-select {
      min-width: 72px;
    }

    .range {
      font-size: var(--_pg-fs);
      color: var(--scout-text-display-secondary);
      white-space: nowrap;
    }

    /* === Page navigation group === */
    .nav {
      display: inline-flex;
      align-items: center;
      gap: var(--_pg-gap);
    }

    .ctrl {
      appearance: none;
      background: transparent;
      border: var(--scout-border-width-1) solid transparent;
      border-radius: var(--scout-radius-4);
      width: var(--_pg-control-size);
      height: var(--_pg-control-size);
      min-width: var(--_pg-control-size);
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: inherit;
      font-size: var(--_pg-fs);
      font-weight: var(--scout-font-weight-medium);
      color: var(--scout-text-display-primary);
      cursor: pointer;
      transition: background var(--scout-motion-duration-fast, 120ms)
        var(--scout-motion-easing-standard, ease),
        color var(--scout-motion-duration-fast, 120ms) var(--scout-motion-easing-standard, ease);
    }
    .ctrl svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      fill: currentColor;
    }
    :host([size='condensed']) .ctrl svg {
      width: 14px;
      height: 14px;
    }

    /* Default chevron / page-number color */
    .ctrl:hover:not(:disabled):not([aria-current='page']) {
      background: var(--scout-interactive-background-hover);
    }
    .ctrl:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: var(--scout-focus-ring-offset);
    }
    .ctrl:active:not(:disabled):not([aria-current='page']) {
      background: var(--scout-interactive-background-pressed);
    }
    .ctrl:disabled {
      color: var(--scout-text-display-disabled, var(--scout-color-cool-gray-400));
      cursor: not-allowed;
      background: transparent;
    }

    /* Selected page */
    .ctrl[aria-current='page'] {
      background: var(--scout-text-interactive-primary);
      color: var(--scout-color-white);
    }
    .ctrl[aria-current='page']:focus-visible {
      outline-color: var(--scout-focus-ring-color);
    }

    /* Ellipsis */
    .ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: var(--_pg-control-size);
      height: var(--_pg-control-size);
      color: var(--scout-text-display-secondary);
      font-size: var(--_pg-fs);
      user-select: none;
    }

    :host([disabled]) {
      pointer-events: none;
      opacity: 0.5;
    }
  `;

  @property({ type: Number, reflect: true }) page = 1;
  @property({ type: Number, reflect: true, attribute: 'page-size' }) pageSize = 10;
  @property({ type: Number, reflect: true }) total = 0;
  @property({ attribute: 'page-size-options' }) pageSizeOptions = '[10,25,50,100]';
  @property({ type: String, reflect: true }) layout: PaginationLayout = 'both';
  @property({ type: String, reflect: true }) size: PaginationSize = 'default';
  @property({ type: Boolean, reflect: true }) disabled = false;

  private get _options(): number[] {
    try {
      const parsed = JSON.parse(this.pageSizeOptions);
      return Array.isArray(parsed) ? parsed.map(Number).filter((n) => n > 0) : [10, 25, 50];
    } catch {
      return [10, 25, 50];
    }
  }

  private get _totalPages(): number {
    return Math.max(1, Math.ceil(this.total / Math.max(1, this.pageSize)));
  }

  private _go(next: number) {
    const clamped = Math.min(this._totalPages, Math.max(1, next));
    if (clamped === this.page) return;
    this.page = clamped;
    this._emit();
  }

  private _onSizeChange = (e: Event) => {
    const detail = (e as CustomEvent<{ value: string }>).detail;
    const next = Number(detail?.value);
    if (!next || next === this.pageSize) return;
    // Preserve the first item shown, pick the page that contains it
    const firstItem = (this.page - 1) * this.pageSize + 1;
    this.pageSize = next;
    this.page = Math.max(1, Math.ceil(firstItem / next));
    this._emit();
  };

  private _emit() {
    this.dispatchEvent(
      new CustomEvent<{ page: number; pageSize: number }>('scout-pagination-change', {
        bubbles: true,
        composed: true,
        detail: { page: this.page, pageSize: this.pageSize },
      }),
    );
  }

  /**
   * Compute the visible page sequence with ellipses.
   * Always shows: first, last, current ± 1, and ellipses between gaps.
   */
  private _pageSequence(): Array<number | 'ellipsis'> {
    const total = this._totalPages;
    const current = this.page;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const out: Array<number | 'ellipsis'> = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) out.push('ellipsis');
    for (let p = start; p <= end; p++) out.push(p);
    if (end < total - 1) out.push('ellipsis');
    out.push(total);
    return out;
  }

  private _renderItemsDropdown() {
    const dd = document.createElement('scout-dropdown-select');
    dd.setAttribute('size', 'condensed');
    dd.setAttribute('value', String(this.pageSize));
    if (this.disabled) dd.setAttribute('disabled', '');
    for (const n of this._options) {
      const o = document.createElement('scout-dropdown-option');
      o.setAttribute('value', String(n));
      o.textContent = String(n);
      dd.appendChild(o);
    }
    dd.addEventListener('scout-dropdown-change', this._onSizeChange as EventListener);
    return html`
      <div class="items">
        <span>Items per page</span>
        ${dd}
        <span class="range">${this._rangeText()}</span>
      </div>
    `;
  }

  private _rangeText() {
    if (this.total <= 0) return '0 of 0';
    const first = (this.page - 1) * this.pageSize + 1;
    const last = Math.min(this.total, this.page * this.pageSize);
    return `${first}–${last} of ${this.total}`;
  }

  private _renderPageNumbers() {
    const total = this._totalPages;
    const seq = this._pageSequence();
    return html`
      <nav class="nav" role="navigation" aria-label="Pagination">
        <button
          class="ctrl"
          type="button"
          aria-label="Previous page"
          ?disabled=${this.disabled || this.page <= 1}
          @click=${() => this._go(this.page - 1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">${CHEVRON_LEFT}</svg>
        </button>
        ${seq.map((p) =>
          p === 'ellipsis'
            ? html`<span class="ellipsis" aria-hidden="true">…</span>`
            : html`<button
                class="ctrl"
                type="button"
                aria-label=${`Page ${p}`}
                aria-current=${p === this.page ? 'page' : nothing}
                ?disabled=${this.disabled}
                @click=${() => this._go(p)}
              >
                ${p}
              </button>`,
        )}
        <button
          class="ctrl"
          type="button"
          aria-label="Next page"
          ?disabled=${this.disabled || this.page >= total}
          @click=${() => this._go(this.page + 1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">${CHEVRON_RIGHT}</svg>
        </button>
      </nav>
    `;
  }

  render() {
    const showItems = this.layout === 'item-dropdown' || this.layout === 'both';
    const showPages = this.layout === 'page-numbers' || this.layout === 'both';
    return html`
      ${showItems ? this._renderItemsDropdown() : nothing}
      ${showPages ? this._renderPageNumbers() : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-pagination': ScoutPagination;
  }
}
