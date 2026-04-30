import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

const CHEVRON = svg`<path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>`;

/**
 * `<scout-progress-timeline>` — list of ordered events on a vertical timeline.
 *
 * Renders a left-rail line; each child `<scout-progress-timeline-item>` plants
 * a dot on the rail and exposes its own collapse/expand toggle. Content is
 * authored via the item's default slot — no shape constraints.
 *
 * @element scout-progress-timeline
 *
 * @slot - One or more `<scout-progress-timeline-item>` children.
 */
@customElement('scout-progress-timeline')
export class ScoutProgressTimeline extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--scout-font-family-inter);
      --_dot-size: 12px;
      --_rail-thickness: 2px;
      --_rail-color: var(--scout-color-cool-gray-200);
    }
    ::slotted(scout-progress-timeline-item) {
      display: block;
    }
  `;
  render() {
    return html`<slot></slot>`;
  }
}

/**
 * `<scout-progress-timeline-item>` — single entry on the timeline.
 *
 * @element scout-progress-timeline-item
 *
 * @attr title-text - Top-line title.
 * @attr subtitle   - Optional second line (e.g., timestamp, actor).
 * @attr expanded   - Reflects the open state. Default: false (collapsed).
 *
 * @slot - Content body, rendered when expanded.
 *
 * @fires scout-timeline-toggle - Bubbles, composed; detail = `{ expanded }`.
 */
@customElement('scout-progress-timeline-item')
export class ScoutProgressTimelineItem extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
      padding: 0 0 var(--scout-space-16) var(--scout-space-32);
      font-family: var(--scout-font-family-inter);
    }
    /* Left rail — runs the full height of every item so it visually
       touches each notch from above and below. The dot covers the rail
       where it intersects, so the eye reads a continuous gray bar. The
       first item starts the rail at the dot (no rail above the first
       notch); the last item ends the rail at the dot (no rail below). */
    :host::before {
      content: '';
      position: absolute;
      box-sizing: border-box;
      left: calc(var(--_dot-size, 12px) / 2 - var(--_rail-thickness, 2px) / 2);
      top: 0;
      bottom: 0;
      width: var(--_rail-thickness, 2px);
      background: var(--_rail-color, var(--scout-color-cool-gray-200));
    }
    :host(:first-of-type)::before { top: 12px; }
    :host(:last-of-type)::before {
      bottom: auto;
      height: 12px;
    }
    :host(:only-of-type)::before { display: none; }
    /* Dot */
    :host::after {
      content: '';
      position: absolute;
      box-sizing: border-box;
      left: 0;
      top: 6px;
      width: var(--_dot-size, 12px);
      height: var(--_dot-size, 12px);
      border-radius: 50%;
      background: var(--scout-text-interactive-primary);
      border: var(--scout-border-width-2) solid var(--scout-surface-primary);
      box-shadow: 0 0 0 2px var(--scout-text-interactive-primary);
      z-index: 1;
    }

    .head {
      display: flex;
      align-items: flex-start;
      gap: var(--scout-space-12);
      cursor: pointer;
      user-select: none;
    }
    .titles {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .title {
      font-size: var(--scout-font-size-14);
      font-weight: var(--scout-font-weight-semibold);
      color: var(--scout-text-display-primary);
    }
    .subtitle {
      font-size: var(--scout-font-size-12);
      color: var(--scout-text-display-secondary);
    }
    .toggle {
      appearance: none;
      background: transparent;
      border: none;
      border-radius: var(--scout-radius-4);
      width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--scout-text-display-secondary);
      cursor: pointer;
      flex-shrink: 0;
      transition: background var(--scout-motion-duration-fast, 120ms) ease,
        transform var(--scout-motion-duration-base, 240ms) ease;
    }
    .toggle:hover { background: var(--scout-interactive-background-hover); }
    .toggle:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: var(--scout-focus-ring-offset);
    }
    :host([expanded]) .toggle { transform: rotate(180deg); }
    .toggle svg { width: 16px; height: 16px; }

    /* Smooth grid-row collapse — no max-height hack */
    .body {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows var(--scout-motion-duration-base, 240ms)
        var(--scout-motion-easing-standard, ease);
      margin-top: 0;
    }
    :host([expanded]) .body {
      grid-template-rows: 1fr;
      margin-top: var(--scout-space-8);
    }
    .body-inner {
      overflow: hidden;
      font-size: var(--scout-font-size-14);
      line-height: var(--scout-font-line-height-21);
      color: var(--scout-text-display-secondary);
    }
  `;

  @property({ attribute: 'title-text' }) titleText = '';
  @property() subtitle = '';
  @property({ type: Boolean, reflect: true }) expanded = false;

  private _toggle = () => {
    this.expanded = !this.expanded;
    this.dispatchEvent(
      new CustomEvent<{ expanded: boolean }>('scout-timeline-toggle', {
        bubbles: true,
        composed: true,
        detail: { expanded: this.expanded },
      }),
    );
  };

  render() {
    return html`
      <div class="head" @click=${this._toggle}>
        <div class="titles">
          <span class="title">${this.titleText}</span>
          ${this.subtitle ? html`<span class="subtitle">${this.subtitle}</span>` : null}
        </div>
        <button
          class="toggle"
          type="button"
          aria-expanded=${String(this.expanded)}
          aria-label=${this.expanded ? 'Collapse' : 'Expand'}
        >
          <svg viewBox="0 0 20 20">${CHEVRON}</svg>
        </button>
      </div>
      <div class="body" aria-hidden=${String(!this.expanded)}>
        <div class="body-inner"><slot></slot></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-progress-timeline': ScoutProgressTimeline;
    'scout-progress-timeline-item': ScoutProgressTimelineItem;
  }
}
