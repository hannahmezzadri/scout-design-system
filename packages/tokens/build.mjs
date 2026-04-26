/**
 * Connex token build pipeline.
 *
 * Produces:
 *   dist/css/tokens.css            — primitives + light semantic + default density (`:root`)
 *   dist/css/dark.css              — dark overrides (`[data-theme="dark"]`)
 *   dist/css/density-condensed.css — condensed typography (`[data-density="condensed"]`)
 *   dist/css/brand-{connex,empath,sage}.css — brand colors (`[data-brand="..."]`)
 *   dist/json/tokens.json          — flat JSON of all base tokens
 *   dist/ts/tokens.js + .d.ts      — typed JS/TS exports
 *   dist/tailwind/preset.js + .d.ts — Tailwind v4 preset wired to CSS vars
 */

import StyleDictionary from 'style-dictionary';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const PREFIX = 'connex';
const OUT = 'dist';

function ensureDir(file) {
  mkdirSync(dirname(file), { recursive: true });
}

const baseOpts = (overrides) => ({
  log: { verbosity: 'silent', warnings: 'warn', errors: { brokenReferences: 'throw' } },
  expand: { include: ['typography'] },
  ...overrides,
});

// 1. Base build: primitives + semantic (light defaults + default density typography)
async function buildBase() {
  const sd = new StyleDictionary(
    baseOpts({
      source: ['src/primitive/**/*.json', 'src/semantic/**/*.json'],
      platforms: {
        css: {
          transformGroup: 'css',
          prefix: PREFIX,
          buildPath: `${OUT}/css/`,
          files: [
            {
              destination: 'tokens.css',
              format: 'css/variables',
              options: { selector: ':root, [data-theme="light"]', outputReferences: false },
            },
          ],
        },
        json: {
          transformGroup: 'js',
          prefix: PREFIX,
          buildPath: `${OUT}/json/`,
          files: [{ destination: 'tokens.json', format: 'json/flat' }],
        },
        js: {
          transformGroup: 'js',
          prefix: PREFIX,
          buildPath: `${OUT}/ts/`,
          files: [
            { destination: 'tokens.js', format: 'javascript/es6' },
            { destination: 'tokens.d.ts', format: 'typescript/es6-declarations' },
          ],
        },
      },
    }),
  );
  await sd.buildAllPlatforms();
}

// 2. Overlay build: include primitives so refs resolve, but only emit tokens
//    that originate from the overlay source file (filter by filePath).
async function buildOverlay({ sourceFile, selector, fileName }) {
  const absSource = resolve(sourceFile);
  const onlyOverlay = (token) => resolve(token.filePath) === absSource;

  const sd = new StyleDictionary(
    baseOpts({
      include: ['src/primitive/**/*.json'],
      source: [sourceFile],
      platforms: {
        css: {
          transformGroup: 'css',
          prefix: PREFIX,
          buildPath: `${OUT}/css/`,
          files: [
            {
              destination: fileName,
              format: 'css/variables',
              filter: onlyOverlay,
              options: { selector, outputReferences: false },
            },
          ],
        },
      },
    }),
  );
  await sd.buildAllPlatforms();
}

