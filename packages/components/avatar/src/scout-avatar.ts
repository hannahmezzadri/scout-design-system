import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@scout/notification-badge';
import type { AvatarColor, AvatarSize, AvatarTitleSize } from './types.js';

/**
 * `<scout-avatar>` — thumbnail representation of a person or entity.
 *
 * Renders a circular badge with initials. Supports a notification dot and
 * an optional name/title rendered next to the badge.
 *
 * @element scout-avatar
 *
 * @attr initials                          - 1–2 letter initials shown in the badge.
 * @attr {"small"|"medium"|"large"} size   - Badge size.
 * @attr {"blue"|"gray"|"knockout"} color  - Color treatment.
 * @attr notification                      - Renders a red dot indicator on the badge.
 * @attr {"medium"|"large"} title-size     - Size of the slotted title text.
 *
 * @slot title - Optional name or title rendered next to the badge.
 */
@customElement('scout-avatar')
export class ScoutAvatar extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-8);
      --_avatar-size: 32px;
      --_avatar-font-size: var(--scout-font-size-12);
      --_avatar-badge-size: 10px;
      --_avatar-title-font-size: var(--scout-font-size-14);
      --_avatar-title-font-weight: var(--scout-font-weight-semibold);
    }
    :host([size='small']) {
      --_avatar-size: 24px;
      --_avatar-font-size: var(--scout-font-size-10);
      --_avatar-badge-size: 8px;
    }
    :host([size='large']) {
      --_avatar-size: 40px;
      --_avatar-font-size: var(--scout-font-size-14);
      --_avatar-badge-size: 12px;
    }
    :host([title-size='large']) {
      --_avatar-title-font-size: var(--scout-font-size-16);
      --_avatar-title-font-weight: var(--scout-font-weight-semibold);
    }

    .badge {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--_avatar-size);
      height: var(--_avatar-size);
      border-radius: var(--scout-radius-999);
      font-family: var(--scout-font-family-inter);
      font-size: var(--_avatar-font-size);
      font-weight: var(--scout-font-weight-semibold);
      line-height: 1;
      flex-shrink: 0;
      user-select: none;
      letter-spacing: 0.02em;
    }

    /* Color variants — all token-driven */
    /* Blue: soft brand-tinted fill in light theme (subtle + info text) so
       the avatar reads as a chip alongside data; in dark theme the same
       subtle fill (blue.900) blends into the dark surface and the info
       text (blue.300) loses contrast against it, so we flip to the bolder
       brand fill (blue.400) with white initials. The result reads as a
       confident brand-blue avatar in both themes. */
    :host([color='blue']) .badge {
      background: var(--scout-fill-info-subtle);
      color: var(--scout-text-display-info);
    }
    :host-context([data-theme='dark']):host([color='blue']) .badge {
      background: var(--scout-fill-info-bold);
      color: var(--scout-text-inverse-primary);
    }
    :host([color='gray']) .badge {
      background: var(--scout-color-cool-gray-200);
      color: var(--scout-color-cool-gray-700);
    }
    :host([color='knockout']) .badge {
      background: var(--scout-surface-primary);
      color: var(--scout-text-display-primary);
      border: var(--scout-border-width-1) solid var(--scout-border-primary);
    }

    .initials {
      text-transform: uppercase;
    }

    /* Notification badge — composed from @scout/notification-badge */
    .notification {
      position: absolute;
      top: -2px;
      right: -2px;
      pointer-events: none;
    }

    /* Title slot */
    .title {
      font-family: var(--scout-font-family-inter);
      font-size: var(--_avatar-title-font-size);
      font-weight: var(--_avatar-title-font-weight);
      color: var(--scout-text-display-primary);
      line-height: var(--scout-font-line-height-21);
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
          ? html`<scout-notification-badge
              class="notification"
              size=${this.size === 'large' ? 'x-small' : 'xx-small'}
            ></scout-notification-badge>`
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
    'scout-avatar': ScoutAvatar;
  }
}
