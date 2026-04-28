import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * `<connex-overlay>` — semi-transparent scrim that dims page content behind a
 * dialog, drawer, or other modal surface.
 *
 * Renders fixed to the viewport at z-index `overlay` (just below `modal`).
 * Click fires `connex-overlay-click` so the parent can close the dialog.
 *
 * @element connex-overlay
 *
 * @attr open - When set, renders the scrim. Without it, the host is `display: none`.
 *
 * @fires connex-overlay-click - Bubbling, composed; fired when the scrim is clicked.
 */
@customElement('connex-overlay')
export class ConnexOverlay extends LitElement {
  static styles = css`
    :host {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 1000; /* matches token z-index.overlay */
      background: var(--connex-surface-scrim);
      animation: cnx-overlay-in var(--connex-motion-duration-base)
        var(--connex-motion-easing-enter) both;
    }
    :host([open]) {
      display: block;
    }
    @keyframes cnx-overlay-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) {
      :host { animation: none; }
    }
  `;

  @property({ type: Boolean, reflect: true }) open = false;

  private _onClick = () => {
    this.dispatchEvent(
      new CustomEvent('connex-overlay-click', { bubbles: true, composed: true }),
    );
  };

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('click', this._onClick);
  }

  render() {
    return html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-overlay': ConnexOverlay;
  }
}
