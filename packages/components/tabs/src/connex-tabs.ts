import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ConnexTab } from './connex-tab.js';

/**
 * `<connex-tabs>` — horizontal tab list for navigating between related groups
 * of content at the same hierarchy level.
 *
 * Manages a single-selected tab across child `<connex-tab>` items. Consumers
 * either read the selected `value` attribute or listen for `connex-tabs-change`
 * to render the corresponding panel.
 *
 * **Spec rule:** a tab list cannot have a single solo tab. The component logs
 * a console warning when only one tab is present so authors catch it early.
 *
 * @element connex-tabs
 *
 * @attr value - Currently-selected tab's value. Reflects to attribute.
 *
 * @slot - One or more `<connex-tab>` children. Minimum two.
 *
 * @fires connex-tabs-change - Bubbles, composed; detail = `{ value }`.
 */
@customElement('connex-tabs')
export class ConnexTabs extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--connex-font-family-inter);
    }
    .list {
      display: flex;
      align-items: stretch;
      gap: 0;
      border-bottom: var(--connex-border-width-1) solid var(--connex-border-secondary);
      overflow-x: auto;
      scrollbar-width: thin;
    }
  `;

  @property({ reflect: true }) value = '';

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('connex-tab-select', this._onTabSelect as EventListener);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('connex-tab-select', this._onTabSelect as EventListener);
  }

  private _onTabSelect = (e: CustomEvent<{ value: string }>) => {
    const next = e.detail.value;
    if (next === this.value) return;
    this.value = next;
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('connex-tabs-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  };

  /** Sync the selected attribute on every child to the current value. */
  private _syncChildren = () => {
    const tabs = this.querySelectorAll<ConnexTab>('connex-tab');
    if (tabs.length < 2) {
      // eslint-disable-next-line no-console
      console.warn(
        '[connex-tabs] A tab list must have at least 2 tabs. Use a different component (e.g., <connex-button>) for a single-action surface.',
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
    'connex-tabs': ConnexTabs;
  }
}
