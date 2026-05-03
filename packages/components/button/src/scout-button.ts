import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ButtonSize, ButtonType, ButtonVariant } from './types.js';

/**
 * `<scout-button>` — clickable element that triggers an action or event.
 *
 * Use buttons for important actions like submitting a form, committing a change,
 * or moving to the next step. The button is form-associated via ElementInternals
 * so `type="submit"` and `type="reset"` work inside native `<form>` elements.
 *
 * @element scout-button
 *
 * @attr {"primary"|"secondary"|"tertiary"|"action"|"critical"|"critical-tertiary"} variant - Visual hierarchy.
 * @attr {"default"|"condensed"} size - Density preset matching the page's `[data-density]`.
 * @attr {"button"|"submit"|"reset"} type - Form-association behavior.
 * @attr disabled - Disables interaction; skips tab order.
 * @attr knockout - White-on-dark treatment for buttons sitting on dark / saturated surfaces.
 * @attr flush - Tertiary-only — drops the left/right padding so the label sits flush with surrounding text.
 * @attr loading - Shows a spinner and sets `aria-busy="true"`.
 *
 * @slot icon-leading - Icon rendered before the label (e.g. plus, search).
 * @slot - Label content (default slot).
 * @slot icon-trailing - Icon rendered after the label (e.g. arrow-right).
 *
 * @csspart button - The internal native `<button>` element. Style via `scout-button::part(button)`.
 */
@customElement('scout-button')
export class ScoutButton extends LitElement {
  static formAssociated = true;

  static styles = css`
    :host {
      display: inline-block;
      /* Default size tokens */
      --_cnx-button-padding-block: var(--scout-space-8);
      --_cnx-button-padding-inline: var(--scout-space-16);
      --_cnx-button-font-size: var(--scout-font-size-14);
      --_cnx-button-min-height: 36px;
      --_cnx-button-icon-size: 16px;
    }
    :host([size='condensed']),
    :host-context([data-density='condensed']) {
      --_cnx-button-padding-block: var(--scout-space-4);
      --_cnx-button-padding-inline: var(--scout-space-12);
      --_cnx-button-font-size: var(--scout-font-size-12);
      --_cnx-button-min-height: 28px;
      --_cnx-button-icon-size: 14px;
    }

    .button {
      appearance: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--scout-space-8);
      width: 100%;
      min-height: var(--_cnx-button-min-height);
      padding: var(--_cnx-button-padding-block) var(--_cnx-button-padding-inline);
      font-family: var(--scout-font-family-inter);
      font-size: var(--_cnx-button-font-size);
      font-weight: var(--scout-font-weight-semibold);
      line-height: 1;
      border: var(--scout-border-width-1) solid transparent;
      border-radius: var(--scout-radius-4);
      cursor: pointer;
      white-space: nowrap;
      user-select: none;
      transition:
        background var(--scout-motion-duration-fast) var(--scout-motion-easing-standard),
        border-color var(--scout-motion-duration-fast) var(--scout-motion-easing-standard),
        color var(--scout-motion-duration-fast) var(--scout-motion-easing-standard),
        transform var(--scout-motion-duration-fast) var(--scout-motion-easing-standard);
    }
    .button:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: var(--scout-focus-ring-offset);
    }
    .button:active:not(:disabled):not([aria-busy='true']) {
      transform: translateY(1px);
    }
    .button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    .button[aria-busy='true'] {
      cursor: progress;
    }

    /* === Variant: primary (filled, brand) === */
    :host([variant='primary']) .button {
      background: var(--scout-text-interactive-primary);
      color: var(--scout-color-white);
    }
    :host([variant='primary']) .button:hover:not(:disabled):not([aria-busy='true']) {
      background: var(--scout-interactive-background-brand-strong-hover);
    }
    :host([variant='primary']) .button:active:not(:disabled):not([aria-busy='true']) {
      background: var(--scout-interactive-background-brand-strong-pressed);
    }

    /* === Variant: secondary (outlined) === */
    :host([variant='secondary']) .button {
      background: var(--scout-surface-primary);
      color: var(--scout-text-interactive-primary);
      border-color: var(--scout-text-interactive-primary);
    }
    :host([variant='secondary']) .button:hover:not(:disabled):not([aria-busy='true']) {
      background: var(--scout-interactive-background-hover);
      border-color: var(--scout-text-interactive-primary);
    }
    :host([variant='secondary']) .button:active:not(:disabled):not([aria-busy='true']) {
      background: var(--scout-interactive-background-pressed);
    }

    /* === Variant: tertiary (text-only) === */
    :host([variant='tertiary']) .button {
      background: transparent;
      color: var(--scout-text-interactive-primary);
    }
    :host([variant='tertiary']) .button:hover:not(:disabled):not([aria-busy='true']) {
      background: var(--scout-interactive-background-hover);
    }
    :host([variant='tertiary']) .button:active:not(:disabled):not([aria-busy='true']) {
      background: var(--scout-interactive-background-pressed);
    }
    /* The flush attribute drops the inline (left/right) padding so a
       tertiary button can sit edge-aligned with surrounding text/labels
       (e.g. "Edit" inside a data display row, inline "View all" links).
       Block padding stays so the click target keeps height; hover and
       pressed backgrounds still draw around the visible label only.
       Tertiary-only by design — filled variants need their padding to
       read as a button. */
    :host([variant='tertiary'][flush]) .button,
    :host([variant='critical-tertiary'][flush]) .button {
      --_cnx-button-padding-inline: 0px;
    }

    /* === Variant: action (filled, success/affirmative) === */
    :host([variant='action']) .button {
      background: var(--scout-interactive-background-success-strong);
      color: var(--scout-color-white);
    }
    :host([variant='action']) .button:hover:not(:disabled):not([aria-busy='true']) {
      background: var(--scout-interactive-background-success-strong-hover);
    }
    :host([variant='action']) .button:active:not(:disabled):not([aria-busy='true']) {
      background: var(--scout-interactive-background-success-strong-pressed);
    }

    /* === Variant: critical (filled, destructive) === */
    :host([variant='critical']) .button {
      background: var(--scout-interactive-background-critical-strong-hover);
      color: var(--scout-color-white);
    }
    :host([variant='critical']) .button:hover:not(:disabled):not([aria-busy='true']) {
      background: var(--scout-interactive-background-critical-strong-pressed);
    }
    :host([variant='critical']) .button:active:not(:disabled):not([aria-busy='true']) {
      background: var(--scout-color-red-800);
    }

    /* === Variant: critical-tertiary (text-only, destructive) === */
    :host([variant='critical-tertiary']) .button {
      background: transparent;
      color: var(--scout-text-interactive-critical);
    }
    :host([variant='critical-tertiary']) .button:hover:not(:disabled):not([aria-busy='true']) {
      background: var(--scout-fill-critical-subtle);
    }
    :host([variant='critical-tertiary']) .button:active:not(:disabled):not([aria-busy='true']) {
      background: var(--scout-color-red-200);
    }

    /* === Knockout — for buttons sitting on dark / saturated surfaces
       (system-outage banner, dark cards, snackbar). Locks the resting
       fill to white with dark text; hover/active drop to alpha-white
       tints so the affordance reads in both themes. */
    :host([knockout]) .button {
      background: var(--scout-color-white);
      color: var(--scout-text-display-primary);
      border-color: var(--scout-color-white);
    }
    :host([knockout]) .button:hover:not(:disabled):not([aria-busy='true']) {
      background: var(--scout-color-alpha-white-80);
      border-color: var(--scout-color-alpha-white-80);
    }
    :host([knockout]) .button:active:not(:disabled):not([aria-busy='true']) {
      background: var(--scout-color-cool-gray-100);
      border-color: var(--scout-color-cool-gray-100);
    }
    :host([knockout]) .button:focus-visible {
      outline-color: var(--scout-color-white);
    }

    /* === Icon slots === */
    ::slotted([slot='icon-leading']),
    ::slotted([slot='icon-trailing']) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--_cnx-button-icon-size);
      height: var(--_cnx-button-icon-size);
      flex-shrink: 0;
    }

    /* === Loading spinner === */
    .spinner {
      display: inline-block;
      width: 1em;
      height: 1em;
      flex-shrink: 0;
      border-radius: 50%;
      border: 2px solid currentColor;
      border-right-color: transparent;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .button {
        transition: none;
      }
      .spinner {
        animation-duration: 0s;
      }
    }
  `;

