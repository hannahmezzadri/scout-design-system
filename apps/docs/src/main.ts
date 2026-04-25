// Connex token gallery — visualizes everything in @connex/tokens.

const PREFIX = '--connex';
const html = document.documentElement;

// --- Theme controls
const themeSel = document.getElementById('theme') as HTMLSelectElement;
const densitySel = document.getElementById('density') as HTMLSelectElement;
const brandSel = document.getElementById('brand') as HTMLSelectElement;

themeSel.addEventListener('change', () => html.setAttribute('data-theme', themeSel.value));
densitySel.addEventListener('change', () => html.setAttribute('data-density', densitySel.value));
brandSel.addEventListener('change', () => html.setAttribute('data-brand', brandSel.value));

// --- Helpers
function cssVar(name: string): string {
  return getComputedStyle(html).getPropertyValue(`${PREFIX}-${name}`).trim();
}

function el(tag: string, attrs: Record<string, string> = {}, ...children: (Node | string)[]): HTMLElement {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'style') node.setAttribute('style', v);
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(typeof c === 'string' ? document.createTextNode(c) : c);
  return node;
}

function section(id: string, title: string, lede: string): HTMLElement {
  return el('section', { id }, el('h2', {}, title), el('p', { class: 'lede' }, lede));
}

function categoryBanner(id: string, title: string, lede: string): HTMLElement {
  return el(
    'section',
    { id, class: 'category' },
    el('div', { class: 'category-banner' }, el('h1', {}, title), el('p', {}, lede)),
  );
}

function emptyPanel(title: string, body: string): HTMLElement {
  return el(
    'div',
    { class: 'empty-panel' },
    el('span', { class: 'badge' }, 'Coming soon'),
    el('h3', {}, title),
    el('p', {}, body),
  );
}

function colorSwatch(tokenName: string, displayName: string): HTMLElement {
  const value = cssVar(tokenName);
  return el(
    'div',
    { class: 'swatch' },
    el('div', { class: 'chip', style: `background: var(${PREFIX}-${tokenName})` }),
    el(
      'div',
      { class: 'meta' },
      el('span', { class: 'name' }, displayName),
      el('span', { class: 'value' }, value || '—'),
    ),
  );
}

function subhead(text: string): HTMLElement {
  return el('h3', { class: 'subheading' }, text);
}

const app = document.getElementById('app')!;

// =================================================================
// FOUNDATION
// =================================================================
{
  app.append(
    categoryBanner(
      'foundation-overview',
      'Foundation',
      'The principles, theming model, and accessibility baseline that every Connex token, component, and pattern is built on.',
    ),
  );

  const cards = el('div', { class: 'foundation-grid' });
  cards.append(
    el(
      'div',
      { class: 'foundation-card' },
      el('h4', {}, 'Tiered architecture'),
      el(
        'p',
        {},
        'Three tiers: Core (tokens, primitives, foundational components), Shared (cross-product patterns and page templates), Product (product-scoped patterns that can be promoted upward).',
      ),
    ),
    el(
      'div',
      { class: 'foundation-card' },
      el('h4', {}, 'Tokens as the source of truth'),
      el(
        'p',
        {},
        'Every visual property — color, typography, spacing, motion — is a token. Components consume tokens via CSS custom properties. No hard-coded values.',
      ),
    ),
    el(
      'div',
      { class: 'foundation-card' },
      el('h4', {}, 'Web Components'),
      el(
        'p',
        {},
        'Built with Lit and Shadow DOM. Framework-agnostic at the core, with ergonomic React (and later Vue, Angular) wrappers.',
      ),
    ),
  );
  app.append(
    el(
      'section',
      { id: 'foundation-arch' },
      el('h2', {}, 'Architecture'),
      el(
        'p',
        { class: 'lede' },
        'Connex is structured as a private monorepo. Each package versions independently and ships to a private npm registry.',
      ),
      cards,
    ),
  );

  app.append(
    section(
      'foundation-theming',
      'Theming',
      'Themes are scoped via data attributes on any element (typically <html>). Switching theme/density/brand is a single attribute change — no rebundle, no FOUC.',
    ),
  );
  const themingGrid = el('div', { class: 'foundation-grid' });
  themingGrid.append(
    el(
      'div',
      { class: 'foundation-card' },
      el('h4', {}, '[data-theme]'),
      el('p', {}, 'light · dark — semantic color tokens flip; primitives stay constant.'),
    ),
    el(
      'div',
      { class: 'foundation-card' },
      el('h4', {}, '[data-density]'),
      el('p', {}, 'default · condensed — typography line-heights and (later) component padding tighten for dense UIs.'),
    ),
    el(
      'div',
      { class: 'foundation-card' },
      el('h4', {}, '[data-brand]'),
      el(
        'p',
        {},
        'connex · empath · sage · onecomm · athena · graffiti · hubble · voyant · echo · e4a — brand color slots scope per product.',
      ),
    ),
  );
  app.append(themingGrid);

  app.append(
    section(
      'foundation-density',
      'Density',
      'Default vs. condensed. Condensed tightens typography line-heights so data-dense interfaces (agent desktops, tables) read more compactly without losing legibility.',
    ),
  );

  app.append(
    section(
      'foundation-accessibility',
      'Accessibility',
      'WCAG 2.1 AA is the baseline for color contrast, focus indicators, keyboard navigation, and screen-reader semantics. Components honor `prefers-reduced-motion`. Logical CSS properties (margin-inline, padding-block) are used throughout for future RTL support.',
    ),
  );

  app.append(
    section(
      'foundation-motion-principles',
      'Motion principles',
      'Motion is purposeful: enter motion decelerates (eases the user in), exit motion accelerates (gets out of the way), hover/focus is fast (≤150ms). Every animated component honors `prefers-reduced-motion: reduce` by collapsing durations to 0.',
    ),
  );
}

