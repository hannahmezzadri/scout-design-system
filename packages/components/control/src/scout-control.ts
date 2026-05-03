import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ControlColor, ControlSize, ControlType } from './types.js';

/* Hero Icons paths inlined so the component is self-contained. */
const ICONS: Record<ControlType, ReturnType<typeof svg>> = {
  'x-close': svg`<path d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"/>`,
  'x-clear': svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm6.97-2.78a.75.75 0 0 1 1.06 0L12 10.94l1.72-1.72a.75.75 0 1 1 1.06 1.06L13.06 12l1.72 1.72a.75.75 0 1 1-1.06 1.06L12 13.06l-1.72 1.72a.75.75 0 1 1-1.06-1.06L10.94 12l-1.72-1.72a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>`,
  'arrow-left': svg`<path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L7.06 11h12.69a.75.75 0 0 1 0 1.5H7.06l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd"/>`,
  'arrow-right': svg`<path fill-rule="evenodd" d="M12.22 5.22a.75.75 0 0 1 1.06 0l6 6a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 1 1-1.06-1.06l4.72-4.72H4.25a.75.75 0 0 1 0-1.5h12.69l-4.72-4.72a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>`,
  'arrow-left-double': svg`<path fill-rule="evenodd" d="M13.78 5.22a.75.75 0 0 1 0 1.06L7.81 12.25H21a.75.75 0 0 1 0 1.5H7.81l5.97 5.97a.75.75 0 1 1-1.06 1.06l-7.25-7.25a.75.75 0 0 1 0-1.06l7.25-7.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M7.78 5.22a.75.75 0 0 1 0 1.06L1.81 12.25H3a.75.75 0 0 1 0 1.5H1.81l5.97 5.97a.75.75 0 1 1-1.06 1.06l-7.25-7.25a.75.75 0 0 1 0-1.06l7.25-7.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd"/>`,
  'arrow-right-double': svg`<path fill-rule="evenodd" d="M10.22 5.22a.75.75 0 0 1 1.06 0l7.25 7.25a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 1 1-1.06-1.06l5.97-5.97H3a.75.75 0 0 1 0-1.5h13.19l-5.97-5.97a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M16.22 5.22a.75.75 0 0 1 1.06 0l7.25 7.25a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 1 1-1.06-1.06l5.97-5.97H23a.75.75 0 0 1 0-1.5h-1.19l-5.97-5.97a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>`,
  'chevron-up': svg`<path fill-rule="evenodd" d="M11.47 7.72a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 0 1-1.06-1.06l7.5-7.5Z" clip-rule="evenodd"/>`,
  'chevron-down': svg`<path fill-rule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clip-rule="evenodd"/>`,
  'chevron-left': svg`<path fill-rule="evenodd" d="M15.78 19.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L8.81 11.25l6.97 6.97a.75.75 0 0 1 0 1.06Z" clip-rule="evenodd"/>`,
  'chevron-right': svg`<path fill-rule="evenodd" d="M8.22 4.72a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.97-6.97-6.97-6.97a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>`,
  tooltip: svg`<path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/>`,
  trash: svg`<path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452ZM10.5 9a.75.75 0 0 1 .75.75v8.5a.75.75 0 0 1-1.5 0v-8.5A.75.75 0 0 1 10.5 9Zm3 0a.75.75 0 0 1 .75.75v8.5a.75.75 0 0 1-1.5 0v-8.5a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd"/>`,
  kebab: svg`<path fill-rule="evenodd" d="M10.5 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clip-rule="evenodd"/>`,
};

const DEFAULT_LABELS: Record<ControlType, string> = {
  'x-close': 'Close',
  'x-clear': 'Clear',
  'arrow-left': 'Previous',
  'arrow-right': 'Next',
  'arrow-left-double': 'First',
  'arrow-right-double': 'Last',
  'chevron-up': 'Up',
  'chevron-down': 'Down',
  'chevron-left': 'Previous',
  'chevron-right': 'Next',
  tooltip: 'More info',
  trash: 'Delete',
  kebab: 'More options',
};

/**
 * `<scout-control>` — interactive control that triggers a single action with
 * just an icon (no accompanying text). Used everywhere in the system that
 * needs a small icon-only trigger: alert close buttons, table-row delete,
 * pagination arrows, kebab menus, etc.
 *
 * @element scout-control
 *
 * @attr {ControlType} type - One of the built-in icon types.
 * @attr {"default"|"condensed"} size - Density preset.
 * @attr {"primary"|"secondary"|"critical"} color - Color treatment. `critical` is only valid for `type="trash"`.
 * @attr disabled - Disables interaction; skips tab order.
 * @attr aria-label-override - Overrides the auto-derived ARIA label.
 *
 * @fires click - Native button click event.
 */
@customElement('scout-control')
export class ScoutControl extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      --_control-size: 32px;
      --_control-icon-size: 20px;
      --_control-fg: var(--scout-icon-interactive-primary);
      --_control-fg-hover: var(--scout-color-cool-gray-900);
      /* Hover background for the default treatment — semantic interactive
         hover token (theme-aware). */
      --_control-bg-hover: var(--scout-interactive-background-hover);
    }
    :host([size='condensed']),
    :host-context([data-density='condensed']) {
      --_control-size: 24px;
      --_control-icon-size: 16px;
    }

    /* Critical variant — for type="trash" and other destructive triggers.
       Hover only changes the background; the icon color stays put so the
       trash glyph reads the same in resting and hovered states. */
    :host([color='critical']) {
      --_control-fg: var(--scout-icon-interactive-delete);
      --_control-fg-hover: var(--scout-icon-interactive-delete);
      --_control-bg-hover: var(--scout-interactive-background-critical-hover);
    }

    .control {
      appearance: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--_control-size);
      height: var(--_control-size);
      padding: 0;
      background: transparent;
      border: none;
      border-radius: var(--scout-radius-4);
      color: var(--_control-fg);
      cursor: pointer;
      transition:
        background var(--scout-motion-duration-hover)
          var(--scout-motion-easing-gentle),
        color var(--scout-motion-duration-hover)
          var(--scout-motion-easing-gentle);
      flex-shrink: 0;
    }
    .control:hover:not(:disabled) {
      background: var(--_control-bg-hover);
      color: var(--_control-fg-hover);
    }
    .control:active:not(:disabled) {
      background: var(--scout-interactive-background-pressed);
    }
    .control:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: 1px;
    }
    .control:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .icon {
      width: var(--_control-icon-size);
      height: var(--_control-icon-size);
      display: block;
    }

    @media (prefers-reduced-motion: reduce) {
      .control { transition: none; }
    }
  `;

  @property({ type: String, reflect: true }) type: ControlType = 'x-close';
  @property({ type: String, reflect: true }) size: ControlSize = 'default';
  @property({ type: String, reflect: true }) color: ControlColor = 'primary';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ attribute: 'aria-label-override' }) ariaLabelOverride: string | null = null;

  render() {
    const label = this.ariaLabelOverride || DEFAULT_LABELS[this.type];
    const viewBox = this.type === 'x-clear' ? '0 0 24 24' : '0 0 24 24';
    return html`
      <button
        part="button"
        class="control"
        type="button"
        aria-label=${label}
        ?disabled=${this.disabled}
      >
        <svg class="icon" viewBox=${viewBox} fill="currentColor" aria-hidden="true">
          ${ICONS[this.type]}
        </svg>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-control': ScoutControl;
  }
}
