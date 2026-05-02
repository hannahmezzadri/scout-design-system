import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { NotificationBadgeSize } from './types.js';

/**
 * `<scout-notification-badge>` — small visual indicator that draws attention
 * to new activity without interrupting the user's workflow.
 *
 * Often paired with avatars, icons, or buttons. The "stroke" border
 * (`--cnx-notification-stroke-color`, default = page background) gives a
 * "punched out" effect when the badge sits on top of another element.
 *
 * @element scout-notification-badge
 *
 * @attr {"xx-small"|"x-small"|"small"|"medium"} size - Badge size. xx-small and x-small are dot-only; small and medium can show 1–2 digit numbers.
 *
 * @slot - Optional number to display (1–2 digits). Ignored at xx-small and x-small.
 */
@customElement('scout-notification-badge')
export class ScoutNotificationBadge extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      --_nb-base: var(--scout-fill-critical-bold);
      --_nb-text: var(--scout-color-white);
      --_nb-stroke-w: 2px;
      --_nb-stroke-c: var(--cnx-notification-stroke-color, var(--scout-surface-page));
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: content-box;
      background: var(--_nb-base);
      color: var(--_nb-text);
      border: var(--_nb-stroke-w) solid var(--_nb-stroke-c);
      border-radius: var(--scout-radius-999);
      font-family: var(--scout-font-family-inter);
      font-weight: var(--scout-font-weight-semibold);
      line-height: 1;
      padding: 0;
      flex-shrink: 0;
    }

    /* Dot sizes (no number) */
    :host([size='xx-small']) .badge {
      width: 6px;
      height: 6px;
      font-size: 0;
    }
    :host([size='x-small']) .badge {
      width: 8px;
      height: 8px;
      font-size: 0;
    }

    /* Numbered sizes */
    :host([size='small']) .badge {
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      font-size: 10px;
    }
    :host([size='medium']) .badge,
    :host(:not([size])) .badge {
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      font-size: 12px;
    }

    /* Hide slot content for dot sizes */
    :host([size='xx-small']) ::slotted(*),
    :host([size='x-small']) ::slotted(*) {
      display: none;
    }
  `;

  @property({ type: String, reflect: true }) size: NotificationBadgeSize = 'medium';

  render() {
    return html`
      <span class="badge" role="status" aria-label="Notification">
        <slot></slot>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-notification-badge': ScoutNotificationBadge;
  }
}
