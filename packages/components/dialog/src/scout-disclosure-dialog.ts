import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@scout-ds/overlay';
import '@scout-ds/control';
import '@scout-ds/segmented-control';
import '@scout-ds/progress';
import '@scout-ds/button';
import '@scout-ds/checkbox';
import '@scout-ds/inline-alert';
import type { DisclosureDialogType } from './types.js';

interface LangDef {
  code: string;
  label: string;
}

/**
 * `<scout-disclosure-dialog>` — specialized modal for legal/compliance
 * disclosures that agents must read verbatim before continuing.
 *
 * Adds language tabs, optional acknowledgement, and an optional
 * confirmation checkbox (gates the primary action). Body content per language
 * is filtered by the slotted child's `data-language` attribute.
 *
 * @element scout-disclosure-dialog
 *
 * @attr open
 * @attr {"simple"|"automated"} type   - `automated` shows a banner reminding the agent the system is reading.
 * @attr languages                       - Comma-separated language codes (e.g. "en,es,fr"). Default: "en".
 * @attr language                        - Currently displayed language code.
 * @attr closable                        - Default true.
 * @attr require-checkbox                - When set, the primary action button is disabled until the consumer toggles `acknowledged`.
 * @attr acknowledged                    - The current acknowledged state. Bidirectionally bound by the host or set by the consumer.
 *
 * @slot title          - Title bar text.
 * @slot subtitle       - Optional subtitle below the title.
 * @slot                - Default slot: per-language `<div data-language="en">…</div>` content.
 * @slot acknowledgement - Optional acknowledgement text rendered above the actions.
 * @slot actions        - Buttons.
 *
 * @fires scout-disclosure-close            - Bubbles when the user dismisses.
 * @fires scout-disclosure-language-change  - detail = `{ code }`.
 * @fires scout-disclosure-acknowledge      - detail = `{ acknowledged: boolean }`.
 */