// =================================================================
// TOKENS
// =================================================================
{
  app.append(
    categoryBanner(
      'tokens-overview',
      'Tokens',
      'The atomic visual values of Connex. Three layers: primitives (raw values), semantic (purposeful aliases), composite (component-level token bundles).',
    ),
  );
}

// --- Colors (primitives)
{
  const sec = section(
    'colors',
    'Colors',
    'Primitive color scales (100 lightest → 800 darkest), alpha overlays for scrims, plus white and black anchors.',
  );
  const hues = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'];
  for (const hue of hues) {
    sec.append(subhead(hue.charAt(0).toUpperCase() + hue.slice(1)));
    const grid = el('div', { class: 'grid dense' });
    for (const stop of ['100', '200', '300', '400', '500', '600', '700', '800']) {
      grid.append(colorSwatch(`color-${hue}-${stop}`, `${hue}.${stop}`));
    }
    sec.append(grid);
  }
  sec.append(subhead('Alpha (black-based scrims)'));
  const alphaGrid = el('div', { class: 'grid dense' });
  for (const stop of ['100', '200', '300', '400', '500', '600', '700', '800']) {
    alphaGrid.append(colorSwatch(`color-alpha-${stop}`, `alpha.${stop}`));
  }
  sec.append(alphaGrid);

  sec.append(subhead('Alpha-white (for dark surfaces)'));
  const aWhite = el('div', { class: 'grid dense' });
  for (const stop of ['100', '200', '300', '400', '500', '600', '700', '800']) {
    aWhite.append(colorSwatch(`color-alpha-white-${stop}`, `alpha-white.${stop}`));
  }
  sec.append(aWhite);

  sec.append(subhead('Anchors'));
  const anchors = el('div', { class: 'grid dense' });
  anchors.append(colorSwatch('color-white', 'white'));
  anchors.append(colorSwatch('color-black', 'black'));
  sec.append(anchors);

  app.append(sec);
}

// --- Brand
{
  const sec = section(
    'brand',
    'Brand',
    'Per-product brand colors, scoped via [data-brand]. Switch the Brand control above to see the active set update.',
  );
  const brands: Array<[string, string[]]> = [
    ['connex', ['light', 'primary', 'dark']],
    ['empath', ['primary', 'accent']],
    ['sage', ['primary', 'cream']],
  ];
  for (const [b, keys] of brands) {
    sec.append(subhead(b.charAt(0).toUpperCase() + b.slice(1)));
    const grid = el('div', { class: 'grid' });
    for (const k of keys) {
      const tmp = document.createElement('div');
      tmp.setAttribute('data-brand', b);
      document.body.append(tmp);
      const val = getComputedStyle(tmp).getPropertyValue(`${PREFIX}-brand-${b}-${k}`).trim();
      tmp.remove();
      grid.append(
        el(
          'div',
          { class: 'swatch' },
          el('div', { class: 'chip', style: `background: ${val}` }),
          el(
            'div',
            { class: 'meta' },
            el('span', { class: 'name' }, `${b}.${k}`),
            el('span', { class: 'value' }, val || '—'),
          ),
        ),
      );
    }
    sec.append(grid);
  }
  app.append(sec);
}

