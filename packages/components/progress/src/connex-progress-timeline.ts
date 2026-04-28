import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

const CHEVRON = svg`<path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>`;

/**
 * `<connex-progress-timeline>` — list of ordered events on a vertical timeline.
 *
 * Renders a left-rail line; each child `<connex-progress-timeline-item>` plants
 * a dot on the rail and exposes its own collapse/expand toggle. Content is
 * authored via the item's default slot — no shape constraints.
 *
 * @element connex-progress-timeline
 *
 * @slot - One or more `<connex-progress-timeline-item>` children.
 */
@customElement('connex-progress-timeline')
export class ConnexProgressTimeline extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--connex-font-family-inter);
      --_dot-size: 12px;
      --_rail-thickness: 2px;
      --_rail-color: var(--connex-color-cool-gray-200);
    }
    ::slotted(connex-progress-timeline-item) {
      display: block;
    }
  `;
  render() {
    return html`<slot></slot>`;
  }
}

/**
 * `<connex-progress-timeline-item>` — single entry on the timeline.
 *
 * @element connex-progress-timeline-item
 *
 * @attr title-text - Top-line title.
 * @attr subtitle   - Optional second line (e.g., timestamp, actor).
 * @attr expanded   - Reflects the open state. Default: false (collapsed).
 *
 * @slot - Content body, rendered when expanded.
 *
 * @fires connex-timeline-toggle - Bubbles, composed; detail = `{ expanded }`.
 */
@customElement('connex-progress-timeline-item')
export class ConnexProgressTimelineItem extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
      padding: 0 0 var(--connex-space-16) var(--connex-space-32);
      font-family: var(--connex-font-family-inter);
    }
    /* Left rail — drawn for every item; the parent timeline doesn't draw. */
    :host::before {
      content: '';
      position: absolute;
      left: 5px;
      top: 12px;
      bottom: 0;
      width: var(--_rail-thickness, 2px);
      background: var(--_rail-color, var(--connex-color-cool-gray-200));
    }
    :host(:last-of-type)::before { display: none; }
    /* Dot */
    :host::after {
      content: '';
      position: absolute;
      left: 0;
      top: 6px;
      width: var(--_dot-size, 12px);
      height: var(--_dot-size, 12px);
      border-radius: 50%;
      background: var(--connex-text-interactive-primary);
      border: var(--connex-border-width-2) solid var(--connex-surface-primary);
      box-shadow: 0 0 0 2px var(--connex-text-interactive-primary);
      z-index: 1;
    }

    .head {
      display: flex;
      align-items: flex-start;
      gap: var(--connex-space-12);
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
      font-size: var(--connex-font-size-14);
      font-weight: var(--connex-font-weight-semibold);
      color: var(--connex-text-display-primary);
    }
    .subtitle {
      font-size: var(--connex-font-size-12);
      color: var(--connex-text-display-secondary);
    }
    .toggle {
      appearance: none;
      background: transparent;
      border: none;
      border-radius: var(--connex-radius-4);
      width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--connex-text-display-secondary);
      cursor: pointer;
      flex-shrink: 0;
      transition: background var(--connex-motion-duration-fast, 120ms) ease,
        transform var(--connex-motion-duration-base, 240ms) ease;
    }
    .toggle:hover { background: var(--connex-interactive-background-hover); }
    .toggle:focus-visible {
      outline: var(--connex-focus-ring-width) solid var(--connex-focus-ring-color);
      outline-offset: var(--connex-focus-ring-offset);
    }
    :host([expanded]) .toggle { transform: rotate(180deg); }
    .toggle svg { width: 16px; height: 16px; }

    /* Smooth grid-row collapse — no max-height hack */
    .body {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows var(--connex-motion-duration-base, 240ms)
        var(--connex-motion-easing-standard, ease);
      margin-top: 0;
    }
    :host([expanded]) .body {
      grid-template-rows: 1fr;
      margin-top: var(--connex-space-8);
    }
    .body-inner {
      overflow: hidden;
      font-size: var(--connex-font-size-14);
      line-height: var(--connex-font-line-height-21);
      color: var(--connex-text-display-secondary);
    }
  `;

  @property({ attribute: 'title-text' }) titleText = '';
  @property() subtitle = '';
  @property({ type: Boolean, reflect: true }) expanded = false;

  private _toggle = () => {
    this.expanded = !this.expanded;
    this.dispatchEvent(
      new CustomEvent<{ expanded: boolean }>('connex-timeline-toggle', {
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
    'connex-progress-timeline': ConnexProgressTimeline;
    'connex-progress-timeline-item': ConnexProgressTimelineItem;
  }
}
