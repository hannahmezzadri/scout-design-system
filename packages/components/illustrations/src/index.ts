/**
 * Convenience entry: registers every illustration in one import. For
 * tree-shaking, prefer the per-illustration subpath imports
 * (`@connex/illustrations/accordion`, etc.).
 */
export { ConnexIllustrationBase } from './base.js';
export { ConnexIllustrationAccordion } from './accordion.js';
export { ConnexIllustrationAddress } from './address.js';
export { ConnexIllustrationAvatar } from './avatar.js';
export type { IllustrationSize } from './types.js';

import './accordion.js';
import './address.js';
import './avatar.js';