// --- Typography
{
  const sec = section(
    'typography',
    'Typography',
    'Composite typography tokens. Literata for heading + display, Inter for everything else. Toggle Density to compare default vs. condensed.',
  );
  const styles: Array<[string, string, string]> = [
    ['display-large', 't-display-large', 'The agent desktop loads.'],
    ['display-small', 't-display-small', 'Connex powers Empath.'],
    ['heading-1', 't-h1', 'Account overview'],
    ['heading-2', 't-h2', 'Recent transactions'],
    ['heading-3', 't-h3', 'Pending actions'],
    ['heading-4', 't-h4', 'Customer details'],
    ['heading-5', 't-h5', 'Section label'],
    ['body-large', 't-body-large', 'Larger body text for emphasized paragraphs.'],
    ['body', 't-body', 'Body text for the main content of the page.'],
    ['body-small', 't-body-small', 'Smaller body text for tables and condensed contexts.'],
    ['label', 't-label', 'INPUT LABEL'],
    ['caption', 't-caption', 'Caption for footnotes, helper text, and metadata.'],
  ];
  for (const [name, cls, sample] of styles) {
    sec.append(
      el(
        'div',
        { class: 'specimen' },
        el(
          'div',
          { class: 'meta' },
          el('span', { class: 'key' }, name),
          el('span', { class: 'key' }, `var(${PREFIX}-typography-${name}-*)`),
        ),
        el('div', { class: cls }, sample),
      ),
    );
  }
  app.append(sec);
}

// --- Spacing
{
  const sec = section('spacing', 'Spacing', '4-based scale. Use these for padding, margin, gap.');
  const stops = ['0', '4', '8', '12', '16', '24', '32', '48', '64', '96'];
  for (const s of stops) {
    sec.append(
      el(
        'div',
        { class: 'space-row' },
        el('div', { class: 'label' }, `space.${s}`),
        el('div', { class: 'bar', style: `width: var(${PREFIX}-space-${s})` }),
        el('div', { class: 'value' }, cssVar(`space-${s}`) || '0px'),
      ),
    );
  }
  app.append(sec);
}

// --- Radius
{
  const sec = section('radius', 'Corner radius', 'Border-radius scale. 999 = fully rounded (pill / circle).');
  const grid = el('div', { class: 'grid' });
  for (const r of ['0', '2', '4', '8', '12', '999']) {
    grid.append(
      el(
        'div',
        { class: 'radius-row' },
        el('div', { class: 'box', style: `border-radius: var(${PREFIX}-radius-${r})` }),
        el('span', { class: 'name' }, `radius.${r}`),
        el('span', { class: 'value' }, cssVar(`radius-${r}`)),
      ),
    );
  }
  sec.append(grid);
  app.append(sec);
}

// --- Border width
{
  const sec = section('border', 'Border width', 'Border thickness scale.');
  const grid = el('div', { class: 'grid' });
  for (const w of ['0', '1', '2']) {
    grid.append(
      el(
        'div',
        { class: 'radius-row border-row' },
        el('div', { class: 'box', style: `border-width: var(${PREFIX}-border-width-${w})` }),
        el('span', { class: 'name' }, `border-width.${w}`),
        el('span', { class: 'value' }, cssVar(`border-width-${w}`)),
      ),
    );
  }
  sec.append(grid);
  app.append(sec);
}

