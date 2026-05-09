/**
 * Convenience entry: registers every illustration in one import. For
 * tree-shaking, prefer the per-illustration subpath imports
 * (`@scout-ds/illustrations/accordion`, etc.).
 */
export { ScoutIllustrationBase } from './base.js';
export { ScoutIllustrationAccordion } from './accordion.js';
export { ScoutIllustrationAddress } from './address.js';
export { ScoutIllustrationAvatar } from './avatar.js';
export type { IllustrationSize } from './types.js';

import './accordion.js';
import './address.js';
import './avatar.js';
