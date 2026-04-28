import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ProgressGaugeSize } from './types.js';

/**
 * `<scout-progress-gauge>` — circular progress indicator.
 *
 * Renders an SVG ring with a stroked base and a stroked fill. The ratio fills
 * clockwise from 12 o'clock. The percentage value is centered; an optional
 * label sits below.
 *
 * @element scout-progress-gauge
 *
 * @attr {number} value                                  - Current value, clamped to `[0, max]`.
 * @attr {number} max                                    - Maximum value (default `100`).
 * @attr {"small"|"medium"|"large"|"x-large"} size       - Outer dimension preset.
 * @attr label                                            - Optional label rendered below the percentage.
 *
 * @fires scout-progress-change - Bubbles, composed; detail = `{ value, max, ratio }`.
 */
@customElement('scout-progress-gauge')
export class ScoutProgressGauge extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: var(--scout-space-4);
      font-family: var(--scout-font-family-inter);
      --_pg-size: 64px;
      --_pg-stroke: 6px;
      --_pg-pct: var(--scout-font-size-14);
    }
    :host([size='small'])  { --_pg-size: 40px; --_pg-stroke: 4px; --_pg-pct: var(--scout-font-size-10); }
    :host([size='medium']) { --_pg-size: 64px; --_pg-stroke: 6px; --_pg-pct: var(--scout-font-size-14); }
    :host([size='large'])  { --_pg-size: 96px; --_pg-stroke: 8px; --_pg-pct: var(--scout-font-size-20); }
    :host([size='x-large']){ --_pg-size: 128px;--_pg-stroke: 10px;--_pg-pct: var(--scout-font-size-24); }

    .ring {
      position: relative;
      width: var(--_pg-size);
      height: var(--_pg-size);
    }
    svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    .base {
      fill: none;
      stroke: var(--scout-color-cool-gray-200);
      stroke-width: var(--_pg-stroke);
    }
    .fill {
      fill: none;
      stroke: var(--scout-text-interactive-primary);
      stroke-width: var(--_pg-stroke);
      stroke-linecap: round;
      transition: stroke-dashoffset var(--scout-motion-duration-base, 240ms)
        var(--scout-motion-easing-standard, ease);
    }
    .pct {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--_pg-pct);
      font-weight: var(--scout-font-weight-semibold);
      color: var(--scout-text-display-primary);
      font-variant-numeric: tabular-nums;
    }
    .label {
      font-size: var(--scout-font-size-12);
      color: var(--scout-text-display-secondary);
    }
  `;

  @property({ type: Number, reflect: true }) value = 0;
  @property({ type: Number, reflect: true }) max = 100;
  @property({ reflect: true }) size: ProgressGaugeSize = 'medium';
  @property() label = '';

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

  render() {
    // Use a normalized 0–100 viewBox; the radius accounts for the stroke so
    // the ring sits inside the box without clipping.
    const r = 45;
    const c = 2 * Math.PI * r;
    const dashOffset = c * (1 - this._ratio);
    const pct = Math.round(this._ratio * 100);
    return html`
      <div
        class="ring"
        role="progressbar"
        aria-valuenow=${String(this.value)}
        aria-valuemin="0"
        aria-valuemax=${String(this.max)}
        aria-label=${this.label || `${pct}%`}
      >
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle class="base" cx="50" cy="50" r=${r}></circle>
          <circle
            class="fill"
            cx="50"
            cy="50"
            r=${r}
            stroke-dasharray=${c}
            stroke-dashoffset=${dashOffset}
          ></circle>
        </svg>
        <span class="pct">${pct}%</span>
      </div>
      ${this.label ? html`<span class="label">${this.label}</span>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-progress-gauge': ScoutProgressGauge;
  }
}
