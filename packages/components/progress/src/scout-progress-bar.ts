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
    .title {
      display: block;
      font-size: var(--scout-font-size-14);
      font-weight: var(--scout-font-weight-medium);
      color: var(--scout-text-display-primary);
      margin-bottom: var(--scout-space-4);
    }
    .labels {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--scout-space-12);
      margin-bottom: var(--scout-space-4);
      font-size: var(--scout-font-size-12);
      color: var(--scout-text-display-secondary);
    }
    /* When the title moves into the labels row (secondary text is present),
       the left side becomes the primary label — bump it back to the title's
       size and weight so it reads as the label, not as caption. */
    .labels .left.is-title {
      font-size: var(--scout-font-size-14);
      font-weight: var(--scout-font-weight-medium);
      color: var(--scout-text-display-primary);
    }
    .labels .right { font-variant-numeric: tabular-nums; }
    .secondary {
      display: block;
      font-size: var(--scout-font-size-12);
      line-height: var(--scout-font-line-height-18);
      color: var(--scout-text-display-secondary);
      margin-bottom: var(--scout-space-4);
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
      background: var(--scout-text-interactive-primary);
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
    // When there's secondary text, promote the title into the labels row so
    // it sits inline with the percentage; secondary text drops below.
    const titleInLabels = !!this.titleText && !!secondary;
    const labelLeft = titleInLabels ? this.titleText : (auto?.left || '');
    const showLabels = labelLeft || right;
    return html`
      ${this.titleText && !titleInLabels
        ? html`<span class="title">${this.titleText}</span>`
        : nothing}
      ${showLabels
        ? html`<div class="labels">
            <span class="left ${titleInLabels ? 'is-title' : ''}">${labelLeft}</span>
            <span class="right">${right}</span>
          </div>`
        : nothing}
      ${secondary
        ? html`<span class="secondary">${secondary}</span>`
        : nothing}
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
