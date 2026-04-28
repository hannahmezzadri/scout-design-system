/**
 * - `inline`     — appears within paragraph text. Always underlined.
 * - `standalone` — block-level link, often paired with an icon.
 * - `hyperlink`  — external link; auto-renders an "open in new tab" icon and
 *                  defaults to target="_blank" rel="noopener noreferrer".
 */
export type LinkType = 'inline' | 'standalone' | 'hyperlink';

export type LinkSize = 'default' | 'condensed';