// --- Elevation
{
  const sec = section('elevation', 'Elevation', 'Box-shadow tokens. Levels 1–4 increase in depth.');
  const grid = el('div', { class: 'grid' });
  for (const lvl of ['1', '2', '3', '4']) {
    grid.append(
      el(
        'div',
        { class: 'elev-card', style: `box-shadow: var(${PREFIX}-elevation-${lvl})` },
        el('span', { class: 'name' }, `elevation.${lvl}`),
        el('span', { class: 'value' }, `var(${PREFIX}-elevation-${lvl})`),
      ),
    );
  }
  sec.append(grid);
  app.append(sec);
}

// --- Motion
{
  const sec = section(
    'motion',
    'Motion',
    'Hover any card to play the duration × easing combo. Reduced-motion preferences are honored at the component level when shipped.',
  );
  const durations = ['fast', 'base', 'slow', 'deliberate'];
  const easings = ['standard', 'enter', 'exit', 'emphasis'];
  const grid = el('div', { class: 'motion-grid' });
  for (const d of durations) {
    for (const e of easings) {
      grid.append(
        el(
          'div',
          {
            class: 'motion-card',
            style: `--motion-duration: var(${PREFIX}-motion-duration-${d}); --motion-ease: var(${PREFIX}-motion-easing-${e})`,
          },
          el('span', { class: 'name' }, `${d} · ${e}`),
          el('span', { class: 'value' }, `${cssVar(`motion-duration-${d}`)} · ${e}`),
          el('div', { class: 'ball' }),
        ),
      );
    }
  }
  sec.append(grid);
  app.append(sec);
}

// --- Z-index
{
  const sec = section('z-index', 'Z-index', 'Stacking layers. Higher tokens always render above lower tokens.');
  const stack = el('div', { class: 'z-stack' });
  const layers: Array<[string, number, number]> = [
    ['base (0)', 16, 16],
    ['raised (10)', 40, 40],
    ['sticky (100)', 64, 64],
    ['overlay (1000)', 88, 88],
    ['modal (2000)', 112, 112],
    ['contextual (5000)', 136, 136],
    ['dynamic (9000)', 160, 160],
  ];
  layers.forEach(([name, top, left], i) => {
    stack.append(
      el('div', { class: 'layer', style: `top: ${top}px; left: ${left}px; z-index: ${i}` }, name),
    );
  });
  sec.append(stack);
  app.append(sec);
}

// --- Semantic
{
  const sec = section(
    'semantic',
    'Semantic',
    'Aliases that components consume. Switch theme/density above to watch them shift.',
  );

  sec.append(subhead('Text — display'));
  const tDisplay = el('div', { class: 'grid' });
  for (const k of ['primary', 'secondary', 'info', 'warning', 'error', 'success', 'increase', 'decrease']) {
    tDisplay.append(colorSwatch(`text-display-${k}`, `text.display.${k}`));
  }
  sec.append(tDisplay);

  sec.append(subhead('Text — interactive'));
  const tInter = el('div', { class: 'grid' });
  for (const k of ['primary', 'secondary', 'info', 'warning', 'error', 'success', 'increase', 'decrease']) {
    tInter.append(colorSwatch(`text-interactive-${k}`, `text.interactive.${k}`));
  }
  sec.append(tInter);

  sec.append(subhead('Icon — display'));
  const iDisplay = el('div', { class: 'grid' });
  for (const k of ['primary', 'secondary', 'info', 'warning', 'error', 'success', 'increase', 'decrease']) {
    iDisplay.append(colorSwatch(`icon-display-${k}`, `icon.display.${k}`));
  }
  sec.append(iDisplay);

  sec.append(subhead('Border'));
  const bg = el('div', { class: 'grid' });
  for (const k of ['primary', 'secondary', 'knockout', 'info', 'warning', 'error', 'success']) {
    bg.append(colorSwatch(`border-color-${k}`, `border-color.${k}`));
  }
  sec.append(bg);

  sec.append(subhead('Background'));
  const bgs = el('div', { class: 'grid' });
  for (const k of ['page', 'surface', 'scrim']) {
    bgs.append(colorSwatch(`background-${k}`, `background.${k}`));
  }
  sec.append(bgs);

  app.append(sec);
}

