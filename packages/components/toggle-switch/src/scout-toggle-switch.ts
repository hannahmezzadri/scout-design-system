import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ToggleLabelPlacement, ToggleSwitchSize, ToggleVariant } from './types.js';

/**
 * `<scout-toggle-switch>` — quickly switch between two states (On / Off).
 *
 * Anatomy: knob + track + optional label. Form-associated via ElementInternals
 * so the host's `name` / `value` participate in native `<form>` submission.
 *
 * @element scout-toggle-switch
 *
 * @attr checked    - On state. Default `false` (off).
 * @attr {"default"|"condensed"} size - Density preset.
 * @attr {"left"|"right"} label-placement - Where the label sits relative to the track.
 * @attr {"on"|"on-critical"} on-variant - Color treatment when checked. `on-critical` paints
 *                                          the track red — use sparingly for destructive enables.
 * @attr disabled   - Disables interaction.
 * @attr name       - Form field name.
 * @attr value      - Form value emitted when checked. Defaults to "on".
 *
 * @slot - Optional label text.
 *
 * @fires change - Native; bubbles, composed; user toggled the switch.
 */
@customElement('scout-toggle-switch')
export class ScoutToggleSwitch extends LitElement {
  static formAssociated = true;

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-8);
      font-family: var(--scout-font-family-inter);
      --_track-w: 36px;
      --_track-h: 20px;
      --_knob-size: 16px;
      --_knob-offset: 2px;
      --_track-off: var(--scout-color-cool-gray-300, var(--scout-color-cool-gray-200));
      --_track-on:  var(--scout-text-interactive-primary);
      --_track-on-pressed: var(--scout-color-blue-700);
      --_track-critical: var(--scout-color-red-600);
      --_track-critical-pressed: var(--scout-color-red-700);
    }
    :host([size='condensed']),
    :host-context([data-density='condensed']) {
      --_track-w: 28px;
      --_track-h: 16px;
      --_knob-size: 12px;
    }
    :host([disabled]) {
      pointer-events: none;
      opacity: 0.5;
    }
    /* Label placement on the host's flex row */
    :host([label-placement='left']) { flex-direction: row-reverse; }

    .row {
      display: inline-flex;
      align-items: center;
      gap: var(--scout-space-8);
      cursor: pointer;
      user-select: none;
    }
    :host([label-placement='left']) .row { flex-direction: row-reverse; }

    /* Hidden native input — handles focus, form association */
    input {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }

    .track {
      position: relative;
      width: var(--_track-w);
      height: var(--_track-h);
      flex-shrink: 0;
      border-radius: 999px;
      background: var(--_track-off);
      transition: background var(--scout-motion-duration-fast, 120ms)
        var(--scout-motion-easing-standard, ease);
    }
    .track::after {
      content: '';
      position: absolute;
      top: var(--_knob-offset);
      left: var(--_knob-offset);
      width: var(--_knob-size);
      height: var(--_knob-size);
      background: var(--scout-color-white);
      border-radius: 50%;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
      transition: transform var(--scout-motion-duration-fast, 120ms)
        var(--scout-motion-easing-standard, ease);
    }

    /* Hover / pressed / focus on the track when not disabled */
    .row:hover .track { background: var(--scout-color-cool-gray-400, var(--scout-color-cool-gray-300)); }
    input:focus-visible + .track {
      outline: var(--scout-focus-ring-width) solid var(--scout-focus-ring-color);
      outline-offset: var(--scout-focus-ring-offset);
    }
    .row:active:not([aria-disabled='true']) .track {
      background: var(--scout-color-cool-gray-500, var(--scout-color-cool-gray-400));
    }

    /* Functional: ON */
    :host([checked]) .track { background: var(--_track-on); }
    :host([checked]) .row:hover .track { background: var(--scout-color-blue-600, var(--_track-on)); }
    :host([checked]) .row:active .track { background: var(--_track-on-pressed); }
    :host([checked]) .track::after {
      transform: translateX(calc(var(--_track-w) - var(--_knob-size) - (var(--_knob-offset) * 2)));
    }

    /* Functional: ON CRITICAL */
    :host([checked][on-variant='on-critical']) .track { background: var(--_track-critical); }
    :host([checked][on-variant='on-critical']) .row:hover .track { background: var(--_track-critical); }
    :host([checked][on-variant='on-critical']) .row:active .track { background: var(--_track-critical-pressed); }

    /* Label */
    .label {
      font-size: var(--scout-font-size-14);
      line-height: var(--scout-font-line-height-21);
      color: var(--scout-text-display-primary);
    }
    :host([size='condensed']) .label { font-size: var(--scout-font-size-12); }

    @media (prefers-reduced-motion: reduce) {
      .track, .track::after { transition: none; }
    }
  `;

  @property({ type: Boolean, reflect: true }) checked = false;
  @property({ reflect: true }) size: ToggleSwitchSize = 'default';
  @property({ reflect: true, attribute: 'label-placement' })
  labelPlacement: ToggleLabelPlacement = 'right';
  @property({ reflect: true, attribute: 'on-variant' })
  onVariant: 'on' | 'on-critical' = 'on';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property() name = '';
  @property() value = '';

  /** Convenience getter that maps to a discrete functional state. */
  get state(): ToggleVariant {
    if (!this.checked) return 'off';
    return this.onVariant === 'on-critical' ? 'on-critical' : 'on';
  }

  private readonly _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  private _onChange = (e: Event) => {
    if (this.disabled) return;
    this.checked = (e.currentTarget as HTMLInputElement).checked;
    this._setFormValue();
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  };

  private _setFormValue() {
    this._internals.setFormValue(this.checked ? this.value || 'on' : null);
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('checked') || changed.has('value')) this._setFormValue();
  }

  render() {
    return html`
      <label
        class="row"
        aria-disabled=${this.disabled ? 'true' : (nothing as unknown as string)}
      >
        <input
          type="checkbox"
          role="switch"
          ?checked=${this.checked}
          ?disabled=${this.disabled}
          name=${this.name || nothing}
          value=${this.value || nothing}
          @change=${this._onChange}
        />
        <span class="track" aria-hidden="true"></span>
        <span class="label"><slot></slot></span>
      </label>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-toggle-switch': ScoutToggleSwitch;
  }
}
