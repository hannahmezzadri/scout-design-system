import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@connex/overlay';
import '@connex/control';
import type { DisclosureDialogType } from './types.js';

interface LangDef {
  code: string;
  label: string;
}

/**
 * `<connex-disclosure-dialog>` — specialized modal for legal/compliance
 * disclosures that agents must read verbatim before continuing.
 *
 * Adds language tabs, optional acknowledgement, and an optional
 * confirmation checkbox (gates the primary action). Body content per language
 * is filtered by the slotted child's `data-language` attribute.
 *
 * @element connex-disclosure-dialog
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
 * @fires connex-disclosure-close            - Bubbles when the user dismisses.
 * @fires connex-disclosure-language-change  - detail = `{ code }`.
 * @fires connex-disclosure-acknowledge      - detail = `{ acknowledged: boolean }`.
 */
@customElement('connex-disclosure-dialog')
export class ConnexDisclosureDialog extends LitElement {
  static styles = css`
    :host {
      display: contents;
      font-family: var(--connex-font-family-inter);
    }
    .stage {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 2000;
      align-items: center;
      justify-content: center;
      padding: var(--connex-space-24);
      pointer-events: none;
    }
    :host([open]) .stage { display: flex; }

    .panel {
      position: relative;
      pointer-events: auto;
      background: var(--connex-surface-primary);
      color: var(--connex-text-display-primary);
      border-radius: var(--connex-radius-8);
      box-shadow: var(--connex-elevation-4);
      width: 100%;
      max-width: 640px;
      max-height: calc(100vh - var(--connex-space-48));
      display: flex;
      flex-direction: column;
      animation: cnx-dialog-in var(--connex-motion-duration-slow)
        var(--connex-motion-easing-enter) both;
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
      gap: var(--connex-space-12);
      padding: var(--connex-space-16) var(--connex-space-24);
      border-bottom: var(--connex-border-width-1) solid var(--connex-border-secondary);
    }
    .title-group { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .title {
      margin: 0;
      font-family: var(--connex-font-family-literata);
      font-weight: var(--connex-font-weight-semibold);
      font-size: var(--connex-font-size-20);
      line-height: var(--connex-font-line-height-30);
    }
    .subtitle {
      font-size: var(--connex-font-size-12);
      color: var(--connex-text-display-secondary);
    }
    .subtitle[hidden] { display: none; }
    .close { flex-shrink: 0; margin: -8px; }

    /* Automated banner — reminds the agent the system is reading */
    .auto-banner {
      padding: var(--connex-space-8) var(--connex-space-24);
      background: var(--connex-color-yellow-100);
      color: var(--connex-text-display-warning);
      font-size: var(--connex-font-size-12);
      font-weight: var(--connex-font-weight-semibold);
      border-bottom: var(--connex-border-width-1) solid var(--connex-border-warning);
    }

    /* Language tabs */
    .tabs {
      display: flex;
      gap: var(--connex-space-4);
      padding: var(--connex-space-8) var(--connex-space-24);
      border-bottom: var(--connex-border-width-1) solid var(--connex-border-secondary);
      background: var(--connex-color-cool-gray-100);
    }
    .tabs[hidden] { display: none; }
    .tab-btn {
      appearance: none;
      background: transparent;
      border: none;
      padding: var(--connex-space-4) var(--connex-space-12);
      font-family: inherit;
      font-size: var(--connex-font-size-12);
      font-weight: var(--connex-font-weight-semibold);
      color: var(--connex-text-display-secondary);
      cursor: pointer;
      border-radius: var(--connex-radius-4);
    }
    .tab-btn.active {
      background: var(--connex-surface-primary);
      color: var(--connex-text-display-primary);
    }
    .tab-btn:focus-visible { outline: var(--connex-focus-ring-width) solid var(--connex-focus-ring-color); outline-offset: 1px; }

    .body {
      padding: var(--connex-space-16) var(--connex-space-24);
      font-size: var(--connex-font-size-14);
      line-height: var(--connex-font-line-height-21);
      overflow-y: auto;
      flex: 1;
    }

    .ack {
      display: flex;
      align-items: flex-start;
      gap: var(--connex-space-8);
      padding: var(--connex-space-16) var(--connex-space-24) 0;
      font-size: var(--connex-font-size-14);
      line-height: var(--connex-font-line-height-21);
    }
    .ack[hidden] { display: none; }
    .ack input[type='checkbox'] {
      width: 16px;
      height: 16px;
      margin: 2px 0 0;
      accent-color: var(--connex-text-interactive-primary);
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--connex-space-8);
      padding: var(--connex-space-16) var(--connex-space-24);
      border-top: var(--connex-border-width-1) solid var(--connex-border-secondary);
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

  private _onSubtitleSlot = (e: Event) => { this._hasSubtitle = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0; };
  private _onAckSlot = (e: Event) => { this._hasAck = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0; };
  private _onActionsSlot = (e: Event) => {
    this._hasActions = (e.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
    this._syncActionDisabled();
  };

  private _close = () => {
    this.dispatchEvent(new CustomEvent('connex-disclosure-close', { bubbles: true, composed: true }));
  };

  private _onLangClick(code: string) {
    this.language = code;
    this._syncBody();
    this.dispatchEvent(new CustomEvent('connex-disclosure-language-change', {
      bubbles: true, composed: true, detail: { code },
    }));
  }

  private _onCheckboxChange = (e: Event) => {
    this.acknowledged = (e.target as HTMLInputElement).checked;
    this._syncActionDisabled();
    this.dispatchEvent(new CustomEvent('connex-disclosure-acknowledge', {
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

  /** Toggle disabled on slotted primary action(s) until acknowledged. */
  private _syncActionDisabled() {
    if (!this.requireCheckbox) return;
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="actions"]');
    const nodes = slot?.assignedElements({ flatten: true }) ?? [];
    nodes.forEach((node) => {
      // Disable any connex-button with variant="primary" until acknowledged
      if (node.tagName === 'CONNEX-BUTTON' && node.getAttribute('variant') === 'primary') {
        node.toggleAttribute('disabled', !this.acknowledged);
      }
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this._onKey);
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._onKey);
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
      this._syncActionDisabled();
    }
  }

  render() {
    const langs = this._parsedLanguages();
    const showTabs = langs.length > 1;

    return html`
      <connex-overlay ?open=${this.open} @connex-overlay-click=${() => this.closable && this._close()}></connex-overlay>
      <div class="stage" role="dialog" aria-modal="true">
        <div class="panel">
          <div class="header">
            <div class="title-group">
              <h2 class="title"><slot name="title"></slot></h2>
              <div class="subtitle" ?hidden=${!this._hasSubtitle}>
                <slot name="subtitle" @slotchange=${this._onSubtitleSlot}></slot>
              </div>
            </div>
            ${this.closable
              ? html`<connex-control class="close" type="x-close" size="condensed" aria-label-override="Close dialog" @click=${this._close}></connex-control>`
              : nothing}
          </div>

          ${this.type === 'automated'
            ? html`<div class="auto-banner" role="note">⚙️ Automated read — system is reading this disclosure aloud</div>`
            : nothing}

          <div class="tabs" role="tablist" ?hidden=${!showTabs}>
            ${langs.map(l => html`
              <button
                class="tab-btn ${l.code === this.language ? 'active' : ''}"
                role="tab"
                aria-selected=${String(l.code === this.language)}
                @click=${() => this._onLangClick(l.code)}
              >${l.label}</button>
            `)}
          </div>

          <div class="body">
            <slot @slotchange=${() => this._syncBody()}></slot>
          </div>

          <div class="ack" ?hidden=${!this._hasAck && !this.requireCheckbox}>
            ${this.requireCheckbox
              ? html`<input type="checkbox" .checked=${this.acknowledged} @change=${this._onCheckboxChange} />`
              : nothing}
            <span><slot name="acknowledgement" @slotchange=${this._onAckSlot}></slot></span>
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
    'connex-disclosure-dialog': ConnexDisclosureDialog;
  }
}
