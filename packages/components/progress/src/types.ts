export type ProgressBarDisplay = 'number' | 'percentage' | 'bar-only';

export type ProgressGaugeSize = 'small' | 'medium' | 'large' | 'x-large';

export type StepperOrientation = 'horizontal' | 'vertical';

/**
 * State machine for an individual step in either a horizontal or vertical stepper.
 *
 *  - not-started        → empty circle, secondary border
 *  - in-progress        → half-filled / focus ring
 *  - completed          → filled with check
 *  - action-needed      → warning fill with exclamation
 *  - expired            → critical fill with exclamation
 *  - expired-completed  → gray check (the step was completed but the flow expired)
 *  - last-completed     → terminal "you're done" appearance (larger ring + check)
 *  - last-awaiting      → terminal "awaiting info" appearance (dashed ring)
 */
export type StepperState =
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'action-needed'
  | 'expired'
  | 'expired-completed'
  | 'last-completed'
  | 'last-awaiting';

export interface StepperStep {
  label: string;
  state: StepperState;
  /** Optional secondary text rendered under the label. */
  secondary?: string;
  /** Optional tooltip body shown on hover/focus of the step. */
  tooltip?: string;
}

export interface TimelineItem {
  /** Title (top line). */
  title: string;
  /** Subtitle (e.g., timestamp or actor). */
  subtitle?: string;
  /** Body content as plain text or a slot id for advanced authoring. */
  content?: string;
  /** Initial expansion state. Defaults to false (collapsed). */
  expanded?: boolean;
}