  /** Visual hierarchy. */
  @property({ type: String, reflect: true }) variant: ButtonVariant = 'primary';

  /** Density preset. */
  @property({ type: String, reflect: true }) size: ButtonSize = 'default';

  /** Form-association behavior. */
  @property({ type: String, reflect: true }) type: ButtonType = 'button';

  /** Disables interaction; skips tab order. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** White-on-dark treatment — pair with dark / saturated surfaces. */
  @property({ type: Boolean, reflect: true }) knockout = false;

  /** Tertiary-only — drops the left/right padding so the label sits flush
   *  with surrounding text. Has no effect on filled variants. */
  @property({ type: Boolean, reflect: true }) flush = false;

  /** Shows a spinner and sets `aria-busy="true"`. */
  @property({ type: Boolean, reflect: true }) loading = false;

  /** ARIA label override for icon-only buttons. */
  @property({ type: String, attribute: 'aria-label-override' }) ariaLabelOverride: string | null = null;

  private readonly _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  private _onClick = (e: Event) => {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Manually drive form submission/reset since the inner <button>'s
    // form-association is scoped to the shadow tree.
    const form = this._internals.form;
    if (this.type === 'submit') form?.requestSubmit();
    else if (this.type === 'reset') form?.reset();
  };

  render() {
    const ariaBusy = this.loading ? 'true' : nothing;
    return html`
      <button
        part="button"
        class="button"
        type=${this.type}
        ?disabled=${this.disabled}
        aria-busy=${ariaBusy as any}
        aria-label=${this.ariaLabelOverride || nothing}
        @click=${this._onClick}
      >
        ${this.loading
          ? html`<span class="spinner" aria-hidden="true"></span>`
          : html`<slot name="icon-leading"></slot>`}
        <slot></slot>
        ${this.loading ? nothing : html`<slot name="icon-trailing"></slot>`}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-button': ScoutButton;
  }
}
