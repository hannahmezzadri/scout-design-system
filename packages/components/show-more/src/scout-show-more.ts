import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ShowMoreSize } from './types.js';

const CHEVRON = svg`<path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>`;

/**
 * `<scout-show-more>` — collapse / expand toggle used inside cards, tiles,
 * and data-table rows to reveal additional content.
 *
 * Pure control: it owns the label + chevron and emits a state-change event.
 * Consumers wire that event to whatever truncation, height-clamp, or row
 * disclosure they manage. The component does NOT clip your content.
 *
 * Anatomy: label + control (chevron). The chevron rotates 180° when expanded.
 *
 * @element scout-show-more
 *
 * @attr expanded                                    - Reflects the open state.
 * @attr {"default"|"condensed"} size                - Density preset.
 * @attr show-label                                  - Label rendered when collapsed. Default "Show more".
 * @attr hide-label                                  - Label rendered when expanded. Default "Show less".
 * @attr disabled                                    - Disables the toggle; skips tab order.
 *
 * @fires scout-show-more-toggle - Bubbles, composed; detail = `{ expanded }`.
 */
@customElement('scout-show-more')
export class ScoutShowMore extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      font-family: var(--scout-font-family-inter);
      --_sm-fs: var(--scout-typography-body-font-size);
      --_sm-lh: var(--scout-typography-body-line-height);
      --_sm-py: var(--scout-space-4);
      --_sm-px: 0px;
      --_sm-icon: 16px;
    }
    :host([size='condensed']),
    :host-context([data-density='condensed']) {
      --_sm-fs: var(--scout-typography-body-small-font-size);
      --_sm-lh: var(--scout-typography-body-small-line-height);
      --_sm-py: 2px;
      --_sm-icon: 14px;
    }

    .toggle {
      appearance: none;
      background: transparent;
      border: none;
      padding: var(--_sm-py) var(--_sm-px);
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-4);
      font-family: inherit;
      font-size: var(--_sm-fs);
      line-height: var(--_sm-lh);
      font-weight: var(--scout-font-weight-regular);
      line-height: var(--scout-font-line-height-21);
      color: var(--scout-text-interactive-primary);
      border-radius: var(--scout-radius-2);
      cursor: pointer;
      transition: color var(--scout-motion-duration-fast, 120ms)
          var(--scout-motion-easing-standard, ease),
        background var(--scout-motion-duration-fast, 120ms)
          var(--scout-motion-easing-standard, ease);
    }
    .toggle:hover:not(:disabled) {
      text-decoration: underline;
    }
    .toggle:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: var(--scout-focus-ring-offset);
    }
    .toggle:active:not(:disabled) {
      color: var(--scout-interactive-background-brand-strong-pressed);
    }
    .toggle:disabled {
      color: var(--scout-text-display-disabled, var(--scout-color-cool-gray-400));
      cursor: not-allowed;
    }

    .icon {
      width: var(--_sm-icon);
      height: var(--_sm-icon);
      flex-shrink: 0;
      transition: transform var(--scout-motion-duration-base, 240ms)
        var(--scout-motion-easing-standard, ease);
    }
    :host([expanded]) .icon { transform: rotate(180deg); }

    @media (prefers-reduced-motion: reduce) {
      .toggle, .icon { transition: none; }
    }
  `;

  @property({ type: Boolean, reflect: true }) expanded = false;
  @property({ reflect: true }) size: ShowMoreSize = 'default';
  @property({ attribute: 'show-label' }) showLabel = 'Show more';
  @property({ attribute: 'hide-label' }) hideLabel = 'Show less';
  @property({ type: Boolean, reflect: true }) disabled = false;

  private _toggle = () => {
    if (this.disabled) return;
    this.expanded = !this.expanded;
    this.dispatchEvent(
      new CustomEvent<{ expanded: boolean }>('scout-show-more-toggle', {
        bubbles: true,
        composed: true,
        detail: { expanded: this.expanded },
      }),
    );
  };

  render() {
    const label = this.expanded ? this.hideLabel : this.showLabel;
    return html`
      <button
        class="toggle"
        type="button"
        part="toggle"
        ?disabled=${this.disabled}
        aria-expanded=${String(this.expanded)}
        @click=${this._toggle}
      >
        <span>${label}</span>
        <svg class="icon" viewBox="0 0 20 20" aria-hidden="true">${CHEVRON}</svg>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-show-more': ScoutShowMore;
  }
}
