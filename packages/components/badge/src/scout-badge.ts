import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { BadgeEmphasis, BadgeSize, BadgeType } from './types.js';

/* Prescriptive icons — only the four status types have prescribed icons.
 * Neutral and Neutral-knockout never auto-render an icon. */
const PRESCRIBED_ICON: Partial<Record<BadgeType, ReturnType<typeof svg>>> = {
  informational: svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.732 2.923.305-.158a.75.75 0 0 1 .67 1.34l-.32.165c-1.146.573-2.437-.463-2.126-1.706l.732-2.923-.305.158a.75.75 0 1 1-.67-1.34l.32-.165ZM12 8.25a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" clip-rule="evenodd"/>`,
  success: svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd"/>`,
  warning: svg`<path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>`,
  critical: svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm9.75-3.75a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>`,
  'ai-summary': svg`<path d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z"/>`,
};

/**
 * `<scout-badge>` — small label conveying status, category, or count.
 *
 * @element scout-badge
 *
 * @attr {"informational"|"neutral"|"neutral-knockout"|"success"|"warning"|"critical"} type - Badge type.
 * @attr {"high"|"low"} emphasis - Visual weight. Ignored for `neutral-knockout`.
 * @attr {"default"|"condensed"} size - Density. Icons are disallowed at `condensed`.
 * @attr icon - When set on the four status types at default size, auto-renders the prescribed status icon.
 *
 * @slot - Default slot: the badge label.
 * @slot icon-custom - Optional custom icon (overrides the prescribed icon when set).
 */
