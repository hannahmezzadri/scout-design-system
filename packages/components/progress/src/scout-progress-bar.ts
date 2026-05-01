import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ProgressBarDisplay } from './types.js';

/**
 * `<scout-progress-bar>` — linear progress indicator.
 *
 * Anatomy: optional title above, optional left/right labels under the title,
 * and a horizontal track with a fill that animates to `value`.
 *
 * @element scout-progress-bar
 *
 * @attr title-text                                       - Optional title label rendered above the bar.
 * @attr {number} value                                   - Current value, clamped to `[0, max]`.
 * @attr {number} max                                     - Maximum value (default `100`).
 * @attr left-label                                       - Optional left-side caption (e.g., "$1,250 paid").
 * @attr right-label                                      - Optional right-side caption (e.g., "of $5,000").
 * @attr {"number"|"percentage"|"bar-only"} display       - Auto-readout shown if no left/right labels are set:
 *                                                          number ("12 / 20"), percentage ("60%"), or bar-only.
 *
 * @fires scout-progress-change - Bubbles, composed; detail = `{ value, max, ratio }`. Fired when value or max changes.
 */
@customElement('scout-progress-bar')
export class ScoutProgressBar extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--scout-font-family-inter);
      --_pb-track-h: 8px;
    }
    .title,
    .title-only {
      display: block;
      font-size: var(--scout-font-size-14);
      font-weight: var(--scout-font-weight-semibold);
      color: var(--scout-text-display-primary);
      margin-bottom: var(--scout-space-4);
    }
    .labels {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: var(--scout-space-12);
      margin-bottom: var(--scout-space-4);
      font-size: var(--scout-font-size-12);
      line-height: 1;
      color: var(--scout-text-display-secondary);
    }
    .labels .left,
    .labels .right {
      line-height: 1;
      display: inline-flex;
      align-items: baseline;
    }
    /* When the title moves into the labels row (secondary text is present),
       the left side becomes the primary label — bump it back to the title's
       size and weight so it reads as the label, not as caption. The right
       side matches the same font-size so left and right read on the same
       visual line. */
    .labels .left.is-title {
      font-size: var(--scout-font-size-14);
      font-weight: var(--scout-font-weight-semibold);
      color: var(--scout-text-display-primary);
    }
    .labels:has(.left.is-title) .right {
      font-size: var(--scout-font-size-14);
    }
    .labels .right { font-variant-numeric: tabular-nums; }
    .secondary {
      display: block;
      font-size: var(--scout-font-size-12);
      line-height: var(--scout-font-line-height-18);
      color: var(--scout-text-display-secondary);
      margin-bottom: var(--scout-space-4);
    }
    /* When secondary text shares a row with the right readout, match its
       line metrics exactly so both texts sit on the same baseline. */
    .secondary.inline {
      display: inline;
      line-height: 1;
      margin-bottom: 0;
    }

    .track {
      width: 100%;
      height: var(--_pb-track-h);
      background: var(--scout-color-cool-gray-200);
      border-radius: 999px;
      overflow: hidden;
    }
    .fill {
      height: 100%;
      background: var(--scout-color-teal-500);
      border-radius: 999px;
      transition: width var(--scout-motion-duration-base, 240ms)
        var(--scout-motion-easing-standard, ease);
    }
  `;

  @property({ attribute: 'title-text' }) titleText = '';
  @property({ type: Number, reflect: true }) value = 0;
  @property({ type: Number, reflect: true }) max = 100;
  @property({ attribute: 'left-label' }) leftLabel = '';
  @property({ attribute: 'right-label' }) rightLabel = '';
  @property({ reflect: true }) display: ProgressBarDisplay = 'percentage';

  private get _ratio(): number {
    const m = Math.max(0.0001, this.max);
    return Math.min(1, Math.max(0, this.value / m));
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('value') || changed.has('max')) {
      this.dispatchEvent(
        new CustomEvent('scout-progress-change', {
          bubbles: true,
          composed: true,
          detail: { value: this.value, max: this.max, ratio: this._ratio },
        }),
      );
    }
  }

  private _autoReadout(): { left: string; right: string } | null {
    if (this.display === 'bar-only') return null;
    if (this.display === 'number') return { left: '', right: `${this.value} / ${this.max}` };
    return { left: '', right: `${Math.round(this._ratio * 100)}%` };
  }

  render() {
    const auto = this._autoReadout();
    const right = this.rightLabel || auto?.right || '';
    const secondary = this.leftLabel; // "secondary text" beneath the label
    // When there's secondary text, the title takes its own row and the
    // right readout drops down to share a row with the secondary text —
    // keeping the right readout close to the bar. Otherwise the title and
    // right readout share a single labels row.
    return html`
      ${secondary
        ? html`
            ${this.titleText
              ? html`<span class="title-only">${this.titleText}</span>`
              : nothing}
            <div class="labels">
              <span class="secondary inline">${secondary}</span>
              <span class="right">${right}</span>
            </div>
          `
        : (this.titleText || right
          ? html`<div class="labels">
              <span class="left ${this.titleText ? 'is-title' : ''}">${this.titleText || (auto?.left || '')}</span>
              <span class="right">${right}</span>
            </div>`
          : nothing)}
      <div
        class="track"
        role="progressbar"
        aria-valuenow=${String(this.value)}
        aria-valuemin="0"
        aria-valuemax=${String(this.max)}
        aria-label=${this.titleText || 'Progress'}
      >
        <div class="fill" style=${`width: ${this._ratio * 100}%`}></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-progress-bar': ScoutProgressBar;
  }
}
