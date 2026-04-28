import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ScoutTab } from './scout-tab.js';

/**
 * `<scout-tabs>` — horizontal tab list for navigating between related groups
 * of content at the same hierarchy level.
 *
 * Manages a single-selected tab across child `<scout-tab>` items. Consumers
 * either read the selected `value` attribute or listen for `scout-tabs-change`
 * to render the corresponding panel.
 *
 * **Spec rule:** a tab list cannot have a single solo tab. The component logs
 * a console warning when only one tab is present so authors catch it early.
 *
 * @element scout-tabs
 *
 * @attr value - Currently-selected tab's value. Reflects to attribute.
 *
 * @slot - One or more `<scout-tab>` children. Minimum two.
 *
 * @fires scout-tabs-change - Bubbles, composed; detail = `{ value }`.
 */
@customElement('scout-tabs')
export class ScoutTabs extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--scout-font-family-inter);
    }
    .list {
      display: flex;
      align-items: stretch;
      gap: 0;
      border-bottom: var(--scout-border-width-1) solid var(--scout-border-secondary);
      overflow-x: auto;
      scrollbar-width: thin;
    }
  `;

  @property({ reflect: true }) value = '';

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('scout-tab-select', this._onTabSelect as EventListener);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('scout-tab-select', this._onTabSelect as EventListener);
  }

  private _onTabSelect = (e: CustomEvent<{ value: string }>) => {
    const next = e.detail.value;
    if (next === this.value) return;
    this.value = next;
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('scout-tabs-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  };

  /** Sync the selected attribute on every child to the current value. */
  private _syncChildren = () => {
    const tabs = this.querySelectorAll<ScoutTab>('scout-tab');
    if (tabs.length < 2) {
      // eslint-disable-next-line no-console
      console.warn(
        '[scout-tabs] A tab list must have at least 2 tabs. Use a different component (e.g., <scout-button>) for a single-action surface.',
      );
    }
    let resolved = this.value;
    if (!resolved && tabs[0]) resolved = tabs[0].value || (tabs[0].textContent ?? '').trim();
    tabs.forEach((t) => {
      const v = t.value || (t.textContent ?? '').trim();
      t.selected = v === resolved;
    });
    if (resolved !== this.value) this.value = resolved;
  };

  updated(changed: Map<string, unknown>) {
    if (changed.has('value')) this._syncChildren();
  }

  /** Re-sync whenever the slotted content changes. */
  private _onSlotChange = () => this._syncChildren();

  render() {
    return html`
      <div class="list" role="tablist">
        <slot @slotchange=${this._onSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-tabs': ScoutTabs;
  }
}
