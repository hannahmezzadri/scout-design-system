import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ConnexSegment } from './connex-segment.js';

/**
 * `<connex-segmented-control>` — pill-style group of mutually-exclusive
 * segments. Use when the user must pick exactly one of two to five short
 * options that fit on one line; for richer choice sets use radios or tabs.
 *
 * Anatomy: rounded container + N `<connex-segment>` children. The selected
 * segment lifts onto a white pill; the rest sit on a cool-gray track.
 *
 * @element connex-segmented-control
 *
 * @attr value                                  - Selected segment's value. Reflects to attribute.
 * @attr {"default"|"condensed"} size           - Density preset.
 * @attr disabled                                - Disables every child segment.
 *
 * @slot - One or more `<connex-segment>` children. Minimum two.
 *
 * @fires connex-segmented-change - Bubbles, composed; detail = `{ value }`.
 */
@customElement('connex-segmented-control')
export class ConnexSegmentedControl extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      font-family: var(--connex-font-family-inter);
      --_seg-pad: 2px;
    }
    :host([size='condensed']) { --_seg-pad: 2px; }
    :host([disabled]) { opacity: 0.5; pointer-events: none; }

    .track {
      display: inline-flex;
      align-items: stretch;
      gap: 2px;
      padding: var(--_seg-pad);
      background: var(--connex-color-cool-gray-100);
      border-radius: var(--connex-radius-8);
    }
  `;

  @property({ reflect: true }) value = '';
  @property({ reflect: true }) size: 'default' | 'condensed' = 'default';
  @property({ type: Boolean, reflect: true }) disabled = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('connex-segment-select', this._onSelect as EventListener);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('connex-segment-select', this._onSelect as EventListener);
  }

  private _onSelect = (e: CustomEvent<{ value: string }>) => {
    const next = e.detail.value;
    if (next === this.value) return;
    this.value = next;
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('connex-segmented-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  };

  /** Sync `selected` on every child to the current value. */
  private _syncChildren = () => {
    const segs = this.querySelectorAll<ConnexSegment>('connex-segment');
    if (segs.length < 2) {
      // eslint-disable-next-line no-console
      console.warn('[connex-segmented-control] needs at least 2 segments.');
    }
    let resolved = this.value;
    if (!resolved && segs[0]) {
      resolved = segs[0].value || (segs[0].textContent ?? '').trim();
    }
    segs.forEach((s) => {
      const v = s.value || (s.textContent ?? '').trim();
      s.selected = v === resolved;
      if (this.disabled) s.setAttribute('disabled', '');
    });
    if (resolved !== this.value) this.value = resolved;
  };

  updated(changed: Map<string, unknown>) {
    if (changed.has('value') || changed.has('disabled')) this._syncChildren();
  }

  private _onSlotChange = () => this._syncChildren();

  render() {
    return html`
      <div class="track" role="radiogroup">
        <slot @slotchange=${this._onSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-segmented-control': ConnexSegmentedControl;
  }
}
