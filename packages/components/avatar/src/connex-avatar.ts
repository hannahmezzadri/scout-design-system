import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@connex/notification-badge';
import type { AvatarColor, AvatarSize, AvatarTitleSize } from './types.js';

/**
 * `<connex-avatar>` — thumbnail representation of a person or entity.
 *
 * Renders a circular badge with initials. Supports a notification dot and
 * an optional name/title rendered next to the badge.
 *
 * @element connex-avatar
 *
 * @attr initials                          - 1–2 letter initials shown in the badge.
 * @attr {"small"|"medium"|"large"} size   - Badge size.
 * @attr {"blue"|"gray"|"knockout"} color  - Color treatment.
 * @attr notification                      - Renders a red dot indicator on the badge.
 * @attr {"medium"|"large"} title-size     - Size of the slotted title text.
 *
 * @slot title - Optional name or title rendered next to the badge.
 */
@customElement('connex-avatar')
export class ConnexAvatar extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--connex-space-8);
      --_avatar-size: 32px;
      --_avatar-font-size: var(--connex-font-size-12);
      --_avatar-badge-size: 10px;
      --_avatar-title-font-size: var(--connex-font-size-14);
      --_avatar-title-font-weight: var(--connex-font-weight-medium);
    }
    :host([size='small']) {
      --_avatar-size: 24px;
      --_avatar-font-size: var(--connex-font-size-10);
      --_avatar-badge-size: 8px;
    }
    :host([size='large']) {
      --_avatar-size: 40px;
      --_avatar-font-size: var(--connex-font-size-14);
      --_avatar-badge-size: 12px;
    }
    :host([title-size='large']) {
      --_avatar-title-font-size: var(--connex-font-size-16);
      --_avatar-title-font-weight: var(--connex-font-weight-semibold);
    }

    .badge {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--_avatar-size);
      height: var(--_avatar-size);
      border-radius: var(--connex-radius-999);
      font-family: var(--connex-font-family-inter);
      font-size: var(--_avatar-font-size);
      font-weight: var(--connex-font-weight-semibold);
      line-height: 1;
      flex-shrink: 0;
      user-select: none;
      letter-spacing: 0.02em;
    }

    /* Color variants — all token-driven */
    :host([color='blue']) .badge {
      background: var(--connex-text-interactive-primary);
      color: var(--connex-color-white);
    }
    :host([color='gray']) .badge {
      background: var(--connex-color-cool-gray-200);
      color: var(--connex-color-cool-gray-700);
    }
    :host([color='knockout']) .badge {
      background: var(--connex-surface-primary);
      color: var(--connex-text-display-primary);
      border: var(--connex-border-width-1) solid var(--connex-border-primary);
    }

    .initials {
      text-transform: uppercase;
    }

    /* Notification badge — composed from @connex/notification-badge */
    .notification {
      position: absolute;
      top: -2px;
      right: -2px;
      pointer-events: none;
    }

    /* Title slot */
    .title {
      font-family: var(--connex-font-family-inter);
      font-size: var(--_avatar-title-font-size);
      font-weight: var(--_avatar-title-font-weight);
      color: var(--connex-text-display-primary);
      line-height: var(--connex-font-line-height-21);
    }
    .title[hidden] {
      display: none;
    }
  `;

  @property() initials = '';
  @property({ type: String, reflect: true }) size: AvatarSize = 'medium';
  @property({ type: String, reflect: true }) color: AvatarColor = 'blue';
  @property({ type: Boolean, reflect: true }) notification = false;
  @property({ type: String, reflect: true, attribute: 'title-size' })
  titleSize: AvatarTitleSize = 'medium';

  @state() private _hasTitle = false;

  private _onTitleSlotChange = (e: Event) => {
    this._hasTitle = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };

  render() {
    const ariaLabel = this.initials ? `Avatar: ${this.initials}` : 'Avatar';
    return html`
      <div class="badge" role="img" aria-label=${ariaLabel}>
        <span class="initials">${this.initials}</span>
        ${this.notification
          ? html`<connex-notification-badge
              class="notification"
              size=${this.size === 'large' ? 'x-small' : 'xx-small'}
            ></connex-notification-badge>`
          : nothing}
      </div>
      <span class="title" ?hidden=${!this._hasTitle}>
        <slot name="title" @slotchange=${this._onTitleSlotChange}></slot>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'connex-avatar': ConnexAvatar;
  }
}
