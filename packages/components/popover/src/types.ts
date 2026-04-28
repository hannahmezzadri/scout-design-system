export type TipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type TipAlignment = 'start' | 'center' | 'end';

export type TooltipVariant = 'simple' | 'advanced';
export type TooltipTrigger = 'text' | 'info-icon';

export type DatePickerType = 'single' | 'range' | 'month' | 'year';

/** Day-cell visual + functional states. Multiple may apply (e.g., selected + range). */
export type DayCellState =
  | 'default'
  | 'past'
  | 'unavailable'
  | 'selected'
  | 'range'
  | 'due'
  | 'late'
  | 'late-hover'
  | 'yellow'
  | 'red'
  | 'green'
  | 'statement';
