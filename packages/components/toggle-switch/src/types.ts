export type ToggleSwitchSize = 'default' | 'condensed';
export type ToggleLabelPlacement = 'left' | 'right';
/**
 * Functional state.
 *  - `off` — track + knob in the resting (gray) palette
 *  - `on`  — track + knob in interactive primary (blue)
 *  - `on-critical` — track + knob in critical (red); use when the switch
 *      enables a destructive or potentially-dangerous capability
 */
export type ToggleVariant = 'off' | 'on' | 'on-critical';
