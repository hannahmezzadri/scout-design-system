import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DataPairOrientation } from './types.js';

/**
 * `<connex-data-pair>` — display a label paired with its value, with optional
 * meta data and a follow-up link.
 *
 * Anatomy: label + description + optional meta + optional link. The
 * description is the slotted content (default slot); meta and link are slots
 * too so consumers can compose any markup (a `<connex-link>`, a button, an
 * external `<a>`, etc.).
 *
 * @element connex-data-pair
 *
 * @attr label                                       - Field label.
 * @attr {"vertical"|"horizontal"} orientation        - Layout direction. `vertical` (default) stacks label
 *                                                     above description; `horizontal` puts the label inline to
 *                                                     the left.
 *
 * @slot      - Default slot: the description / value.
 * @slot meta - Optional meta data (e.g., timestamp, secondary detail).
 * @slot link - Optional link or action that follows the description.
 */
@customElement('connex-data-pair')
export class ConnexDataPair extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--connex-font-family-inter);
    }

    /* Vertical (default): label stacked above the description. */
    .pair {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    /* Horizontal: label sits to the left, description to the right. */
    :host([orientation='horizontal']) .pair {
      flex-direction: row;
      align-items: baseline;
      gap: var(--connex-space-12);
    }
    :host([orientation='horizontal']) .label {
      flex-shrink: 0;
      min-width: 140px;
    }

    .label {
      font-size: var(--connex-font-size-12);
      font-weight: var(--connex-font-weight-semibold);
      color: var(--connex-text-display-secondary);
      line-height: var(--connex-font-line-height-18);
    }

    .body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    :host([orientation='horizontal']) .body { flex: 1; }

    .description {
      font-size: var(--connex-font-size-14);
      line-height: var(--connex-font-line-height-21);
      color: var(--connex-text-display-primary);
      word-break: break-word;
    }
    .meta {
      font-size: var(--connex-font-size-12);
      line-height: var(--connex-font-line-height-18);
      color: var(--connex-text-display-secondary);
    }
    .meta[hidden],
    .link[hidden] { display: none; }

    .link {
      margin-top: var(--connex-space-4);
      font-size: var(--connex-font-size-12);
    }
  `;

  @property() label = '';
  @property({ reflect: true }) orientation: DataPairOrientation = 'vertical';

  /** Slot-presence flags for `meta` / `link` so empty slots don't render gaps. */
  private _hasMeta = false;
  private _hasLink = false;

  private _onMetaSlot = (e: Event) => {
    this._hasMeta = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
    this.requestUpdate();
  };
  private _onLinkSlot = (e: Event) => {
    this._hasLink = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
    this.requestUpdate();
  };

  render() {
    return html`
      <div class="pair">
        ${this.label ? html`<span class="label">${this.label}</span>` : nothing}
        <div class="body">
          <span class="description"><slot></slot></span>
          <span class="meta" ?hidden=${!this._hasMeta}>
            <slot name="meta" @slotchange=${this._onMetaSlot}></slot>
          </span>
          <span class="link" ?hidden=${!this._hasLink}>
            <slot name="link" @slotchange=${this._onLinkSlot}></slot>
          </span>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-data-pair': ConnexDataPair;
  }
}
