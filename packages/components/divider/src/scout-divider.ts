import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DividerColor, DividerOrientation, DividerWeight } from './types.js';

/**
 * `<scout-divider>` — visual separator between content sections.
 *
 * Anatomy: a single line drawn with a token-driven color and weight. Use to
 * group related content, mark accordion / data-table boundaries, or split
 * sections of a long form.
 *
 * @element scout-divider
 *
 * @attr {"1"|"2"} weight                                - Line thickness in pixels.
 * @attr {"default"|"light"|"knockout"} color            - `default` is the standard secondary border;
 *                                                          `light` is the more subtle cool-gray.100; `knockout`
 *                                                          is white-on-dark for use against dark surfaces.
 * @attr {"horizontal"|"vertical"} orientation           - Direction of the line.
 */
@customElement('scout-divider')
export class ScoutDivider extends LitElement {
  static styles = css`
    :host {
      display: block;
      /* Color tokens per variant — picked at the host level so both
         orientations share one source of truth. Default sits one step
         darker than border-secondary for stronger separation. */
      --_div-color: var(--scout-border-primary);
      --_div-weight: var(--scout-border-width-1);
    }
    :host([color='light'])    { --_div-color: var(--scout-color-cool-gray-200); }
    /* Knockout reads against the opposite end of the page palette: closer
       to white in the light theme, closer to black in the dark theme. */
    :host([color='knockout']) { --_div-color: var(--scout-color-alpha-white-80); }
    :host([weight='2'])       { --_div-weight: var(--scout-border-width-2); }

    /* Dark theme — border-secondary collapses into surface-primary in dark
       and border-primary collapses into the dark card surface (cool-gray.700),
       so we promote the default divider to cool-gray.500. That keeps it
       readable on both the page chrome and inside raised surfaces. */
    :host-context([data-theme='dark']) {
      --_div-color: var(--scout-color-cool-gray-500);
    }
    :host-context([data-theme='dark']):host([color='light'])    { --_div-color: var(--scout-color-cool-gray-700); }
    :host-context([data-theme='dark']):host([color='knockout']) { --_div-color: var(--scout-color-alpha-80); }

    /* Horizontal — full-width rule that takes its own line in flow. */
    :host(:not([orientation='vertical'])) {
      width: 100%;
      height: var(--_div-weight);
      background: var(--_div-color);
    }

    /* Vertical — column rule that stretches to its parent's height. Inline-
       block so it sits next to siblings; consumers control height via CSS. */
    :host([orientation='vertical']) {
      display: inline-block;
      width: var(--_div-weight);
      height: 100%;
      min-height: 1em;
      background: var(--_div-color);
      vertical-align: stretch;
    }
  `;

  @property({ reflect: true }) weight: DividerWeight = '1';
  @property({ reflect: true }) color: DividerColor = 'default';
  @property({ reflect: true }) orientation: DividerOrientation = 'horizontal';

  render() {
    // Pure CSS rule — host element is the line itself; no inner DOM needed.
    // role="separator" + aria-orientation make the divider announceable.
    if (this.getAttribute('role') !== 'separator') {
      this.setAttribute('role', 'separator');
    }
    this.setAttribute('aria-orientation', this.orientation);
    return html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-divider': ScoutDivider;
  }
}
