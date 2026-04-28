import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { StepperOrientation, StepperState, StepperStep } from './types.js';

const CHECK   = svg`<path d="M5 10.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
const EXCLAIM = svg`<path d="M10 5v6m0 3v.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

/**
 * `<connex-progress-stepper>` — multi-step progress indicator.
 *
 * Renders the steps either horizontally (label + dot + connecting line) or
 * vertically (dot + line on the left, label + secondary text + tooltip on
 * the right). Steps are supplied as a JS array via the `steps` property.
 *
 * @element connex-progress-stepper
 *
 * @attr {"horizontal"|"vertical"} orientation - Stepper layout.
 *
 * @prop steps - `StepperStep[]` — minimum of 2. Each item has a `label`, `state`,
 *               and optional `secondary` and `tooltip`.
 */
@customElement('connex-progress-stepper')
export class ConnexProgressStepper extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--connex-font-family-inter);
      --_dot-size: 24px;
      --_line-thickness: 2px;
      --_line-base: var(--connex-color-cool-gray-200);
      --_line-fill: var(--connex-text-interactive-primary);
    }

    /* Horizontal layout — steps in a row, lines between */
    .h-row {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
      align-items: start;
      gap: 0;
    }
    .h-step {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--connex-space-8);
      padding: 0 var(--connex-space-8);
    }
    /* Connecting line — sits centered on the dot's vertical axis */
    .h-step:not(:last-child)::after {
      content: '';
      position: absolute;
      top: calc(var(--_dot-size) / 2 - var(--_line-thickness) / 2);
      left: calc(50% + var(--_dot-size) / 2);
      right: calc(-50% + var(--_dot-size) / 2);
      height: var(--_line-thickness);
      background: var(--_line-base);
    }
    .h-step.completed:not(:last-child)::after,
    .h-step.expired-completed:not(:last-child)::after,
    .h-step.last-completed:not(:last-child)::after,
    .h-step.in-progress:not(:last-child)::after {
      background: var(--_line-fill);
    }

    /* Vertical layout — dots in a column, line drawn through them */
    .v-col {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .v-step {
      position: relative;
      display: grid;
      grid-template-columns: var(--_dot-size) 1fr;
      gap: var(--connex-space-12);
      padding-bottom: var(--connex-space-16);
    }
    .v-step:not(:last-child)::after {
      content: '';
      position: absolute;
      left: calc(var(--_dot-size) / 2 - var(--_line-thickness) / 2);
      top: var(--_dot-size);
      bottom: 0;
      width: var(--_line-thickness);
      background: var(--_line-base);
    }
    .v-step.completed:not(:last-child)::after,
    .v-step.expired-completed:not(:last-child)::after,
    .v-step.last-completed:not(:last-child)::after,
    .v-step.in-progress:not(:last-child)::after {
      background: var(--_line-fill);
    }

    /* Dot / circle — shared across orientations */
    .dot {
      width: var(--_dot-size);
      height: var(--_dot-size);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: var(--connex-surface-primary);
      border: var(--_line-thickness) solid var(--connex-border-primary);
      color: var(--connex-text-display-secondary);
      font-size: var(--connex-font-size-12);
      font-weight: var(--connex-font-weight-semibold);
      position: relative;
      z-index: 1;
    }
    .dot svg { width: 60%; height: 60%; }

    /* === Per-state appearance === */
    .completed .dot,
    .last-completed .dot,
    .in-progress .dot {
      background: var(--connex-text-interactive-primary);
      border-color: var(--connex-text-interactive-primary);
      color: var(--connex-color-white);
    }
    .in-progress .dot {
      background: var(--connex-color-blue-100);
      color: var(--connex-text-interactive-primary);
      box-shadow: 0 0 0 4px var(--connex-color-blue-100);
    }
    .action-needed .dot {
      background: var(--connex-color-yellow-600);
      border-color: var(--connex-color-yellow-600);
      color: var(--connex-color-white);
    }
    .expired .dot {
      background: var(--connex-color-red-600);
      border-color: var(--connex-color-red-600);
      color: var(--connex-color-white);
    }
    .expired-completed .dot {
      background: var(--connex-color-cool-gray-700);
      border-color: var(--connex-color-cool-gray-700);
      color: var(--connex-color-white);
    }
    .last-awaiting .dot {
      background: var(--connex-surface-primary);
      border-style: dashed;
      border-color: var(--connex-text-interactive-primary);
      color: var(--connex-text-interactive-primary);
    }
    .last-completed .dot {
      width: calc(var(--_dot-size) + 4px);
      height: calc(var(--_dot-size) + 4px);
      box-shadow: 0 0 0 4px var(--connex-color-blue-100);
    }

    /* Labels */
    .label {
      font-size: var(--connex-font-size-12);
      font-weight: var(--connex-font-weight-medium);
      color: var(--connex-text-display-primary);
      text-align: center;
      line-height: var(--connex-font-line-height-15);
    }
    .secondary {
      font-size: var(--connex-font-size-10);
      color: var(--connex-text-display-secondary);
      line-height: var(--connex-font-line-height-15);
    }
    /* Vertical-step text block */
    .v-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-top: 2px;
    }
    .v-text .label { text-align: left; font-size: var(--connex-font-size-14); }

    /* Per-state label tints */
    .not-started .label { color: var(--connex-text-display-secondary); }
    .action-needed .label { color: var(--connex-color-yellow-600); }
    .expired .label,
    .expired-completed .label { color: var(--connex-text-display-secondary); }

    /* Tooltip-on-hover */
    [data-tooltip] { position: relative; }
    [data-tooltip]:hover::before,
    [data-tooltip]:focus-within::before {
      content: attr(data-tooltip);
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--connex-color-cool-gray-800, #2a3340);
      color: var(--connex-color-white);
      padding: var(--connex-space-4) var(--connex-space-8);
      border-radius: var(--connex-radius-4);
      font-size: var(--connex-font-size-12);
      white-space: nowrap;
      z-index: 100;
      pointer-events: none;
    }
  `;

  @property({ reflect: true }) orientation: StepperOrientation = 'horizontal';
  @property({ attribute: false }) steps: StepperStep[] = [];

  /** Glyph rendered inside the dot for a given state. */
  private _glyph(state: StepperState, index: number) {
    switch (state) {
      case 'completed':
      case 'expired-completed':
      case 'last-completed':
        return html`<svg viewBox="0 0 20 20">${CHECK}</svg>`;
      case 'action-needed':
      case 'expired':
        return html`<svg viewBox="0 0 20 20">${EXCLAIM}</svg>`;
      case 'in-progress':
      case 'not-started':
      case 'last-awaiting':
      default:
        return html`${index + 1}`;
    }
  }

  private _renderHorizontal() {
    return html`
      <div class="h-row">
        ${this.steps.map(
          (s, i) => html`
            <div class=${`h-step ${s.state}`} role="listitem">
              <span class="dot" data-tooltip=${s.tooltip || nothing}>
                ${this._glyph(s.state, i)}
              </span>
              <span class="label">${s.label}</span>
              ${s.secondary ? html`<span class="secondary">${s.secondary}</span>` : nothing}
            </div>
          `,
        )}
      </div>
    `;
  }

  private _renderVertical() {
    return html`
      <div class="v-col">
        ${this.steps.map(
          (s, i) => html`
            <div class=${`v-step ${s.state}`} role="listitem">
              <span class="dot" data-tooltip=${s.tooltip || nothing}>
                ${this._glyph(s.state, i)}
              </span>
              <div class="v-text">
                <span class="label">${s.label}</span>
                ${s.secondary ? html`<span class="secondary">${s.secondary}</span>` : nothing}
              </div>
            </div>
          `,
        )}
      </div>
    `;
  }

  render() {
    return html`
      <div role="list" aria-label="Progress steps">
        ${this.orientation === 'vertical' ? this._renderVertical() : this._renderHorizontal()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-progress-stepper': ConnexProgressStepper;
  }
}