// 3. Tailwind preset (CSS-var based, themed via data attributes)
function generateTailwindPreset() {
  const v = (name) => `var(--${PREFIX}-${name})`;

  const colorScale = (hue) =>
    Object.fromEntries(
      ['100', '200', '300', '400', '500', '600', '700', '800'].map((s) => [s, v(`color-${hue}-${s}`)]),
    );

  const colors = {
    red: colorScale('red'),
    yellow: colorScale('yellow'),
    green: colorScale('green'),
    blue: colorScale('blue'),
    purple: colorScale('purple'),
    teal: colorScale('teal'),
    'cool-gray': colorScale('cool-gray'),
    'warm-gray': colorScale('warm-gray'),
    alpha: colorScale('alpha'),
    'alpha-white': colorScale('alpha-white'),
    white: v('color-white'),
    black: v('color-black'),
    text: {
      'display-primary': v('text-display-primary'),
      'display-secondary': v('text-display-secondary'),
      'display-info': v('text-display-info'),
      'display-warning': v('text-display-warning'),
      'display-error': v('text-display-error'),
      'display-success': v('text-display-success'),
      'display-increase': v('text-display-increase'),
      'display-decrease': v('text-display-decrease'),
      'interactive-primary': v('text-interactive-primary'),
      'interactive-secondary': v('text-interactive-secondary'),
      'interactive-info': v('text-interactive-info'),
      'interactive-warning': v('text-interactive-warning'),
      'interactive-error': v('text-interactive-error'),
      'interactive-success': v('text-interactive-success'),
      'interactive-increase': v('text-interactive-increase'),
      'interactive-decrease': v('text-interactive-decrease'),
    },
    icon: {
      'display-primary': v('icon-display-primary'),
      'display-secondary': v('icon-display-secondary'),
      'interactive-primary': v('icon-interactive-primary'),
      'interactive-secondary': v('icon-interactive-secondary'),
    },
    border: {
      none: 'transparent',
      primary: v('border-color-primary'),
      secondary: v('border-color-secondary'),
      knockout: v('border-color-knockout'),
      info: v('border-color-info'),
      warning: v('border-color-warning'),
      error: v('border-color-error'),
      success: v('border-color-success'),
    },
    bg: {
      page: v('background-page'),
      surface: v('background-surface'),
      scrim: v('background-scrim'),
    },
  };

  const spacing = Object.fromEntries(
    ['0', '4', '8', '12', '16', '24', '32', '48', '64', '96'].map((s) => [s, v(`space-${s}`)]),
  );

  const borderRadius = {
    none: v('radius-0'),
    xs: v('radius-2'),
    sm: v('radius-4'),
    md: v('radius-8'),
    lg: v('radius-12'),
    full: v('radius-999'),
  };

  const borderWidth = {
    0: v('border-width-0'),
    1: v('border-width-1'),
    2: v('border-width-2'),
  };

  const fontFamily = {
    sans: v('font-family-inter'),
    serif: v('font-family-literata'),
  };

  const fontSize = Object.fromEntries(
    ['10', '12', '14', '16', '20', '24', '32', '48', '64'].map((s) => [s, v(`font-size-${s}`)]),
  );

  const fontWeight = {
    'extra-light': v('font-weight-extra-light'),
    light: v('font-weight-light'),
    regular: v('font-weight-regular'),
    medium: v('font-weight-medium'),
    semibold: v('font-weight-semibold'),
    bold: v('font-weight-bold'),
  };

  const lineHeight = Object.fromEntries(
    ['15', '18', '21', '24', '30', '36', '40', '64', '76'].map((s) => [s, v(`font-line-height-${s}`)]),
  );

  const boxShadow = {
    1: v('elevation-1'),
    2: v('elevation-2'),
    3: v('elevation-3'),
    4: v('elevation-4'),
  };

  const transitionDuration = {
    instant: v('motion-duration-instant'),
    fast: v('motion-duration-fast'),
    base: v('motion-duration-base'),
    slow: v('motion-duration-slow'),
    deliberate: v('motion-duration-deliberate'),
  };

  const transitionTimingFunction = {
    linear: v('motion-easing-linear'),
    standard: v('motion-easing-standard'),
    enter: v('motion-easing-enter'),
    exit: v('motion-easing-exit'),
    emphasis: v('motion-easing-emphasis'),
  };

  const zIndex = {
    base: '0',
    raised: '10',
    sticky: '100',
    overlay: '1000',
    modal: '2000',
    contextual: '5000',
    dynamic: '9000',
  };

  const preset = {
    theme: {
      colors,
      spacing,
      borderRadius,
      borderWidth,
      fontFamily,
      fontSize,
      fontWeight,
      lineHeight,
      boxShadow,
      transitionDuration,
      transitionTimingFunction,
      zIndex,
    },
  };

  const file = `${OUT}/tailwind/preset.js`;
  ensureDir(file);
  writeFileSync(
    file,
    `// Auto-generated by @connex/tokens build. Do not edit by hand.\n` +
      `// Tailwind preset wired to Connex CSS custom properties.\n` +
      `// Consumers: import preset from '@connex/tokens/tailwind';\n\n` +
      `const preset = ${JSON.stringify(preset, null, 2)};\n\n` +
      `export default preset;\n`,
  );

  writeFileSync(
    `${OUT}/tailwind/preset.d.ts`,
    `import type { Config } from 'tailwindcss';\ndeclare const preset: Partial<Config>;\nexport default preset;\n`,
  );
}

// Run all builds
console.log('Building Connex tokens...');
await buildBase();
await buildOverlay({
  sourceFile: 'src/themes/dark.json',
  selector: '[data-theme="dark"]',
  fileName: 'dark.css',
});
await buildOverlay({
  sourceFile: 'src/themes/density-condensed.json',
  selector: '[data-density="condensed"]',
  fileName: 'density-condensed.css',
});
await buildOverlay({
  sourceFile: 'src/brand/connex.json',
  selector: '[data-brand="connex"]',
  fileName: 'brand-connex.css',
});
await buildOverlay({
  sourceFile: 'src/brand/empath.json',
  selector: '[data-brand="empath"]',
  fileName: 'brand-empath.css',
});
await buildOverlay({
  sourceFile: 'src/brand/sage.json',
  selector: '[data-brand="sage"]',
  fileName: 'brand-sage.css',
});

generateTailwindPreset();

console.log('✓ Connex tokens built to dist/');
