import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@scout-ds/link';
import type { DataPairOrientation, DataPairVariant } from './types.js';

/**
 * `<scout-data-pair>` — display a label paired with its value, with optional
 * meta data and a follow-up link.
 *
 * Anatomy: label + description + optional meta + optional link. The
 * description is the slotted content (default slot); meta and link are slots
 * too so consumers can compose any markup (a `<scout-link>`, a button, an
 * external `<a>`, etc.).
 *
 * @element scout-data-pair
 *
 * @attr label                                       - Field label.
 * @attr {"vertical"} orientation                      - Layout direction. Always stacks label above description.
 * @attr {"default"|"stat"} variant                    - `default` renders the description at body size; `stat`
 *                                                       promotes it to heading-2 typography for prominent metrics.
 *
 * @slot      - Default slot: the description / value.
 * @slot meta - Optional meta data (e.g., timestamp, secondary detail).
 * @slot link - Optional link or action that follows the description.
 */
@customElement('scout-data-pair')
export class ScoutDataPair extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--scout-font-family-inter);
    }

    /* Label stacked above the description. */
    .pair {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .label {
      font-size: var(--scout-typography-body-small-font-size);
      line-height: var(--scout-typography-body-small-line-height);
      font-weight: var(--scout-font-weight-semibold);
      color: var(--scout-text-display-primary);
    }

    .body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .description {
      font-size: var(--scout-typography-body-font-size);
      line-height: var(--scout-typography-body-line-height);
      color: var(--scout-text-display-primary);
      word-break: break-word;
    }
    /* Stat variant — promote the description to heading-2 typography so a
       data-pair can stand in as a labelled metric (count, balance, KPI).
       Tighten the label → description gap to space.0 so the metric reads
       as a single unit. */
    :host([variant='stat']) .pair {
      gap: var(--scout-space-0);
    }
    :host([variant='stat']) .description {
      font-family: var(--scout-typography-heading-2-font-family);
      font-weight: var(--scout-typography-heading-2-font-weight);
      font-size: var(--scout-typography-heading-2-font-size);
      line-height: var(--scout-typography-heading-2-line-height);
    }
    .meta {
      font-size: var(--scout-typography-body-small-font-size);
      line-height: var(--scout-typography-body-small-line-height);
      color: var(--scout-text-display-secondary);
    }
    .meta[hidden],
    .link[hidden] { display: none; }

    .link {
      margin-top: var(--scout-space-4);
      font-size: var(--scout-font-size-12);
    }
  `;

  @property() label = '';
  @property({ reflect: true }) orientation: DataPairOrientation = 'vertical';
  @property({ reflect: true }) variant: DataPairVariant = 'default';

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
    'scout-data-pair': ScoutDataPair;
  }
}
