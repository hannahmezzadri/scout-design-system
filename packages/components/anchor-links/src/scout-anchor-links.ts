import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@scout/badge';
import type { AnchorLinkItem, AnchorLinksMode } from './types.js';

/**
 * `<scout-anchor-links>` — vertical menu that links to in-page sections.
 *
 * Two modes:
 *   - `auto-scroll`  → highlights the active tab as the user scrolls; clicking
 *                      a tab smoothly scrolls to its section.
 *   - `manual`       → click-only; the user explicitly selects the active tab.
 *
 * The component finds target sections via document.getElementById(id) for each
 * item and observes them with IntersectionObserver in auto-scroll mode. In
 * manual mode, clicks update the active state immediately.
 *
 * @element scout-anchor-links
 *
 * @attr {"auto-scroll"|"manual"} mode  - Highlight behavior.
 * @attr active                          - The currently-active item id.
 * @attr {string} scroll-root            - CSS selector for the scroll container; defaults to window.
 * @attr prevent-scroll                  - When set, clicking a tab does NOT scroll the target into view; instead the
 *                                          native `<a href="#id">` navigation runs. Use for sidebar-style page routers.
 *
 * @prop items - `AnchorLinkItem[]` — the menu items to render.
 *
 * @fires scout-anchor-change - Bubbles, composed; detail = `{ id }` whenever the active item changes.
 */
@customElement('scout-anchor-links')
export class ScoutAnchorLinks extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--scout-font-family-inter);
      width: 220px;
      max-width: 100%;
    }

    nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    a {
      position: relative;
      display: block;
      padding: var(--scout-space-8) var(--scout-space-12) var(--scout-space-8) var(--scout-space-16);
      font-size: var(--scout-font-size-14);
      line-height: var(--scout-font-line-height-21);
      font-weight: var(--scout-font-weight-regular);
      color: var(--scout-text-display-secondary);
      text-decoration: none;
      border-left: 2px solid transparent;
      border-radius: var(--scout-radius-2);
      cursor: pointer;
      user-select: none;
      transition: background var(--scout-motion-duration-fast, 120ms)
          var(--scout-motion-easing-standard, ease),
        color var(--scout-motion-duration-fast, 120ms) var(--scout-motion-easing-standard, ease),
        border-color var(--scout-motion-duration-fast, 120ms)
          var(--scout-motion-easing-standard, ease);
    }

    a:hover {
      background: var(--scout-interactive-background-brand-hover);
      color: var(--scout-text-display-primary);
    }
    a:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: var(--scout-focus-ring-offset);
    }
    a:active {
      background: var(--scout-interactive-background-brand-pressed);
    }

    /* Selected (active) state — left rail + interactive primary text */
    a[aria-current='true'] {
      color: var(--scout-text-interactive-primary);
      border-left-color: var(--scout-text-interactive-primary);
      font-weight: var(--scout-font-weight-semibold);
      background: var(--scout-fill-info-subtle);
    }

    /* Disabled */
    a[aria-disabled='true'] {
      color: var(--scout-text-display-disabled, var(--scout-color-cool-gray-400));
      cursor: not-allowed;
      pointer-events: none;
    }

    /* Layout for label + optional tag chip */
    a {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--scout-space-8);
    }
    .label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tag {
      flex-shrink: 0;
    }
  `;

  @property({ type: String, reflect: true }) mode: AnchorLinksMode = 'auto-scroll';
  @property({ type: String, reflect: true }) active = '';
  @property({ attribute: 'scroll-root' }) scrollRoot = '';
  @property({ type: Boolean, reflect: true, attribute: 'prevent-scroll' })
  preventScroll = false;
  @property({ attribute: false }) items: AnchorLinkItem[] = [];

  /** Maps each section id to the IntersectionObserverEntry that last reported. */
  @state() private _visibility = new Map<string, IntersectionObserverEntry>();

  private _observer?: IntersectionObserver;

  connectedCallback(): void {
    super.connectedCallback();
    queueMicrotask(() => this._setupObserver());
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('mode') || changed.has('items') || changed.has('scrollRoot')) {
      this._observer?.disconnect();
      this._setupObserver();
    }
  }

  /** Wire up IntersectionObserver in auto-scroll mode; no-op in manual. */
  private _setupObserver() {
    if (this.mode !== 'auto-scroll' || !this.items.length) return;
    const root = this.scrollRoot ? document.querySelector(this.scrollRoot) : null;
    this._observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) this._visibility.set(entry.target.id, entry);
        // Active = top-most section currently intersecting. If none, leave active alone.
        const visible = Array.from(this._visibility.values())
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) this._setActive(visible[0].target.id, /* fromObserver */ true);
      },
      {
        root: root ?? null,
        // Trigger when the section's top is roughly in the upper third of the viewport
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      },
    );
    for (const item of this.items) {
      const target = document.getElementById(item.id);
      if (target) this._observer.observe(target);
    }
  }

  private _setActive(id: string, fromObserver = false) {
    if (id === this.active) return;
    this.active = id;
    if (!fromObserver) {
      this.dispatchEvent(
        new CustomEvent<{ id: string }>('scout-anchor-change', {
          bubbles: true,
          composed: true,
          detail: { id },
        }),
      );
    }
  }

  private _onClick = (e: MouseEvent, item: AnchorLinkItem) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    if (!this.preventScroll) {
      // In-page anchor mode: smooth-scroll the target into view ourselves.
      e.preventDefault();
      const target = document.getElementById(item.id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // When preventScroll is true, fall through and let the native `<a href="#id">`
    // handle hash navigation — useful for sidebar / page-router consumers.
    this._setActive(item.id);
  };

  render() {
    return html`
      <nav aria-label="On-page navigation">
        ${this.items.map(
          (item) => html`
            <a
              href=${`#${item.id}`}
              aria-current=${item.id === this.active ? 'true' : 'false'}
              aria-disabled=${item.disabled ? 'true' : 'false'}
              tabindex=${item.disabled ? -1 : 0}
              @click=${(e: MouseEvent) => this._onClick(e, item)}
            >
              <span class="label">${item.label}</span>
              ${item.tag
                ? html`<scout-badge
                    class="tag"
                    type="warning"
                    emphasis="low"
                    size="condensed"
                  >${item.tag}</scout-badge>`
                : null}
            </a>
          `,
        )}
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-anchor-links': ScoutAnchorLinks;
  }
}
