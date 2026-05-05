import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ScoutSegment } from './scout-segment.js';

/**
 * `<scout-segmented-control>` — pill-style group of mutually-exclusive
 * segments. Use when the user must pick exactly one of two to five short
 * options that fit on one line; for richer choice sets use radios or tabs.
 *
 * Anatomy: rounded container + N `<scout-segment>` children. The selected
 * segment lifts onto a white pill; the rest sit on a cool-gray track.
 *
 * @element scout-segmented-control
 *
 * @attr value                                  - Selected segment's value. Reflects to attribute.
 * @attr {"default"|"condensed"} size           - Density preset.
 * @attr disabled                                - Disables every child segment.
 *
 * @slot - One or more `<scout-segment>` children. Minimum two.
 *
 * @fires scout-segmented-change - Bubbles, composed; detail = `{ value }`.
 */
@customElement('scout-segmented-control')
export class ScoutSegmentedControl extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      font-family: var(--scout-font-family-inter);
      --_seg-pad: 2px;
    }
    :host([size='condensed']) { --_seg-pad: 2px; }
    :host-context([data-density='condensed']) { --_seg-pad: 2px; }
    :host([disabled]) { opacity: 0.5; pointer-events: none; }

    .track {
      display: inline-flex;
      align-items: stretch;
      gap: 2px;
      padding: var(--_seg-pad);
      /* Theme-aware track surface — flips to a deeper neutral in dark mode
         so the lifted selected segment (surface-primary) keeps a clear
         contrast step against the well behind it. */
      background: var(--scout-surface-page);
      border: var(--scout-border-width-1) var(--scout-stroke-solid)
        var(--scout-border-primary);
      border-radius: var(--scout-radius-8);
    }
  `;

  @property({ reflect: true }) value = '';
  @property({ reflect: true }) size: 'default' | 'condensed' = 'default';
  @property({ type: Boolean, reflect: true }) disabled = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('scout-segment-select', this._onSelect as EventListener);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('scout-segment-select', this._onSelect as EventListener);
  }

  private _onSelect = (e: CustomEvent<{ value: string }>) => {
    const next = e.detail.value;
    if (next === this.value) return;
    this.value = next;
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('scout-segmented-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  };

  /** Sync `selected` on every child to the current value. */
  private _syncChildren = () => {
    const segs = this.querySelectorAll<ScoutSegment>('scout-segment');
    if (segs.length < 2) {
      // eslint-disable-next-line no-console
      console.warn('[scout-segmented-control] needs at least 2 segments.');
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
    'scout-segmented-control': ScoutSegmentedControl;
  }
}