// =================================================================
// COMPONENTS (placeholder)
// =================================================================
{
  app.append(
    categoryBanner(
      'components-overview',
      'Components',
      'Reusable Lit Web Components built on Connex tokens. Form-associated via ElementInternals, accessible to WCAG 2.1 AA, framework-agnostic with React wrappers.',
    ),
  );
  app.append(
    el(
      'div',
      { class: 'foundation-grid' },
      emptyPanel('Button', 'Primary, secondary, tertiary, destructive variants. Sizes: small, medium, large. Loading and icon states.'),
      emptyPanel('Input', 'Text, email, number, password. Native form association. Validation states wired to border-color.error and text-display-error.'),
      emptyPanel('Modal', 'Focus-trapped, dismissible, scrim-backed. Uses elevation.4 + motion.duration.slow on enter.'),
      emptyPanel('Table', 'Sortable, virtualized, sticky-header. Condensed-density-aware row heights.'),
      emptyPanel('Tabs', 'Horizontal and vertical orientations. Keyboard navigation, ARIA tablist semantics.'),
      emptyPanel('Toast', 'Stack of dismissible notifications. Status variants (info, success, warning, error). Reduced-motion compliant.'),
    ),
  );
}

// =================================================================
// PATTERNS (placeholder)
// =================================================================
{
  app.append(
    categoryBanner(
      'patterns-overview',
      'Patterns',
      'Combinations of components that solve recurring UX problems. Cross-product patterns live in core; product-specific patterns live in product repos and can be promoted upward.',
    ),
  );
  app.append(
    el(
      'div',
      { class: 'foundation-grid' },
      emptyPanel('Empty state', 'Illustration, headline, description, primary action. Used when data is missing or unavailable.'),
      emptyPanel('Form', 'Field grouping, inline validation, submission states, error summaries.'),
      emptyPanel('Workflow stepper', 'Linear multi-step processes (close account, make payment). Progress indicator and back/next controls.'),
      emptyPanel('Data table pattern', 'Toolbar + table + pagination. Filtering, sorting, bulk actions, row selection.'),
    ),
  );
}

// =================================================================
// TEMPLATES (placeholder)
// =================================================================
{
  app.append(
    categoryBanner(
      'templates-overview',
      'Templates',
      'Page-level layouts that combine patterns and components. Templates standardize the high-level shape of pages across products.',
    ),
  );
  app.append(
    el(
      'div',
      { class: 'foundation-grid' },
      emptyPanel('Settings page', 'Sidebar navigation + scrolling content with section anchors. Used for any preference or configuration UI.'),
      emptyPanel('Dashboard', 'Header + stat cards + chart row + activity table. The default landing for product home views.'),
      emptyPanel('Detail view', 'Header with key actions, metadata strip, tabbed body. Used for entity pages (customer, account, ticket).'),
      emptyPanel('List + filter', 'Filter sidebar + searchable, sortable list + detail panel. Used for any list-heavy product surface.'),
    ),
  );
}

// --- Sidebar active-link highlighting on scroll
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav-group li a'));
const anchorIds = links
  .map((a) => a.getAttribute('href')?.replace('#', ''))
  .filter(Boolean) as string[];

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        for (const a of links) {
          const li = a.closest('li');
          if (!li) continue;
          if (a.getAttribute('href') === `#${id}`) li.classList.add('active');
          else li.classList.remove('active');
        }
      }
    }
  },
  { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
);
for (const id of anchorIds) {
  const node = document.getElementById(id);
  if (node) observer.observe(node);
}

// --- Mobile nav (hamburger) toggle
const navToggle = document.getElementById('nav-toggle');
const scrim = document.getElementById('sidebar-scrim');
const sidebar = document.getElementById('sidebar');
const mq = window.matchMedia('(max-width: 960px)');

function setNavOpen(open: boolean) {
  document.body.classList.toggle('nav-open', open);
  navToggle?.setAttribute('aria-expanded', String(open));
}
function closeNav() {
  setNavOpen(false);
}

navToggle?.addEventListener('click', () => {
  setNavOpen(!document.body.classList.contains('nav-open'));
});
scrim?.addEventListener('click', closeNav);

// Close drawer when a sidebar link is tapped (mobile UX)
sidebar?.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.closest('a[href^="#"]') && mq.matches) closeNav();
});

// Reset state when crossing the breakpoint back to desktop
mq.addEventListener('change', (e) => {
  if (!e.matches) closeNav();
});

// Esc closes the drawer
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.classList.contains('nav-open')) closeNav();
});