@customElement('scout-badge')
export class ScoutBadge extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      --_badge-padding-block: 2px;
      --_badge-padding-inline: var(--scout-space-8);
      --_badge-font-size: var(--scout-font-size-12);
      --_badge-line-height: var(--scout-font-line-height-15);
      --_badge-icon-size: 12px;
      --_badge-gap: var(--scout-space-4);
    }
    :host([size='condensed']) {
      --_badge-padding-block: 1px;
      --_badge-padding-inline: var(--scout-space-4);
      --_badge-font-size: var(--scout-font-size-10);
      --_badge-line-height: 14px;
      --_badge-icon-size: 10px;
    }
    :host-context([data-density='condensed']) {
      --_badge-padding-block: 1px;
      --_badge-padding-inline: var(--scout-space-4);
      --_badge-font-size: var(--scout-font-size-10);
      --_badge-line-height: 14px;
      --_badge-icon-size: 10px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: var(--_badge-gap);
      padding: var(--_badge-padding-block) var(--_badge-padding-inline);
      font-family: var(--scout-font-family-inter);
      font-size: var(--_badge-font-size);
      line-height: var(--_badge-line-height);
      font-weight: var(--scout-font-weight-semibold);
      border-radius: var(--scout-radius-4);
      white-space: nowrap;
      border: var(--scout-border-width-1) solid transparent;
    }

    /* === Type × Emphasis colors === */

    /* Informational */
    :host([type='informational'][emphasis='high']) .badge {
      background: var(--scout-text-interactive-primary);
      color: var(--scout-color-cool-gray-50);
    }
    :host([type='informational'][emphasis='low']) .badge,
    :host([type='informational']:not([emphasis])) .badge {
      background: var(--scout-fill-info-subtle);
      color: var(--scout-text-display-info);
    }
    /* Dark mode — text-display-info (blue.300) on blue.900 has weak
       contrast. Bump text to blue.200 so the chip stays readable. */
    :host-context([data-theme='dark']):host([type='informational'][emphasis='low']) .badge,
    :host-context([data-theme='dark']):host([type='informational']:not([emphasis])) .badge {
      color: var(--scout-color-blue-200);
    }

    /* Neutral — light theme defaults. In dark theme the chip would lose
       contrast against the page (cool-gray.900) so we flip the fill +
       text per emphasis level via :host-context overrides below. */
    :host([type='neutral'][emphasis='high']) .badge {
      background: var(--scout-color-cool-gray-700);
      color: var(--scout-color-cool-gray-50);
    }
    :host([type='neutral'][emphasis='low']) .badge,
    :host([type='neutral']:not([emphasis])) .badge,
    :host(:not([type])) .badge {
      background: var(--scout-color-cool-gray-200);
      color: var(--scout-color-cool-gray-700);
    }
    :host-context([data-theme='dark']):host([type='neutral'][emphasis='high']) .badge {
      /* Bumps from .700 to .500 so the high-emphasis chip lifts off the
         dark page surface (cool-gray.900) instead of merging into it. */
      background: var(--scout-color-cool-gray-500);
      color: var(--scout-color-cool-gray-50);
    }
    :host-context([data-theme='dark']):host([type='neutral'][emphasis='low']) .badge,
    :host-context([data-theme='dark']):host([type='neutral']:not([emphasis])) .badge,
    :host-context([data-theme='dark']):host(:not([type])) .badge {
      /* Mid-tone chip: dark enough to sit on the page, light enough to
         read against. Text bumps to .200 for legibility. */
      background: var(--scout-color-cool-gray-700);
      color: var(--scout-color-cool-gray-200);
    }

    /* Neutral knockout — borderless white chip with gray text in light
       theme. In dark theme the always-white fill reads as a hard punch
       through the page; soften to cool-gray.100 so the chip still
       knockouts but doesn't shout. */
    :host([type='neutral-knockout']) .badge {
      background: var(--scout-fill-always-white);
      color: var(--scout-color-cool-gray-900);
      border-color: transparent;
    }
    /* Dark-mode neutral-knockout splits emphasis levels:
       - Low: transparent fill + subtle border so the chip recedes into
         the page (a "ghost" chip for tagging-style use).
       - High: cool-gray.100 fill keeps a soft knockout identity
         without the harshness of pure white. */
    :host-context([data-theme='dark']):host([type='neutral-knockout'][emphasis='low']) .badge,
    :host-context([data-theme='dark']):host([type='neutral-knockout']:not([emphasis])) .badge {
      background: transparent;
      color: var(--scout-color-cool-gray-300);
      border-color: var(--scout-color-cool-gray-600);
    }
    :host-context([data-theme='dark']):host([type='neutral-knockout'][emphasis='high']) .badge {
      background: var(--scout-color-cool-gray-100);
      color: var(--scout-color-cool-gray-700);
    }

    /* Success */
    :host([type='success'][emphasis='high']) .badge {
      background: var(--scout-interactive-background-success-strong);
      color: var(--scout-color-cool-gray-50);
    }
    :host([type='success'][emphasis='low']) .badge,
    :host([type='success']:not([emphasis])) .badge {
      background: var(--scout-fill-success-subtle);
      color: var(--scout-text-display-success);
    }
    :host-context([data-theme='dark']):host([type='success'][emphasis='low']) .badge,
    :host-context([data-theme='dark']):host([type='success']:not([emphasis])) .badge {
      color: var(--scout-color-green-200);
    }

    /* Warning */
    :host([type='warning'][emphasis='high']) .badge {
      background: var(--scout-fill-warning-bold);
      color: var(--scout-color-cool-gray-50);
    }
    :host([type='warning'][emphasis='low']) .badge,
    :host([type='warning']:not([emphasis])) .badge {
      background: var(--scout-fill-warning-subtle);
      color: var(--scout-text-display-warning);
    }
    :host-context([data-theme='dark']):host([type='warning'][emphasis='low']) .badge,
    :host-context([data-theme='dark']):host([type='warning']:not([emphasis])) .badge {
      color: var(--scout-color-yellow-200);
    }

    /* Critical */
    :host([type='critical'][emphasis='high']) .badge {
      background: var(--scout-interactive-background-critical-strong-hover);
      color: var(--scout-color-cool-gray-50);
    }
    :host([type='critical'][emphasis='low']) .badge,
    :host([type='critical']:not([emphasis])) .badge {
      background: var(--scout-fill-critical-subtle);
      color: var(--scout-text-display-critical);
    }
    :host-context([data-theme='dark']):host([type='critical'][emphasis='low']) .badge,
    :host-context([data-theme='dark']):host([type='critical']:not([emphasis])) .badge {
      color: var(--scout-color-red-200);
    }

    /* AI summary — purple, the system's convention for AI-generated content */
    :host([type='ai-summary'][emphasis='high']) .badge {
      background: var(--scout-fill-ai-bold);
      color: var(--scout-color-cool-gray-50);
    }
    :host([type='ai-summary'][emphasis='low']) .badge,
    :host([type='ai-summary']:not([emphasis])) .badge {
      background: var(--scout-fill-ai-subtle);
      color: var(--scout-color-purple-700);
    }
    /* Dark mode — purple-700 text on purple-900 bg has almost no contrast.
       Bump text to purple-200 so the chip stays readable. */
    :host-context([data-theme='dark']):host([type='ai-summary'][emphasis='low']) .badge,
    :host-context([data-theme='dark']):host([type='ai-summary']:not([emphasis])) .badge {
      color: var(--scout-color-purple-200);
    }

    .icon,
    ::slotted([slot='icon-custom']) {
      width: var(--_badge-icon-size);
      height: var(--_badge-icon-size);
      flex-shrink: 0;
    }
  `;

  @property({ type: String, reflect: true }) type: BadgeType = 'neutral';
  @property({ type: String, reflect: true }) emphasis: BadgeEmphasis = 'low';
  @property({ type: String, reflect: true }) size: BadgeSize = 'default';
  @property({ type: Boolean, reflect: true }) icon = false;

  @state() private _hasCustomIcon = false;

  private _onCustomIconSlot = (e: Event) => {
    this._hasCustomIcon =
      (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  };

  render() {
    // Render the prescribed icon when:
    //   - size is default (icons are disallowed at condensed)
    //   - the consumer hasn't slotted a custom icon
    //   - the type has a prescribed icon (informational, success, warning, critical, ai-summary)
    //   - the consumer explicitly opted in via the `icon` attribute.
    const showPrescribed =
      this.size !== 'condensed' &&
      !this._hasCustomIcon &&
      this.type in PRESCRIBED_ICON &&
      this.icon;

    const showCustomSlot = this.size !== 'condensed';

    return html`
      <span class="badge">
        ${showCustomSlot
          ? html`<slot name="icon-custom" @slotchange=${this._onCustomIconSlot}></slot>`
          : nothing}
        ${showPrescribed
          ? html`<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              ${PRESCRIBED_ICON[this.type]}
            </svg>`
          : nothing}
        <slot></slot>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-badge': ScoutBadge;
  }
}
