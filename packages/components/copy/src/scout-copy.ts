import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { CopySize, CopyLayout } from './types.js';

/* Heroicons "document-duplicate" outline. */
const COPY_ICON = svg`<path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"/>`;

/**
 * `<scout-copy>` — one-click copy-to-clipboard control. Hovering shows a
 * "Copy" tooltip; clicking copies the `value` attribute (or the slotted
 * text fallback) to the clipboard and flips the tooltip to "Copied!" for
 * a brief moment.
 *
 * @element scout-copy
 *
 * @attr {string} value                              - Text to copy. If omitted, the slotted text content is used.
 * @attr {"icon-only"|"icon-label"} layout           - Anatomy variant. Default `icon-only`.
 * @attr {string} label                              - Label rendered next to the icon when layout is `icon-label`. Defaults to "Copy".
 * @attr {"default"|"condensed"} size                - Density preset matching scout-control.
 * @attr disabled                                    - Disables interaction; skips tab order.
 * @attr {string} aria-label-override                - Overrides the default ARIA label.
 *
 * @slot - Fallback text node — copied if `value` is not set.
 *
 * @fires scout-copy - Bubbles, composed; detail = `{ value: string, ok: boolean }`.
 */
@customElement('scout-copy')
export class ScoutCopy extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      position: relative;
      font-family: var(--scout-font-family-inter);
      --_copy-size: 32px;
      --_copy-icon-size: 20px;
      --_copy-fs: var(--scout-font-size-14);
      --_copy-lh: var(--scout-font-line-height-21);
      --_copy-px: var(--scout-space-12);
    }
    :host([size='condensed']),
    :host-context([data-density='condensed']) {
      --_copy-size: 24px;
      --_copy-icon-size: 16px;
      --_copy-fs: var(--scout-font-size-12);
      --_copy-lh: var(--scout-font-line-height-18);
      --_copy-px: var(--scout-space-8);
    }

    .control {
      appearance: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--scout-space-4);
      min-height: var(--_copy-size);
      padding: 0;
      background: transparent;
      border: none;
      border-radius: var(--scout-radius-4);
      color: var(--scout-icon-interactive-primary);
      font: inherit;
      font-size: var(--_copy-fs);
      line-height: var(--_copy-lh);
      cursor: pointer;
      transition:
        background var(--scout-motion-duration-hover) var(--scout-motion-easing-gentle),
        color var(--scout-motion-duration-hover) var(--scout-motion-easing-gentle);
    }
    /* Icon-only sits inside a square hit-target to match scout-control. */
    :host([layout='icon-only']) .control,
    :host(:not([layout])) .control {
      width: var(--_copy-size);
      height: var(--_copy-size);
    }
    /* Icon + label gets horizontal padding so the label has breathing room. */
    :host([layout='icon-label']) .control {
      padding: 0 var(--_copy-px);
    }

    /* === Interactive states === */
    .control:hover:not(:disabled) {
      background: var(--scout-interactive-background-hover);
      color: var(--scout-color-cool-gray-900);
    }
    .control:focus-visible {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: 1px;
    }
    .control:active:not(:disabled) {
      background: var(--scout-interactive-background-pressed);
    }
    .control:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .icon {
      width: var(--_copy-icon-size);
      height: var(--_copy-icon-size);
      flex-shrink: 0;
      display: block;
    }

    /* === Tooltip === */
    .tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%) translateY(2px);
      background: var(--scout-color-cool-gray-800);
      color: var(--scout-color-white);
      border-radius: var(--scout-radius-4);
      padding: var(--scout-space-4) var(--scout-space-8);
      font-size: var(--scout-typography-body-small-font-size);
      line-height: var(--scout-typography-body-small-line-height);
      box-shadow: var(--scout-elevation-2);
      width: max-content;
      max-width: 200px;
      pointer-events: none;
      opacity: 0;
      transition:
        opacity var(--scout-motion-duration-hover) var(--scout-motion-easing-gentle),
        transform var(--scout-motion-duration-hover) var(--scout-motion-easing-gentle);
      z-index: 1000;
      white-space: nowrap;
    }
    /* Show on hover, focus-within, or while in copied state. */
    :host(:hover:not([disabled])) .tooltip,
    :host(:focus-within:not([disabled])) .tooltip,
    :host([data-copied]) .tooltip {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    @media (prefers-reduced-motion: reduce) {
      .control, .tooltip { transition: none; }
    }
  `;

  /** Text to copy. If omitted, slotted text content is used. */
  @property({ type: String }) value = '';

  /** Anatomy variant. */
  @property({ type: String, reflect: true }) layout: CopyLayout = 'icon-only';

  /** Label rendered next to the icon when layout is `icon-label`. */
  @property({ type: String }) label = 'Copy';

  /** Density preset. */
  @property({ type: String, reflect: true }) size: CopySize = 'default';

  /** Disables interaction; skips tab order. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** ARIA label override. */
  @property({ type: String, attribute: 'aria-label-override' }) ariaLabelOverride: string | null = null;

  /** Tracks "Copied!" state — drives both the tooltip text and the
   *  `data-copied` attribute that keeps the tooltip visible after the
   *  pointer leaves while the success message is still showing. */
  @state() private _copied = false;
  private _resetTimer: number | null = null;

  private _resolveText(): string {
    if (this.value) return this.value;
    return (this.textContent ?? '').trim();
  }

  private _onClick = (e: Event) => {
    if (this.disabled) {
      e.preventDefault();
      return;
    }
    const text = this._resolveText();
    let ok = false;

    // execCommand path runs synchronously inside the click — works in
    // every browser including those that gate the async Clipboard API
    // behind permission prompts or document-focus checks.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.left = '0';
    document.body.appendChild(ta);
    ta.select();
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();

    // Best-effort upgrade for browsers that prefer the modern API.
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => { /* swallowed */ });
    }

    this._setCopied(ok);
    this.dispatchEvent(new CustomEvent('scout-copy', {
      bubbles: true,
      composed: true,
      detail: { value: text, ok },
    }));
  };

  private _setCopied(ok: boolean) {
    this._copied = ok;
    if (ok) this.setAttribute('data-copied', '');
    else this.removeAttribute('data-copied');

    if (this._resetTimer != null) clearTimeout(this._resetTimer);
    if (ok) {
      this._resetTimer = window.setTimeout(() => {
        this._copied = false;
        this.removeAttribute('data-copied');
      }, 1600);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._resetTimer != null) clearTimeout(this._resetTimer);
  }

  render() {
    const tooltipText = this._copied ? 'Copied!' : 'Copy';
    const ariaLabel = this.ariaLabelOverride ?? (this.layout === 'icon-only' ? 'Copy to clipboard' : null);
    return html`
      <button
        class="control"
        type="button"
        ?disabled=${this.disabled}
        aria-label=${ariaLabel ?? nothing}
        @click=${this._onClick}
      >
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          ${COPY_ICON}
        </svg>
        ${this.layout === 'icon-label'
          ? html`<span class="label">${this.label}</span>`
          : nothing}
      </button>
      <span class="tooltip" role="status" aria-live="polite">${tooltipText}</span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-copy': ScoutCopy;
  }
}
