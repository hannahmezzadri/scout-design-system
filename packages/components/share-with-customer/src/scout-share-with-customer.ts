import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@scout/segmented-control';

/**
 * Speech-bubble icon — visual cue that the body is meant to be spoken aloud
 * to the customer, not read silently by the agent.
 */
const ICON = svg`<path fill-rule="evenodd" d="M4.804 21.644A6.707 6.707 0 0 0 6.75 21.75a6.721 6.721 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 0 1-.814 1.686.75.75 0 0 0 .44 1.223Z" clip-rule="evenodd"/>`;

export interface ShareLanguageSpec {
  /** ISO 639-1 (or BCP-47) tag emitted on selection. */
  value: string;
  /** Display label shown in the language tab. */
  label: string;
  /** Body text rendered when this language is selected. */
  body: string;
  /** When true, the segment is dimmed and skipped from interaction. */
  disabled?: boolean;
}

/**
 * `<scout-share-with-customer>` — agent-facing message displayed inside a
 * workflow tile. The body text is what the agent is expected to read aloud
 * to the customer.
 *
 * Anatomy:
 *   - Speech-bubble icon (left)
 *   - Label (top)
 *   - Optional `<scout-language-tabs>` for translations
 *   - Body content (slot or per-language `body` text)
 *
 * Two ways to author the body:
 *   1) Pass `languages: [{ value, label, body }, …]` — the component renders
 *      the language tabs and swaps the body when the agent picks a language.
 *   2) Slot custom content into the default slot. The language tabs aren't
 *      rendered; consumers wire their own translation logic.
 *
 * @element scout-share-with-customer
 *
 * @attr label                                            - Header label. Default: "Share with customer".
 * @attr value                                            - Currently-selected language tag (when languages is set).
 *
 * @prop languages - `ShareLanguageSpec[]` — translations to render via the language tabs.
 *
 * @slot - Custom body content; used when `languages` is empty.
 *
 * @fires scout-share-language-change - Bubbles, composed; detail = `{ value }`.
 */
@customElement('scout-share-with-customer')
export class ScoutShareWithCustomer extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--scout-font-family-inter);
    }

    .surface {
      display: flex;
      flex-direction: column;
      gap: var(--scout-space-12);
      padding: var(--scout-space-16);
      background: var(--scout-fill-teal);
      border: var(--scout-border-width-1) var(--scout-stroke-solid)
        var(--scout-border-teal);
      border-radius: var(--scout-radius-8);
    }

    .head {
      display: flex;
      align-items: center;
      gap: var(--scout-space-12);
    }

    .icon {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      color: var(--scout-text-interactive-primary);
    }
    .icon svg { width: 100%; height: 100%; fill: currentColor; }

    .label {
      font-size: var(--scout-font-size-14);
      font-weight: var(--scout-font-weight-semibold);
      color: var(--scout-text-display-primary);
    }

    .head scout-language-tabs {
      margin-left: auto;
    }

    .body {
      padding-left: calc(24px + var(--scout-space-12));
      font-size: var(--scout-font-size-14);
      line-height: var(--scout-font-line-height-21);
      color: var(--scout-text-display-primary);
      white-space: pre-wrap;
    }
  `;

  @property() label = 'Share with customer';
  @property({ reflect: true }) value = '';
  @property({ attribute: false }) languages: ShareLanguageSpec[] = [];

  /** Tracks which translation body to render. Falls back to the first language. */
  @state() private _activeBody = '';

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('languages') || changed.has('value')) {
      const langs = this.languages;
      const next = langs.find((l) => l.value === this.value) ?? langs[0];
      if (next) {
        this.value = next.value;
        this._activeBody = next.body;
      }
    }
  }

  private _onLanguageChange = (e: Event) => {
    const detail = (e as CustomEvent<{ value: string }>).detail;
    this.value = detail.value;
    const found = this.languages.find((l) => l.value === detail.value);
    if (found) this._activeBody = found.body;
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('scout-share-language-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  };

  render() {
    const langs = this.languages;
    const hasLangs = langs.length > 0;
    return html`
      <div class="surface" role="note" aria-label=${this.label}>
        <div class="head">
          <span class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">${ICON}</svg>
          </span>
          <span class="label">${this.label}</span>
          ${hasLangs
            ? html`<scout-language-tabs
                label=""
                size="condensed"
                .languages=${langs.map((l) => ({
                  value: l.value,
                  label: l.label,
                  disabled: l.disabled,
                }))}
                value=${this.value}
                @scout-language-change=${this._onLanguageChange}
              ></scout-language-tabs>`
            : nothing}
        </div>
        <div class="body">${hasLangs ? this._activeBody : html`<slot></slot>`}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-share-with-customer': ScoutShareWithCustomer;
  }
}
