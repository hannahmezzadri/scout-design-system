import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { CheckboxGroupOrientation } from './types.js';

const WARNING_ICON = svg`<path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>`;
const ERROR_ICON = svg`<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm9.75-3.75a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd"/>`;

/**
 * `<scout-checkbox-group>` — wraps multiple `<scout-checkbox>` items with a
 * shared label, helper text, error, warning, and orientation.
 *
 * @element scout-checkbox-group
 *
 * @attr label                          - Group/field label rendered as a fieldset legend.
 * @attr helper                         - Helper text rendered below the label.
 * @attr error                          - Error message; marks all child checkboxes invalid.
 * @attr warning                        - Warning message rendered below the items.
 * @attr {"vertical"|"horizontal"} orientation - Layout direction of children.
 * @attr disabled                       - Disables every child checkbox.
 *
 * @slot - One or more `<scout-checkbox>` children.
 * @slot helper - Override the helper attribute with rich content.
 * @slot error  - Override the error attribute with rich content.
 * @slot warning - Override the warning attribute with rich content.
 */
@customElement('scout-checkbox-group')
export class ScoutCheckboxGroup extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--scout-font-family-inter);
    }
    .group {
      display: flex;
      flex-direction: column;
      gap: var(--scout-space-8);
      margin: 0;
      padding: 0;
      border: none;
      min-width: 0;
    }
    .label {
      font-size: var(--scout-font-size-14);
      font-weight: var(--scout-font-weight-semibold);
      color: var(--scout-text-display-primary);
      padding: 0;
      margin: 0;
    }
    .helper {
      font-size: var(--scout-font-size-12);
      line-height: var(--scout-font-line-height-18);
      color: var(--scout-text-display-secondary);
    }
    .helper[hidden] { display: none; }

    .items {
      display: flex;
      flex-direction: column;
      gap: var(--scout-space-8);
      margin-top: var(--scout-space-12);
    }
    :host([orientation='horizontal']) .items {
      flex-direction: row;
      flex-wrap: wrap;
      gap: var(--scout-space-16);
    }

    .message {
      display: inline-flex;
      align-items: flex-start;
      gap: var(--scout-space-4);
      font-size: var(--scout-font-size-12);
      line-height: var(--scout-font-line-height-18);
      margin-top: var(--scout-space-0);
    }
    .message[hidden] { display: none; }
    .message svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .warning { color: var(--scout-text-display-warning); }
    .error { color: var(--scout-text-display-error); }
  `;

  @property() label = '';
  @property() helper = '';
  @property() error = '';
  @property() warning = '';
  @property({ type: String, reflect: true })
  orientation: CheckboxGroupOrientation = 'vertical';
  @property({ type: Boolean, reflect: true }) disabled = false;

  updated(changed: Map<string, unknown>) {
    // Propagate group state to children
    if (changed.has('error') || changed.has('disabled')) {
      const items = this.querySelectorAll('scout-checkbox');
      items.forEach((c) => {
        c.toggleAttribute('invalid', !!this.error);
        if (this.disabled) c.setAttribute('disabled', '');
        else if (changed.has('disabled')) c.removeAttribute('disabled');
      });
    }
  }

  render() {
    return html`
      <fieldset class="group" ?disabled=${this.disabled}>
        ${this.label
          ? html`<legend class="label">${this.label}</legend>`
          : nothing}
        <div class="helper" ?hidden=${!this.helper}><slot name="helper">${this.helper}</slot></div>
        <div class="items">
          <slot></slot>
        </div>
        <div class="message warning" ?hidden=${!this.warning}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${WARNING_ICON}</svg>
          <slot name="warning">${this.warning}</slot>
        </div>
        <div class="message error" role="alert" ?hidden=${!this.error}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ERROR_ICON}</svg>
          <slot name="error">${this.error}</slot>
        </div>
      </fieldset>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scout-checkbox-group': ScoutCheckboxGroup;
  }
}
