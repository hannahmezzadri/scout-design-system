import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './scout-segmented-control.js';
import './scout-segment.js';

/**
 * Scout language tabs are intentionally limited to the three languages
 * Empath supports out of the box: English, Spanish, and French. Adding more
 * is a deliberate platform decision (translation cost, agent training,
 * compliance review) — the component enforces the contract by typing
 * `value` and filtering unrecognized entries from the `languages` prop
 * with a console warning.
 */
export const SUPPORTED_LANGUAGE_VALUES = ['en', 'es', 'fr'] as const;
export type SupportedLanguageValue = (typeof SUPPORTED_LANGUAGE_VALUES)[number];

export interface LanguageTabSpec {
  /** Supported language tag: `en`, `es`, or `fr`. */
  value: SupportedLanguageValue;
  /** Display label for the segment. */
  label: string;
  /** When true, the segment is dimmed and skipped from interaction. */
  disabled?: boolean;
}

const DEFAULT_LANGUAGES: LanguageTabSpec[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
];

const SUPPORTED_SET: ReadonlySet<string> = new Set<string>(SUPPORTED_LANGUAGE_VALUES);

/**
 * `<scout-language-tabs>` — language picker built on top of
 * `<scout-segmented-control>`. Use to switch between translations of the
 * same content (typically inside a share-with-customer surface).
 *
 * Anatomy: optional label + segmented control of language options + a
 * trailing divider that visually separates the picker from the translated
 * content below.
 *
 * **Supported languages:** English (`en`), Spanish (`es`), French (`fr`).
 * Other tags are stripped from the `languages` array with a console warning.
 *
 * @element scout-language-tabs
 *
 * @attr label                                    - Optional label rendered above the picker (default `Language`).
 * @attr value                                    - Selected language tag (`en` / `es` / `fr`).
 * @attr {"default"|"condensed"} size             - Density preset; forwarded to the underlying segmented control.
 * @attr disabled                                 - Disables every language segment.
 *
 * @prop languages - `LanguageTabSpec[]` — defaults to all three supported languages.
 *
 * @fires scout-language-change - Bubbles, composed; detail = `{ value }` on user selection.
 */
@customElement('scout-language-tabs')
export class ScoutLanguageTabs extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--scout-font-family-inter);
    }
    .label {
      display: block;
      font-size: var(--scout-font-size-12);
      font-weight: var(--scout-font-weight-semibold);
      color: var(--scout-text-display-secondary);
      margin-bottom: var(--scout-space-4);
    }
    .divider {
      margin-top: var(--scout-space-12);
      height: var(--scout-border-width-1);
      background: var(--scout-border-secondary);
    }
  `;

  @property() label = 'Language';
  @property({ reflect: true }) value: SupportedLanguageValue | '' = '';
  @property({ reflect: true }) size: 'default' | 'condensed' = 'default';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ attribute: false }) languages: LanguageTabSpec[] = [];

  /** Filter unsupported language tags out of any caller-supplied list and warn
   *  once per offending value. Returns the surviving entries (or the default
   *  list when none survive). */
  private _resolveLanguages(): LanguageTabSpec[] {
    const incoming = this.languages;
    if (!incoming || incoming.length === 0) return DEFAULT_LANGUAGES;
    const dropped: string[] = [];
    const kept: LanguageTabSpec[] = [];
    for (const l of incoming) {
      if (SUPPORTED_SET.has(l.value)) kept.push(l);
      else dropped.push(l.value);
    }
    if (dropped.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[scout-language-tabs] Unsupported language(s) ignored: ${dropped.join(', ')}. ` +
          `Scout language tabs only support English (en), Spanish (es), and French (fr).`,
      );
    }
    return kept.length > 0 ? kept : DEFAULT_LANGUAGES;
  }

  private _onSegmentedChange = (e: Event) => {
    const detail = (e as CustomEvent<{ value: string }>).detail;
    if (!SUPPORTED_SET.has(detail.value)) return;
    this.value = detail.value as SupportedLanguageValue;
    this.dispatchEvent(
      new CustomEvent<{ value: SupportedLanguageValue }>('scout-language-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  };

  render() {
    const langs = this._resolveLanguages();
    const initialValue = this.value || langs[0]?.value || '';
    return html`
      ${this.label ? html`<span class="label">${this.label}</span>` : nothing}
      <scout-segmented-control
        value=${initialValue}
        size=${this.size}
        ?disabled=${this.disabled}
        @scout-segmented-change=${this._onSegmentedChange}
      >
        ${langs.map(
          (l) => html`
            <scout-segment value=${l.value} ?disabled=${l.disabled ?? false}>
              ${l.label}
            </scout-segment>
          `,
        )}
      </scout-segmented-control>
      <div class="divider" aria-hidden="true"></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-language-tabs': ScoutLanguageTabs;
  }
}
