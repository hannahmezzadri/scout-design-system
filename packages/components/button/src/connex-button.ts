import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ButtonSize, ButtonType, ButtonVariant } from './types.js';

/**
 * `<connex-button>` — clickable element that triggers an action or event.
 *
 * Use buttons for important actions like submitting a form, committing a change,
 * or moving to the next step. The button is form-associated via ElementInternals
 * so `type="submit"` and `type="reset"` work inside native `<form>` elements.
 *
 * @element connex-button
 *
 * @attr {"primary"|"secondary"|"tertiary"|"action"|"critical"|"critical-tertiary"} variant - Visual hierarchy.
 * @attr {"default"|"condensed"} size - Density preset matching the page's `[data-density]`.
 * @attr {"button"|"submit"|"reset"} type - Form-association behavior.
 * @attr disabled - Disables interaction; skips tab order.
 * @attr loading - Shows a spinner and sets `aria-busy="true"`.
 *
 * @slot icon-leading - Icon rendered before the label (e.g. plus, search).
 * @slot - Label content (default slot).
 * @slot icon-trailing - Icon rendered after the label (e.g. arrow-right).
 *
 * @csspart button - The internal native `<button>` element. Style via `connex-button::part(button)`.
 */
@customElement('connex-button')
export class ConnexButton extends LitElement {
  static formAssociated = true;

  static styles = css`
    :host {
      display: inline-block;
      /* Default size tokens */
      --_cnx-button-padding-block: var(--connex-space-8);
      --_cnx-button-padding-inline: var(--connex-space-16);
      --_cnx-button-font-size: var(--connex-font-size-14);
      --_cnx-button-min-height: 36px;
      --_cnx-button-icon-size: 16px;
    }
    :host([size='condensed']) {
      --_cnx-button-padding-block: var(--connex-space-4);
      --_cnx-button-padding-inline: var(--connex-space-12);
      --_cnx-button-font-size: var(--connex-font-size-12);
      --_cnx-button-min-height: 28px;
      --_cnx-button-icon-size: 14px;
    }

    .button {
      appearance: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--connex-space-8);
      width: 100%;
      min-height: var(--_cnx-button-min-height);
      padding: var(--_cnx-button-padding-block) var(--_cnx-button-padding-inline);
      font-family: var(--connex-font-family-inter);
      font-size: var(--_cnx-button-font-size);
      font-weight: var(--connex-font-weight-semibold);
      line-height: 1;
      border: var(--connex-border-width-1) solid transparent;
      border-radius: var(--connex-radius-4);
      cursor: pointer;
      white-space: nowrap;
      user-select: none;
      transition:
        background var(--connex-motion-duration-fast) var(--connex-motion-easing-standard),
        border-color var(--connex-motion-duration-fast) var(--connex-motion-easing-standard),
        color var(--connex-motion-duration-fast) var(--connex-motion-easing-standard),
        transform var(--connex-motion-duration-fast) var(--connex-motion-easing-standard);
    }
    .button:focus-visible {
      outline: var(--connex-focus-ring-width) solid var(--connex-focus-ring-color);
      outline-offset: var(--connex-focus-ring-offset);
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
      background: var(--connex-text-interactive-primary);
      color: var(--connex-color-white);
    }
    :host([variant='primary']) .button:hover:not(:disabled):not([aria-busy='true']) {
      background: var(--connex-interactive-background-brand-strong-hover);
    }
    :host([variant='primary']) .button:active:not(:disabled):not([aria-busy='true']) {
      background: var(--connex-interactive-background-brand-strong-pressed);
    }

    /* === Variant: secondary (outlined) === */
    :host([variant='secondary']) .button {
      background: var(--connex-surface-primary);
      color: var(--connex-text-interactive-primary);
      border-color: var(--connex-border-primary);
    }
    :host([variant='secondary']) .button:hover:not(:disabled):not([aria-busy='true']) {
      background: var(--connex-interactive-background-hover);
      border-color: var(--connex-text-interactive-primary);
    }
    :host([variant='secondary']) .button:active:not(:disabled):not([aria-busy='true']) {
      background: var(--connex-interactive-background-pressed);
    }

    /* === Variant: tertiary (text-only) === */
    :host([variant='tertiary']) .button {
      background: transparent;
      color: var(--connex-text-interactive-primary);
    }
    :host([variant='tertiary']) .button:hover:not(:disabled):not([aria-busy='true']) {
      background: var(--connex-interactive-background-hover);
    }
    :host([variant='tertiary']) .button:active:not(:disabled):not([aria-busy='true']) {
      background: var(--connex-interactive-background-pressed);
    }

    /* === Variant: action (filled, success/affirmative) === */
    :host([variant='action']) .button {
      background: var(--connex-color-green-600);
      color: var(--connex-color-white);
    }
    :host([variant='action']) .button:hover:not(:disabled):not([aria-busy='true']) {
      background: var(--connex-color-green-700);
    }
    :host([variant='action']) .button:active:not(:disabled):not([aria-busy='true']) {
      background: var(--connex-color-green-800);
    }

    /* === Variant: critical (filled, destructive) === */
    :host([variant='critical']) .button {
      background: var(--connex-color-red-600);
      color: var(--connex-color-white);
    }
    :host([variant='critical']) .button:hover:not(:disabled):not([aria-busy='true']) {
      background: var(--connex-color-red-700);
    }
    :host([variant='critical']) .button:active:not(:disabled):not([aria-busy='true']) {
      background: var(--connex-color-red-800);
    }

    /* === Variant: critical-tertiary (text-only, destructive) === */
    :host([variant='critical-tertiary']) .button {
      background: transparent;
      color: var(--connex-text-interactive-error);
    }
    :host([variant='critical-tertiary']) .button:hover:not(:disabled):not([aria-busy='true']) {
      background: var(--connex-color-red-100);
    }
    :host([variant='critical-tertiary']) .button:active:not(:disabled):not([aria-busy='true']) {
      background: var(--connex-color-red-200);
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
    'connex-button': ConnexButton;
  }
}