@customElement('scout-disclosure-dialog')
export class ScoutDisclosureDialog extends LitElement {
  static styles = css`
    :host {
      display: contents;
      font-family: var(--scout-font-family-inter);
    }
    .stage {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 2000;
      align-items: center;
      justify-content: center;
      padding: var(--scout-space-24);
      pointer-events: none;
    }
    :host([open]) .stage { display: flex; }

    .panel {
      position: relative;
      pointer-events: auto;
      background: var(--scout-surface-primary);
      color: var(--scout-text-display-primary);
      border-radius: var(--scout-radius-8);
      box-shadow: var(--scout-elevation-4);
      width: 100%;
      max-width: 640px;
      max-height: calc(100vh - var(--scout-space-48));
      display: flex;
      flex-direction: column;
      animation: cnx-dialog-in var(--scout-motion-duration-slow)
        var(--scout-motion-easing-enter) both;
    }
    @keyframes cnx-dialog-in {
      from { opacity: 0; transform: translateY(8px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .panel { animation: none; }
    }

    .header {
      display: flex;
      align-items: flex-start;
      gap: var(--scout-space-12);
      padding: var(--scout-space-16) var(--scout-space-24);
    }
    .title-group { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--scout-space-0); }
    /* Title row keeps the title text vertically centered with the controls
       on the right (language tabs + X close), independent of any subtitle
       that sits below. */
    .title-row {
      display: flex;
      align-items: center;
      gap: var(--scout-space-12);
      margin-top: var(--scout-space-4);
    }
    .title {
      flex: 1;
      min-width: 0;
      margin: 0;
      font-family: var(--scout-font-family-literata);
      font-weight: var(--scout-font-weight-semibold);
      font-size: var(--scout-font-size-24);
      line-height: var(--scout-font-line-height-32);
    }
    .header-controls {
      display: flex;
      align-items: center;
      gap: var(--scout-space-24);
      flex-shrink: 0;
    }
    .subtitle {
      margin-top: var(--scout-space-4);
      font-size: var(--scout-typography-body-small-font-size);
      line-height: var(--scout-typography-body-small-line-height);
      color: var(--scout-text-display-secondary);
    }
    .subtitle[hidden] { display: none; }
    .close { flex-shrink: 0; margin: -8px; }

    /* Automated read progress — surfaces how far along the system-narrated
       disclosure is via a real progress-bar component. */
    .auto-progress {
      padding: var(--scout-space-12) var(--scout-space-24);
    }

    /* Language tabs render as scout-language-tabs (segmented control)
       inline in the header to the left of the X. */
    scout-language-tabs[hidden] { display: none; }

    /* Small breakpoint — push the language-tabs segmented control below
       the subtitle. The X close stays anchored top-right next to the
       title. We dissolve .title-row + .header-controls with
       display:contents so the title, tabs, close, and subtitle become
       direct grid children of .title-group and we can re-area them. */
    @media (max-width: 600px) {
      .title-row, .header-controls { display: contents; }
      .title-group {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-areas:
          "title    close"
          "subtitle subtitle"
          "tabs     tabs";
        align-items: center;
        column-gap: var(--scout-space-12);
      }
      .title { grid-area: title; }
      .close { grid-area: close; align-self: center; }
      .subtitle { grid-area: subtitle; }
      scout-language-tabs { grid-area: tabs; justify-self: start; margin-top: var(--scout-space-16); }
    }

    .body {
      padding: var(--scout-space-16) var(--scout-space-24);
      /* Extra space.8 below the main content before the actions row. */
      padding-bottom: calc(var(--scout-space-16) + var(--scout-space-8));
      font-size: var(--scout-typography-body-font-size);
      line-height: var(--scout-typography-body-line-height);
      overflow-y: auto;
      flex: 1;
    }

    /* Play again — appears below the disclosure body once the automated
       read finishes, so the agent can replay the narration. */
    .replay {
      margin-top: var(--scout-space-16);
    }
    .replay[hidden] { display: none; }

    .ack {
      display: flex;
      align-items: flex-start;
      gap: var(--scout-space-8);
      padding: var(--scout-space-16) var(--scout-space-24) var(--scout-space-24);
      font-size: var(--scout-font-size-14);
      line-height: var(--scout-font-line-height-21);
    }
    /* The body's padding-bottom (space.16 + space.8 = 24) already supplies
       the visible gap. Pull the .ack up by space.8 and zero its top
       padding so paragraph→checkbox reads as exactly space.16. */
    .body + .ack {
      padding-top: 0;
      margin-top: calc(0px - var(--scout-space-8));
    }
    .ack[hidden] { display: none; }

    /* Validation alert shown below the subtitle when the agent tries to
       confirm without ticking the acknowledgement. Uses scout-inline-alert
       for the chrome; we just slot it into the header rail. */
    .ack-alert {
      padding: 0 var(--scout-space-24) var(--scout-space-12);
    }
    .ack-alert[hidden] { display: none; }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--scout-space-8);
      padding: var(--scout-space-16) var(--scout-space-24);
      border-top: var(--scout-border-width-1) solid var(--scout-border-secondary);
    }
    .actions[hidden] { display: none; }
  `;

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String, reflect: true }) type: DisclosureDialogType = 'simple';
  @property() languages = 'en';
  @property() language = 'en';
  @property({ type: Boolean, reflect: true }) closable = true;
  @property({ type: Boolean, reflect: true, attribute: 'require-checkbox' })
  requireCheckbox = false;
  @property({ type: Boolean, reflect: true }) acknowledged = false;

  @state() private _hasSubtitle = false;
  @state() private _hasAck = false;
  @state() private _hasActions = false;
  @state() private _readProgress = 0;
  /** Surfaces the inline-alert + checkbox-invalid state when the user
   *  clicks the primary action without acknowledging. */
  @state() private _ackError = false;

  /** Total time (ms) the simulated automated read takes to reach 100%. */
  @property({ type: Number, attribute: 'read-duration' }) readDuration = 8000;
  private _readRaf: number | null = null;

  private _onSubtitleSlot = (e: Event) => { this._hasSubtitle = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0; };
  private _onAckSlot = (e: Event) => { this._hasAck = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0; };
  private _onActionsSlot = (e: Event) => {
    this._hasActions = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
    this._bindActionValidation();
  };

  private _close = () => {
    this.dispatchEvent(new CustomEvent('scout-disclosure-close', { bubbles: true, composed: true }));
  };

  private _onLangClick(code: string) {
    this.language = code;
    this._syncBody();
    this.dispatchEvent(new CustomEvent('scout-disclosure-language-change', {
      bubbles: true, composed: true, detail: { code },
    }));
  }

  private _onCheckboxChange = (e: Event) => {
    this.acknowledged = (e.target as HTMLInputElement).checked;
    // Clear the validation error as soon as the agent ticks the box.
    if (this.acknowledged) this._ackError = false;
    this.dispatchEvent(new CustomEvent('scout-disclosure-acknowledge', {
      bubbles: true, composed: true, detail: { acknowledged: this.acknowledged },
    }));
  };

  private _parsedLanguages(): LangDef[] {
    const codes = (this.languages || 'en').split(',').map(s => s.trim()).filter(Boolean);
    const labels: Record<string, string> = {
      en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese',
    };
    return codes.map(c => ({ code: c, label: labels[c] || c.toUpperCase() }));
  }

  /** Show/hide slotted children whose data-language doesn't match current language. */
  private _syncBody() {
    const allLangs = new Set(this._parsedLanguages().map(l => l.code));
    Array.from(this.children).forEach((child) => {
      if (!(child instanceof HTMLElement)) return;
      const lang = child.getAttribute('data-language');
      if (!lang) return; // not a language-specific child; leave alone
      if (!allLangs.has(lang)) return;
      child.toggleAttribute('hidden', lang !== this.language);
    });
  }

  /** Validate the checkbox at click-time on slotted primary action(s).
   *  Per spec the primary button is enabled at rest; clicking without
   *  acknowledging surfaces an inline-alert and flips the checkbox into
   *  invalid state. We attach a capture-phase listener once and let the
   *  consumer's own click handler still run when validation passes. */
  private _bindActionValidation() {
    if (!this.requireCheckbox) return;
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="actions"]');
    const nodes = slot?.assignedElements({ flatten: true }) ?? [];
    nodes.forEach((node) => {
      if (node.tagName === 'SCOUT-BUTTON' && node.getAttribute('variant') === 'primary') {
        // Idempotent — replace any prior bound handler so re-slotting
        // doesn't stack listeners.
        node.removeEventListener('click', this._onPrimaryClick, true);
        node.addEventListener('click', this._onPrimaryClick, true);
      }
    });
  }

  private _onPrimaryClick = (e: Event) => {
    if (!this.requireCheckbox || this.acknowledged) {
      this._ackError = false;
      return;
    }
    e.stopImmediatePropagation();
    e.preventDefault();
    this._ackError = true;
  };

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this._onKey);
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._onKey);
    this._stopRead();
  }

  private _startRead() {
    this._stopRead();
    if (this.type !== 'automated' || !this.open) return;
    this._readProgress = 0;
    const start = performance.now();
    const tick = () => {
      const ratio = Math.min(1, (performance.now() - start) / Math.max(1, this.readDuration));
      this._readProgress = ratio * 100;
      if (ratio < 1) this._readRaf = requestAnimationFrame(tick);
    };
    this._readRaf = requestAnimationFrame(tick);
  }
  private _stopRead() {
    if (this._readRaf != null) cancelAnimationFrame(this._readRaf);
    this._readRaf = null;
  }
  private _onKey = (e: KeyboardEvent) => {
    if (this.open && this.closable && e.key === 'Escape') {
      e.preventDefault();
      this._close();
    }
  };

  updated(changed: Map<string, unknown>) {
    if (changed.has('language') || changed.has('languages') || changed.has('open')) {
      this._syncBody();
    }
    if (changed.has('acknowledged') || changed.has('requireCheckbox')) {
      this._bindActionValidation();
    }
    if (changed.has('open') || changed.has('type')) {
      if (this.open && this.type === 'automated') this._startRead();
      else this._stopRead();
    }
  }

  render() {
    const langs = this._parsedLanguages();
    const showTabs = langs.length > 1;

    return html`
      <scout-overlay ?open=${this.open} @scout-overlay-click=${() => this.closable && this._close()}></scout-overlay>
      <div class="stage" role="dialog" aria-modal="true">
        <div class="panel">
          <div class="header">
            <div class="title-group">
              <div class="title-row">
                <h2 class="title"><slot name="title"></slot></h2>
                <div class="header-controls">
                  ${showTabs
                    ? html`<scout-language-tabs
                        label=""
                        size="condensed"
                        .languages=${langs.map((l) => ({ value: l.code as 'en' | 'es' | 'fr', label: l.label }))}
                        value=${this.language as 'en' | 'es' | 'fr' | ''}
                        @scout-language-change=${(e: Event) => this._onLangClick((e as CustomEvent<{ value: string }>).detail.value)}
                      ></scout-language-tabs>`
                    : nothing}
                  ${this.closable
                    ? html`<scout-control class="close" type="x-close" size="condensed" aria-label-override="Close dialog" @click=${this._close}></scout-control>`
                    : nothing}
                </div>
              </div>
              <div class="subtitle" ?hidden=${!this._hasSubtitle}>
                <slot name="subtitle" @slotchange=${this._onSubtitleSlot}></slot>
              </div>
            </div>
          </div>

          <div class="ack-alert" ?hidden=${!this._ackError}>
            <scout-inline-alert status="critical">
              You must attest that you have confirmed the customer has been read this disclosure verbatim. Check the checkbox.
            </scout-inline-alert>
          </div>

          ${this.type === 'automated'
            ? html`<div class="auto-progress" role="note" aria-label="Automated read progress">
                <scout-progress-bar
                  title-text="Automated read"
                  .value=${this._readProgress}
                  max="100"
                  display="percentage"
                ></scout-progress-bar>
              </div>`
            : nothing}

          <div class="body">
            <slot @slotchange=${() => this._syncBody()}></slot>
            ${this.type === 'automated' && this._readProgress >= 100
              ? html`<div class="replay">
                  <scout-button
                    variant="secondary"
                    size="condensed"
                    @click=${() => this._startRead()}
                  >
                    <svg slot="icon-leading" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clip-rule="evenodd"/>
                    </svg>
                    Play again
                  </scout-button>
                </div>`
              : nothing}
          </div>

          <div class="ack" ?hidden=${!this._hasAck && !this.requireCheckbox}>
            ${this.requireCheckbox
              ? html`<scout-checkbox
                  .checked=${this.acknowledged}
                  ?invalid=${this._ackError}
                  @change=${this._onCheckboxChange}
                >
                  <slot name="acknowledgement" @slotchange=${this._onAckSlot}></slot>
                </scout-checkbox>`
              : html`<span><slot name="acknowledgement" @slotchange=${this._onAckSlot}></slot></span>`}
          </div>

          <div class="actions" ?hidden=${!this._hasActions}>
            <slot name="actions" @slotchange=${this._onActionsSlot}></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-disclosure-dialog': ScoutDisclosureDialog;
  }
}
