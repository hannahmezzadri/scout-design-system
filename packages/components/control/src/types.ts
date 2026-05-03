/** Built-in control icon types. */
export type ControlType =
  | 'x-close' // closes dialogs, alerts, banners
  | 'x-clear' // clears the value of a text field
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-left-double' // navigates to the first item
  | 'arrow-right-double' // navigates to the last item
  | 'chevron-up'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'tooltip' // triggers a popover with additional context
  | 'trash' // deletes a record
  | 'kebab'; // triggers a popover menu

export type ControlSize = 'default' | 'condensed';

/** `critical` is only valid when `type="trash"`. */
export type ControlColor = 'primary' | 'critical';
