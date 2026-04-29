// Scout docs — page-based router. Sidebar clicks switch which page is visible.
// No anchor scrolling. Each sidebar link corresponds to one .page element.

// Register dropdown, accordion, anchor-links, and badge early so the topbar,
// sidebar, and every page-eyebrow badge (which dogfood these components)
// upgrade on first paint.
import '@scout/dropdown';
import '@scout/accordion';
import '@scout/anchor-links';
import '@scout/badge';
// Tile registers the scout-tile-button used by every overview page's grid.
import '@scout/tile';
// Text-input + checkbox are used by every Controls panel via the ctrlText /
// ctrlCheck helpers below; eager-import so the elements are upgraded before
// any controls render.
import '@scout/text-input';
import '@scout/checkbox';
// Tabs power both the per-page tab list (componentPage helper) and the Colors
// page's tabbed view; eager-import so they're upgraded on first paint.
import '@scout/tabs';
// Segmented control is used by Tokens > Iconography (icon-style switcher);
// hoisted here so the elements are upgraded before that page renders.
import '@scout/segmented-control';
import type { AnchorLinkItem } from '@scout/anchor-links';

const PREFIX = '--scout';
const html = document.documentElement;

// --- Theme controls (now <scout-dropdown-select>)
type DropdownEl = HTMLElement & { value: string };
const brandSel = document.getElementById('brand') as DropdownEl;
const themeSel = document.getElementById('theme') as DropdownEl;
const densitySel = document.getElementById('density') as DropdownEl;
brandSel.addEventListener('scout-dropdown-change', () =>
  html.setAttribute('data-brand', brandSel.value),
);
themeSel.addEventListener('scout-dropdown-change', () =>
  html.setAttribute('data-theme', themeSel.value),
);
densitySel.addEventListener('scout-dropdown-change', () =>
  html.setAttribute('data-density', densitySel.value),
);

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

/**
 * Controls-panel dropdown helper. Returns a `<scout-dropdown-select size="condensed">`
 * with the supplied options, and bridges its `scout-dropdown-change` event to a
 * native `change` event so existing render() loops in each control panel keep working.
 */
type DDOption = string | { value: string; label: string };
function ddSelect(
  id: string,
  options: readonly DDOption[],
  value?: string,
): HTMLElement & { value: string } {
  const dd = document.createElement('scout-dropdown-select') as HTMLElement & { value: string };
  dd.id = id;
  dd.setAttribute('size', 'condensed');
  const norm = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  // Default to first option to mirror native <select> behavior used previously
  dd.setAttribute('value', value ?? norm[0]?.value ?? '');
  for (const { value: v, label } of norm) {
    const o = document.createElement('scout-dropdown-option');
    o.setAttribute('value', v);
    o.textContent = label;
    dd.appendChild(o);
  }
  dd.addEventListener('scout-dropdown-change', () => {
    dd.dispatchEvent(new Event('change', { bubbles: true }));
  });
  return dd;
}

/**
 * Controls-panel text field. Returns a `<scout-text-field size="condensed">`
 * with the same `.value` getter and native `input`/`change` events that the
 * docs' render() loops expect, so existing wiring keeps working unchanged.
 */
function ctrlText(
  id: string,
  value = '',
  opts: { placeholder?: string; type?: 'text' | 'number' } = {},
): HTMLElement & { value: string } {
  const t = document.createElement('scout-text-field') as HTMLElement & { value: string };
  t.id = id;
  t.setAttribute('size', 'condensed');
  // The `number` variant strips non-digits as the user types; bounds
  // (min/max) are enforced by the consuming render() function.
  if (opts.type === 'number') t.setAttribute('variant', 'number');
  if (value) t.setAttribute('value', value);
  if (opts.placeholder) t.setAttribute('placeholder', opts.placeholder);
  return t;
}

/**
 * Controls-panel checkbox. Returns a `<scout-checkbox>` whose label content
 * is slotted from `label`, so the surrounding `el('label', {}, chk, ' Text')`
 * wrapper used previously is no longer needed — drop the chk into the
 * `.ctrl-checks` container directly.
 */
function ctrlCheck(
  id: string,
  label: string,
  opts: { checked?: boolean } = {},
): HTMLElement & { checked: boolean } {
  const c = document.createElement('scout-checkbox') as HTMLElement & { checked: boolean };
  c.id = id;
  if (opts.checked) c.setAttribute('checked', '');
  c.appendChild(document.createTextNode(label));
  return c;
}

/**
 * Toggle a controls-panel field's enablement. The field stays visible (so the
 * panel still tells the full prop story for the component / variant), but its
 * inner control is disabled and the wrapper picks up `is-disabled` so the
 * label dims via CSS. Used to gate child props by their parent — e.g. the
 * "Workflow header state" field is disabled when the Tile variant is set to
 * tile or tile-button. Last-set values are preserved across toggles.
 */
function setFieldDisabled(field: HTMLElement, control: HTMLElement, disabled: boolean): void {
  field.classList.toggle('is-disabled', disabled);
  if (disabled) control.setAttribute('disabled', '');
  else control.removeAttribute('disabled');
}

/** Standard `.ctrl-field` wrapper used by every component's controls panel. */
function ctrlField(label: string, htmlFor: string, control: HTMLElement): HTMLElement {
  return el('div', { class: 'ctrl-field' }, el('label', { for: htmlFor }, label), control);
}

function page(id: string, ...children: (Node | string)[]): HTMLElement {
  return el('section', { id, class: 'page', 'data-page': id }, ...children);
}

/**
 * Knockout low-emphasis badge rendered above the page title — identifies the
 * page kind ("Token" / "Component" / "Pattern"). Uses the live scout-badge
 * component so all docs eyebrows match the badge component's visual contract.
 */
function pageBadge(label: 'Token' | 'Component' | 'Pattern'): HTMLElement {
  const b = document.createElement('scout-badge');
  b.setAttribute('type', 'neutral-knockout');
  b.setAttribute('emphasis', 'low');
  b.setAttribute('size', 'condensed');
  b.className = 'page-badge';
  b.textContent = label;
  return b;
}

function header(title: string, lede: string, kind?: 'Token'): HTMLElement {
  return el(
    'div',
    { class: 'page-header' },
    ...(kind ? [pageBadge(kind)] : []),
    el('h2', {}, title),
    el('p', { class: 'lede' }, lede),
  );
}

function categoryBanner(title: string, lede: string): HTMLElement {
  return el('div', { class: 'category-banner' }, el('h1', {}, title), el('p', {}, lede));
}

/**
 * Shared overview-page card. Every overview (Tokens, Components, Patterns,
 * Templates) renders its grid as `<scout-tile-button>`s through this
 * helper. Click navigates to `href` (hash route); coming-soon variants are
 * disabled and show a yellow "Coming soon" badge above the summary.
 */
function overviewTile(opts: {
  title: string;
  summary: string;
  href?: string;
  comingSoon?: boolean;
}): HTMLElement {
  const tile = document.createElement('scout-tile-button');
  tile.setAttribute('header', opts.title);
  if (opts.comingSoon) tile.setAttribute('disabled', '');

  // Body slot — when a tile is "coming soon" we prepend a yellow warning
  // badge so the state is communicated by both the disabled styling AND a
  // textual marker.
  const body = el('div', { class: 'overview-tile-body' });
  if (opts.comingSoon) {
    const b = document.createElement('scout-badge');
    b.setAttribute('type', 'warning');
    b.setAttribute('emphasis', 'low');
    b.setAttribute('size', 'condensed');
    b.textContent = 'Coming soon';
    body.appendChild(b);
  }
  body.appendChild(el('p', {}, opts.summary));
  tile.appendChild(body);

  if (opts.href && !opts.comingSoon) {
    tile.addEventListener('scout-tile-click', () => {
      const next = `#${opts.href}`;
      if (location.hash !== next) location.hash = next;
    });
  }
  return tile;
}

function emptyPanel(title: string, body: string): HTMLElement {
  // "Coming soon" tag uses the warning (yellow) badge to match the rest of the
  // doc site's "soon" indicators (e.g. anchor-links sidebar tags).
  const badge = document.createElement('scout-badge');
  badge.setAttribute('type', 'warning');
  badge.setAttribute('emphasis', 'low');
  badge.setAttribute('size', 'condensed');
  badge.textContent = 'Coming soon';
  return el(
    'div',
    { class: 'empty-panel' },
    badge,
    el('h3', {}, title),
    el('p', {}, body),
  );
}

// Build a map of semantic-token-name → primitive ref ("cool-gray.800") at build time
// by reading the semantic JSON sources. Lets swatches show their primitive lineage
// without hand-maintaining a parallel list.
type DTCGLeaf = { $value?: unknown; $type?: string };
const semanticSources = import.meta.glob('../../../packages/tokens/src/semantic/*.json', {
  eager: true,
}) as Record<string, { default: Record<string, unknown> }>;

const semanticRefs: Record<string, string> = {};
function walkRefs(node: unknown, path: string[]) {
  if (!node || typeof node !== 'object') return;
  for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
    if (key.startsWith('$') || !val || typeof val !== 'object') continue;
    const leaf = val as DTCGLeaf;
    if ('$value' in leaf) {
      const v = leaf.$value;
      if (typeof v === 'string' && v.startsWith('{') && v.endsWith('}')) {
        const tokenName = [...path, key].join('-');
        // Strip the "color." prefix so the displayed ref is "cool-gray.800" instead of "color.cool-gray.800"
        semanticRefs[tokenName] = v.slice(1, -1).replace(/^color\./, '');
      }
    } else {
      walkRefs(val, [...path, key]);
    }
  }
}
for (const mod of Object.values(semanticSources)) walkRefs(mod.default, []);

function colorSwatch(tokenName: string, displayName: string): HTMLElement {
  const value = cssVar(tokenName);
  const ref = semanticRefs[tokenName];
  const meta = el(
    'div',
    { class: 'meta' },
    el('span', { class: 'name' }, displayName),
  );
  if (ref) meta.append(el('span', { class: 'value value--ref' }, ref));
  meta.append(el('span', { class: 'value' }, value || '—'));
  return el(
    'div',
    { class: 'swatch' },
    el('div', { class: 'chip', style: `background: var(${PREFIX}-${tokenName})` }),
    meta,
  );
}

function subhead(text: string): HTMLElement {
  return el('h3', { class: 'subheading' }, text);
}

// --- Hero icon helper (shared across docs pages)
// Bulk-imports the solid 24-pixel Hero Icons via Vite glob (?raw → svg string).
// `heroIconSvg('check-circle', 20)` returns an <svg> sized to the requested px,
// using currentColor so it inherits whatever color is set on the parent.
const heroSolidIcons24 = import.meta.glob('../node_modules/heroicons/24/solid/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function heroIconSvg(name: string, sizePx = 20): SVGElement {
  const path = Object.keys(heroSolidIcons24).find((p) => p.endsWith(`/${name}.svg`));
  const tmp = document.createElement('div');
  tmp.innerHTML = path ? heroSolidIcons24[path]! : '<svg></svg>';
  const svg = tmp.querySelector('svg')!;
  svg.removeAttribute('class');
  svg.removeAttribute('data-slot');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', String(sizePx));
  svg.setAttribute('height', String(sizePx));
  return svg;
}

const app = document.getElementById('app')!;

// =================================================================
// FOUNDATION
// =================================================================

// foundation-overview
{
  /**
   * Renders a colored "section card" — a primitive-color-themed container
   * with a title, body copy, optional illustration placeholder, and optional
   * structured content. Backgrounds use the 50-step primitive scales so each
   * section reads with a distinct identity while staying brand-cohesive.
   */
  function sectionCard(opts: {
    tone: 'blue' | 'teal' | 'purple' | 'green' | 'yellow';
    eyebrow: string;
    title: string;
    body: string;
    items?: string[];
    illustration?: string;
  }): HTMLElement {
    const card = el('section', {
      class: `overview-card overview-card--${opts.tone}`,
    },
      el('div', { class: 'overview-card__copy' },
        el('div', { class: 'overview-card__eyebrow' }, opts.eyebrow),
        el('h3', { class: 'overview-card__title' }, opts.title),
        el('p', { class: 'overview-card__body' }, opts.body),
        ...(opts.items
          ? [el('ul', { class: 'overview-card__list' },
              ...opts.items.map((i) => el('li', {}, i)))]
          : []),
      ),
      el('div', { class: 'overview-card__illustration', 'aria-hidden': 'true' },
        el('span', { class: 'overview-card__illustration-label' },
          opts.illustration ?? 'Illustration'),
      ),
    );
    return card;
  }

  // Hero — full-width intro stating what Scout is and which products it
  // empowers. Pill-style product chips render directly inline with the copy.
  const products = ['Ember', 'Snag', 'Onward', 'Acorn', 'Grub', 'Huddle', 'Venture', 'Embark', 'Etch', 'Owt'];
  const hero = el('section', { class: 'overview-hero' },
    el('div', { class: 'overview-hero__copy' },
      el('div', { class: 'overview-hero__eyebrow' }, 'Scout'),
      el('h2', { class: 'overview-hero__title' }, "Capital Two's design system for internal products within Card Servicing"),
      el('p', { class: 'overview-hero__body' },
        'Scout empowers a family of products with a single, cohesive visual and interaction language. It is built on atomic design methodology and follows a tokens → components → patterns → templates structure. Tokens and components are specific to Scout and form the building blocks of the system. Patterns and templates ship in both core/shared form and product-specific form.'),
      el('div', { class: 'overview-hero__products' },
        el('span', { class: 'overview-hero__products-label' }, 'Empowers'),
        ...products.map((p) => el('span', { class: 'overview-hero__product-chip' }, p)),
      ),
    ),
    el('div', { class: 'overview-hero__illustration', 'aria-hidden': 'true' },
      el('span', { class: 'overview-card__illustration-label' }, 'Hero illustration'),
    ),
  );

  // Section grid — Taxonomy + Build, each rendered as a colored card.
  const grid = el('div', { class: 'overview-section-grid' },
    sectionCard({
      tone: 'teal',
      eyebrow: 'Taxonomy',
      title: 'How Scout is organized',
      body: 'Atomic design at the system level. Lower tiers compose into higher tiers; product-specific surfaces extend the shared core without forking it.',
      items: [
        'Core tokens',
        'Core components',
        'Core patterns and templates',
        'Product-specific patterns and templates',
      ],
      illustration: 'Taxonomy diagram',
    }),
    sectionCard({
      tone: 'teal',
      eyebrow: 'Build',
      title: 'Technology stack',
      body: 'Framework-agnostic at the core. Lit drives the component layer; Tailwind layers token-driven utility styling on top for product surfaces that prefer it.',
      items: [
        'Web components',
        'Lit component framework',
        'Tailwind configuration for style',
      ],
      illustration: 'Stack diagram',
    }),
  );

  // Principles grid — Density, Accessibility, and Motion principles each get
  // their own colored tile, mirroring the Taxonomy + Build cards above.
  const principles = el('div', { class: 'overview-section-grid overview-section-grid--3up' },
    sectionCard({
      tone: 'teal',
      eyebrow: 'Density',
      title: 'Default vs. condensed',
      body: 'Condensed tightens typography line-heights so data-dense interfaces (agent desktops, tables) read more compactly without losing legibility.',
      illustration: 'Density',
    }),
    sectionCard({
      tone: 'teal',
      eyebrow: 'Accessibility',
      title: 'WCAG 2.1 AA baseline',
      body: 'Color contrast, focus indicators, keyboard navigation, and screen-reader semantics meet WCAG 2.1 AA. Components honor prefers-reduced-motion. Logical CSS properties (margin-inline, padding-block) are used throughout for future RTL support.',
      illustration: 'Accessibility',
    }),
    sectionCard({
      tone: 'teal',
      eyebrow: 'Motion principles',
      title: 'Purposeful motion',
      body: 'Enter motion decelerates (eases the user in), exit motion accelerates (gets out of the way), hover/focus is fast (≤150ms). Every animated component honors prefers-reduced-motion: reduce by collapsing durations to 0.',
      illustration: 'Motion',
    }),
  );

  app.append(
    page(
      'foundation-overview',
      categoryBanner(
        'Foundation',
        'The principles, theming model, and accessibility baseline that every Scout token, component, and pattern is built on.',
      ),
      hero,
      grid,
      principles,
    ),
  );
}

// foundation-theming
{
  // Helper: a small pill-style card showing a theme option
  const themePill = (label: string, attr: string) =>
    el(
      'div',
      { class: 'theme-pill' },
      el('span', { class: 'theme-pill__label' }, label),
      el('code', { class: 'theme-pill__code' }, attr),
    );

  // (Products moved to Foundation > Brand > Products tab.)

  // Custom themes
  const customBlock = el(
    'section',
    { class: 'theme-section' },
    el('h3', { class: 'theme-section__heading' }, 'Custom themes'),
    el(
      'p',
      { class: 'theme-section__lede' },
      'Two orthogonal axes that adapt the system to user preference and information density.',
    ),
    el(
      'div',
      { class: 'theme-subgroup-grid' },
      el(
        'div',
        { class: 'theme-subgroup' },
        el('h4', { class: 'theme-subgroup__heading' }, 'Color'),
        el(
          'p',
          { class: 'theme-subgroup__lede' },
          'Light is the default. Dark flips semantic color tokens for low-light environments and reduced eye strain.',
        ),
        el(
          'div',
          { class: 'theme-pill-grid' },
          themePill('Light', 'data-theme="light"'),
          themePill('Dark', 'data-theme="dark"'),
        ),
      ),
      el(
        'div',
        { class: 'theme-subgroup' },
        el('h4', { class: 'theme-subgroup__heading' }, 'Data density'),
        el(
          'p',
          { class: 'theme-subgroup__lede' },
          'Default for general-purpose UIs. Condensed tightens typography line-heights and component padding for data-dense surfaces (agent desktops, tables, dashboards).',
        ),
        el(
          'div',
          { class: 'theme-pill-grid' },
          themePill('Default', 'data-density="default"'),
          themePill('Condensed', 'data-density="condensed"'),
        ),
      ),
    ),
  );

  // Language — matches the Custom themes card layout
  const languageBlock = el(
    'section',
    { class: 'theme-section' },
    el('h3', { class: 'theme-section__heading' }, 'Language'),
    el(
      'p',
      { class: 'theme-section__lede' },
      'Component strings are translated via @lit/localize. Set the language on the root element; locale bundles are lazy-loaded so apps that only ship English pay nothing for other locales.',
    ),
    el(
      'div',
      { class: 'theme-subgroup-grid' },
      el(
        'div',
        { class: 'theme-subgroup' },
        el('h4', { class: 'theme-subgroup__heading' }, 'Locale'),
        el(
          'p',
          { class: 'theme-subgroup__lede' },
          'English is the default. Additional locales are added by registering a translation bundle with @lit/localize and setting the lang attribute on the root.',
        ),
        el(
          'div',
          { class: 'theme-pill-grid' },
          themePill('English', 'lang="en"'),
          themePill('Spanish', 'lang="es"'),
        ),
      ),
    ),
  );

  // Composition note
  const compositionBlock = el(
    'section',
    { class: 'theme-section composition-block' },
    el('h3', { class: 'theme-section__heading' }, 'How themes layer'),
    el(
      'p',
      { class: 'theme-section__lede' },
      'Custom themes (Color and Data density) and Language are independent of the product theme — any combination is valid. A single product can run multiple custom-theme + language pairings simultaneously without rebuilds.',
    ),
    el('pre', { class: 'code-block' },
`<html
  lang="es"
  data-product="ember"
  data-theme="dark"
  data-density="condensed"
>
  <!-- Ember, dark mode, condensed density, Spanish -->
</html>`,
    ),
    el(
      'ul',
      { class: 'guideline-list' },
      el('li', {}, 'Product theme sets the brand identity (colors, logo). Always required.'),
      el('li', {}, 'Color theme defaults to light if not set. Dark is opt-in.'),
      el('li', {}, 'Density defaults to default. Condensed is opt-in for dense surfaces.'),
      el('li', {}, 'Language defaults to en if not set. Each locale ships as a separate, lazy-loaded bundle.'),
      el('li', {}, "Any attribute can be set on a sub-tree — e.g., a single <section data-density=\"condensed\"> inside a default-density app — and the cascade does the rest."),
    ),
  );

  app.append(
    page(
      'foundation-theming',
      header(
        'Theming',
        'Scout themes are scoped via data attributes on any element (typically <html>). Switching product, color, density, or language is a single attribute change — no rebundle, no FOUC.',
      ),
      customBlock,
      languageBlock,
      compositionBlock,
    ),
  );
}

// =================================================================
// foundation-brand
// Brand-specific identity surfaces. Two tabs:
//   - Products: the product theme grid (brand colors, logos, overrides)
//   - Illustrations: brand-aware illustration library (Soon)
// =================================================================
{
  const themePill = (label: string, attr: string) =>
    el(
      'div',
      { class: 'theme-pill' },
      el('span', { class: 'theme-pill__label' }, label),
      el('code', { class: 'theme-pill__code' }, attr),
    );

  function renderProducts(): HTMLElement {
    const products: Array<[string, string]> = [
      ['Scout',   'data-product="scout"'],
      ['Ember',   'data-product="ember"'],
      ['Snag',     'data-product="snag"'],
      ['Onward',  'data-product="onward"'],
      ['Acorn',   'data-product="acorn"'],
      ['Grub', 'data-product="grub"'],
      ['Huddle',   'data-product="huddle"'],
      ['Venture',   'data-product="venture"'],
      ['Embark',     'data-product="embark"'],
      ['Etch',      'data-product="etch"'],
    ];
    return el('div', { class: 'tab-content' },
      el('section', { class: 'theme-section' },
        el('h3', { class: 'theme-section__heading' }, 'Products'),
        el('p', { class: 'theme-section__lede' },
          'Each product gets its own theme. Product themes set brand colors, logos, and any product-specific token overrides while everything else (typography, spacing, motion, primitives) stays consistent across the system.'),
        el('div', { class: 'theme-pill-grid' }, ...products.map(([n, a]) => themePill(n, a))),
      ),
    );
  }

  function renderIllustrations(): HTMLElement {
    return el('div', { class: 'tab-content' },
      el('section', { class: 'theme-section' },
        el('h3', { class: 'theme-section__heading' }, 'Illustrations'),
        el('p', { class: 'theme-section__lede' },
          'A brand-aware illustration library is in development. Each illustration will use four color slots (primary, secondary, accent, surface) that re-tint per product theme and per color theme.'),
        (() => {
          const b = document.createElement('scout-badge');
          b.setAttribute('type', 'warning');
          b.setAttribute('emphasis', 'low');
          b.setAttribute('size', 'condensed');
          b.textContent = 'Soon';
          return b;
        })(),
      ),
    );
  }

  const tabs = [
    { id: 'products',      label: 'Products',      content: renderProducts() },
    { id: 'illustrations', label: 'Illustrations', content: renderIllustrations() },
  ];

  const tabsEl = document.createElement('scout-tabs');
  tabsEl.setAttribute('value', tabs[0].id);
  const panels = el('div', { class: 'component-panels' });

  tabs.forEach((t, i) => {
    const tabEl = document.createElement('scout-tab');
    tabEl.setAttribute('value', t.id);
    tabEl.textContent = t.label;
    tabsEl.appendChild(tabEl);

    panels.append(
      el('div',
        {
          class: `component-panel${i === 0 ? ' active' : ''}`,
          role: 'tabpanel',
          id: `panel-foundation-brand-${t.id}`,
          tabindex: '0',
        },
        t.content,
      ),
    );
  });

  tabsEl.addEventListener('scout-tabs-change', (e) => {
    const v = (e as CustomEvent<{ value: string }>).detail.value;
    panels.querySelectorAll<HTMLElement>('.component-panel').forEach((p) => {
      p.classList.toggle('active', p.id === `panel-foundation-brand-${v}`);
    });
  });

  app.append(
    page(
      'foundation-brand',
      header(
        'Brand',
        'Brand identity surfaces — the product theme grid and the brand-aware illustration library. Both re-tint via product and color themes set on the document root.',
      ),
      tabsEl,
      panels,
    ),
  );
}

// (Density, Accessibility, Motion principles are now sections inside foundation-overview.)

// =================================================================
// TOKENS
// =================================================================

// tokens-overview — mirrors components-overview: searchable grid of link cards.
{
  type TokenEntry = { id: string; name: string; summary: string };
  const tokenEntries: TokenEntry[] = [
    { id: 'colors',      name: 'Color',        summary: 'Three layers of color: primitive scales (red, yellow, green, teal, blue, purple, cool gray, warm gray, alpha), semantic aliases for text / icon / background / border / fill, and per-product brand palettes scoped via [data-brand].' },
    { id: 'typography',  name: 'Typography',   summary: 'Composite typography tokens. Literata for heading + display, Inter for everything else. Toggle Density to compare default vs. condensed.' },
    { id: 'iconography', name: 'Iconography',  summary: 'Hero Icons referenced via primitive icon tokens. Stroke and fill variants, sized at 16 / 20 / 24, themed via the icon-display / icon-interactive semantic tokens.' },
    { id: 'spacing',     name: 'Spacing',      summary: '4-based scale used for padding, margin, and gap. 0 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96.' },
    { id: 'radius',      name: 'Corner radius',summary: 'Border-radius scale. 999 = fully rounded (pill / circle).' },
    { id: 'border',      name: 'Border width', summary: 'Border thickness scale: 0, 1, 2.' },
    { id: 'stroke',      name: 'Stroke',       summary: 'Stroke style tokens. Two variants: solid (default) and dashed (placeholder, draft, non-permanent boundaries).' },
    { id: 'elevation',   name: 'Elevation',    summary: 'Box-shadow tokens. Levels 1–4 increase in depth.' },
    { id: 'motion',      name: 'Motion',       summary: 'Duration + easing tokens. Reduced-motion preferences are honored at the component level.' },
    { id: 'z-index',     name: 'Z-index',      summary: 'Stacking layers. Higher tokens always render above lower tokens.' },
  ];

  const tokenLinkCard = (t: TokenEntry): HTMLElement =>
    overviewTile({ title: t.name, summary: t.summary, href: t.id });

  // Search input + count — same styling as the components overview.
  const searchInput = el('input', {
    type: 'search',
    class: 'component-search',
    placeholder: 'Search tokens by name or description (e.g. "color", "spacing")',
    'aria-label': 'Search tokens',
    autocomplete: 'off',
  }) as HTMLInputElement;

  const count = el('span', { class: 'component-search-count' });
  const searchToolbar = el('div', { class: 'component-search-toolbar' }, searchInput, count);

  const grid = el('div', { class: 'foundation-grid' });

  function rerender() {
    const q = searchInput.value.trim().toLowerCase();
    const matches = q
      ? tokenEntries.filter(
          (t) => t.name.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q),
        )
      : tokenEntries;
    count.textContent = `${matches.length} of ${tokenEntries.length}`;
    if (matches.length === 0) {
      grid.replaceChildren(
        el('div', { class: 'component-search-empty' }, `No tokens match "${searchInput.value}".`),
      );
    } else {
      grid.replaceChildren(...matches.map(tokenLinkCard));
    }
  }
  searchInput.addEventListener('input', rerender);
  rerender();

  app.append(
    page(
      'tokens-overview',
      categoryBanner(
        'Tokens',
        'The atomic visual values of Scout. Three layers: primitives (raw values), semantic (purposeful aliases), composite (component-level token bundles).',
      ),
      searchToolbar,
      grid,
    ),
  );
}

// colors (tabbed: Primitives + Semantic)
{
  // === Tab content: Primitives ===
  function renderPrimitives(): HTMLElement {
    const wrap = el('div', { class: 'tab-content' });
    const hues = ['red', 'yellow', 'green', 'teal', 'blue', 'purple', 'cool-gray', 'warm-gray'];
    for (const hue of hues) {
      const hueLabel = hue
        .split('-')
        .map((part, i) => (i === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join(' ');
      wrap.append(subhead(hueLabel));
      const grid = el('div', { class: 'grid dense' });
      for (const stop of ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950', '999']) {
        grid.append(colorSwatch(`color-${hue}-${stop}`, `${hue}.${stop}`));
      }
      wrap.append(grid);
    }
    wrap.append(subhead('Alpha (black-based overlays)'));
    const alphaGrid = el('div', { class: 'grid dense' });
    for (const stop of ['20', '80']) {
      alphaGrid.append(colorSwatch(`color-alpha-${stop}`, `alpha.${stop}`));
    }
    wrap.append(alphaGrid);

    wrap.append(subhead('Alpha-white (for dark surfaces)'));
    const aWhite = el('div', { class: 'grid dense' });
    for (const stop of ['20', '80']) {
      aWhite.append(colorSwatch(`color-alpha-white-${stop}`, `alpha-white.${stop}`));
    }
    wrap.append(aWhite);

    wrap.append(subhead('Anchors'));
    const anchors = el('div', { class: 'grid dense' });
    anchors.append(colorSwatch('color-white', 'white'));
    anchors.append(colorSwatch('color-black', 'black'));
    wrap.append(anchors);
    return wrap;
  }

  // === Tab content: Semantic ===
  function renderSemantic(): HTMLElement {
    const wrap = el('div', { class: 'tab-content' });

    wrap.append(subhead('Text — display'));
    const tDisplay = el('div', { class: 'grid' });
    for (const k of ['primary', 'secondary', 'disabled', 'info', 'warning', 'error', 'success', 'increase', 'decrease']) {
      tDisplay.append(colorSwatch(`text-display-${k}`, `text.display.${k}`));
    }
    wrap.append(tDisplay);

    wrap.append(subhead('Text — interactive'));
    const tInter = el('div', { class: 'grid' });
    for (const k of ['primary', 'secondary', 'info', 'warning', 'error', 'success', 'increase', 'decrease']) {
      tInter.append(colorSwatch(`text-interactive-${k}`, `text.interactive.${k}`));
    }
    wrap.append(tInter);

    wrap.append(subhead('Text — inverse'));
    const tInverse = el('div', { class: 'grid' });
    for (const k of ['primary', 'secondary']) {
      tInverse.append(colorSwatch(`text-inverse-${k}`, `text.inverse.${k}`));
    }
    wrap.append(tInverse);

    wrap.append(subhead('Icon — display'));
    const iDisplay = el('div', { class: 'grid' });
    for (const k of ['primary', 'secondary', 'disabled', 'info', 'warning', 'error', 'success', 'increase', 'decrease']) {
      iDisplay.append(colorSwatch(`icon-display-${k}`, `icon.display.${k}`));
    }
    wrap.append(iDisplay);

    wrap.append(subhead('Icon — interactive'));
    const iInter = el('div', { class: 'grid' });
    for (const k of ['primary', 'secondary', 'delete', 'info', 'warning', 'error', 'success', 'increase', 'decrease']) {
      iInter.append(colorSwatch(`icon-interactive-${k}`, `icon.interactive.${k}`));
    }
    wrap.append(iInter);

    wrap.append(subhead('Icon — inverse'));
    const iInverse = el('div', { class: 'grid' });
    for (const k of ['primary', 'secondary']) {
      iInverse.append(colorSwatch(`icon-inverse-${k}`, `icon.inverse.${k}`));
    }
    wrap.append(iInverse);

    wrap.append(subhead('Border'));
    const borders = el('div', { class: 'grid' });
    for (const k of ['primary', 'secondary', 'disabled', 'knockout', 'inverse', 'info', 'warning', 'error', 'success']) {
      borders.append(colorSwatch(`border-${k}`, `border.${k}`));
    }
    wrap.append(borders);

    wrap.append(subhead('Surface'));
    const surfaces = el('div', { class: 'grid' });
    for (const k of ['page', 'primary', 'scrim', 'disabled', 'inverse', 'inverse-strong']) {
      surfaces.append(colorSwatch(`surface-${k}`, `surface.${k}`));
    }
    wrap.append(surfaces);

    wrap.append(subhead('Fill — base'));
    const fillBase = el('div', { class: 'grid' });
    for (const k of ['always-white', 'primary', 'secondary']) {
      fillBase.append(colorSwatch(`fill-${k}`, `fill.${k}`));
    }
    wrap.append(fillBase);

    wrap.append(subhead('Fill — status (subtle / bold pairs)'));
    const fillStatus = el('div', { class: 'grid' });
    for (const status of ['info', 'success', 'warning', 'critical', 'ai']) {
      for (const tone of ['subtle', 'bold']) {
        fillStatus.append(colorSwatch(`fill-${status}-${tone}`, `fill.${status}.${tone}`));
      }
    }
    wrap.append(fillStatus);

    wrap.append(subhead('Interactive — background states'));
    const interBg = el('div', { class: 'grid' });
    for (const k of [
      'hover', 'pressed', 'selected',
      'brand-hover', 'brand-pressed',
      'brand-strong', 'brand-strong-hover', 'brand-strong-pressed',
      'critical-hover', 'critical-pressed',
      'critical-strong', 'critical-strong-hover', 'critical-strong-pressed',
    ]) {
      interBg.append(colorSwatch(`interactive-background-${k}`, `interactive.background.${k}`));
    }
    wrap.append(interBg);

    wrap.append(subhead('Focus'));
    const focus = el('div', { class: 'grid' });
    focus.append(colorSwatch('focus-ring-color', 'focus.ring.color'));
    focus.append(colorSwatch('focus-ring-error-color', 'focus.ring-error.color'));
    wrap.append(focus);
    return wrap;
  }

  /** Brand-specific palettes scoped via [data-brand]. Each row reads the
   *  brand's CSS custom properties from a temporary div mounted with the
   *  matching data-brand attribute, so the swatches render the live token
   *  value rather than a hard-coded hex. */
  function renderBrand(): HTMLElement {
    const wrap = el('div', { class: 'tab-content' });
    wrap.append(el('p', { class: 'preview-block__lede' },
      'Per-product brand colors, scoped via [data-brand]. Switch the Brand control above to see the active set update.'));
    const brands: Array<[string, string[]]> = [
      ['scout', ['light', 'primary', 'dark']],
      ['ember', ['primary', 'accent']],
      ['snag', ['primary', 'cream']],
    ];
    for (const [b, keys] of brands) {
      wrap.append(subhead(b.charAt(0).toUpperCase() + b.slice(1)));
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
      wrap.append(grid);
    }
    return wrap;
  }

  // === Build the tabbed page using the scout-tabs component (same pattern
  //     as componentPage). The token page header replaces the component-page
  //     header above the tab list. ===
  const tabs = [
    { id: 'primitives', label: 'Primitives', content: renderPrimitives() },
    { id: 'semantic',   label: 'Semantic',   content: renderSemantic() },
    { id: 'brand',      label: 'Brand',      content: renderBrand() },
  ];

  const tabsEl = document.createElement('scout-tabs');
  tabsEl.setAttribute('value', tabs[0].id);
  const panels = el('div', { class: 'component-panels' });

  tabs.forEach((t, i) => {
    const tabEl = document.createElement('scout-tab');
    tabEl.setAttribute('value', t.id);
    tabEl.textContent = t.label;
    tabsEl.appendChild(tabEl);

    panels.append(
      el(
        'div',
        {
          class: `component-panel${i === 0 ? ' active' : ''}`,
          role: 'tabpanel',
          id: `panel-colors-${t.id}`,
          tabindex: '0',
        },
        t.content,
      ),
    );
  });

  tabsEl.addEventListener('scout-tabs-change', (e) => {
    const v = (e as CustomEvent<{ value: string }>).detail.value;
    panels.querySelectorAll<HTMLElement>('.component-panel').forEach((p) => {
      p.classList.toggle('active', p.id === `panel-colors-${v}`);
    });
  });

  app.append(
    page(
      'colors',
      header(
        'Color',
        'Primitive color scales for the entire system, plus the semantic aliases components consume. Toggle the topbar Theme/Density to watch the semantic values shift.',
      'Token',
      ),
      tabsEl,
      panels,
    ),
  );
}

// (Brand colors live as a tab on the Colors page above.)

// typography
{
  const wrap = page(
    'typography',
    header(
      'Typography',
      'Composite typography tokens. Literata for heading + display, Inter for everything else. Toggle Density to compare default vs. condensed.',
    'Token',
    ),
  );
  const styles: Array<[string, string, string]> = [
    ['display-large', 't-display-large', 'Scout is the best'],
    ['display-small', 't-display-small', 'Scout is the best'],
    ['heading-1', 't-h1', 'Scout is the best'],
    ['heading-2', 't-h2', 'Scout is the best'],
    ['heading-3', 't-h3', 'Scout is the best'],
    ['heading-4', 't-h4', 'Scout is the best'],
    ['heading-5', 't-h5', 'Scout is the best'],
    ['body-large', 't-body-large', 'Scout is the best'],
    ['body', 't-body', 'Scout is the best'],
    ['body-small', 't-body-small', 'Scout is the best'],
    ['label', 't-label', 'Scout is the best'],
    ['caption', 't-caption', 'Scout is the best'],
  ];
  // Read each typography token's resolved size + line-height + weight from
  // CSS vars so the specimen card shows the actual rendered metrics. These
  // re-read on demand because [data-density="condensed"] swaps the values
  // at runtime.
  function typographyMetrics(name: string): { size: string; lineHeight: string; weight: string } {
    const get = (prop: string) =>
      getComputedStyle(html).getPropertyValue(`${PREFIX}-typography-${name}-${prop}`).trim();
    return {
      size:       get('font-size'),
      lineHeight: get('line-height'),
      weight:     get('font-weight'),
    };
  }

  const specimens: Array<{ row: HTMLElement; sizeEl: HTMLElement; name: string }> = [];
  for (const [name, cls, sample] of styles) {
    const m = typographyMetrics(name);
    const sizeEl = el('span', { class: 'value' }, `${m.size} / ${m.lineHeight} · ${m.weight}`);
    const row = el(
      'div',
      { class: 'specimen' },
      el(
        'div',
        { class: 'meta' },
        el('span', { class: 'key' }, name),
        sizeEl,
        el('span', { class: 'key' }, `var(${PREFIX}-typography-${name}-*)`),
      ),
      el('div', { class: cls }, sample),
    );
    wrap.append(row);
    specimens.push({ row, sizeEl, name });
  }
  // Re-read metrics whenever density flips at the document root so the
  // displayed size/line-height stays accurate.
  const refreshTypographyMetrics = () => {
    for (const s of specimens) {
      const m = typographyMetrics(s.name);
      s.sizeEl.textContent = `${m.size} / ${m.lineHeight} · ${m.weight}`;
    }
  };
  densitySel.addEventListener('scout-dropdown-change', () => requestAnimationFrame(refreshTypographyMetrics));

  // === Weights ===================================================
  // Atomic font-weight tokens (extra-light → bold). Each specimen reads
  // its numeric value from the resolved CSS variable so the right column
  // stays accurate if a brand or theme remaps it.
  const weights: Array<[string, string]> = [
    ['extra-light', 'Scout is the best'],
    ['light',       'Scout is the best'],
    ['regular',     'Scout is the best'],
    ['medium',      'Scout is the best'],
    ['semibold',    'Scout is the best'],
    ['bold',        'Scout is the best'],
  ];
  wrap.append(el('h2', { class: 'typography-section-heading' }, 'Weights'));
  for (const [name, sample] of weights) {
    const value = getComputedStyle(html).getPropertyValue(`${PREFIX}-font-weight-${name}`).trim();
    wrap.append(el(
      'div',
      { class: 'specimen' },
      el(
        'div',
        { class: 'meta' },
        el('span', { class: 'key' }, name),
        el('span', { class: 'value' }, value),
        el('span', { class: 'key' }, `var(${PREFIX}-font-weight-${name})`),
      ),
      el('div', { class: 't-body-large', style: `font-weight: var(${PREFIX}-font-weight-${name});` }, sample),
    ));
  }

  app.append(wrap);
}

// iconography
{
  // Hero Icons — full catalog (~316 per style) loaded from the heroicons package.
  type IconStyle = 'outline' | 'solid' | 'mini' | 'micro';

  const sources: Record<IconStyle, Record<string, string>> = {
    outline: import.meta.glob('../node_modules/heroicons/24/outline/*.svg', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>,
    solid: import.meta.glob('../node_modules/heroicons/24/solid/*.svg', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>,
    mini: import.meta.glob('../node_modules/heroicons/20/solid/*.svg', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>,
    micro: import.meta.glob('../node_modules/heroicons/16/solid/*.svg', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>,
  };

  // Build a {name -> svgString} map per style and a sorted list of names.
  const byStyle: Record<IconStyle, Record<string, string>> = {
    outline: {},
    solid: {},
    mini: {},
    micro: {},
  };
  for (const style of Object.keys(sources) as IconStyle[]) {
    for (const [path, raw] of Object.entries(sources[style])) {
      const name = path.split('/').pop()!.replace('.svg', '');
      byStyle[style][name] = raw;
    }
  }
  const allNames = Array.from(
    new Set([
      ...Object.keys(byStyle.outline),
      ...Object.keys(byStyle.solid),
      ...Object.keys(byStyle.mini),
      ...Object.keys(byStyle.micro),
    ]),
  ).sort();

  // Native pixel size per style (Hero Icons ship at fixed sizes; don't scale).
  const nativeSize: Record<IconStyle, number> = {
    outline: 24,
    solid: 24,
    mini: 20,
    micro: 16,
  };

  // Render an SVG by parsing the raw string. Always sets explicit width/height
  // (heroicons SVGs only have viewBox, which collapses to 0×0 inside flex
  // children in some browsers without explicit dimensions).
  function renderIcon(raw: string, sizePx: number): SVGElement | null {
    const tmp = document.createElement('div');
    tmp.innerHTML = raw;
    const svg = tmp.querySelector('svg');
    if (!svg) return null;
    svg.removeAttribute('class');
    svg.removeAttribute('data-slot');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', String(sizePx));
    svg.setAttribute('height', String(sizePx));
    return svg;
  }

  function iconCell(name: string, style: IconStyle, sizePx?: number, label?: string): HTMLElement {
    const raw = byStyle[style][name];
    const dim = sizePx ?? nativeSize[style];
    const stage = el('div', { class: 'icon-stage' });
    if (raw) {
      const svg = renderIcon(raw, dim);
      if (svg) stage.append(svg);
    } else {
      stage.append(document.createTextNode('—'));
    }
    return el(
      'div',
      { class: 'icon-cell', title: name },
      stage,
      el('span', { class: 'icon-name' }, label ?? name),
    );
  }

  const wrap = page(
    'iconography',
    header(
      'Iconography',
      'Scout uses Hero Icons (heroicons.com). Four styles are supported — Outline and Solid at 24×24, Mini at 20×20, Micro at 16×16. Icons inherit color via currentColor and re-theme automatically.',
    'Token',
    ),
  );

  // Catalog (filterable, switchable style)
  const styleMeta: Array<[IconStyle, string]> = [
    ['outline', 'Outline · 24'],
    ['solid', 'Solid · 24'],
    ['mini', 'Mini · 20'],
    ['micro', 'Micro · 16'],
  ];

  const search = el('input', {
    type: 'search',
    class: 'icon-search',
    placeholder: 'Search icons (e.g. "arrow", "user", "chart")',
    'aria-label': 'Search icons',
  }) as HTMLInputElement;

  // Style switcher uses the scout-segmented-control component so the
  // iconography page dogfoods the same primitive used in product UIs.
  const styleSel = document.createElement('scout-segmented-control');
  styleSel.setAttribute('value', 'outline');
  styleSel.setAttribute('aria-label', 'Icon style');
  for (const [s, label] of styleMeta) {
    const seg = document.createElement('scout-segment');
    seg.setAttribute('value', s);
    seg.textContent = label;
    styleSel.appendChild(seg);
  }

  const count = el('span', { class: 'icon-count' });
  const grid = el('div', { class: 'icon-grid icon-grid--catalog' });

  let activeStyle: IconStyle = 'outline';

  function rerender() {
    const q = search.value.trim().toLowerCase();
    const matches = q ? allNames.filter((n) => n.includes(q)) : allNames;
    count.textContent = `${matches.length} of ${allNames.length} icons`;
    grid.replaceChildren(...matches.map((n) => iconCell(n, activeStyle)));
    if (matches.length === 0) {
      grid.replaceChildren(el('div', { class: 'icon-empty' }, 'No icons match that search.'));
    }
  }

  search.addEventListener('input', rerender);
  styleSel.addEventListener('scout-segmented-change', (e) => {
    activeStyle = (e as CustomEvent<{ value: string }>).detail.value as IconStyle;
    rerender();
  });

  wrap.append(
    el(
      'div',
      { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, 'Catalog'),
      el(
        'p',
        { class: 'preview-block__lede' },
        'The full Hero Icons set, loaded from the heroicons package. Switch styles to compare the same icon across Outline, Solid, Mini, and Micro. Search by name to filter.',
      ),
      el('div', { class: 'icon-toolbar' }, search, styleSel, count),
      grid,
    ),
  );

  rerender();

  // Sizing
  wrap.append(
    el(
      'div',
      { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, 'Sizing'),
      el(
        'p',
        { class: 'preview-block__lede' },
        "Hero Icons ship at three native pixel sizes. Don't scale them — use the size designed for the context to keep stroke weight and detail crisp.",
      ),
      el(
        'div',
        { class: 'icon-grid icon-grid--sizing' },
        iconCell('check', 'micro', 16, '16 · micro'),
        iconCell('check', 'mini', 20, '20 · mini'),
        iconCell('check', 'solid', 24, '24 · solid'),
      ),
    ),
  );

  // Color — references the .500 stop of each hue directly
  const colorTokens: Array<[string, string]> = [
    ['color-cool-gray-500', 'cool-gray.500'],
    ['color-blue-500', 'blue.500'],
    ['color-yellow-500', 'yellow.500'],
    ['color-green-500', 'green.500'],
    ['color-red-500', 'red.500'],
    ['color-purple-500', 'purple.500'],
  ];

  wrap.append(
    el(
      'div',
      { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, 'Color'),
      el(
        'p',
        { class: 'preview-block__lede' },
        'Icons inherit color via the CSS currentColor keyword, so any color set on a parent cascades automatically. The default Scout icon color is cool-gray.500; status hues use the .500 stop of their respective scale.',
      ),
      el(
        'div',
        { class: 'icon-grid' },
        ...colorTokens.map(([token, label]) => {
          const cell = iconCell('bell', 'solid', undefined, label);
          (cell.querySelector('.icon-stage') as HTMLElement).style.color = `var(${PREFIX}-${token})`;
          return cell;
        }),
      ),
    ),
  );

  // Usage notes
  wrap.append(
    el(
      'div',
      { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, 'Usage'),
      el(
        'ul',
        { class: 'guideline-list' },
        el('li', {}, 'Pair icons with text labels whenever possible. Icon-only controls require an aria-label.'),
        el('li', {}, "Decorative icons sit alongside text and are marked aria-hidden=\"true\" so they're not announced."),
        el('li', {}, 'Use Outline as the default style. Reserve Solid for emphasis (active state, brand moments).'),
        el('li', {}, 'Match icon size to surrounding text size: 16 with body-small, 20 with body, 24 with body-large or as standalone affordance.'),
        el('li', {}, "Don't recolor an icon to imply a different status — use the matching icon-display-* semantic token."),
        el('li', {}, 'Source icons from heroicons.com only. Custom icons need design-system review and live in @scout/icons.'),
      ),
    ),
  );

  app.append(wrap);
}

// spacing
{
  const wrap = page('spacing', header('Spacing', '4-based scale. Use these for padding, margin, gap.', 'Token'));
  for (const s of ['0', '4', '8', '12', '16', '24', '32', '48', '64', '96']) {
    wrap.append(
      el(
        'div',
        { class: 'space-row' },
        el('div', { class: 'label' }, `space.${s}`),
        el('div', { class: 'bar', style: `width: var(${PREFIX}-space-${s})` }),
        el('div', { class: 'value' }, cssVar(`space-${s}`) || '0px'),
      ),
    );
  }
  app.append(wrap);
}

// radius
{
  const wrap = page(
    'radius',
    header('Corner radius', 'Border-radius scale. 999 = fully rounded (pill / circle).', 'Token'),
  );
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
  wrap.append(grid);
  app.append(wrap);
}

// border
{
  const wrap = page('border', header('Border width', 'Border thickness scale.', 'Token'));
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
  wrap.append(grid);
  app.append(wrap);
}

// stroke
{
  const wrap = page(
    'stroke',
    header(
      'Stroke',
      'Stroke style tokens. Two variants: solid (the default for borders and dividers) and dashed (used for placeholder, draft, or non-permanent boundaries).',
    'Token',
    ),
  );
  const grid = el('div', { class: 'grid' });
  for (const s of ['solid', 'dashed'] as const) {
    grid.append(
      el(
        'div',
        { class: 'radius-row border-row' },
        el('div', {
          class: 'box',
          style: `border-width: 2px; border-style: var(${PREFIX}-stroke-${s})`,
        }),
        el('span', { class: 'name' }, `stroke.${s}`),
        el('span', { class: 'value' }, cssVar(`stroke-${s}`)),
      ),
    );
  }
  wrap.append(grid);
  app.append(wrap);
}

// elevation
{
  const wrap = page('elevation', header('Elevation', 'Box-shadow tokens. Levels 1–4 increase in depth.', 'Token'));
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
  wrap.append(grid);
  app.append(wrap);
}

// motion
{
  const wrap = page(
    'motion',
    header(
      'Motion',
      'Hover any card to play the duration × easing combo. Reduced-motion preferences are honored at the component level when shipped.',
    'Token',
    ),
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
  wrap.append(grid);
  app.append(wrap);
}

// z-index
{
  const wrap = page(
    'z-index',
    header('Z-index', 'Stacking layers. Higher tokens always render above lower tokens.', 'Token'),
  );
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
  wrap.append(stack);
  app.append(wrap);
}


// =================================================================
// COMPONENTS
// =================================================================

// --- Component page template (flexible tabs)
type ComponentTab = { id: string; label: string; content: HTMLElement };

function componentPage(
  id: string,
  name: string,
  description: string,
  tabs: ComponentTab[],
  kind: 'component' | 'pattern' = 'component',
): HTMLElement {
  // Tab list — dogfoods the scout-tabs component. The scout-tab children
  // carry the panel id as their `value` so we can map change events back to
  // the right panel without maintaining a parallel index.
  const tabsEl = document.createElement('scout-tabs');
  tabsEl.setAttribute('value', tabs[0]?.id ?? '');
  const panels = el('div', { class: 'component-panels' });

  tabs.forEach((t, i) => {
    const tabEl = document.createElement('scout-tab');
    tabEl.setAttribute('value', t.id);
    tabEl.textContent = t.label;
    tabsEl.appendChild(tabEl);

    panels.append(
      el(
        'div',
        {
          class: `component-panel${i === 0 ? ' active' : ''}`,
          role: 'tabpanel',
          id: `panel-${id}-${t.id}`,
          tabindex: '0',
          'aria-labelledby': `tab-${id}-${t.id}`,
        },
        t.content,
      ),
    );
  });

  // Switching: when the scout-tabs component fires a change, flip the active
  // panel by matching the panel's id to the tab's value.
  tabsEl.addEventListener('scout-tabs-change', (e) => {
    const v = (e as CustomEvent<{ value: string }>).detail.value;
    panels.querySelectorAll<HTMLElement>('.component-panel').forEach((p) => {
      p.classList.toggle('active', p.id === `panel-${id}-${v}`);
    });
  });

  return page(
    id,
    el(
      'div',
      { class: 'component-page-header' },
      pageBadge(kind === 'pattern' ? 'Pattern' : 'Component'),
      el('h1', { class: 'component-title' }, name),
      el('p', { class: 'component-description' }, description),
    ),
    tabsEl,
    panels,
  );
}

// --- Button (real Lit component from @scout/button)
import '@scout/button';

type BtnVariant = 'primary' | 'secondary' | 'tertiary' | 'action' | 'critical' | 'critical-tertiary';
type BtnSize = 'default' | 'condensed';
interface BtnOpts {
  variant?: BtnVariant;
  size?: BtnSize;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  leadingIcon?: string;
  trailingIcon?: string;
}

function previewButton(opts: BtnOpts = {}): HTMLElement {
  const {
    variant = 'primary',
    size = 'default',
    label = 'Button',
    disabled = false,
    loading = false,
    leadingIcon,
    trailingIcon,
  } = opts;

  const btn = document.createElement('scout-button');
  btn.setAttribute('variant', variant);
  btn.setAttribute('size', size);
  if (disabled) btn.setAttribute('disabled', '');
  if (loading) btn.setAttribute('loading', '');

  if (leadingIcon) {
    const i = document.createElement('span');
    i.setAttribute('slot', 'icon-leading');
    i.textContent = leadingIcon;
    btn.appendChild(i);
  }
  btn.appendChild(document.createTextNode(label));
  if (trailingIcon) {
    const i = document.createElement('span');
    i.setAttribute('slot', 'icon-trailing');
    i.textContent = trailingIcon;
    btn.appendChild(i);
  }
  return btn;
}

// --- Button — Preview tab
function buttonPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });

  const block = (heading: string, lede: string, ...children: HTMLElement[]) => {
    wrap.append(
      el('div', { class: 'preview-block' },
        el('h3', { class: 'preview-block__title' }, heading),
        el('p', { class: 'preview-block__lede' }, lede),
        el('div', { class: 'preview-row' }, ...children),
      ),
    );
  };

  block(
    'Variants',
    "Six visual hierarchies. Use primary for the single most important action, secondary for supporting actions, tertiary for low-emphasis. Action is for affirmative high-emphasis (Add, Approve). Critical is for destructive; critical-tertiary is its low-emphasis form.",
    previewButton({ variant: 'primary',           label: 'Primary' }),
    previewButton({ variant: 'secondary',         label: 'Secondary' }),
    previewButton({ variant: 'tertiary',          label: 'Tertiary' }),
    previewButton({ variant: 'action',            label: 'Action' }),
    previewButton({ variant: 'critical',          label: 'Critical' }),
    previewButton({ variant: 'critical-tertiary', label: 'Critical tertiary' }),
  );

  block(
    'Sizes',
    "Default matches general-purpose surfaces. Condensed matches data-dense surfaces (tables, agent desktops, toolbars) and aligns with the system's [data-density=\"condensed\"] preset.",
    previewButton({ size: 'default',   label: 'Default' }),
    previewButton({ size: 'condensed', label: 'Condensed' }),
  );

  block(
    'States',
    'Default · Disabled · Loading. Hover, focus, and pressed are all live — interact with the buttons to see them.',
    previewButton({ label: 'Default' }),
    previewButton({ label: 'Disabled', disabled: true }),
    previewButton({ label: 'Loading…', loading: true }),
  );

  block(
    'With icons',
    'Icons can sit before or after the label. Icon-only buttons require an aria-label-override and use a separate IconButton component (forthcoming).',
    previewButton({ label: 'Add account', leadingIcon: '+' }),
    previewButton({ label: 'Continue',    trailingIcon: '→' }),
    previewButton({ variant: 'secondary', label: 'Filter', leadingIcon: '⚲' }),
    previewButton({ variant: 'action',    label: 'Approve', leadingIcon: '✓' }),
  );

  return wrap;
}

// --- Button — Controls tab
function buttonControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });

  const stage = el('div', { class: 'preview-stage' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const variantSel = ddSelect('btn-variant', ['primary', 'secondary', 'tertiary', 'action', 'critical', 'critical-tertiary'] as const);

  const sizeSel = ddSelect('btn-size', ['default', 'condensed'] as const);

  const labelInput = ctrlText('btn-label', 'Button');

  const disabledChk = ctrlCheck('btn-disabled', 'Disabled');
  const loadingChk = ctrlCheck('btn-loading', 'Loading');
  const leadingChk = ctrlCheck('btn-leading', 'Leading icon');
  const trailingChk = ctrlCheck('btn-trailing', 'Trailing icon');

  function render() {
    const variant = variantSel.value as BtnVariant;
    const size = sizeSel.value as BtnSize;
    stage.replaceChildren(
      previewButton({
        variant,
        size,
        label: labelInput.value || 'Button',
        disabled: disabledChk.checked,
        loading: loadingChk.checked,
        leadingIcon: leadingChk.checked ? '+' : undefined,
        trailingIcon: trailingChk.checked ? '→' : undefined,
      }),
    );

    const attrs: string[] = [];
    if (variant !== 'primary') attrs.push(`variant="${variant}"`);
    if (size !== 'default') attrs.push(`size="${size}"`);
    if (disabledChk.checked) attrs.push('disabled');
    if (loadingChk.checked) attrs.push('loading');
    const open = `<scout-button${attrs.length ? ' ' + attrs.join(' ') : ''}>`;
    const lead = leadingChk.checked ? '\n  <svg slot="icon-leading">…</svg>' : '';
    const trail = trailingChk.checked ? '\n  <svg slot="icon-trailing">…</svg>' : '';
    codePre.textContent = `${open}${lead}\n  ${labelInput.value || 'Button'}${trail}\n</scout-button>`;
  }

  for (const c of [variantSel, sizeSel, labelInput, disabledChk, loadingChk, leadingChk, trailingChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }

  const ctrlField = (labelText: string, htmlFor: string, control: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: htmlFor }, labelText), control);

  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Variant', 'btn-variant', variantSel),
    ctrlField('Size', 'btn-size', sizeSel),
    ctrlField('Label', 'btn-label', labelInput),
    el('div', { class: 'ctrl-checks' },
      disabledChk,
      loadingChk,
      leadingChk,
      trailingChk,
    ),
  );

  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre),
  ));

  queueMicrotask(render);
  return wrap;
}

// --- Button — Usage guidelines (Do and Don't, separate sections)
function buttonGuidelines(): HTMLElement {
  const doCard = (preview: HTMLElement | HTMLElement[], copy: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: `do-dont-preview${Array.isArray(preview) ? ' do-dont-preview--row' : ''}` },
        ...(Array.isArray(preview) ? preview : [preview])),
      el('p', {}, copy),
    );
  const dontCard = (preview: HTMLElement | HTMLElement[], copy: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: `do-dont-preview${Array.isArray(preview) ? ' do-dont-preview--row' : ''}` },
        ...(Array.isArray(preview) ? preview : [preview])),
      el('p', {}, copy),
    );

  return el(
    'div',
    { class: 'tab-content guidelines-layout' },

    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, "Patterns that strengthen hierarchy and make a button's action obvious."),
      el('div', { class: 'do-dont-grid' },
        doCard(
          previewButton({ variant: 'primary', label: 'Save changes' }),
          'Use one primary button per view to anchor the most important action.',
        ),
        doCard(
          previewButton({ variant: 'action', label: 'Add account', leadingIcon: '+' }),
          'Use the action variant for affirmative high-emphasis actions (Add, Approve, Submit). It signals "go" without competing with primary.',
        ),
        doCard(
          previewButton({ variant: 'critical', label: 'Delete account' }),
          'Use critical for destructive actions, and name the consequence in the label.',
        ),
        doCard(
          [
            previewButton({ variant: 'primary',  label: 'Save' }),
            previewButton({ variant: 'secondary', label: 'Cancel' }),
          ],
          'Pair a primary action with a secondary, low-emphasis cancel option.',
        ),
      ),
    ),

    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Patterns that weaken hierarchy or confuse the user about what an action will do.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(
          [
            previewButton({ variant: 'primary', label: 'Save' }),
            previewButton({ variant: 'primary', label: 'Continue' }),
            previewButton({ variant: 'primary', label: 'Submit' }),
          ],
          "Don't stack multiple primary buttons together — users won't know which action takes precedence.",
        ),
        dontCard(
          previewButton({ label: 'Click here to perform the requested action now' }),
          "Don't write long, vague labels. Use 1–3 word verb phrases.",
        ),
        dontCard(
          previewButton({ variant: 'critical', label: 'Yes' }),
          "Don't use generic confirm-style labels for critical actions. \"Yes\" doesn't tell the user what they're destroying.",
        ),
        dontCard(
          previewButton({ variant: 'tertiary', label: 'OK', size: 'condensed' }),
          "Don't use tertiary buttons for primary actions — there's no visual hierarchy to anchor the user's next step.",
        ),
      ),
    ),
  );
}

// --- Button — Content
function buttonContent(): HTMLElement {
  return el(
    'div',
    { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Writing button labels'),
      el('p', { class: 'preview-block__lede' }, 'Buttons live or die on their label. A good label tells the user exactly what will happen when they click.'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use sentence case ("Save changes", not "Save Changes" or "SAVE CHANGES").'),
        el('li', {}, 'Lead with a verb. Buttons describe an action: "Add", "Submit", "Cancel".'),
        el('li', {}, 'Keep labels under 3 words when possible. If you need more, you probably need a different component.'),
        el('li', {}, 'Avoid redundancy. "Save" beats "Save now"; "Cancel" beats "Cancel this action".'),
        el('li', {}, 'For critical actions, name the consequence: "Delete account", not "Yes" or "Confirm".'),
        el('li', {}, "Match the verb tense to the user's intent. \"Add\" is invitational; \"Added\" is confirmational and shouldn't live on a button."),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Localization'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Reserve at least 30% extra horizontal space for translated strings. German and French labels often run longer than English.'),
        el('li', {}, "Don't concatenate fragments to build a label — translate the full string. Avoid: \"Add\" + \" \" + entityType."),
        el('li', {}, 'Use the @lit/localize msg() helper to mark labels for translation.'),
      ),
    ),
  );
}

// --- Button — Accessibility
function buttonAccessibility(): HTMLElement {
  return el(
    'div',
    { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard & focus'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Renders as a native <button>. Receives keyboard focus and is activated by Enter and Space.'),
        el('li', {}, 'Visible focus ring uses a 2px outline at offset 2px on :focus-visible. Never disable focus styles.'),
        el('li', {}, 'Disabled buttons set the `disabled` attribute and are skipped in tab order.'),
        el('li', {}, 'No keyboard trap: focus moves naturally to the next focusable element.'),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Screen readers'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Loading buttons set aria-busy="true" so assistive tech announces the state.'),
        el('li', {}, 'Icon-only buttons require an aria-label-override that matches the visual intent ("Close", "Search").'),
        el('li', {}, 'Decorative icons inside text buttons are aria-hidden so they\'re not announced twice.'),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & motion'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Color contrast meets WCAG 2.1 AA against background-page in both light and dark themes.'),
        el('li', {}, 'Status (action, critical) is reinforced with text labels — never conveyed by color alone.'),
        el('li', {}, 'Honors prefers-reduced-motion: state transitions and the loading spinner collapse for users who request reduced motion.'),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Form association'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'scout-button uses the ElementInternals API. Set type="submit" inside a <form> to submit it; type="reset" to reset.'),
        el('li', {}, 'Loading and disabled buttons block submit/reset clicks at the host level.'),
      ),
    ),
  );
}

// --- Button — Code
function buttonCode(): HTMLElement {
  return el(
    'div',
    { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-button variant="primary">Save changes</scout-button>

<scout-button variant="action">
  <svg slot="icon-leading">…</svg>
  Add account
</scout-button>

<scout-button variant="critical" loading>Deleting…</scout-button>

<form>
  <scout-button type="submit" variant="primary">Submit</scout-button>
  <scout-button type="reset"  variant="tertiary">Reset</scout-button>
</form>`,
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' },
        `pnpm add @scout/button @scout/tokens lit

// In your app entry:
import '@scout/button';`,
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {},
            el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'),
          )),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'variant'),  el('td', {}, '"primary" | "secondary" | "tertiary" | "action" | "critical" | "critical-tertiary"'), el('td', {}, '"primary"'), el('td', {}, 'Visual hierarchy.')),
            el('tr', {}, el('td', {}, 'size'),     el('td', {}, '"default" | "condensed"'), el('td', {}, '"default"'), el('td', {}, 'Density preset.')),
            el('tr', {}, el('td', {}, 'type'),     el('td', {}, '"button" | "submit" | "reset"'), el('td', {}, '"button"'), el('td', {}, 'Form-association behavior.')),
            el('tr', {}, el('td', {}, 'disabled'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disable interaction; skip tab order.')),
            el('tr', {}, el('td', {}, 'loading'),  el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Show spinner; set aria-busy.')),
          ),
        ),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Slots'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {},
            el('th', {}, 'Slot'), el('th', {}, 'Purpose'),
          )),
          el('tbody', {},
            el('tr', {}, el('td', {}, '(default)'),     el('td', {}, 'Label content.')),
            el('tr', {}, el('td', {}, 'icon-leading'),  el('td', {}, 'Icon rendered before the label.')),
            el('tr', {}, el('td', {}, 'icon-trailing'), el('td', {}, 'Icon rendered after the label.')),
          ),
        ),
      ),
    ),
  );
}

// --- Components overview
{
  type ComponentEntry = { id: string; name: string; summary: string };
  const components: ComponentEntry[] = [
    { id: 'components-accordion',     name: 'Accordion',     summary: 'Vertically stacked rows that reveal or hide content. Single or multi-expand modes, three sizes, configurable icon position, optional dividers.' },
    { id: 'components-address',       name: 'Address',       summary: 'Pre-formatted display of a postal address. Optional label, favorite, selector (checkbox/radio), and Do-Not-Disclose banner.' },
    { id: 'components-avatar',        name: 'Avatar',        summary: 'Thumbnail representation of a person or entity. Three sizes, three color treatments (blue, gray, knockout), optional notification dot and title.' },
    { id: 'components-badge',         name: 'Badge',         summary: 'Small label conveying status, category, or count. Six types, two emphasis levels, default and condensed sizes, prescriptive status icons.' },
    { id: 'components-breadcrumb',    name: 'Breadcrumb',    summary: 'Hierarchy navigation showing the user\'s location. Supports multi-level chains and single back-link mode.' },
    { id: 'components-button',        name: 'Button',        summary: 'Six variants (primary, secondary, tertiary, action, critical, critical-tertiary). Default and condensed sizes. Loading and icon states.' },
    { id: 'components-card',          name: 'Card',          summary: 'Stylized container for AI summaries and extracted plain-text content. Three background colors, optional AI call-out and show-more toggle.' },
    { id: 'components-checkbox',      name: 'Checkbox',      summary: 'Single and multi-select form input. Selected, not selected, and indeterminate states. Group orientation, helper, error, and warning messages.' },
    { id: 'components-control',       name: 'Control',       summary: 'Icon-only interactive control for triggering single actions. 11 built-in types (close, clear, navigation arrows, tooltip, trash, kebab) with primary and critical colors.' },
    { id: 'components-data-pair',     name: 'Data pair',     summary: 'Label + description display with optional meta and link. Vertical (stacked) or horizontal (inline) orientation.' },
    { id: 'components-data-unavailable', name: 'Data unavailable', summary: 'Inline placeholder for surfaces whose data couldn\'t be fetched. Cloud-with-slash icon + label. Three sizes: small, medium, large.' },
    { id: 'components-dialog',        name: 'Dialog',        summary: 'Modal surface that disables the page behind it. Confirms actions, displays simple flows, surfaces important system messages.' },
    { id: 'components-disclosure-dialog', name: 'Disclosure dialog', summary: 'Specialized dialog for legal/compliance disclosures. Language tabs, optional acknowledgement checkbox. Simple and Automated types.' },
    { id: 'components-divider',       name: 'Divider',       summary: 'Visual separator for organizing content. Two weights (1px / 2px), three colors (default / light / knockout), horizontal or vertical.' },
    { id: 'components-dropdown',      name: 'Dropdown',      summary: 'Single-select dropdown for choosing from a list. Two variants: standard select and searchable. Default and condensed sizes, helper, and error messaging.' },
    { id: 'components-error-state',   name: 'Error state',   summary: 'Full-application error display. Centered illustration, header, message, and optional link.' },
    { id: 'components-filter-chip',   name: 'Filter chip',   summary: 'Selectable tag for filtering content. Toggle mode (default) or menu mode with chevron. Default and condensed sizes.' },
    { id: 'components-inline-alert',  name: 'Inline alert',  summary: 'Contextual message embedded in the page flow. Four statuses (informational, favorable, warning, critical), optional title, action, and close.' },
    { id: 'components-link',          name: 'Link',          summary: 'Anchor for navigation between files and external pages. Three types (inline, standalone, hyperlink), optional leading or trailing icon.' },
    { id: 'components-multiselect',   name: 'Multiselect',   summary: 'Multi-select dropdown with searchable input, chips, select-all, counter, and clear-all. Default and condensed sizes.' },
    { id: 'components-notification-badge', name: 'Notification badge', summary: 'Small indicator that signals new activity. Four sizes (XX-small dot through Medium with number). Composes inside avatars, icons, and buttons.' },
    { id: 'components-overlay',       name: 'Overlay',       summary: 'Semi-transparent scrim that dims content behind dialogs and drawers. Sits below the dialog on the z-index.' },
    { id: 'components-pagination',    name: 'Pagination',    summary: 'Page navigation for tables and paged content. Items-per-page dropdown, range readout, chevron prev/next, and numbered page buttons. Default and condensed sizes.' },
    { id: 'components-popover',       name: 'Popover',       summary: 'Anchored surface that appears after a trigger. Four sub-elements: tooltip, menu, date picker, and time picker. Configurable tip placement and alignment.' },
    { id: 'components-progress',      name: 'Progress',      summary: 'Bar, gauge, stepper (horizontal + vertical), and timeline. Status, ratio, and step-by-step progression for long-running flows.' },
    { id: 'components-radio',         name: 'Radio',         summary: 'Single-select form input rendered as a group of mutually-exclusive radio buttons. Optional badge, secondary text, per-item warning, group helper and error.' },
    { id: 'components-segmented-control', name: 'Segmented control', summary: 'Pill-style group of mutually-exclusive segments. Use when the user must pick exactly one of two to five short options that fit on one line.' },
    { id: 'components-sensitive-data',name: 'Sensitive data',summary: 'Masks PII (SSN, account number, full card number) by default with a Show / Hide toggle. Three layouts: icon + label, icon only, label only.' },
    { id: 'components-share-with-customer', name: 'Share with customer', summary: 'Agent-facing message displayed inside a workflow tile. The body text is intended to be read aloud to the customer; supports an optional language tab picker for translations.' },
    { id: 'components-show-more',     name: 'Show more',     summary: 'Collapse / expand toggle used inside cards, tiles, and data tables to reveal additional content. Default and condensed sizes.' },
    { id: 'components-skeleton',      name: 'Skeleton loader',summary: 'Animated placeholder shape that reserves space while content is loading. Three preset shapes (line, block, circle) plus full attribute overrides.' },
    { id: 'components-snackbar',      name: 'Snackbar',      summary: 'Temporary, low-impact toast notification confirming an action. Auto-dismisses. Three statuses (success, warning, critical).' },
    { id: 'components-status-dot',    name: 'Status dot',    summary: 'Colored dot + adjacent text for inline status indicators. Five status colors and two sizes. Status only — not for general categories or callouts.' },
    { id: 'components-system-outage', name: 'System outage', summary: 'Full-width banner for downtime, maintenance, and service restoration. Three statuses (platform-wide, feature, restored).' },
    { id: 'components-tabs',          name: 'Tabs',          summary: 'Horizontal tab list for navigating between groups of related content at the same hierarchy. Optional leading icon per tab. Minimum of two tabs.' },
    { id: 'components-text-input',    name: 'Text inputs',   summary: 'Text field (eleven variants: text, number, currency, phone, password, search, sensitive data, confirmation, date / month / time pickers) and text area. Default and condensed sizes.' },
    { id: 'components-tile',          name: 'Tile',          summary: 'Three tile variants: tile-button (interactive), tile (rich content with header parts and footer), tile-workflow (collapsible step in a multi-step flow).' },
    { id: 'components-toggle-switch', name: 'Toggle switch', summary: 'Quickly switch between two states (On / Off). Default and condensed sizes, optional left or right label, optional critical-on color treatment.' },
  ];

  const componentLinkCard = (c: ComponentEntry): HTMLElement =>
    overviewTile({ title: c.name, summary: c.summary, href: c.id });

  // Search input + count
  const searchInput = el('input', {
    type: 'search',
    class: 'component-search',
    placeholder: 'Search components by name or description (e.g. "alert", "button")',
    'aria-label': 'Search components',
    autocomplete: 'off',
  }) as HTMLInputElement;

  const count = el('span', { class: 'component-search-count' });
  const searchToolbar = el('div', { class: 'component-search-toolbar' }, searchInput, count);

  const grid = el('div', { class: 'foundation-grid' });

  function rerender() {
    const q = searchInput.value.trim().toLowerCase();
    const matches = q
      ? components.filter(
          (c) => c.name.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q),
        )
      : components;
    count.textContent = `${matches.length} of ${components.length}`;
    if (matches.length === 0) {
      grid.replaceChildren(
        el('div', { class: 'component-search-empty' }, `No components match "${searchInput.value}".`),
      );
    } else {
      grid.replaceChildren(...matches.map(componentLinkCard));
    }
  }
  searchInput.addEventListener('input', rerender);
  rerender();

  app.append(
    page(
      'components-overview',
      categoryBanner(
        'Components',
        'Reusable Lit Web Components built on Scout tokens. Form-associated via ElementInternals, accessible to WCAG 2.1 AA, framework-agnostic with React wrappers.',
      ),
      searchToolbar,
      grid,
    ),
  );
}

// --- Accordion (real Lit component from @scout/accordion)
import '@scout/accordion';

type AccSize = 'sm' | 'md' | 'lg';
type AccIconPos = 'left' | 'right';
type AccMode = 'single' | 'multi';

interface AccOpts {
  mode?: AccMode;
  size?: AccSize;
  iconPosition?: AccIconPos;
  divider?: boolean;
  items?: Array<{ label: string; content: string; expanded?: boolean; disabled?: boolean }>;
}

function previewAccordion(opts: AccOpts = {}): HTMLElement {
  const {
    mode = 'multi',
    size = 'md',
    iconPosition = 'right',
    divider = false,
    items = [
      { label: 'What is Scout?', content: 'Scout is the enterprise design system powering Ember and 7+ other internal tools. It ships tokens, components, and patterns built on Lit Web Components.', expanded: true },
      { label: 'How is the system structured?', content: 'Three tiers: Core (tokens + primitives), Shared (cross-product patterns), and Product (product-scoped patterns that can be promoted to Shared or Core).' },
      { label: 'Can I theme components?', content: 'Yes. Scout uses CSS custom properties for every visual value, so theme, density, language, and product brand all swap via data attributes on the root element with no rebuild.' },
    ],
  } = opts;

  const acc = document.createElement('scout-accordion');
  acc.setAttribute('mode', mode);
  acc.setAttribute('size', size);
  acc.setAttribute('icon-position', iconPosition);
  if (divider) acc.setAttribute('divider', '');

  for (const item of items) {
    const i = document.createElement('scout-accordion-item');
    i.setAttribute('label', item.label);
    if (item.expanded) i.setAttribute('expanded', '');
    if (item.disabled) i.setAttribute('disabled', '');
    i.textContent = item.content;
    acc.appendChild(i);
  }
  return acc;
}

// --- Accordion — Preview tab
function accordionPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, child: HTMLElement) => {
    wrap.append(
      el(
        'div',
        { class: 'preview-block' },
        el('h3', { class: 'preview-block__title' }, heading),
        el('p', { class: 'preview-block__lede' }, lede),
        el('div', { class: 'preview-row preview-row--block' }, child),
      ),
    );
  };

  block(
    'Default (multi expand)',
    'Multiple rows can be open simultaneously. Use this when sections are independent (FAQ, settings groups).',
    previewAccordion({ divider: true }),
  );
  block(
    'Single expand',
    'Opening one row collapses the others. Use this when only one section is relevant at a time.',
    previewAccordion({ mode: 'single', divider: true, items: [
      { label: 'Personal information', content: 'Name, contact, demographics.', expanded: true },
      { label: 'Billing details', content: 'Card on file, payment methods, statements.' },
      { label: 'Preferences', content: 'Communication settings, language, accessibility.' },
    ] }),
  );
  block(
    'Sizes',
    'Small for dense surfaces (toolbars, sidebars). Medium is the default. Large for prominent content sections.',
    el('div', { class: 'preview-stack' },
      previewAccordion({ size: 'sm', divider: true, items: [{ label: 'Small', content: 'Sm row content.', expanded: true }, { label: 'Small row 2', content: 'More content.' }] }),
      previewAccordion({ size: 'md', divider: true, items: [{ label: 'Medium', content: 'Md row content.', expanded: true }, { label: 'Medium row 2', content: 'More content.' }] }),
      previewAccordion({ size: 'lg', divider: true, items: [{ label: 'Large', content: 'Lg row content.', expanded: true }, { label: 'Large row 2', content: 'More content.' }] }),
    ),
  );
  block(
    'Icon position',
    'Right is the default and reads left-to-right. Left is occasionally used in tree-like or file-explorer contexts.',
    el('div', { class: 'preview-stack' },
      previewAccordion({ iconPosition: 'right', divider: true, items: [{ label: 'Icon on the right', content: 'Default placement.', expanded: true }] }),
      previewAccordion({ iconPosition: 'left', divider: true, items: [{ label: 'Icon on the left', content: 'Alternate placement.', expanded: true }] }),
    ),
  );
  block(
    'States',
    'Default · Disabled. Hover, focus, and pressed are interactive states best seen by interacting with the live components — they all use the standard Scout motion easing.',
    previewAccordion({ divider: true, items: [
      { label: 'Default row', content: 'Hover or focus me.' },
      { label: 'Expanded row', content: 'Already open.', expanded: true },
      { label: 'Disabled row', content: '(unreachable)', disabled: true },
    ] }),
  );
  block(
    'Without dividers',
    'Use this when the accordion sits on its own card or a colored background.',
    previewAccordion({ items: [
      { label: 'Section one', content: 'Content of section one.', expanded: true },
      { label: 'Section two', content: 'Content of section two.' },
    ] }),
  );
  return wrap;
}

// --- Accordion — Controls tab
function accordionControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });

  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const modeSel = ddSelect('acc-mode', ['multi', 'single'] as const);
  const sizeSel = ddSelect('acc-size', [{ value: 'sm', label: 'SM' }, { value: 'md', label: 'MD' }, { value: 'lg', label: 'LG' }]);
  sizeSel.value = 'md';
  const iconPosSel = ddSelect('acc-icon', ['right', 'left'] as const);
  const dividerChk = ctrlCheck('acc-divider', 'Divider', { checked: true });

  function render() {
    const mode = modeSel.value as AccMode;
    const size = sizeSel.value as AccSize;
    const iconPosition = iconPosSel.value as AccIconPos;
    const divider = dividerChk.checked;

    stage.replaceChildren(previewAccordion({ mode, size, iconPosition, divider }));

    const attrs = [`mode="${mode}"`, `size="${size}"`, `icon-position="${iconPosition}"`];
    if (divider) attrs.push('divider');
    codePre.textContent = `<scout-accordion ${attrs.join(' ')}>
  <scout-accordion-item label="What is Scout?" expanded>
    Scout is the enterprise design system…
  </scout-accordion-item>
  <scout-accordion-item label="How is the system structured?">
    Three tiers: Core, Shared, Product…
  </scout-accordion-item>
</scout-accordion>`;
  }

  for (const c of [modeSel, sizeSel, iconPosSel, dividerChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }

  const ctrlField = (labelText: string, htmlFor: string, control: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: htmlFor }, labelText), control);

  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Mode', 'acc-mode', modeSel),
    ctrlField('Size', 'acc-size', sizeSel),
    ctrlField('Icon position', 'acc-icon', iconPosSel),
    el('div', { class: 'ctrl-checks' },
      dividerChk,
    ),
  );

  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre),
  ));

  queueMicrotask(render);
  return wrap;
}

// --- Accordion — Usage guidelines (Do / Don't)
function accordionGuidelines(): HTMLElement {
  const doCard = (preview: HTMLElement, copy: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, preview),
      el('p', {}, copy),
    );
  const dontCard = (preview: HTMLElement, copy: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, preview),
      el('p', {}, copy),
    );

  return el(
    'div',
    { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Patterns that match user expectations and keep the accordion useful.'),
      el('div', { class: 'do-dont-grid' },
        doCard(
          previewAccordion({ mode: 'single', divider: true, items: [
            { label: 'Step 1', content: 'Verify identity.', expanded: true },
            { label: 'Step 2', content: 'Confirm payment.' },
          ] }),
          'Use single-expand mode for sequential or mutually exclusive content (e.g. forms with steps, settings sections).',
        ),
        doCard(
          previewAccordion({ size: 'md', divider: true, items: [
            { label: 'Frequently asked', content: 'A clear, short label tells users what they\'ll find without surprising them.', expanded: true },
          ] }),
          'Write labels that describe the content. Users should be able to predict what opens before they click.',
        ),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Patterns that hide important content or break user expectations.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(
          previewAccordion({ items: [
            { label: 'Required: Account holder name', content: 'A required field…', expanded: true },
          ] }),
          "Don't put critical or required content inside an accordion. Anything users must see should be visible by default.",
        ),
        dontCard(
          previewAccordion({ items: [
            { label: 'More', content: 'Vague label content.' },
            { label: 'Other', content: 'Equally vague.' },
            { label: 'Stuff', content: 'You get the picture.' },
          ] }),
          'Don\'t use vague labels like "More", "Other", or "Stuff". Users will skip past them.',
        ),
      ),
    ),
  );
}

// --- Accordion — Content
function accordionContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Writing accordion labels'),
      el('p', { class: 'preview-block__lede' }, 'Labels are the only thing users see in a collapsed accordion — they decide whether the user opens the row.'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use sentence case ("Account preferences", not "Account Preferences").'),
        el('li', {}, 'Be specific. "Billing details" beats "More info".'),
        el('li', {}, 'Front-load the noun. "Payment methods" beats "Methods of payment".'),
        el('li', {}, 'Keep labels under 6 words. If you need more, the section probably needs to be split.'),
        el('li', {}, "Don't repeat the page title in every row label. The accordion is part of a larger page; labels are sub-headings."),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Inside the row'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Keep content focused. If a row needs more than ~200 words, consider linking out to a dedicated page.'),
        el('li', {}, 'Format with the rest of Scout typography (Body, Body small, Label) — accordions inherit naturally.'),
        el('li', {}, 'Group related controls and content. A "Notification preferences" row should contain the actual toggles, not just a description.'),
      ),
    ),
  );
}

// --- Accordion — Accessibility
function accordionAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Tab moves focus to the next accordion trigger; Shift+Tab moves back.'),
        el('li', {}, 'Enter and Space toggle the focused row.'),
        el('li', {}, 'Disabled rows are skipped in tab order.'),
        el('li', {}, 'Focus ring uses Scout `text.interactive.primary` at 2px inset for visibility on hover backgrounds.'),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Screen readers'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Each trigger is a native `<button>` with `aria-expanded` reflecting the row state.'),
        el('li', {}, 'The content region uses `role="region"` and is labelled by the trigger via `aria-labelledby`.'),
        el('li', {}, 'Collapsed content sets `aria-hidden="true"` so screen readers skip it cleanly.'),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Motion & reduced-motion'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Expand / collapse uses CSS Grid 1fr animation at `motion.duration.base` × `motion.easing.standard`.'),
        el('li', {}, 'Honors `prefers-reduced-motion: reduce` — transitions on icon and content collapse to instant.'),
      ),
    ),
  );
}

// --- Accordion — Code
function accordionCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-accordion mode="single" size="md" icon-position="right" divider>
  <scout-accordion-item label="What is Scout?" expanded>
    Scout is the enterprise design system…
  </scout-accordion-item>

  <scout-accordion-item label="Disabled row" disabled>
    This row cannot be toggled.
  </scout-accordion-item>
</scout-accordion>`,
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' },
        `pnpm add @scout/accordion @scout/tokens lit

// In your app entry, side-effect import to register the elements:
import '@scout/accordion';`,
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props — <scout-accordion>'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {},
            el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'),
          )),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'mode'), el('td', {}, '"single" | "multi"'), el('td', {}, '"multi"'), el('td', {}, 'Single collapses peers when one opens.')),
            el('tr', {}, el('td', {}, 'size'), el('td', {}, '"sm" | "md" | "lg"'), el('td', {}, '"md"'), el('td', {}, 'Density preset propagated to all child items.')),
            el('tr', {}, el('td', {}, 'icon-position'), el('td', {}, '"left" | "right"'), el('td', {}, '"right"'), el('td', {}, 'Where the chevron sits.')),
            el('tr', {}, el('td', {}, 'divider'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, '1px rule between items.')),
          ),
        ),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props — <scout-accordion-item>'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {},
            el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'),
          )),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'label'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Header text rendered next to the chevron.')),
            el('tr', {}, el('td', {}, 'expanded'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Whether content is visible. Reflective.')),
            el('tr', {}, el('td', {}, 'disabled'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disables interaction; skips tab order.')),
          ),
        ),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Events'),
      el('pre', { class: 'code-block' },
        `// Bubbles, composed. detail = { expanded: boolean }
accordion.addEventListener('scout-accordion-toggle', (e) => {
  console.log('row toggled to', e.detail.expanded);
});`,
      ),
    ),
  );
}

// --- Accordion page
app.append(
  componentPage(
    'components-accordion',
    'Accordion',
    'Vertically stacked rows that reveal or hide associated sections of content. Configure to display one row at a time or many simultaneously.',
    [
      { id: 'preview',       label: 'Preview',           content: accordionPreview() },
      { id: 'controls',      label: 'Controls',          content: accordionControls() },
      { id: 'guidelines',    label: 'Usage guidelines',  content: accordionGuidelines() },
      { id: 'content',       label: 'Content',           content: accordionContent() },
      { id: 'accessibility', label: 'Accessibility',     content: accordionAccessibility() },
      { id: 'code',          label: 'Code',              content: accordionCode() },
    ],
  ),
);

// =================================================================
// Address (real Lit component from @scout/address)
// =================================================================
import '@scout/address';

type AddrSize = 'full' | 'condensed' | 'single-line';
type AddrSelectTool = 'none' | 'checkbox' | 'radio';
type AddrOrientation = 'stacked' | 'inline';

interface AddrOpts {
  label?: string;
  size?: AddrSize;
  selectTool?: AddrSelectTool;
  orientation?: AddrOrientation;
  favorite?: boolean;
  doNotDisclose?: boolean;
  selected?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
  // Body lines: in single-line we'll join with ", ", otherwise <br>-separated
  lines?: string[];
  meta?: string;
}

function previewAddress(opts: AddrOpts = {}): HTMLElement {
  const {
    label = '',
    size = 'full',
    selectTool = 'none',
    orientation = 'stacked',
    favorite = false,
    doNotDisclose = false,
    selected = false,
    disabled = false,
    name = '',
    value = '',
    lines = ['123 Main St', 'Apt 4B', 'Brooklyn, NY 11201'],
    meta,
  } = opts;

  const a = document.createElement('scout-address');
  if (label) a.setAttribute('label', label);
  a.setAttribute('size', size);
  a.setAttribute('select-tool', selectTool);
  a.setAttribute('orientation', orientation);
  if (favorite) a.setAttribute('favorite', '');
  if (doNotDisclose) a.setAttribute('do-not-disclose', '');
  if (selected) a.setAttribute('selected', '');
  if (disabled) a.setAttribute('disabled', '');
  if (name) a.setAttribute('name', name);
  if (value) a.setAttribute('value', value);

  // Body slot — for single-line, join with comma. For multi-line, insert <br>.
  if (size === 'single-line') {
    a.appendChild(document.createTextNode(lines.join(', ')));
  } else {
    lines.forEach((line, i) => {
      a.appendChild(document.createTextNode(line));
      if (i < lines.length - 1) a.appendChild(document.createElement('br'));
    });
  }

  if (meta) {
    const m = document.createElement('span');
    m.setAttribute('slot', 'meta');
    m.textContent = meta;
    a.appendChild(m);
  }
  return a;
}

// --- Address — Preview tab
function addressPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });

  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(
      el('div', { class: 'preview-block' },
        el('h3', { class: 'preview-block__title' }, heading),
        el('p', { class: 'preview-block__lede' }, lede),
        el('div', { class: 'preview-row preview-row--block' }, content),
      ),
    );
  };

  block(
    'Default (Full size, stacked)',
    'The default presentation: label, optional favorite, body, and meta copy. Used in profile and account-detail views where the address has room to breathe.',
    previewAddress({ label: 'Home address', favorite: true, meta: 'Last verified Mar 2024 · Primary' }),
  );

  block(
    'Sizes',
    'Full for detail views. Condensed for data-dense surfaces (lists, tables). Single-line for compact rows where the address must fit on one line.',
    el('div', { class: 'preview-stack' },
      previewAddress({ size: 'full', label: 'Full' }),
      previewAddress({ size: 'condensed', label: 'Condensed' }),
      previewAddress({ size: 'single-line', label: 'Single-line' }),
    ),
  );

  block(
    'Select tools',
    'Add a selector when the user is interacting with addresses. Use scout-checkbox to select one or many for a bulk action (delete, mail to, export). Wrap the address in scout-accordion when only the most recently used address should be visible by default and the rest collapsed.',
    el('div', { class: 'preview-stack' },
      // Checkbox composition — pairs <scout-checkbox> with the address.
      // The checkbox is the actual Scout component (not the native input
      // the address component embeds via selectTool="checkbox"), so the
      // pattern reads as "checkbox + address" the same way it would in a
      // bulk-select list.
      (() => {
        const row = el('div', { class: 'address-select-row' });
        const cb = document.createElement('scout-checkbox') as HTMLElement & { checked: boolean };
        cb.setAttribute('checked', '');
        cb.setAttribute('aria-label', 'Select home address');
        row.append(cb, previewAddress({ label: 'Home address', meta: 'Last verified Mar 2024 · Primary' }));
        return row;
      })(),
      // Accordion composition — wraps the address in a <scout-accordion>
      // so it can collapse to its label when other priorities take focus.
      (() => {
        const acc = document.createElement('scout-accordion');
        acc.setAttribute('mode', 'single');
        acc.setAttribute('size', 'md');
        acc.setAttribute('icon-position', 'right');
        acc.setAttribute('divider', '');
        const item = document.createElement('scout-accordion-item');
        item.setAttribute('label', 'Home address');
        item.setAttribute('expanded', '');
        item.append(previewAddress({ lines: ['1234 Maple Street', 'Apt 5B', 'Anywhere, USA 12345'] }));
        acc.append(item);
        const item2 = document.createElement('scout-accordion-item');
        item2.setAttribute('label', 'Work address');
        item2.append(previewAddress({ lines: ['450 Industrial Blvd', 'Suite 200', 'Anywhere, USA 12346'] }));
        acc.append(item2);
        return acc;
      })(),
    ),
  );

  block(
    'Orientation',
    'Stacked is the default. Inline puts the label on the same row as the body — useful when vertical real estate is tight.',
    el('div', { class: 'preview-stack' },
      previewAddress({ label: 'Stacked', orientation: 'stacked' }),
      previewAddress({ label: 'Inline',  orientation: 'inline'  }),
    ),
  );

  block(
    'Do not disclose',
    'When the customer has flagged an address as private, render the privacy banner. The address remains visible — agents need to see it — but the banner is a clear reminder.',
    previewAddress({ label: 'Backup address', doNotDisclose: true, lines: ['PO Box 4421', 'Anywhere, USA 12345'] }),
  );

  block(
    'States',
    'Default · Selected · Disabled.',
    el('div', { class: 'preview-stack' },
      previewAddress({ label: 'Default' }),
      previewAddress({ label: 'Selected', selectTool: 'checkbox', selected: true }),
      previewAddress({ label: 'Disabled', disabled: true }),
    ),
  );

  return wrap;
}

// --- Address — Controls tab
function addressControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });

  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const labelInput = ctrlText('addr-label', 'Home address');
  const sizeSel = ddSelect('addr-size', ['full', 'condensed', 'single-line'] as const);
  const selectToolSel = ddSelect('addr-select', ['none', 'checkbox', 'radio'] as const);
  const orientationSel = ddSelect('addr-orient', ['stacked', 'inline'] as const);
  const favoriteChk = ctrlCheck('addr-fav', 'Favorite');
  const dndChk = ctrlCheck('addr-dnd', 'Do not disclose');
  const selectedChk = ctrlCheck('addr-selected', 'Selected');
  const disabledChk = ctrlCheck('addr-disabled', 'Disabled');
  const metaInput = ctrlText('addr-meta', 'Last verified Mar 2024 · Primary');

  function render() {
    const opts: AddrOpts = {
      label: labelInput.value,
      size: sizeSel.value as AddrSize,
      selectTool: selectToolSel.value as AddrSelectTool,
      orientation: orientationSel.value as AddrOrientation,
      favorite: favoriteChk.checked,
      doNotDisclose: dndChk.checked,
      selected: selectedChk.checked,
      disabled: disabledChk.checked,
      meta: metaInput.value || undefined,
    };
    stage.replaceChildren(previewAddress(opts));

    const attrs: string[] = [];
    if (opts.label) attrs.push(`label="${opts.label}"`);
    if (opts.size !== 'full') attrs.push(`size="${opts.size}"`);
    if (opts.selectTool !== 'none') attrs.push(`select-tool="${opts.selectTool}"`);
    if (opts.orientation !== 'stacked') attrs.push(`orientation="${opts.orientation}"`);
    if (opts.favorite) attrs.push('favorite');
    if (opts.doNotDisclose) attrs.push('do-not-disclose');
    if (opts.selected) attrs.push('selected');
    if (opts.disabled) attrs.push('disabled');

    const indent = attrs.length > 1 ? '\n  ' : ' ';
    const opener = attrs.length ? `<scout-address${indent}${attrs.join(indent)}\n>` : '<scout-address>';
    const body = opts.size === 'single-line'
      ? '\n  123 Main St, Apt 4B, Brooklyn, NY 11201\n'
      : '\n  123 Main St<br />\n  Apt 4B<br />\n  Brooklyn, NY 11201\n';
    const meta = opts.meta ? `  <span slot="meta">${opts.meta}</span>\n` : '';
    codePre.textContent = `${opener}${body}${meta}</scout-address>`;
  }

  // Selected only applies when a select tool (checkbox or radio) is set —
  // gate the checkbox via the wrapper class. The actual checkbox stays in
  // the .ctrl-checks group since it's not wrapped in .ctrl-field, so we
  // toggle its disabled attribute directly and dim it via parent class.
  function applyAddressGating() {
    const hasSelector = selectToolSel.value !== 'none';
    if (hasSelector) {
      selectedChk.removeAttribute('disabled');
      selectedChk.classList.remove('is-disabled');
    } else {
      selectedChk.setAttribute('disabled', '');
      selectedChk.classList.add('is-disabled');
    }
  }

  for (const c of [labelInput, sizeSel, selectToolSel, orientationSel, favoriteChk, dndChk, selectedChk, disabledChk, metaInput]) {
    c.addEventListener('input', () => { applyAddressGating(); render(); });
    c.addEventListener('change', () => { applyAddressGating(); render(); });
  }
  applyAddressGating();

  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Label', 'addr-label', labelInput),
    ctrlField('Size', 'addr-size', sizeSel),
    ctrlField('Select tool', 'addr-select', selectToolSel),
    ctrlField('Orientation', 'addr-orient', orientationSel),
    ctrlField('Meta', 'addr-meta', metaInput),
    el('div', { class: 'ctrl-checks' },
      favoriteChk,
      dndChk,
      selectedChk,
      disabledChk,
    ),
  );

  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre),
  ));

  queueMicrotask(render);
  return wrap;
}

// --- Address — Usage guidelines
function addressGuidelines(): HTMLElement {
  const doCard = (preview: HTMLElement, copy: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, preview),
      el('p', {}, copy),
    );
  const dontCard = (preview: HTMLElement, copy: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, preview),
      el('p', {}, copy),
    );

  return el(
    'div',
    { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Patterns that respect privacy and keep address presentation scannable.'),
      el('div', { class: 'do-dont-grid' },
        doCard(
          previewAddress({ label: 'Home address', favorite: true, meta: 'Primary' }),
          'Use the favorite indicator and a meta tag like "Primary" to mark the default address in a list.',
        ),
        doCard(
          previewAddress({ doNotDisclose: true, label: 'Backup' }),
          'Always render the Do-Not-Disclose banner when the customer has flagged the address. Don\'t hide it just because the agent might find it visually noisy.',
        ),
        doCard(
          previewAddress({ size: 'condensed', label: 'Mailing', orientation: 'inline' }),
          'In dense surfaces (account list, table rows), use condensed size and inline orientation to fit more addresses on screen.',
        ),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Patterns that hide privacy flags or break expected scanning patterns.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(
          previewAddress({ size: 'single-line', label: 'Verylonglabelthatcrowdsthebody', lines: ['1234567890 Some Very Very Long Street Name', 'Apartment 99-Z', 'A Long City Name', 'Country'] }),
          "Don't force complex addresses into single-line mode — they'll truncate. Use full or condensed when the address has 4+ lines or unusual length.",
        ),
        dontCard(
          previewAddress({ label: 'Address' }),
          "Don't use vague labels like \"Address\" when the user has multiple addresses on file. Specify which one (\"Home\", \"Mailing\", \"Billing\").",
        ),
      ),
    ),
  );
}

// --- Address — Content
function addressContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use sentence case ("Home address", not "Home Address").'),
        el('li', {}, 'Be specific: "Home address", "Mailing address", "Backup billing", not "Address 1", "Address 2".'),
        el('li', {}, 'Front-load the noun: "Mailing address" beats "Address for mail".'),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Body formatting'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Format the body to match the locale. US: street, city/state, zip, country. Other locales follow their conventions.'),
        el('li', {}, 'Use line breaks for clarity. Don\'t cram everything into one comma-separated line unless using `size="single-line"`.'),
        el('li', {}, 'For international addresses, include the country on its own line.'),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Meta copy'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use meta to surface low-importance context: "Primary", "Last verified Mar 2024", "USPS-validated".'),
        el('li', {}, 'Separate multiple meta items with " · " (middle dot, surrounded by spaces).'),
        el('li', {}, 'Keep meta to one line if possible — it\'s a glance, not a paragraph.'),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Privacy'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use `do-not-disclose` whenever the customer has flagged the address as private. Banner is mandatory; do not omit.'),
        el('li', {}, 'Do not paraphrase the privacy notice — "Do not disclose" is the standardized wording across Scout products.'),
      ),
    ),
  );
}

// --- Address — Accessibility
function addressAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Semantic markup'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Body uses the native `<address>` element — screen readers and crawlers identify it as an address.'),
        el('li', {}, 'The Do-Not-Disclose banner uses `role="note"` so it\'s announced as supplementary information.'),
        el('li', {}, 'The favorite icon is wrapped in an inline SVG with a `<title>` for assistive tech.'),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Selectors'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'When `select-tool` is set, the inner `<input>` receives an aria-label derived from the address label ("Select Home address").'),
        el('li', {}, 'Selectors are keyboard-focusable and operable with Space (checkbox) or arrow keys (radio).'),
        el('li', {}, 'Selected state uses both a visible border highlight and the input\'s `checked` attribute — never color alone.'),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & motion'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'All text meets WCAG 2.1 AA against the surface background in light and dark themes.'),
        el('li', {}, 'Selection-state border transition honors prefers-reduced-motion: reduce.'),
      ),
    ),
  );
}

// --- Address — Code
function addressCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-address label="Home address" favorite>
  123 Main St<br />
  Apt 4B<br />
  Brooklyn, NY 11201
  <span slot="meta">Last verified Mar 2024 · Primary</span>
</scout-address>

<scout-address
  label="Mailing address"
  select-tool="radio"
  name="primary-addr"
  value="addr-1"
  selected
>
  500 Park Ave<br />
  New York, NY 10022
</scout-address>

<scout-address size="single-line">
  123 Main St, Apt 4B, Brooklyn, NY 11201
</scout-address>

<scout-address do-not-disclose label="Backup">
  PO Box 4421<br />
  Anywhere, USA 12345
</scout-address>`,
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' },
        `pnpm add @scout/address @scout/tokens lit

import '@scout/address';`,
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {},
            el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'),
          )),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'label'),           el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Optional label rendered above the body.')),
            el('tr', {}, el('td', {}, 'size'),            el('td', {}, '"full" | "condensed" | "single-line"'), el('td', {}, '"full"'), el('td', {}, 'Layout density.')),
            el('tr', {}, el('td', {}, 'select-tool'),     el('td', {}, '"none" | "checkbox" | "radio"'), el('td', {}, '"none"'), el('td', {}, 'Selector for choose-one or multi-select flows.')),
            el('tr', {}, el('td', {}, 'orientation'),     el('td', {}, '"stacked" | "inline"'), el('td', {}, '"stacked"'), el('td', {}, 'Stacked = label above body. Inline = label and body share a row.')),
            el('tr', {}, el('td', {}, 'favorite'),        el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Renders a star next to the label.')),
            el('tr', {}, el('td', {}, 'do-not-disclose'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Renders a privacy banner above the address.')),
            el('tr', {}, el('td', {}, 'selected'),        el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Toggles the selector\'s checked state.')),
            el('tr', {}, el('td', {}, 'disabled'),        el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disables interaction.')),
            el('tr', {}, el('td', {}, 'name / value'),    el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Form name/value passed to the internal selector input.')),
          ),
        ),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Slots'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {},
            el('th', {}, 'Slot'), el('th', {}, 'Purpose'),
          )),
          el('tbody', {},
            el('tr', {}, el('td', {}, '(default)'), el('td', {}, 'Body copy. Use <br /> for multi-line layouts.')),
            el('tr', {}, el('td', {}, 'meta'),      el('td', {}, 'Secondary meta copy.')),
          ),
        ),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Events'),
      el('pre', { class: 'code-block' },
        `// Bubbles, composed. detail = { selected: boolean, value: string }
addr.addEventListener('scout-address-change', (e) => {
  console.log(e.detail);
});`,
      ),
    ),
  );
}

// --- Address page
app.append(
  componentPage(
    'components-address',
    'Address',
    'Pre-formatted display of a postal address. Composes optional label, favorite, selector, body, meta, and Do-Not-Disclose banner.',
    [
      { id: 'preview',       label: 'Preview',           content: addressPreview() },
      { id: 'controls',      label: 'Controls',          content: addressControls() },
      { id: 'guidelines',    label: 'Usage guidelines',  content: addressGuidelines() },
      { id: 'content',       label: 'Content',           content: addressContent() },
      { id: 'accessibility', label: 'Accessibility',     content: addressAccessibility() },
      { id: 'code',          label: 'Code',              content: addressCode() },
    ],
  ),
);

// =================================================================
// Avatar (real Lit component from @scout/avatar)
// =================================================================
import '@scout/avatar';

type AvSize = 'small' | 'medium' | 'large';
type AvColor = 'blue' | 'gray' | 'knockout';
type AvTitleSize = 'medium' | 'large';

interface AvOpts {
  initials?: string;
  size?: AvSize;
  color?: AvColor;
  notification?: boolean;
  title?: string;
  titleSize?: AvTitleSize;
}

function previewAvatar(opts: AvOpts = {}): HTMLElement {
  const {
    initials = 'HM',
    size = 'medium',
    color = 'blue',
    notification = false,
    title,
    titleSize = 'medium',
  } = opts;
  const a = document.createElement('scout-avatar');
  a.setAttribute('initials', initials);
  a.setAttribute('size', size);
  a.setAttribute('color', color);
  if (notification) a.setAttribute('notification', '');
  if (title) {
    a.setAttribute('title-size', titleSize);
    const t = document.createElement('span');
    t.setAttribute('slot', 'title');
    t.textContent = title;
    a.appendChild(t);
  }
  return a;
}

function avatarPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, ...children: HTMLElement[]) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row' }, ...children),
    ));
  };

  block(
    'Sizes',
    'Small for tight contexts (table cells, inline mentions). Medium is the default. Large for prominent profile or list-row displays.',
    previewAvatar({ size: 'small' }),
    previewAvatar({ size: 'medium' }),
    previewAvatar({ size: 'large' }),
  );

  block(
    'Colors',
    'Blue is the default Scout brand treatment. Gray is a neutral fallback for non-personal entities. Knockout uses the page surface for use on tinted or photo backgrounds.',
    previewAvatar({ color: 'blue', initials: 'HM' }),
    previewAvatar({ color: 'gray', initials: 'JD' }),
    previewAvatar({ color: 'knockout', initials: 'AB' }),
  );

  block(
    'With notification badge',
    'A red dot in the top-right indicates unread notifications or attention required. Renders proportionally across sizes.',
    previewAvatar({ size: 'small', notification: true }),
    previewAvatar({ size: 'medium', notification: true }),
    previewAvatar({ size: 'large', notification: true }),
  );

  block(
    'With title',
    'Use the title slot to render the entity\'s name beside the avatar. Medium for body-sized contexts; large for hero or header surfaces.',
    previewAvatar({ initials: 'HM', title: 'Hannah Mezzadri', titleSize: 'medium' }),
    previewAvatar({ initials: 'HM', title: 'Hannah Mezzadri', titleSize: 'large', size: 'large' }),
  );

  return wrap;
}

function avatarControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const initialsInput = ctrlText('av-initials', 'HM');
  const sizeSel = ddSelect('av-size', ['small', 'medium', 'large'] as const);
  sizeSel.value = 'medium';
  const colorSel = ddSelect('av-color', ['blue', 'gray', 'knockout'] as const);
  const titleInput = ctrlText('av-title', '');
  const titleSizeSel = ddSelect('av-title-size', ['medium', 'large'] as const);
  const notificationChk = ctrlCheck('av-notif', 'Notification dot');

  // Title size only applies when a Title is set — gate it.
  const titleSizeField = ctrlField('Title size', 'av-title-size', titleSizeSel);

  function render() {
    setFieldDisabled(titleSizeField, titleSizeSel, !titleInput.value);

    stage.replaceChildren(previewAvatar({
      initials: initialsInput.value || 'HM',
      size: sizeSel.value as AvSize,
      color: colorSel.value as AvColor,
      notification: notificationChk.checked,
      title: titleInput.value || undefined,
      titleSize: titleSizeSel.value as AvTitleSize,
    }));
    const attrs: string[] = [`initials="${initialsInput.value || 'HM'}"`];
    if (sizeSel.value !== 'medium') attrs.push(`size="${sizeSel.value}"`);
    if (colorSel.value !== 'blue') attrs.push(`color="${colorSel.value}"`);
    if (notificationChk.checked) attrs.push('notification');
    if (titleInput.value) attrs.push(`title-size="${titleSizeSel.value}"`);
    const titleSlot = titleInput.value
      ? `\n  <span slot="title">${titleInput.value}</span>\n`
      : '';
    codePre.textContent = `<scout-avatar ${attrs.join(' ')}>${titleSlot}${titleSlot ? '' : ''}</scout-avatar>`;
  }
  for (const c of [initialsInput, sizeSel, colorSel, titleInput, titleSizeSel, notificationChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Initials', 'av-initials', initialsInput),
    ctrlField('Size', 'av-size', sizeSel),
    ctrlField('Color', 'av-color', colorSel),
    ctrlField('Title', 'av-title', titleInput),
    titleSizeField,
    el('div', { class: 'ctrl-checks' }, notificationChk),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function avatarGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Patterns that keep avatars scannable and meaningful.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewAvatar({ initials: 'HM' }), 'Use 1–2 letter initials. The first letter of the first and last name is the convention; single letter for entities is fine.'),
        doCard(previewAvatar({ initials: 'JD', notification: true }), 'Add the notification dot only when there\'s actionable, unread content tied to the person/entity.'),
        doCard(previewAvatar({ color: 'gray', initials: 'AC' }), 'Use the gray treatment for non-personal entities (departments, accounts, automated agents).'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Patterns that confuse or visually overload the avatar.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewAvatar({ initials: 'HMZ' }), "Don't use more than 2 letters. They overflow the badge and lose readability at small sizes."),
        dontCard(previewAvatar({ initials: '' }), "Don't render an avatar with empty initials. Always provide initials, even if you have to derive them from a fallback string."),
      )));
}

function avatarContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Initials'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Default: first letter of the first and last name (e.g. "Hannah Mezzadri" → "HM").'),
        el('li', {}, 'Single names: use the first two letters or just the first letter.'),
        el('li', {}, 'Always uppercase. The component handles this via CSS so you can pass any case.'),
        el('li', {}, 'Maximum 2 characters; longer strings will overflow the badge.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Title'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use the user or entity\'s display name as it appears elsewhere in the product.'),
        el('li', {}, 'Title-size medium pairs with body-sized layouts. Large pairs with hero / header surfaces and the large avatar.'),
      )));
}

function avatarAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Semantic markup'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The badge uses role="img" with an aria-label of "Avatar: HM" so it\'s announced by screen readers.'),
        el('li', {}, 'The notification dot has its own aria-label ("Has notification") so it\'s not silent decoration.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & contrast'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'All three color treatments (blue, gray, knockout) meet WCAG 2.1 AA for the initials text against the badge background.'),
        el('li', {}, 'The notification dot is conveyed by both color AND position — not color alone.'),
      )));
}

function avatarCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-avatar initials="HM" size="medium" color="blue"></scout-avatar>

<scout-avatar initials="JD" size="large" color="gray" notification>
  <span slot="title">Jane Doe</span>
</scout-avatar>

<scout-avatar initials="AC" size="small" color="knockout"></scout-avatar>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/avatar @scout/tokens lit\n\nimport '@scout/avatar';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'initials'),     el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, '1–2 letter initials. Auto-uppercased.')),
            el('tr', {}, el('td', {}, 'size'),         el('td', {}, '"small" | "medium" | "large"'), el('td', {}, '"medium"'), el('td', {}, 'Badge size.')),
            el('tr', {}, el('td', {}, 'color'),        el('td', {}, '"blue" | "gray" | "knockout"'), el('td', {}, '"blue"'), el('td', {}, 'Color treatment.')),
            el('tr', {}, el('td', {}, 'notification'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Renders a red dot indicator.')),
            el('tr', {}, el('td', {}, 'title-size'),   el('td', {}, '"medium" | "large"'), el('td', {}, '"medium"'), el('td', {}, 'Size of the slotted title text.')),
          )))));
}

app.append(componentPage(
  'components-avatar',
  'Avatar',
  'Thumbnail representation of a person or entity. Three sizes, three color treatments, optional notification dot and title.',
  [
    { id: 'preview', label: 'Preview', content: avatarPreview() },
    { id: 'controls', label: 'Controls', content: avatarControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: avatarGuidelines() },
    { id: 'content', label: 'Content', content: avatarContent() },
    { id: 'accessibility', label: 'Accessibility', content: avatarAccessibility() },
    { id: 'code', label: 'Code', content: avatarCode() },
  ],
));

// =================================================================
// Badge (real Lit component from @scout/badge)
// =================================================================
import '@scout/badge';

type BgType = 'informational' | 'neutral' | 'neutral-knockout' | 'success' | 'warning' | 'critical' | 'ai-summary';
type BgEmphasis = 'high' | 'low';
type BgSize = 'default' | 'condensed';

function previewBadge(opts: {
  type?: BgType;
  emphasis?: BgEmphasis;
  size?: BgSize;
  icon?: boolean;
  label?: string;
} = {}): HTMLElement {
  const {
    type = 'neutral',
    emphasis = 'low',
    size = 'default',
    icon = false,
    label = 'Label',
  } = opts;
  const b = document.createElement('scout-badge');
  b.setAttribute('type', type);
  b.setAttribute('emphasis', emphasis);
  b.setAttribute('size', size);
  if (icon) b.setAttribute('icon', '');
  b.textContent = label;
  return b;
}

function badgePreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, ...children: HTMLElement[]) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row' }, ...children),
    ));
  };

  block(
    'Types — low emphasis (default)',
    'Seven types cover the badge\'s semantic meaning. Low emphasis is the default — use it for status chips that sit alongside data without competing for attention.',
    previewBadge({ type: 'informational', label: 'New' }),
    previewBadge({ type: 'neutral', label: 'Draft' }),
    previewBadge({ type: 'neutral-knockout', label: 'Default' }),
    previewBadge({ type: 'success', label: 'Active' }),
    previewBadge({ type: 'warning', label: 'Pending' }),
    previewBadge({ type: 'critical', label: 'Blocked' }),
    previewBadge({ type: 'ai-summary', label: 'AI summary' }),
  );

  block(
    'Types — high emphasis',
    'High emphasis fills the badge with the type\'s color. Reserve for badges that need stronger visual presence (active rows, urgent statuses).',
    previewBadge({ type: 'informational', emphasis: 'high', label: 'New' }),
    previewBadge({ type: 'neutral', emphasis: 'high', label: 'Draft' }),
    previewBadge({ type: 'neutral-knockout', emphasis: 'high', label: 'Default' }),
    previewBadge({ type: 'success', emphasis: 'high', label: 'Active' }),
    previewBadge({ type: 'warning', emphasis: 'high', label: 'Pending' }),
    previewBadge({ type: 'critical', emphasis: 'high', label: 'Blocked' }),
    previewBadge({ type: 'ai-summary', emphasis: 'high', label: 'AI summary' }),
  );

  block(
    'Sizes',
    'Default for general-purpose surfaces. Condensed for data-dense rows (tables, lists). Icons are disallowed at condensed size.',
    previewBadge({ type: 'success', size: 'default', label: 'Default' }),
    previewBadge({ type: 'success', size: 'condensed', label: 'Condensed' }),
  );

  // ----- Prescriptive usage -----
  // A two-column table: badge example on the left, plain-language usage note on
  // the right. Rendered as a real <table> so it scans like reference material.
  const usageRows: Array<{ badge: HTMLElement; note: string }> = [
    {
      badge: previewBadge({ type: 'informational', label: 'New' }),
      note: 'Use for new content such as features or questions in a form.',
    },
    {
      badge: previewBadge({ type: 'ai-summary', icon: true, label: 'AI summary' }),
      note: 'Use when content is being extracted or generated from AI.',
    },
    {
      badge: previewBadge({ type: 'success', icon: true, label: 'Active' }),
      note: 'Use to confirm a positive, healthy, or completed state — e.g. an active account, a successful payment, or a verified record.',
    },
    {
      badge: previewBadge({ type: 'warning', icon: true, label: 'Pending' }),
      note: 'Use for in-progress or attention-worthy states that aren\'t errors — e.g. pending review, processing, awaiting confirmation.',
    },
    {
      badge: previewBadge({ type: 'critical', icon: true, label: 'Failed' }),
      note: 'Use for error, blocked, or destructive states — e.g. a failed payment, a closed account, or a flagged dispute.',
    },
    {
      badge: previewBadge({ type: 'success', label: 'Enrolled' }),
      note: 'Use to confirm a customer or account is enrolled in a program, plan, or service.',
    },
    {
      badge: previewBadge({ type: 'warning', label: 'Pending' }),
      note: 'Use for enrollments that are submitted but not yet confirmed — awaiting verification, processing, or approval.',
    },
    {
      badge: previewBadge({ type: 'neutral', label: 'Unenrolled' }),
      note: 'Use to mark a customer or account that is not currently enrolled — never enrolled, opted out, or cancelled.',
    },
    {
      badge: previewBadge({ type: 'critical', label: 'Canceled' }),
      note: 'Use for terminated or revoked enrollments — accounts, plans, or subscriptions that were active and have since been cancelled.',
    },
  ];

  const usageTable = el('table', { class: 'badge-usage-table' },
    el('thead', {},
      el('tr', {},
        el('th', {}, 'Badge'),
        el('th', {}, 'Use for'),
      ),
    ),
    el('tbody', {},
      ...usageRows.map((row) =>
        el('tr', {},
          el('td', { class: 'badge-usage-table__badge' }, row.badge),
          el('td', { class: 'badge-usage-table__note' }, row.note),
        ),
      ),
    ),
  );

  wrap.append(el('div', { class: 'preview-block' },
    el('h3', { class: 'preview-block__title' }, 'Prescriptive usage'),
    el('p', { class: 'preview-block__lede' },
      'When the icon attribute is set, status types auto-render their prescribed icon. Use the table below as a quick reference for which badge to reach for in which situation.',
    ),
    // Wrap the table in the same .preview-row--block container used by the
    // "Types" and "Sizes" blocks so it picks up the surface fill, border, and
    // 8px radius — visual parity across the page.
    el('div', { class: 'preview-row preview-row--block' }, usageTable),
  ));

  return wrap;
}

function badgeControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const typeSel = ddSelect('bg-type', ['informational', 'neutral', 'neutral-knockout', 'success', 'warning', 'critical', 'ai-summary'] as const);
  const emphasisSel = ddSelect('bg-emph', ['low', 'high'] as const);
  const sizeSel = ddSelect('bg-size', ['default', 'condensed'] as const);
  const labelInput = ctrlText('bg-label', 'Active');
  const iconChk = ctrlCheck('bg-icon', 'Prescriptive icon');

  function render() {
    stage.replaceChildren(previewBadge({
      type: typeSel.value as BgType,
      emphasis: emphasisSel.value as BgEmphasis,
      size: sizeSel.value as BgSize,
      icon: iconChk.checked,
      label: labelInput.value || 'Label',
    }));
    const attrs: string[] = [];
    if (typeSel.value !== 'neutral') attrs.push(`type="${typeSel.value}"`);
    if (emphasisSel.value !== 'low') attrs.push(`emphasis="${emphasisSel.value}"`);
    if (sizeSel.value !== 'default') attrs.push(`size="${sizeSel.value}"`);
    if (iconChk.checked) attrs.push('icon');
    codePre.textContent = `<scout-badge${attrs.length ? ' ' + attrs.join(' ') : ''}>${labelInput.value || 'Label'}</scout-badge>`;
  }
  for (const c of [typeSel, emphasisSel, sizeSel, labelInput, iconChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Type', 'bg-type', typeSel),
    ctrlField('Emphasis', 'bg-emph', emphasisSel),
    ctrlField('Size', 'bg-size', sizeSel),
    ctrlField('Label', 'bg-label', labelInput),
    el('div', { class: 'ctrl-checks' }, iconChk),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function badgeGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Patterns that use badges to label objects without overwhelming them.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewBadge({ type: 'success', label: 'Active' }),
          'Use low-emphasis badges by default. They sit cleanly alongside data without competing for visual attention.'),
        doCard(previewBadge({ type: 'critical', icon: true, label: 'Blocked' }),
          'Pair status types with their prescribed icons so users can identify state at a glance — never relying on color alone.'),
        doCard(previewBadge({ type: 'neutral-knockout', label: 'Default' }),
          'Use neutral-knockout on tinted or photo backgrounds where filled neutral would look heavy.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Patterns that misuse type or visual weight.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewBadge({ type: 'success', emphasis: 'high', label: 'Click here for details about this status' }),
          "Don't put long phrases in badges. Use 1–2 words. If you need more, use Inline alert."),
        dontCard(previewBadge({ type: 'critical', emphasis: 'high', label: 'Verified' }),
          "Don't pick the type by visual taste. The semantic meaning of critical (red) is reserved for blocking, dangerous, or failed states."),
      )));
}

function badgeContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use 1–2 word labels. "Active", "Pending review", "Locked".'),
        el('li', {}, 'Use sentence case ("Pending review", not "Pending Review").'),
        el('li', {}, 'Be descriptive: "Locked" beats "Issue"; "Refunded" beats "Other".'),
        el('li', {}, "Don't include the noun — the badge is contextual. \"Active\" beats \"Account active\"."),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Type semantics'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Informational — neutral information ("New", "Beta").'),
        el('li', {}, 'Neutral — uncategorized or default status ("Draft", "Default").'),
        el('li', {}, 'Neutral knockout — same semantics as Neutral, optimized for tinted/photo backgrounds.'),
        el('li', {}, 'Success — affirmative, complete, healthy ("Active", "Approved", "Verified").'),
        el('li', {}, 'Warning — non-blocking attention ("Pending", "Expiring", "Stale").'),
        el('li', {}, 'Critical — blocking, dangerous, or failed ("Blocked", "Locked", "Failed").'),
        el('li', {}, 'AI summary — content generated by AI ("AI summary", "AI insight"). Purple-anchored for system-wide AI consistency.'),
      )));
}

function badgeAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & icons'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Status (success / warning / critical) is conveyed by both color AND a prescribed icon when the icon attribute is set.'),
        el('li', {}, 'All type × emphasis combinations meet WCAG 2.1 AA contrast for the label text against the badge background in light and dark themes.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Semantic markup'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Badges render as inline span elements; the prescribed icon is aria-hidden so it isn\'t announced redundantly.'),
        el('li', {}, 'When the badge conveys live state changes, wrap it in role="status" so screen readers announce updates.'),
      )));
}

function badgeCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-badge type="success">Active</scout-badge>

<scout-badge type="critical" emphasis="high" icon>Failed</scout-badge>

<scout-badge type="neutral-knockout" size="condensed">Default</scout-badge>

<scout-badge type="warning" icon>
  Pending review
</scout-badge>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/badge @scout/tokens lit\n\nimport '@scout/badge';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'type'),     el('td', {}, '"informational" | "neutral" | "neutral-knockout" | "success" | "warning" | "critical" | "ai-summary"'), el('td', {}, '"neutral"'), el('td', {}, 'Badge type.')),
            el('tr', {}, el('td', {}, 'emphasis'), el('td', {}, '"low" | "high"'), el('td', {}, '"low"'), el('td', {}, 'Visual weight. High = stronger presence.')),
            el('tr', {}, el('td', {}, 'size'),     el('td', {}, '"default" | "condensed"'), el('td', {}, '"default"'), el('td', {}, 'Density. Icons disallowed at condensed.')),
            el('tr', {}, el('td', {}, 'icon'),     el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Auto-renders the prescribed icon for status types.')),
          )))));
}

app.append(componentPage(
  'components-badge',
  'Badge',
  'Small label conveying status, category, or count. Six types with low and high emphasis variants. Status types pair with prescribed icons.',
  [
    { id: 'preview', label: 'Preview', content: badgePreview() },
    { id: 'controls', label: 'Controls', content: badgeControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: badgeGuidelines() },
    { id: 'content', label: 'Content', content: badgeContent() },
    { id: 'accessibility', label: 'Accessibility', content: badgeAccessibility() },
    { id: 'code', label: 'Code', content: badgeCode() },
  ],
));

// =================================================================
// Breadcrumb (real Lit component from @scout/breadcrumb)
// =================================================================
import '@scout/breadcrumb';

interface CrumbDef { label: string; href?: string; current?: boolean; disabled?: boolean }

function previewBreadcrumb(opts: { back?: boolean; items: CrumbDef[] }): HTMLElement {
  const bc = document.createElement('scout-breadcrumb');
  if (opts.back) bc.setAttribute('back', '');
  for (const item of opts.items) {
    const li = document.createElement('scout-breadcrumb-item');
    if (item.href) li.setAttribute('href', item.href);
    if (item.current) li.setAttribute('current', '');
    if (item.disabled) li.setAttribute('disabled', '');
    li.textContent = item.label;
    bc.appendChild(li);
  }
  return bc;
}

function breadcrumbPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Multi-level (3+)',
    'A chain of crumbs separated by chevrons. The last crumb has the current attribute and renders as non-clickable text.',
    el('div', { class: 'preview-stack' },
      previewBreadcrumb({ items: [
        { label: 'Home', href: '#' },
        { label: 'Customers', href: '#' },
        { label: 'Jane Doe', href: '#' },
        { label: 'Account details', current: true },
      ]}),
      previewBreadcrumb({ items: [
        { label: 'Ember', href: '#' },
        { label: 'Settings', href: '#' },
        { label: 'Notifications', current: true },
      ]}),
    ),
  );

  block(
    'Single back link',
    'When there\'s only one level "up" to return to, use back mode. Renders a leading arrow icon and a single link to the parent page.',
    el('div', { class: 'preview-stack' },
      previewBreadcrumb({ back: true, items: [{ label: 'Customers', href: '#' }] }),
      previewBreadcrumb({ back: true, items: [{ label: 'Account list', href: '#' }] }),
    ),
  );

  block(
    'States',
    'Hover, focus, and pressed are all live — interact with the links to see them. Disabled crumbs are non-clickable and de-emphasized.',
    el('div', { class: 'preview-stack' },
      previewBreadcrumb({ items: [
        { label: 'Home', href: '#' },
        { label: 'Disabled level', disabled: true },
        { label: 'Account details', current: true },
      ]}),
    ),
  );

  return wrap;
}

function breadcrumbControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const modeSel = ddSelect('bc-mode', ['multi', 'back'] as const);
  const levelsInput = ctrlText('bc-levels', '3', { type: 'number' });

  const sampleLabels = ['Home', 'Customers', 'Jane Doe', 'Accounts', 'Visa ending 4242', 'Transactions'];

  function render() {
    const isBack = modeSel.value === 'back';
    let levels = Math.max(1, Math.min(6, Number(levelsInput.value) || 1));
    if (isBack) levels = 1;
    levelsInput.value = String(levels);

    const items: CrumbDef[] = [];
    for (let i = 0; i < levels; i++) {
      const isLast = i === levels - 1;
      items.push({
        label: sampleLabels[i] ?? `Level ${i + 1}`,
        href: isBack ? '#' : isLast ? undefined : '#',
        current: !isBack && isLast,
      });
    }
    stage.replaceChildren(previewBreadcrumb({ back: isBack, items }));

    const itemMarkup = items
      .map((it) => {
        const attrs: string[] = [];
        if (it.href) attrs.push(`href="${it.href}"`);
        if (it.current) attrs.push('current');
        return `  <scout-breadcrumb-item${attrs.length ? ' ' + attrs.join(' ') : ''}>${it.label}</scout-breadcrumb-item>`;
      })
      .join('\n');
    codePre.textContent = `<scout-breadcrumb${isBack ? ' back' : ''}>\n${itemMarkup}\n</scout-breadcrumb>`;
  }
  for (const c of [modeSel, levelsInput]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Mode', 'bc-mode', modeSel),
    ctrlField('Levels (1–6, multi mode only)', 'bc-levels', levelsInput),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function breadcrumbGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Patterns that help users orient themselves and navigate predictably.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewBreadcrumb({ items: [
          { label: 'Customers', href: '#' },
          { label: 'Jane Doe', href: '#' },
          { label: 'Account details', current: true },
        ]}),
          'Use a multi-level breadcrumb for nested pages 3 levels or deeper. The current page is the last crumb and is not clickable.'),
        doCard(previewBreadcrumb({ back: true, items: [{ label: 'Account list', href: '#' }] }),
          'Use back mode for shallow hierarchies (1 level up). It\'s clearer than a 2-crumb breadcrumb at "Home › Settings".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Patterns that confuse users about where they are.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewBreadcrumb({ items: [{ label: 'Home', href: '#' }, { label: 'Settings', current: true } ]}),
          "Don't use multi-level breadcrumbs for shallow hierarchies. Use back mode instead for a clearer single-level affordance."),
        dontCard(previewBreadcrumb({ items: [
          { label: 'Home', href: '#' },
          { label: 'Customers', href: '#' },
          { label: 'Jane Doe', href: '#' },
          { label: 'Account details', href: '#' },
        ]}),
          "Don't render the current page as a clickable link — it suggests navigation that won't go anywhere. Use the current attribute on the last crumb."),
      )));
}

function breadcrumbContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Crumb labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Match the page title each crumb links to. If a page is "Customer accounts", the crumb is "Customer accounts".'),
        el('li', {}, 'Use sentence case.'),
        el('li', {}, 'Avoid truncation. If the label is long, abbreviate the page title rather than mid-string truncating in the crumb.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Back mode'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The label is the parent page name — "Customers", "Account list" — not "Back" alone.'),
        el('li', {}, 'The leading arrow icon is rendered automatically; don\'t prepend a manual arrow in the label.'),
      )));
}

function breadcrumbAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Semantics'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The component renders a <nav aria-label="Breadcrumb"> wrapping an <ol>. Screen readers announce it as a navigation landmark.'),
        el('li', {}, 'The current crumb sets aria-current="page" so it\'s announced as the user\'s location.'),
        el('li', {}, 'Disabled crumbs set aria-disabled="true".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard & focus'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Each link receives keyboard focus. The chevron separator is decorative and never focusable.'),
        el('li', {}, 'Focus rings use 2px outline at offset 2px on :focus-visible.'),
      )));
}

function breadcrumbCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<!-- Multi-level -->
<scout-breadcrumb>
  <scout-breadcrumb-item href="/">Home</scout-breadcrumb-item>
  <scout-breadcrumb-item href="/customers">Customers</scout-breadcrumb-item>
  <scout-breadcrumb-item current>Jane Doe</scout-breadcrumb-item>
</scout-breadcrumb>

<!-- Single back link -->
<scout-breadcrumb back>
  <scout-breadcrumb-item href="/customers">Customers</scout-breadcrumb-item>
</scout-breadcrumb>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/breadcrumb @scout/tokens lit\n\nimport '@scout/breadcrumb';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props — <scout-breadcrumb>'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'back'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Switches to single back-link mode with leading arrow.')),
          )))),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props — <scout-breadcrumb-item>'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'href'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'When set, renders the item as a link.')),
            el('tr', {}, el('td', {}, 'current'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Marks the item as the current page (not clickable).')),
            el('tr', {}, el('td', {}, 'disabled'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'De-emphasizes and disables the item.')),
          )))));
}

app.append(componentPage(
  'components-breadcrumb',
  'Breadcrumb',
  'A series of clickable links showing where the user is in an application\'s hierarchy. Supports multi-level chains and a single back-link mode.',
  [
    { id: 'preview', label: 'Preview', content: breadcrumbPreview() },
    { id: 'controls', label: 'Controls', content: breadcrumbControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: breadcrumbGuidelines() },
    { id: 'content', label: 'Content', content: breadcrumbContent() },
    { id: 'accessibility', label: 'Accessibility', content: breadcrumbAccessibility() },
    { id: 'code', label: 'Code', content: breadcrumbCode() },
  ],
));

// --- Button page
app.append(
  componentPage(
    'components-button',
    'Button',
    'Triggers an action or navigates to a new view. Buttons are the primary way users interact with Scout products.',
    [
      { id: 'preview',       label: 'Preview',           content: buttonPreview() },
      { id: 'controls',      label: 'Controls',          content: buttonControls() },
      { id: 'guidelines',    label: 'Usage guidelines',  content: buttonGuidelines() },
      { id: 'content',       label: 'Content',           content: buttonContent() },
      { id: 'accessibility', label: 'Accessibility',     content: buttonAccessibility() },
      { id: 'code',          label: 'Code',              content: buttonCode() },
    ],
  ),
);

// =================================================================
// Card (real Lit component from @scout/card)
// =================================================================
import '@scout/card';

type CardBg = 'white' | 'cool-gray-100' | 'warm-gray-100';

interface CardOpts {
  background?: CardBg;
  accentBar?: boolean;
  aiCallout?: boolean;
  showMore?: boolean;
  expanded?: boolean;
  body?: string;
  aiLabel?: string;
}

const SAMPLE_LONG_BODY = "The customer called regarding a recurring monthly charge of $9.99 they didn't recognize. After reviewing the account, the charge originates from a streaming service subscription set up in March 2024. The customer initially used a 30-day free trial and the subscription auto-converted to paid; they were not billed during the trial period. Customer has requested cancellation and a full refund of the last three months. Cancellation has been processed; refund of $29.97 has been issued and will appear within 5–7 business days.";

function previewCard(opts: CardOpts = {}): HTMLElement {
  const {
    background = 'white',
    accentBar = false,
    aiCallout = false,
    showMore = false,
    expanded = false,
    body = 'Customer mentioned a recurring charge issue. Last call was 2 days ago. Identity verified.',
    aiLabel,
  } = opts;
  const c = document.createElement('scout-card');
  c.setAttribute('background', background);
  if (accentBar) c.setAttribute('accent-bar', '');
  if (aiCallout) c.setAttribute('ai-callout', '');
  if (showMore) c.setAttribute('show-more', '');
  if (expanded) c.setAttribute('expanded', '');
  if (aiLabel) {
    const span = document.createElement('span');
    span.setAttribute('slot', 'ai-label');
    span.textContent = aiLabel;
    c.appendChild(span);
  }
  c.appendChild(document.createTextNode(body));
  return c;
}

function cardPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Default',
    'A simple card with a white background. AI callout on, accent bar off — the standard presentation for AI summaries.',
    previewCard({ aiCallout: true }),
  );

  block(
    'Accent bar',
    'Set accent-bar to render a 4px brand-colored rail along the card’s left edge. Use it to draw attention to a specific card or signal an "active" / focused item in a list.',
    el('div', { class: 'preview-stack' },
      previewCard({ accentBar: true, aiCallout: true, body: 'Accent bar on with the AI callout.' }),
      previewCard({ accentBar: true, body: 'Accent bar on, no AI callout — useful for highlighting plain content.' }),
    ),
  );

  block(
    'Background colors',
    'Three options. White is the default. Cool-gray.100 sits well on white surfaces; warm-gray.100 is used for editorial / reading contexts.',
    el('div', { class: 'preview-stack' },
      previewCard({ background: 'white', aiCallout: true, body: 'Background: white (default).' }),
      previewCard({ background: 'cool-gray-100', aiCallout: true, body: 'Background: cool-gray.100.' }),
      previewCard({ background: 'warm-gray-100', aiCallout: true, body: 'Background: warm-gray.100.' }),
    ),
  );

  block(
    'AI callout',
    'Use the ai-callout attribute when the contained content is AI-generated. The default label is "AI summary"; override it via the ai-label slot.',
    el('div', { class: 'preview-stack' },
      previewCard({ aiCallout: true }),
      previewCard({ aiCallout: true, aiLabel: 'AI insight' }),
      previewCard({ aiCallout: false, body: 'No AI callout — plain card content.' }),
    ),
  );

  block(
    'Show more / less',
    'For longer content, set show-more. The body truncates to ~3 lines with a fade and a Show more toggle.',
    el('div', { class: 'preview-stack' },
      previewCard({ aiCallout: true, showMore: true, body: SAMPLE_LONG_BODY }),
      previewCard({ aiCallout: true, showMore: true, expanded: true, body: SAMPLE_LONG_BODY }),
    ),
  );

  return wrap;
}

function cardControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const bgSel = ddSelect('card-bg', ['white', 'cool-gray-100', 'warm-gray-100'] as const);
  const bodyInput = ctrlText('card-body', 'Customer mentioned a recurring charge issue. Last call was 2 days ago.');
  const aiLabelInput = ctrlText('card-ailabel', 'AI summary');
  const accentBarChk = ctrlCheck('card-accent', 'Accent bar');
  const aiChk = ctrlCheck('card-ai', 'AI callout', { checked: true });
  const showMoreChk = ctrlCheck('card-showmore', 'Show more');

  // AI label only applies when AI callout is enabled — gate it.
  const aiLabelField = ctrlField('AI label', 'card-ailabel', aiLabelInput);

  function render() {
    setFieldDisabled(aiLabelField, aiLabelInput, !aiChk.checked);

    stage.replaceChildren(previewCard({
      background: bgSel.value as CardBg,
      accentBar: accentBarChk.checked,
      aiCallout: aiChk.checked,
      showMore: showMoreChk.checked,
      body: bodyInput.value,
      aiLabel: aiChk.checked && aiLabelInput.value !== 'AI summary' ? aiLabelInput.value : undefined,
    }));
    const attrs: string[] = [];
    if (bgSel.value !== 'white') attrs.push(`background="${bgSel.value}"`);
    if (accentBarChk.checked) attrs.push('accent-bar');
    if (aiChk.checked) attrs.push('ai-callout');
    if (showMoreChk.checked) attrs.push('show-more');
    const aiSlot = aiChk.checked && aiLabelInput.value !== 'AI summary'
      ? `\n  <span slot="ai-label">${aiLabelInput.value}</span>` : '';
    codePre.textContent = `<scout-card${attrs.length ? ' ' + attrs.join(' ') : ''}>${aiSlot}\n  ${bodyInput.value}\n</scout-card>`;
  }
  for (const c of [bgSel, bodyInput, aiLabelInput, accentBarChk, aiChk, showMoreChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Background', 'card-bg', bgSel),
    ctrlField('Body', 'card-body', bodyInput),
    aiLabelField,
    el('div', { class: 'ctrl-checks' },
      accentBarChk,
      aiChk,
      showMoreChk,
    ),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function cardGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Patterns that surface AI content clearly and avoid making it disappear into the page.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewCard({ aiCallout: true, body: 'Customer wants to dispute a recent charge of $124.50 from May 14.' }),
          'Always pair AI-generated content with the AI callout so users know the source. The callout is the most important affordance for trust and safety.'),
        doCard(previewCard({ aiCallout: true, showMore: true, body: SAMPLE_LONG_BODY }),
          'Use show-more for AI summaries longer than 3 lines. Lets users scan quickly and expand only when they need details.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Patterns that obscure AI provenance or use the card for the wrong purpose.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewCard({ body: 'AI says: customer wants a refund.' }),
          "Don't omit the AI callout when the body is AI-generated. Users must be able to distinguish AI content from human-authored content."),
        dontCard(previewCard({ aiCallout: true, body: '$124.50' }),
          "Don't use the card for trivial values or single labels. Reserve the AI card for plain-text summaries or extractions of meaningful length."),
      )));
}

function cardContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'AI summaries'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Write summaries in plain language. Avoid jargon, internal codes, or untranslated abbreviations.'),
        el('li', {}, 'Lead with the most important fact. The card may be truncated to 3 lines.'),
        el('li', {}, "Don't speculate or fabricate. If the AI doesn't have a confident answer, say so."),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'AI callout label'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Default is "AI summary". Override with ai-label slot for context-specific phrasing ("AI insight", "AI extraction").'),
        el('li', {}, 'Use sentence case. Keep it under 3 words.'),
      )));
}

function cardAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'AI callout'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The AI callout uses role="note" so assistive tech announces it as supplementary information.'),
        el('li', {}, 'The sparkle icon is decorative (aria-hidden) — meaning is conveyed by the label text.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Show more'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The toggle is a native <button> with aria-expanded reflecting the state.'),
        el('li', {}, 'When collapsed, the truncated content is still in the DOM — only its visual height is constrained — so screen readers reach it via tabbing past the button.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color contrast'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Body text on all three backgrounds (white, cool-gray.100, warm-gray.100) meets WCAG 2.1 AA contrast in light and dark themes.'),
      )));
}

function cardCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-card ai-callout>
  Customer mentioned a recurring $9.99 charge they didn't recognize.
</scout-card>

<scout-card background="cool-gray-100" ai-callout show-more>
  <span slot="ai-label">AI insight</span>
  After reviewing the account, the charge originates from a streaming
  service subscription set up in March 2024…
</scout-card>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/card @scout/tokens lit\n\nimport '@scout/card';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'background'), el('td', {}, '"white" | "cool-gray-100" | "warm-gray-100"'), el('td', {}, '"white"'), el('td', {}, 'Card background color.')),
            el('tr', {}, el('td', {}, 'accent-bar'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Renders a 4px brand-colored bar along the card’s left edge.')),
            el('tr', {}, el('td', {}, 'ai-callout'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Renders the AI callout banner.')),
            el('tr', {}, el('td', {}, 'show-more'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Truncates body and reveals expand/collapse toggle.')),
            el('tr', {}, el('td', {}, 'expanded'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Reflects show-more expansion state.')),
          )))));
}

app.append(componentPage(
  'components-card',
  'Card',
  'Stylized container meant to house a summarization or extraction of AI in plain text.',
  [
    { id: 'preview', label: 'Preview', content: cardPreview() },
    { id: 'controls', label: 'Controls', content: cardControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: cardGuidelines() },
    { id: 'content', label: 'Content', content: cardContent() },
    { id: 'accessibility', label: 'Accessibility', content: cardAccessibility() },
    { id: 'code', label: 'Code', content: cardCode() },
  ],
));

// =================================================================
// Checkbox (real Lit component from @scout/checkbox)
// =================================================================
import '@scout/checkbox';

interface CheckboxOpts {
  label?: string;
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  secondary?: string;
  name?: string;
  value?: string;
}

function previewCheckbox(opts: CheckboxOpts = {}): HTMLElement {
  const {
    label = 'Checkbox label',
    checked = false,
    indeterminate = false,
    disabled = false,
    invalid = false,
    secondary,
    name,
    value,
  } = opts;
  const c = document.createElement('scout-checkbox');
  if (checked) c.setAttribute('checked', '');
  if (indeterminate) c.setAttribute('indeterminate', '');
  if (disabled) c.setAttribute('disabled', '');
  if (invalid) c.setAttribute('invalid', '');
  if (secondary) c.setAttribute('secondary', secondary);
  if (name) c.setAttribute('name', name);
  if (value) c.setAttribute('value', value);
  c.textContent = label;
  return c;
}

interface GroupOpts {
  label?: string;
  helper?: string;
  error?: string;
  warning?: string;
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  items: CheckboxOpts[];
}

function previewCheckboxGroup(opts: GroupOpts): HTMLElement {
  const g = document.createElement('scout-checkbox-group');
  if (opts.label) g.setAttribute('label', opts.label);
  if (opts.helper) g.setAttribute('helper', opts.helper);
  if (opts.error) g.setAttribute('error', opts.error);
  if (opts.warning) g.setAttribute('warning', opts.warning);
  if (opts.orientation) g.setAttribute('orientation', opts.orientation);
  if (opts.disabled) g.setAttribute('disabled', '');
  for (const item of opts.items) g.appendChild(previewCheckbox(item));
  return g;
}

function checkboxPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Single checkbox',
    'A standalone checkbox with a label. Click anywhere on the row to toggle.',
    el('div', { class: 'preview-stack' },
      previewCheckbox({ label: 'Subscribe to email updates' }),
      previewCheckbox({ label: 'Save card on file', checked: true }),
      previewCheckbox({ label: 'Auto-pay (managed by admin)', disabled: true, checked: true }),
    ),
  );

  block(
    'Functional states',
    'Selected, not selected, and indeterminate. Indeterminate is used when a parent represents a partial selection of children.',
    el('div', { class: 'preview-stack' },
      previewCheckbox({ label: 'Not selected' }),
      previewCheckbox({ label: 'Selected', checked: true }),
      previewCheckbox({ label: 'Indeterminate', indeterminate: true }),
    ),
  );

  block(
    'Interactive states',
    'Default · Hover · Focus · Pressed · Disabled. Hover, focus, and pressed are live — interact with the inputs.',
    el('div', { class: 'preview-stack' },
      previewCheckbox({ label: 'Default — try hover, focus, click' }),
      previewCheckbox({ label: 'Disabled', disabled: true }),
      previewCheckbox({ label: 'Disabled, selected', disabled: true, checked: true }),
    ),
  );

  block(
    'Group, vertical (default)',
    'Use a group to wrap related checkboxes with a shared label, helper, and orientation.',
    previewCheckboxGroup({
      label: 'Notification preferences',
      helper: 'Choose how you want to be notified about account activity.',
      orientation: 'vertical',
      items: [
        { label: 'Email', name: 'notif', value: 'email', secondary: 'Real-time email alerts', checked: true },
        { label: 'SMS',   name: 'notif', value: 'sms',   secondary: 'SMS to your registered phone' },
        { label: 'Push',  name: 'notif', value: 'push',  secondary: 'Mobile app push notifications' },
      ],
    }),
  );

  block(
    'Group, horizontal',
    'Use horizontal orientation when 2–4 short options fit naturally in a row (filters, sorting flags, etc.).',
    previewCheckboxGroup({
      label: 'Filter by status',
      orientation: 'horizontal',
      items: [
        { label: 'Active',   name: 'status', value: 'active',   checked: true },
        { label: 'Pending',  name: 'status', value: 'pending',  checked: true },
        { label: 'Closed',   name: 'status', value: 'closed' },
        { label: 'Archived', name: 'status', value: 'archived' },
      ],
    }),
  );

  block(
    'Group with warning',
    'A non-blocking warning rendered below the items. Use for soft guidance.',
    previewCheckboxGroup({
      label: 'Deletion options',
      warning: 'Deleting will remove all linked transactions. This may take up to 30 minutes.',
      items: [
        { label: 'Delete payment methods', name: 'del', value: 'pm' },
        { label: 'Delete transaction history', name: 'del', value: 'tx', checked: true },
      ],
    }),
  );

  block(
    'Group with error',
    'A blocking error message. The group automatically marks every child checkbox invalid (red border) until the error clears.',
    previewCheckboxGroup({
      label: 'Required agreements',
      error: 'You must accept both terms before continuing.',
      items: [
        { label: 'I accept the Terms of Service', name: 'agree', value: 'tos' },
        { label: 'I accept the Privacy Policy',   name: 'agree', value: 'privacy' },
      ],
    }),
  );

  return wrap;
}

function checkboxControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const labelInput = ctrlText('cb-label', 'Subscribe to email updates');
  const secondaryInput = ctrlText('cb-secondary', '');
  const checkedChk = ctrlCheck('cb-checked', 'Checked');
  const indeterminateChk = ctrlCheck('cb-indet', 'Indeterminate');
  const disabledChk = ctrlCheck('cb-disabled', 'Disabled');
  const invalidChk = ctrlCheck('cb-invalid', 'Invalid');

  function render() {
    stage.replaceChildren(previewCheckbox({
      label: labelInput.value || 'Checkbox',
      secondary: secondaryInput.value || undefined,
      checked: checkedChk.checked,
      indeterminate: indeterminateChk.checked,
      disabled: disabledChk.checked,
      invalid: invalidChk.checked,
    }));
    const attrs: string[] = [];
    if (checkedChk.checked) attrs.push('checked');
    if (indeterminateChk.checked) attrs.push('indeterminate');
    if (disabledChk.checked) attrs.push('disabled');
    if (invalidChk.checked) attrs.push('invalid');
    if (secondaryInput.value) attrs.push(`secondary="${secondaryInput.value}"`);
    codePre.textContent = `<scout-checkbox${attrs.length ? ' ' + attrs.join(' ') : ''}>\n  ${labelInput.value || 'Checkbox'}\n</scout-checkbox>`;
  }
  for (const c of [labelInput, secondaryInput, checkedChk, indeterminateChk, disabledChk, invalidChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Label', 'cb-label', labelInput),
    ctrlField('Secondary text', 'cb-secondary', secondaryInput),
    el('div', { class: 'ctrl-checks' },
      checkedChk,
      indeterminateChk,
      disabledChk,
      invalidChk,
    ),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function checkboxGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Patterns that respect the user\'s ability to make multi-select choices.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewCheckboxGroup({
          label: 'Notification preferences',
          orientation: 'vertical',
          items: [
            { label: 'Email', name: 'n', value: 'e' },
            { label: 'SMS', name: 'n', value: 's' },
          ],
        }), 'Use a group with a shared label when checkboxes are part of the same logical decision.'),
        doCard(previewCheckbox({ label: 'I accept the Terms of Service', secondary: 'Last updated March 2024' }),
          'Use secondary text to add helpful context (links, dates, side notes) under a single checkbox label.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Patterns that confuse users about choice or state.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewCheckbox({ label: 'Choose one option' }),
          "Don't use a checkbox when only one option can be selected. Use radio buttons for mutually exclusive choices."),
        dontCard(previewCheckbox({ label: 'I agree' }),
          "Don't use vague labels for required agreements. Name what the user is agreeing to: \"I accept the Terms of Service\"."),
      )));
}

function checkboxContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use sentence case ("Subscribe to email updates", not "Subscribe To Email Updates").'),
        el('li', {}, "Write labels in the affirmative — \"Email updates\" beats \"Don't unsubscribe me\"."),
        el('li', {}, 'For required agreements, name what is being agreed to. Avoid generic "I agree".'),
        el('li', {}, 'Keep labels under 8 words when possible. Use secondary text for additional context.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Group label & helper'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The group label describes the decision being made. "Notification preferences" beats "Notifications".'),
        el('li', {}, 'Helper text gives context for the whole group, not for individual items. Use secondary text on each item for per-item context.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Error and warning messages'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Errors block submission. Tell the user what\'s wrong and how to fix it: "You must accept both terms before continuing".'),
        el('li', {}, 'Warnings inform without blocking. Use them for soft guidance, side effects, or rate-limit notices.'),
      )));
}

function checkboxAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Semantic markup'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Each checkbox renders a real <input type="checkbox"> inside shadow DOM with proper name/value/checked/disabled.'),
        el('li', {}, 'Groups render as <fieldset> with <legend> for the label, so screen readers identify the related set.'),
        el('li', {}, 'Error messages set role="alert" so they\'re announced when they appear.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Form association'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'scout-checkbox uses ElementInternals so the host element submits with the form using its name/value.'),
        el('li', {}, 'Multiple checkboxes with the same name submit as repeated fields, matching native form behavior.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Tab moves focus through checkboxes. Space toggles the focused checkbox.'),
        el('li', {}, 'Disabled checkboxes are skipped in tab order.'),
        el('li', {}, 'Focus ring uses 2px outline at 2px offset on :focus-visible.'),
      )));
}

function checkboxCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<!-- Single -->
<scout-checkbox name="newsletter" value="yes">
  Subscribe to email updates
</scout-checkbox>

<!-- Group with helper, error, and warning -->
<scout-checkbox-group
  label="Notification preferences"
  helper="Choose how you want to be notified."
  orientation="vertical"
>
  <scout-checkbox name="notif" value="email" checked
    secondary="Real-time email alerts">Email</scout-checkbox>
  <scout-checkbox name="notif" value="sms"
    secondary="SMS to your registered phone">SMS</scout-checkbox>
  <scout-checkbox name="notif" value="push" disabled>Push (coming soon)</scout-checkbox>
</scout-checkbox-group>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/checkbox @scout/tokens lit\n\nimport '@scout/checkbox';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props — <scout-checkbox>'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'checked'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Selected state.')),
            el('tr', {}, el('td', {}, 'indeterminate'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Indeterminate state. Cleared on user interaction.')),
            el('tr', {}, el('td', {}, 'disabled'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disables interaction; skips tab order.')),
            el('tr', {}, el('td', {}, 'invalid'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Renders an error border. Auto-set by the group when error is set.')),
            el('tr', {}, el('td', {}, 'name / value'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Form name and value. Submitted via ElementInternals when checked.')),
            el('tr', {}, el('td', {}, 'secondary'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Optional secondary text rendered under the label.')),
          )))),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props — <scout-checkbox-group>'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'label'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Group label, rendered as fieldset legend.')),
            el('tr', {}, el('td', {}, 'helper'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Helper text rendered below the label.')),
            el('tr', {}, el('td', {}, 'error'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Error message; marks every child invalid.')),
            el('tr', {}, el('td', {}, 'warning'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Warning message rendered below items.')),
            el('tr', {}, el('td', {}, 'orientation'), el('td', {}, '"vertical" | "horizontal"'), el('td', {}, '"vertical"'), el('td', {}, 'Layout direction of children.')),
            el('tr', {}, el('td', {}, 'disabled'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disables every child checkbox.')),
          )))));
}

app.append(componentPage(
  'components-checkbox',
  'Checkbox',
  'Used to select one or many items. Single checkbox or grouped fields with shared label, helper text, error, and warning messages.',
  [
    { id: 'preview', label: 'Preview', content: checkboxPreview() },
    { id: 'controls', label: 'Controls', content: checkboxControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: checkboxGuidelines() },
    { id: 'content', label: 'Content', content: checkboxContent() },
    { id: 'accessibility', label: 'Accessibility', content: checkboxAccessibility() },
    { id: 'code', label: 'Code', content: checkboxCode() },
  ],
));

// =================================================================
// Control (real Lit component from @scout/control)
// =================================================================
import '@scout/control';

const CONTROL_TYPES = ['x-close', 'x-clear', 'arrow-left', 'arrow-right', 'arrow-left-double', 'arrow-right-double', 'chevron-up', 'chevron-down', 'tooltip', 'trash', 'kebab'] as const;
type CtrlType = typeof CONTROL_TYPES[number];

interface CtrlOpts {
  type?: CtrlType;
  size?: 'default' | 'condensed';
  color?: 'primary' | 'critical';
  disabled?: boolean;
  ariaLabel?: string;
}

function previewControl(opts: CtrlOpts = {}): HTMLElement {
  const c = document.createElement('scout-control');
  c.setAttribute('type', opts.type ?? 'x-close');
  c.setAttribute('size', opts.size ?? 'default');
  c.setAttribute('color', opts.color ?? 'primary');
  if (opts.disabled) c.setAttribute('disabled', '');
  if (opts.ariaLabel) c.setAttribute('aria-label-override', opts.ariaLabel);
  return c;
}

function labeledCell(label: string, ...children: HTMLElement[]): HTMLElement {
  return el('div', { class: 'control-cell' },
    el('div', { class: 'control-cell__stage' }, ...children),
    el('span', { class: 'control-cell__label' }, label),
  );
}

function controlPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, ...children: HTMLElement[]) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row control-grid' }, ...children),
    ));
  };

  const TYPE_LABELS: Record<CtrlType, string> = {
    'x-close': 'X (closes)',
    'x-clear': 'X (clears text)',
    'arrow-left': 'Arrow left',
    'arrow-right': 'Arrow right',
    'arrow-left-double': 'Double arrow left',
    'arrow-right-double': 'Double arrow right',
    'chevron-up': 'Chevron up',
    'chevron-down': 'Chevron down',
    tooltip: 'Tooltip',
    trash: 'Trash',
    kebab: 'Kebab menu',
  };

  block('All types',
    'Eleven built-in icon types cover the common single-action use cases. Hover, focus, and click each one to see interaction states.',
    ...CONTROL_TYPES.map(t => labeledCell(TYPE_LABELS[t], previewControl({ type: t }))),
  );

  block('Sizes',
    'Default for general toolbars and headers. Condensed for dense rows like data tables and inline form controls.',
    labeledCell('Default', previewControl({ size: 'default' })),
    labeledCell('Condensed', previewControl({ size: 'condensed' })),
  );

  block('Colors',
    'Primary is the default — uses icon.interactive.primary. Critical is reserved for trash and uses icon.interactive.delete.',
    labeledCell('Primary', previewControl({ color: 'primary', type: 'tooltip' })),
    labeledCell('Critical (trash only)', previewControl({ color: 'critical', type: 'trash' })),
  );

  block('States',
    'Default · Hover · Focus · Pressed · Disabled. Tab into the controls to see the focus ring; click to see the pressed treatment.',
    labeledCell('Default', previewControl({ type: 'x-close' })),
    labeledCell('Disabled', previewControl({ type: 'x-close', disabled: true })),
  );

  return wrap;
}

function controlControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const typeSel = ddSelect('ctl-type', CONTROL_TYPES as readonly string[]);
  const sizeSel = ddSelect('ctl-size', ['default', 'condensed'] as const);
  const colorSel = ddSelect('ctl-color', ['primary', 'critical'] as const);
  const disabledChk = ctrlCheck('ctl-disabled', 'Disabled');

  function render() {
    stage.replaceChildren(previewControl({
      type: typeSel.value as CtrlType,
      size: sizeSel.value as 'default' | 'condensed',
      color: colorSel.value as 'primary' | 'critical',
      disabled: disabledChk.checked,
    }));
    const attrs: string[] = [`type="${typeSel.value}"`];
    if (sizeSel.value !== 'default') attrs.push(`size="${sizeSel.value}"`);
    if (colorSel.value !== 'primary') attrs.push(`color="${colorSel.value}"`);
    if (disabledChk.checked) attrs.push('disabled');
    codePre.textContent = `<scout-control ${attrs.join(' ')}></scout-control>`;
  }
  for (const c of [typeSel, sizeSel, colorSel, disabledChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Type', 'ctl-type', typeSel),
    ctrlField('Size', 'ctl-size', sizeSel),
    ctrlField('Color', 'ctl-color', colorSel),
    el('div', { class: 'ctrl-checks' }, disabledChk),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function controlGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Patterns that match user expectations for icon-only controls.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewControl({ type: 'x-close' }),
          'Use the prescribed type for the action. x-close for dismiss, x-clear for input fields, trash with critical color for delete.'),
        doCard(previewControl({ type: 'trash', color: 'critical' }),
          'Reserve the critical color for trash only. It signals destructive action.'),
        doCard(previewControl({ type: 'kebab', size: 'condensed' }),
          'Use condensed size for low-emphasis row-level actions (kebab menus inside tables).'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Patterns that confuse icon meaning or accessibility.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewControl({ type: 'kebab', color: 'critical' }),
          "Don't use critical color outside of trash. It loses meaning when applied to other types."),
        dontCard(previewControl({ type: 'tooltip', size: 'condensed', disabled: true }),
          "Don't disable a control without surfacing why elsewhere. Use a tooltip or a disabled-state explanation rather than leaving users guessing."),
      )));
}

function controlContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'ARIA labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Every control includes an aria-label since there\'s no visible text. Defaults are derived from type ("Close", "Delete", "More options").'),
        el('li', {}, 'Override with aria-label-override when context-specific phrasing is more useful: "Close payment dialog" beats "Close".'),
        el('li', {}, 'Use action verbs. "Delete" beats "Trash"; "Close" beats "X".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Type semantics'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'x-close — dismiss a dialog, alert, or banner.'),
        el('li', {}, 'x-clear — clear the value of a text input. Visually identical to x-close; the type drives ARIA + intent.'),
        el('li', {}, 'arrow-left / arrow-right — navigate to previous / next item.'),
        el('li', {}, 'arrow-left-double / arrow-right-double — navigate to first / last item.'),
        el('li', {}, 'chevron-up / chevron-down — expand or collapse content vertically.'),
        el('li', {}, 'tooltip — trigger a popover with additional context. Pairs with the Tooltip component.'),
        el('li', {}, 'trash — delete a record. Use color="critical".'),
        el('li', {}, 'kebab — trigger a popover menu of secondary actions.'),
      )));
}

function controlAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Semantics'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Renders as a native <button>. Receives keyboard focus, activates on Enter and Space.'),
        el('li', {}, 'aria-label is derived from type (or aria-label-override) so screen readers announce the action even though there\'s no visible text.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Focus & motion'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Focus ring uses 2px outline at 1px offset (slightly inset for tight inline contexts).'),
        el('li', {}, 'Hover and pressed transitions honor prefers-reduced-motion: reduce.'),
      )));
}

function controlCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-control type="x-close" aria-label-override="Close dialog"></scout-control>

<scout-control type="trash" color="critical" size="condensed"></scout-control>

<scout-control type="kebab"></scout-control>

<scout-control type="arrow-right" size="condensed"></scout-control>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/control @scout/tokens lit\n\nimport '@scout/control';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'type'), el('td', {}, '11 built-in types (x-close, x-clear, arrow-*, chevron-*, tooltip, trash, kebab)'), el('td', {}, '"x-close"'), el('td', {}, 'Icon and default ARIA label.')),
            el('tr', {}, el('td', {}, 'size'), el('td', {}, '"default" | "condensed"'), el('td', {}, '"default"'), el('td', {}, 'Density preset.')),
            el('tr', {}, el('td', {}, 'color'), el('td', {}, '"primary" | "critical"'), el('td', {}, '"primary"'), el('td', {}, 'Color treatment. Primary uses icon.interactive.primary. Critical (icon.interactive.delete) is reserved for trash.')),
            el('tr', {}, el('td', {}, 'disabled'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disables interaction.')),
            el('tr', {}, el('td', {}, 'aria-label-override'), el('td', {}, 'string'), el('td', {}, '—'), el('td', {}, 'Override the auto-derived ARIA label.')),
          )))));
}

app.append(componentPage(
  'components-control',
  'Control',
  'Interactive control that triggers a single action with just an icon. Used in alert dismiss buttons, table-row delete, pagination, kebab menus, and similar single-action surfaces.',
  [
    { id: 'preview', label: 'Preview', content: controlPreview() },
    { id: 'controls', label: 'Controls', content: controlControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: controlGuidelines() },
    { id: 'content', label: 'Content', content: controlContent() },
    { id: 'accessibility', label: 'Accessibility', content: controlAccessibility() },
    { id: 'code', label: 'Code', content: controlCode() },
  ],
));

// =================================================================
// Data pair (real Lit component from @scout/data-pair)
// =================================================================
import '@scout/data-pair';

interface DataPairOpts {
  label?: string;
  description?: string;
  meta?: string;
  link?: string;
  orientation?: 'vertical' | 'horizontal';
}

function previewDataPair(opts: DataPairOpts = {}): HTMLElement {
  const dp = document.createElement('scout-data-pair');
  if (opts.label) dp.setAttribute('label', opts.label);
  if (opts.orientation) dp.setAttribute('orientation', opts.orientation);
  dp.appendChild(document.createTextNode(opts.description ?? ''));
  if (opts.meta) {
    const m = el('span', { slot: 'meta' }, opts.meta);
    dp.appendChild(m);
  }
  if (opts.link) {
    const a = el('a', { slot: 'link', href: '#' }, opts.link);
    dp.appendChild(a);
  }
  return dp;
}

function dataPairPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Vertical (stacked) — default',
    'Label sits on its own line above the description. Use for forms, detail views, and any surface where vertical real-estate is plentiful.',
    el('div', { class: 'data-pair-grid' },
      previewDataPair({ label: 'Account name', description: 'Jamie Tran' }),
      previewDataPair({ label: 'Member since', description: 'March 2021', meta: '4 years and 1 month' }),
      previewDataPair({ label: 'Statement balance', description: '$1,250.18', meta: 'As of May 18', link: 'View statements' }),
    ),
  );

  block(
    'Horizontal (inline)',
    'Label sits inline with the description. Use in dense detail rails, summary headers, and any place a stacked layout would feel chatty.',
    el('div', { class: 'preview-stack' },
      previewDataPair({ orientation: 'horizontal', label: 'Account name', description: 'Jamie Tran' }),
      previewDataPair({ orientation: 'horizontal', label: 'Phone', description: '555-014-2237' }),
      previewDataPair({ orientation: 'horizontal', label: 'Email', description: 'jamie@ember.com', meta: 'Verified' }),
      previewDataPair({ orientation: 'horizontal', label: 'Status', description: 'Active', link: 'Manage' }),
    ),
  );

  block(
    'With meta + link',
    'Both meta and link slots are optional. Drop a `<scout-link>`, an `<a>`, or any custom element into slot="link"; consumers own the affordance.',
    previewDataPair({
      label: 'Auto-pay',
      description: 'Enrolled · Wells Fargo ····2204',
      meta: 'Will draft on the statement due date.',
      link: 'Change funding source',
    }),
  );

  return wrap;
}

function dataPairControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const orientationSel = ddSelect('dp-orient', ['vertical', 'horizontal']);
  const labelInput = ctrlText('dp-label', 'Account name');
  const descInput = ctrlText('dp-desc', 'Jamie Tran');
  const metaInput = ctrlText('dp-meta', '');
  const linkInput = ctrlText('dp-link', '');

  function render() {
    stage.replaceChildren(previewDataPair({
      orientation: orientationSel.value as 'vertical' | 'horizontal',
      label: labelInput.value,
      description: descInput.value,
      meta: metaInput.value || undefined,
      link: linkInput.value || undefined,
    }));
    const slots: string[] = [];
    if (descInput.value) slots.push(`  ${descInput.value}`);
    if (metaInput.value) slots.push(`  <span slot="meta">${metaInput.value}</span>`);
    if (linkInput.value) slots.push(`  <a slot="link" href="#">${linkInput.value}</a>`);
    codePre.textContent =
      `<scout-data-pair label="${labelInput.value}"${orientationSel.value !== 'vertical' ? ` orientation="${orientationSel.value}"` : ''}>\n${slots.join('\n')}\n</scout-data-pair>`;
  }
  for (const c of [orientationSel, labelInput, descInput, metaInput, linkInput]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Orientation', 'dp-orient', orientationSel),
    ctrlField('Label', 'dp-label', labelInput),
    ctrlField('Description', 'dp-desc', descInput),
    ctrlField('Meta (optional)', 'dp-meta', metaInput),
    ctrlField('Link text (optional)', 'dp-link', linkInput),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function dataPairGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Use data pairs to display read-only key/value information.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewDataPair({ label: 'Account name', description: 'Jamie Tran' }),
          'Use the vertical orientation in detail views and forms where labels and values stack naturally.'),
        doCard(previewDataPair({ orientation: 'horizontal', label: 'Phone', description: '555-014-2237', meta: 'Mobile' }),
          'Use the horizontal orientation in dense detail rails or compact summary headers.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Don\'t use data pairs for editable inputs.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewDataPair({ label: 'Phone', description: 'Click to edit' }),
          "Don't use a data pair as a fake editable field. Use scout-text-field for input — data pair is read-only display."),
        dontCard(previewDataPair({ label: '', description: 'A long paragraph of marketing copy that doesn\'t need a label and isn\'t structured key/value data at all.' }),
          "Don't use data pair for prose. Use a paragraph or content body — data pair is for short, structured key/value pairs."),
      )));
}

function dataPairContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Sentence case noun phrases — "Account name", "Member since", "Phone".'),
        el('li', {}, 'Avoid trailing colons. The visual separation does the work.'),
        el('li', {}, 'Keep labels short — one to three words is ideal.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Description'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The actual value. Format consistent with the rest of the system — phone as 555-014-2237, currency with two decimals, dates in the system\'s long format.'),
        el('li', {}, 'For multi-part values, use middle-dot " · " between parts: "Active · Premium · ····2204".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Meta vs. link'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Meta — supplementary detail that doesn\'t lead anywhere. "Verified", "Last updated 2 days ago".'),
        el('li', {}, 'Link — a follow-up action. "Manage", "View statements", "Change funding source". Use scout-link for the slotted element.'),
      )));
}

function dataPairAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & labelling'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The label is rendered as a styled span — semantic emphasis comes from font-weight and color, not from heading levels (which would mis-imply hierarchy).'),
        el('li', {}, 'For tabular data, prefer a real <table> — data pairs work best for one-off label/value display, not as a substitute for table semantics.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & focus'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Label uses text-display-secondary; description uses text-display-primary — meets WCAG AA against page and surface backgrounds.'),
        el('li', {}, 'Slotted links inherit their own focus styling. Pair with scout-link for token-driven focus rings.'),
      )));
}

function dataPairCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<!-- Vertical (default) -->
<scout-data-pair label="Account name">Jamie Tran</scout-data-pair>

<!-- Horizontal -->
<scout-data-pair orientation="horizontal" label="Phone">
  555-014-2237
</scout-data-pair>

<!-- With meta + link -->
<scout-data-pair label="Auto-pay">
  Enrolled · Wells Fargo ····2204
  <span slot="meta">Will draft on the statement due date.</span>
  <a slot="link" href="/funding">Change funding source</a>
</scout-data-pair>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/data-pair @scout/tokens lit\n\nimport '@scout/data-pair';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'label'),       el('td', {}, 'string'), el('td', {}, '""'),         el('td', {}, 'Field label.')),
            el('tr', {}, el('td', {}, 'orientation'), el('td', {}, '"vertical" | "horizontal"'), el('td', {}, '"vertical"'), el('td', {}, 'Layout direction.')),
          )))),
  );
}

app.append(componentPage(
  'components-data-pair',
  'Data pair',
  'Label + description display with optional meta and link. Vertical (stacked) or horizontal (inline) orientation.',
  [
    { id: 'preview', label: 'Preview', content: dataPairPreview() },
    { id: 'controls', label: 'Controls', content: dataPairControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: dataPairGuidelines() },
    { id: 'content', label: 'Content', content: dataPairContent() },
    { id: 'accessibility', label: 'Accessibility', content: dataPairAccessibility() },
    { id: 'code', label: 'Code', content: dataPairCode() },
  ],
));

// =================================================================
// Data unavailable (real Lit component from @scout/data-unavailable)
// =================================================================
import '@scout/data-unavailable';
import type { DataUnavailableSize } from '@scout/data-unavailable';

function previewDataUnavailable(opts: { label?: string; size?: DataUnavailableSize } = {}): HTMLElement {
  const du = document.createElement('scout-data-unavailable');
  if (opts.label) du.setAttribute('label', opts.label);
  if (opts.size) du.setAttribute('size', opts.size);
  return du;
}

function dataUnavailablePreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Default',
    'Default size with the default copy. Use when the surface is small and the missing data is obvious from context.',
    previewDataUnavailable({}),
  );

  block(
    'Sizes',
    'Small for table cells and dense rows; medium for section bodies and tile interiors; large for full-card replacements.',
    el('div', { class: 'preview-stack' },
      previewDataUnavailable({ size: 'small',  label: 'Data unavailable' }),
      previewDataUnavailable({ size: 'medium', label: 'Data unavailable' }),
      previewDataUnavailable({ size: 'large',  label: 'Data unavailable' }),
    ),
  );

  block(
    'Specific labels',
    'Override the label so the agent knows which fetch failed. Be specific — "Activity unavailable" beats the generic default.',
    el('div', { class: 'preview-stack' },
      previewDataUnavailable({ label: 'Couldn\'t load statements' }),
      previewDataUnavailable({ label: 'Activity unavailable' }),
      previewDataUnavailable({ label: 'Recent payments are temporarily unavailable' }),
    ),
  );

  return wrap;
}

function dataUnavailableControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const sizeSel = ddSelect('du-size', ['small', 'medium', 'large'], 'medium');
  const labelInput = ctrlText('du-label', 'Data unavailable');

  function render() {
    stage.replaceChildren(previewDataUnavailable({
      size: sizeSel.value as DataUnavailableSize,
      label: labelInput.value,
    }));
    const attrs: string[] = [];
    if (labelInput.value !== 'Data unavailable') attrs.push(`label="${labelInput.value}"`);
    if (sizeSel.value !== 'medium') attrs.push(`size="${sizeSel.value}"`);
    codePre.textContent =
      `<scout-data-unavailable${attrs.length ? ' ' + attrs.join(' ') : ''}></scout-data-unavailable>`;
  }
  for (const c of [sizeSel, labelInput]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Size', 'du-size', sizeSel),
    ctrlField('Label', 'du-label', labelInput),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function dataUnavailableGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Use data-unavailable when the surface\'s data couldn\'t be fetched.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewDataUnavailable({ size: 'large', label: 'Couldn\'t load statements' }),
          'Use a specific label so the agent knows what\'s missing. "Couldn\'t load statements" is better than the generic default.'),
        doCard(previewDataUnavailable({ size: 'small' }),
          'Use the small size in table cells and dense rows where the missing data is part of a list.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Don\'t use data-unavailable for empty states or input errors.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewDataUnavailable({ label: 'No payments yet' }),
          "Don't use data-unavailable when data is simply absent. \"No payments yet\" is an empty state — pair an illustration + headline pattern there."),
        dontCard(previewDataUnavailable({ label: 'Enter a valid SSN' }),
          "Don't use data-unavailable for input validation errors. Use scout-text-field's error attribute or scout-inline-alert."),
      )));
}

function dataUnavailableContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Label'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Default is "Data unavailable". Override it with the missing surface\'s name — "Couldn\'t load statements", "Activity unavailable".'),
        el('li', {}, 'Sentence case. Avoid trailing punctuation.'),
        el('li', {}, 'Stay under ~6 words; this is a placeholder, not a paragraph.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'When to use which size'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Small — table cells, list rows, dense detail rails.'),
        el('li', {}, 'Medium — tile bodies, card sections, regular section content.'),
        el('li', {}, 'Large — full-card replacements where this is the only thing on the surface.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Data unavailable vs. error state vs. inline alert'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Data unavailable — service call failed; this is a placeholder for missing data.'),
        el('li', {}, 'Error state — full-application error, often with an illustration and a retry action.'),
        el('li', {}, 'Inline alert — input validation, blocking warnings, or actionable notices in the page flow.'),
      )));
}

function dataUnavailableAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & labelling'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The label is rendered inside role="status" so screen readers announce it once on first paint without interrupting the flow.'),
        el('li', {}, 'The icon is decorative (aria-hidden); the label is the accessible name.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & contrast'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Both the icon and the label use text-display-secondary, meeting WCAG AA against page and surface backgrounds.'),
        el('li', {}, 'The cloud-with-slash glyph distinguishes "service problem" from a generic error icon, even when the agent skims the surface.'),
      )));
}

function dataUnavailableCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<!-- Default copy + medium size -->
<scout-data-unavailable></scout-data-unavailable>

<!-- Specific label + small size for a table cell -->
<scout-data-unavailable size="small" label="Activity unavailable"></scout-data-unavailable>

<!-- Large for a full-card replacement -->
<scout-data-unavailable size="large" label="Couldn't load statements"></scout-data-unavailable>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/data-unavailable @scout/tokens lit\n\nimport '@scout/data-unavailable';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'label'), el('td', {}, 'string'),                               el('td', {}, '"Data unavailable"'), el('td', {}, 'Message text. Slot content overrides this.')),
            el('tr', {}, el('td', {}, 'size'),  el('td', {}, '"small" | "medium" | "large"'),         el('td', {}, '"medium"'),           el('td', {}, 'Density preset.')),
          )))),
  );
}

app.append(componentPage(
  'components-data-unavailable',
  'Data unavailable',
  'Inline placeholder for surfaces whose data couldn\'t be fetched. Cloud-with-slash icon + label. Three sizes: small, medium, large.',
  [
    { id: 'preview', label: 'Preview', content: dataUnavailablePreview() },
    { id: 'controls', label: 'Controls', content: dataUnavailableControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: dataUnavailableGuidelines() },
    { id: 'content', label: 'Content', content: dataUnavailableContent() },
    { id: 'accessibility', label: 'Accessibility', content: dataUnavailableAccessibility() },
    { id: 'code', label: 'Code', content: dataUnavailableCode() },
  ],
));

// =================================================================
// Divider (real Lit component from @scout/divider)
// =================================================================
import '@scout/divider';

function previewDivider(opts: {
  weight?: '1' | '2';
  color?: 'default' | 'light' | 'knockout';
  orientation?: 'horizontal' | 'vertical';
} = {}): HTMLElement {
  const d = document.createElement('scout-divider');
  if (opts.weight) d.setAttribute('weight', opts.weight);
  if (opts.color) d.setAttribute('color', opts.color);
  if (opts.orientation) d.setAttribute('orientation', opts.orientation);
  return d;
}

function dividerPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Horizontal — weights',
    'Two weights cover the common cases: 1px for routine boundaries, 2px when the divide should read as a stronger visual break.',
    el('div', { class: 'divider-stack' },
      el('div', { class: 'divider-row' }, el('span', {}, '1px'), previewDivider({ weight: '1' })),
      el('div', { class: 'divider-row' }, el('span', {}, '2px'), previewDivider({ weight: '2' })),
    ),
  );

  block(
    'Horizontal — colors',
    'Default uses the standard secondary border color; light is the more subtle cool-gray.100; knockout is white-on-dark for use against dark surfaces.',
    el('div', { class: 'divider-stack' },
      el('div', { class: 'divider-row' }, el('span', {}, 'Default'),  previewDivider({ color: 'default' })),
      el('div', { class: 'divider-row' }, el('span', {}, 'Light'),    previewDivider({ color: 'light' })),
      el('div', { class: 'divider-row divider-row--dark' }, el('span', {}, 'Knockout'), previewDivider({ color: 'knockout' })),
    ),
  );

  block(
    'Vertical',
    'Vertical dividers stretch to their parent container\'s height. Use to separate inline groups of related controls (e.g., a toolbar).',
    el('div', { class: 'divider-vert-row' },
      el('span', {}, 'Save'),
      previewDivider({ orientation: 'vertical' }),
      el('span', {}, 'Cancel'),
      previewDivider({ orientation: 'vertical', weight: '2' }),
      el('span', {}, 'Reset'),
    ),
  );

  return wrap;
}

function dividerControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const orientationSel = ddSelect('dv-orient', ['horizontal', 'vertical']);
  const weightSel = ddSelect('dv-weight', ['1', '2']);
  const colorSel = ddSelect('dv-color', ['default', 'light', 'knockout']);

  function render() {
    const node = previewDivider({
      orientation: orientationSel.value as 'horizontal' | 'vertical',
      weight: weightSel.value as '1' | '2',
      color: colorSel.value as 'default' | 'light' | 'knockout',
    });
    if (orientationSel.value === 'vertical') {
      const wrap2 = el('div', { class: 'divider-vert-row' },
        el('span', {}, 'Left'), node, el('span', {}, 'Right'),
      );
      stage.replaceChildren(wrap2);
    } else {
      stage.replaceChildren(node);
    }
    const attrs: string[] = [];
    if (orientationSel.value !== 'horizontal') attrs.push(`orientation="${orientationSel.value}"`);
    if (weightSel.value !== '1') attrs.push(`weight="${weightSel.value}"`);
    if (colorSel.value !== 'default') attrs.push(`color="${colorSel.value}"`);
    codePre.textContent = `<scout-divider${attrs.length ? ' ' + attrs.join(' ') : ''}></scout-divider>`;
  }
  for (const c of [orientationSel, weightSel, colorSel]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Orientation', 'dv-orient', orientationSel),
    ctrlField('Weight', 'dv-weight', weightSel),
    ctrlField('Color', 'dv-color', colorSel),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function dividerGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Use a divider to separate sections that share a hierarchy.'),
      el('div', { class: 'do-dont-grid' },
        doCard(el('div', { class: 'divider-stack' },
          el('span', {}, 'Account details'),
          previewDivider({ weight: '1' }),
          el('span', {}, 'Statements'),
        ),
          'Use a 1px default divider for routine section breaks inside cards, dialogs, and lists.'),
        doCard(el('div', { class: 'divider-vert-row' },
          el('span', {}, 'Save'),
          previewDivider({ orientation: 'vertical' }),
          el('span', {}, 'Cancel'),
        ),
          'Use a vertical divider in toolbars and action rails to separate related groups of controls.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Don\'t use a divider where spacing alone communicates the break.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(el('div', { class: 'divider-stack' },
          el('span', {}, 'Heading'),
          previewDivider({ weight: '2' }),
          el('span', {}, 'Body content'),
        ),
          "Don't reach for the 2px weight by default. Reserve it for genuinely strong visual breaks; the 1px default usually carries enough weight."),
        dontCard(el('div', { class: 'divider-stack' },
          el('span', {}, 'Section A'),
          previewDivider({}),
          el('span', {}, 'Section B'),
          previewDivider({}),
          el('span', {}, 'Section C'),
        ),
          "Don't stack dividers between every consecutive item. Lean on spacing first; reach for the divider when the relationship between sections genuinely needs the visual cue."),
      )));
}

function dividerContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'When to use which weight'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, '1px (default) — routine section breaks inside cards, dialogs, lists, accordions, table rows.'),
        el('li', {}, '2px — strong visual break between top-level page regions or as the boundary between a header and the body of a complex panel.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'When to use which color'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Default — sits on the page background; meets WCAG decorative contrast.'),
        el('li', {}, 'Light — when the surrounding surface is already grayed and the default color reads too dark.'),
        el('li', {}, 'Knockout — for use on dark surfaces (snackbar interiors, dark-mode tile splits).'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Vertical sizing'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Vertical dividers stretch to 100% of their parent\'s height; consumers control height via the parent container.'),
        el('li', {}, 'For toolbar dividers, give the parent a row layout (display: flex; align-items: stretch) so the divider scales with the row.'),
      )));
}

function dividerAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The host element gets role="separator" automatically, with aria-orientation reflecting the orientation attr.'),
        el('li', {}, 'Decorative dividers (purely visual breaks between unrelated chunks) can keep the role as-is — assistive tech treats it as an "ignore me" hint by default.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color contrast'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'All three colors meet WCAG 1.4.11 non-text contrast against their intended surfaces. Knockout uses alpha-white-20 so it stays subtle on dark fills without going too bright.'),
      )));
}

function dividerCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<!-- Default 1px horizontal -->
<scout-divider></scout-divider>

<!-- 2px, light -->
<scout-divider weight="2" color="light"></scout-divider>

<!-- Vertical, knockout (e.g., on a dark surface) -->
<scout-divider orientation="vertical" color="knockout"></scout-divider>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/divider @scout/tokens lit\n\nimport '@scout/divider';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'weight'),      el('td', {}, '"1" | "2"'),                          el('td', {}, '"1"'),         el('td', {}, 'Line thickness in pixels.')),
            el('tr', {}, el('td', {}, 'color'),       el('td', {}, '"default" | "light" | "knockout"'),   el('td', {}, '"default"'),   el('td', {}, 'Visual treatment of the line.')),
            el('tr', {}, el('td', {}, 'orientation'), el('td', {}, '"horizontal" | "vertical"'),          el('td', {}, '"horizontal"'),el('td', {}, 'Direction of the line.')),
          )))),
  );
}

app.append(componentPage(
  'components-divider',
  'Divider',
  'Visual separator for organizing content. Two weights (1px / 2px), three colors (default / light / knockout), horizontal or vertical orientation.',
  [
    { id: 'preview', label: 'Preview', content: dividerPreview() },
    { id: 'controls', label: 'Controls', content: dividerControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: dividerGuidelines() },
    { id: 'content', label: 'Content', content: dividerContent() },
    { id: 'accessibility', label: 'Accessibility', content: dividerAccessibility() },
    { id: 'code', label: 'Code', content: dividerCode() },
  ],
));

// =================================================================
// Dropdown (real Lit components from @scout/dropdown)
// =================================================================
import '@scout/dropdown';

const COUNTRY_OPTIONS = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'es', label: 'Spain' },
  { value: 'it', label: 'Italy' },
  { value: 'jp', label: 'Japan' },
  { value: 'kr', label: 'South Korea' },
  { value: 'br', label: 'Brazil' },
  { value: 'au', label: 'Australia' },
];

interface DropOpts {
  variant?: 'select' | 'searchable';
  label?: string;
  placeholder?: string;
  value?: string;
  helper?: string;
  error?: string;
  size?: 'default' | 'condensed';
  disabled?: boolean;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
}

function previewDropdown(opts: DropOpts = {}): HTMLElement {
  const tag = opts.variant === 'searchable' ? 'scout-dropdown-searchable' : 'scout-dropdown-select';
  const d = document.createElement(tag);
  if (opts.label) d.setAttribute('label', opts.label);
  if (opts.placeholder) d.setAttribute('placeholder', opts.placeholder);
  if (opts.value) d.setAttribute('value', opts.value);
  if (opts.helper) d.setAttribute('helper', opts.helper);
  if (opts.error) d.setAttribute('error', opts.error);
  if (opts.size) d.setAttribute('size', opts.size);
  if (opts.disabled) d.setAttribute('disabled', '');
  for (const o of opts.options ?? COUNTRY_OPTIONS) {
    const opt = document.createElement('scout-dropdown-option');
    opt.setAttribute('value', o.value);
    if (o.disabled) opt.setAttribute('disabled', '');
    opt.textContent = o.label;
    d.appendChild(opt);
  }
  return d;
}

function dropdownPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block('Dropdown Select — basic',
    'A standard single-select dropdown. Click the trigger to open the menu, click an option to choose it. Closes on outside click or Escape.',
    el('div', { class: 'preview-stack' },
      previewDropdown({ label: 'Country', placeholder: 'Select a country', helper: 'Required for shipping' }),
      previewDropdown({ label: 'Country (with value)', value: 'us' }),
      previewDropdown({ label: 'Country (condensed)', size: 'condensed', value: 'ca' }),
    ),
  );

  block('Dropdown Select — error',
    'When error is set, the field gets a red border and an error message appears below.',
    previewDropdown({ label: 'Country', placeholder: 'Select…', error: 'Country is required.' }),
  );

  block('Dropdown Select — disabled',
    'Disabled fields cannot be opened or interacted with.',
    previewDropdown({ label: 'Country (disabled)', value: 'us', disabled: true }),
  );

  block('Dropdown Searchable',
    'Type to filter the options. Functional menu states: default, active with menu, active typed with menu, filled, error, disabled. Try typing "uni" to see filtering.',
    el('div', { class: 'preview-stack' },
      previewDropdown({ variant: 'searchable', label: 'Country', placeholder: 'Search countries…', helper: 'Type to filter' }),
      previewDropdown({ variant: 'searchable', label: 'Country (filled)', value: 'jp' }),
      previewDropdown({ variant: 'searchable', label: 'Country (error)', placeholder: 'Search…', error: 'Country is required.' }),
    ),
  );

  return wrap;
}

function dropdownControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const variantSel = ddSelect('dd-variant', ['select', 'searchable'] as const);
  const labelInput = ctrlText('dd-label', 'Country');
  const placeholderInput = ctrlText('dd-ph', 'Select a country');
  const helperInput = ctrlText('dd-help', '');
  const errorInput = ctrlText('dd-err', '');
  const sizeSel = ddSelect('dd-size', ['default', 'condensed'] as const);
  const disabledChk = ctrlCheck('dd-disabled', 'Disabled');

  function render() {
    stage.replaceChildren(previewDropdown({
      variant: variantSel.value as 'select' | 'searchable',
      label: labelInput.value,
      placeholder: placeholderInput.value,
      helper: helperInput.value || undefined,
      error: errorInput.value || undefined,
      size: sizeSel.value as 'default' | 'condensed',
      disabled: disabledChk.checked,
    }));
    const tag = variantSel.value === 'searchable' ? 'scout-dropdown-searchable' : 'scout-dropdown-select';
    const attrs: string[] = [`label="${labelInput.value}"`, `placeholder="${placeholderInput.value}"`];
    if (helperInput.value) attrs.push(`helper="${helperInput.value}"`);
    if (errorInput.value) attrs.push(`error="${errorInput.value}"`);
    if (sizeSel.value !== 'default') attrs.push(`size="${sizeSel.value}"`);
    if (disabledChk.checked) attrs.push('disabled');
    codePre.textContent = `<${tag} ${attrs.join(' ')}>\n  <scout-dropdown-option value="us">United States</scout-dropdown-option>\n  <scout-dropdown-option value="ca">Canada</scout-dropdown-option>\n  …\n</${tag}>`;
  }
  for (const c of [variantSel, labelInput, placeholderInput, helperInput, errorInput, sizeSel, disabledChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Variant', 'dd-variant', variantSel),
    ctrlField('Label', 'dd-label', labelInput),
    ctrlField('Placeholder', 'dd-ph', placeholderInput),
    ctrlField('Helper', 'dd-help', helperInput),
    ctrlField('Error', 'dd-err', errorInput),
    ctrlField('Size', 'dd-size', sizeSel),
    el('div', { class: 'ctrl-checks' }, disabledChk),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function dropdownGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Patterns that match user expectations for selecting from a list.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewDropdown({ variant: 'searchable', label: 'Country', placeholder: 'Search countries…' }),
          'Use the searchable variant when the option list is longer than ~10 items. Typing-to-filter beats endless scrolling.'),
        doCard(previewDropdown({ label: 'Status', placeholder: 'Select a status', options: [{ value: 'a', label: 'Active' }, { value: 'p', label: 'Pending' }, { value: 'c', label: 'Closed' }] }),
          'Use the standard select for short option lists (3–10 items). It\'s simpler and more familiar.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Patterns that frustrate users.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewDropdown({ label: 'Yes/no', placeholder: 'Choose', options: [{ value: 'y', label: 'Yes' }, { value: 'n', label: 'No' }] }),
          "Don't use a dropdown for binary choices. Use a checkbox or radio buttons — the choice is visible without an extra click."),
        dontCard(previewDropdown({ label: '', placeholder: 'Select…' }),
          "Don't omit the label. Even with a clear placeholder, a label keeps the form scannable when fields are populated."),
      )));
}

function dropdownContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use sentence case ("Country", "Account type", "Mailing region").'),
        el('li', {}, 'Be specific. "Country of residence" beats "Country" when the page might confuse it with country of citizenship.'),
        el('li', {}, 'Always provide a label, even when a placeholder is set. Placeholders disappear on selection; labels persist.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Placeholder'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Action-oriented: "Select a country", "Choose payment method".'),
        el('li', {}, 'For searchable: "Search countries…", "Type to filter…".'),
        el('li', {}, "Don't repeat the label. \"Country / Country\" is redundant."),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Helper / error messages'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Helper text explains why the field exists, what format is expected, or any constraints.'),
        el('li', {}, 'Error messages name the problem and how to fix it. "Country is required" beats "Invalid".'),
      )));
}

function dropdownAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & semantics'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The trigger uses aria-haspopup="listbox" and aria-expanded reflecting the open state.'),
        el('li', {}, 'The menu uses role="listbox"; each option uses role="option" with aria-selected.'),
        el('li', {}, 'The searchable input adds aria-autocomplete="list" so screen readers announce that typing filters results.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Tab focuses the dropdown. Enter / Space opens it. Escape closes it.'),
        el('li', {}, 'Arrow Down / Up navigate options. Enter selects the active one.'),
        el('li', {}, 'Searchable: typing filters. Arrow keys navigate matching options only.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Form association'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Both variants use ElementInternals so the host submits its value with the form via the configured name attribute.'),
      )));
}

function dropdownCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<!-- Standard single-select -->
<scout-dropdown-select label="Country" placeholder="Select a country" name="country">
  <scout-dropdown-option value="us">United States</scout-dropdown-option>
  <scout-dropdown-option value="ca">Canada</scout-dropdown-option>
  <scout-dropdown-option value="mx">Mexico</scout-dropdown-option>
</scout-dropdown-select>

<!-- Searchable single-select -->
<scout-dropdown-searchable label="Country" placeholder="Search countries…" name="country">
  <scout-dropdown-option value="us">United States</scout-dropdown-option>
  <scout-dropdown-option value="ca">Canada</scout-dropdown-option>
  …
</scout-dropdown-searchable>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/dropdown @scout/tokens lit\n\nimport '@scout/dropdown';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Common props (both variants)'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'label'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Field label.')),
            el('tr', {}, el('td', {}, 'placeholder'), el('td', {}, 'string'), el('td', {}, '"Select…" / "Search…"'), el('td', {}, 'Empty-state placeholder text.')),
            el('tr', {}, el('td', {}, 'value'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Currently selected option value.')),
            el('tr', {}, el('td', {}, 'helper'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Helper text rendered below the field.')),
            el('tr', {}, el('td', {}, 'error'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Error message; sets invalid state and red border.')),
            el('tr', {}, el('td', {}, 'size'), el('td', {}, '"default" | "condensed"'), el('td', {}, '"default"'), el('td', {}, 'Density preset.')),
            el('tr', {}, el('td', {}, 'disabled'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disables interaction.')),
            el('tr', {}, el('td', {}, 'name'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Form field name (ElementInternals).')),
          )))));
}

app.append(componentPage(
  'components-dropdown',
  'Dropdown',
  'Used to select a single item from a list. Two variants: standard select and searchable.',
  [
    { id: 'preview', label: 'Preview', content: dropdownPreview() },
    { id: 'controls', label: 'Controls', content: dropdownControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: dropdownGuidelines() },
    { id: 'content', label: 'Content', content: dropdownContent() },
    { id: 'accessibility', label: 'Accessibility', content: dropdownAccessibility() },
    { id: 'code', label: 'Code', content: dropdownCode() },
  ],
));

// =================================================================
// Error state (real Lit component from @scout/error-state)
// =================================================================
import '@scout/error-state';

interface ErrOpts {
  header?: string;
  message?: string;
  link?: string;
  linkHref?: string;
}

function previewErrorState(opts: ErrOpts = {}): HTMLElement {
  const {
    header = 'Something went wrong',
    message = "We couldn't load this page. Try refreshing or contact support if the problem continues.",
    link,
    linkHref = '#',
  } = opts;
  const e = document.createElement('scout-error-state');
  if (header) {
    const h = document.createElement('span');
    h.setAttribute('slot', 'header');
    h.textContent = header;
    e.appendChild(h);
  }
  if (message) e.appendChild(document.createTextNode(message));
  if (link) {
    const a = document.createElement('a');
    a.setAttribute('slot', 'link');
    a.setAttribute('href', linkHref);
    a.textContent = link;
    e.appendChild(a);
  }
  return e;
}

function errorStatePreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block('Default',
    'A centered display with placeholder illustration, header, and message. Use when an error has knocked the entire app or page off the rails.',
    previewErrorState(),
  );

  block('With link',
    'Add a recovery action — typically "Try again", "Contact support", or "Check status page".',
    previewErrorState({ link: 'Contact support', linkHref: '/support' }),
  );

  block('Custom copy',
    'Any combination of header and message. Keep the message under three short sentences.',
    previewErrorState({
      header: 'Ember is unavailable',
      message: 'Our service is currently down. We\'re working to restore it as quickly as possible.',
      link: 'Check status page',
    }),
  );

  return wrap;
}

function errorStateControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const headerInput = ctrlText('es-h', 'Something went wrong');
  const messageInput = ctrlText('es-m', '');
  const linkInput = ctrlText('es-link', 'Contact support');

  function render() {
    stage.replaceChildren(previewErrorState({
      header: headerInput.value,
      message: messageInput.value,
      link: linkInput.value || undefined,
    }));
    const linkSlot = linkInput.value ? `\n  <a slot="link" href="/support">${linkInput.value}</a>` : '';
    codePre.textContent = `<scout-error-state>\n  <span slot="header">${headerInput.value}</span>\n  ${messageInput.value}${linkSlot}\n</scout-error-state>`;
  }
  for (const c of [headerInput, messageInput, linkInput]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Header', 'es-h', headerInput),
    ctrlField('Message', 'es-m', messageInput),
    ctrlField('Link', 'es-link', linkInput),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function errorStateGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Patterns that help users recover from page-level failures.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewErrorState({ link: 'Try again', linkHref: '#' }),
          'Always provide a recovery path — a retry, a way to contact support, or a link back to a working state.'),
        doCard(previewErrorState({ header: 'Ember is unavailable', message: "We're working to restore service. Estimated time to recovery: 15 minutes." }),
          'When the cause is known (outage, maintenance), name it and give an ETA. Vague errors erode trust.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Patterns that frustrate users.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewErrorState({ header: 'Error', message: 'Error 500.' }),
          "Don't show raw error codes or technical messages. Translate to plain language a user can act on."),
        dontCard(previewErrorState({ header: 'Page not found', message: 'The page you requested could not be found.' }),
          "Don't use the full-page error state for individual content failures. Use Inline alert (status=critical) for contextual errors."),
      )));
}

function errorStateContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Header'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use sentence case ("Something went wrong", not "Something Went Wrong").'),
        el('li', {}, 'Be human. "Ember is unavailable" beats "HTTP 503".'),
        el('li', {}, 'Don\'t blame the user. "Couldn\'t load" beats "Your request failed".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Message'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Keep it under three short sentences.'),
        el('li', {}, 'Tell the user what happened, what they can do about it, and (if known) when it\'ll be resolved.'),
        el('li', {}, "Don't include error codes in user-visible copy. Log them; surface them only to support agents."),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Link'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use action verbs: "Try again", "Contact support", "Check status page".'),
        el('li', {}, 'Prefer a single link. Multiple recovery paths are confusing in a moment of failure.'),
      )));
}

function errorStateAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & live regions'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The container uses role="alert" so assistive tech announces the error when the component appears.'),
        el('li', {}, 'The header renders as <h2> for proper document outline.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Illustration'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The default placeholder illustration is decorative (aria-hidden). Custom illustrations slotted in should also be aria-hidden unless they convey unique information.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color contrast'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Header and message text both meet WCAG 2.1 AA contrast in light and dark themes.'),
      )));
}

function errorStateCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-error-state>
  <span slot="header">Something went wrong</span>
  We couldn't load this page. Try refreshing or contact support
  if the problem continues.
  <a slot="link" href="/support">Contact support</a>
</scout-error-state>

<!-- Custom illustration -->
<scout-error-state>
  <svg slot="illustration" viewBox="0 0 200 160">…</svg>
  <span slot="header">Ember is unavailable</span>
  We're working to restore service.
  <a slot="link" href="/status">Check status page</a>
</scout-error-state>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/error-state @scout/tokens lit\n\nimport '@scout/error-state';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Slots'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Slot'), el('th', {}, 'Purpose'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'illustration'), el('td', {}, 'Optional illustration. Defaults to a placeholder.')),
            el('tr', {}, el('td', {}, 'header'), el('td', {}, 'Error headline.')),
            el('tr', {}, el('td', {}, '(default)'), el('td', {}, 'Message body.')),
            el('tr', {}, el('td', {}, 'link'), el('td', {}, 'Optional anchor or button (recovery path).')),
          )))));
}

app.append(componentPage(
  'components-error-state',
  'Error state',
  'Used when an error has occurred that impacts the entire application or page. For inline, contextual errors prefer the Inline alert component instead.',
  [
    { id: 'preview', label: 'Preview', content: errorStatePreview() },
    { id: 'controls', label: 'Controls', content: errorStateControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: errorStateGuidelines() },
    { id: 'content', label: 'Content', content: errorStateContent() },
    { id: 'accessibility', label: 'Accessibility', content: errorStateAccessibility() },
    { id: 'code', label: 'Code', content: errorStateCode() },
  ],
));

// =================================================================
// Filter chip (real Lit component from @scout/filter-chip)
// =================================================================
import '@scout/filter-chip';

interface ChipOpts {
  label?: string;
  size?: 'default' | 'condensed';
  selected?: boolean;
  menu?: boolean;
  disabled?: boolean;
}

function previewChip(opts: ChipOpts = {}): HTMLElement {
  const { label = 'Filter', size = 'default', selected = false, menu = false, disabled = false } = opts;
  const c = document.createElement('scout-filter-chip');
  c.setAttribute('size', size);
  if (selected) c.setAttribute('selected', '');
  if (menu) c.setAttribute('menu', '');
  if (disabled) c.setAttribute('disabled', '');
  c.textContent = label;
  return c;
}

function filterChipPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, ...children: HTMLElement[]) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row' }, ...children),
    ));
  };

  block('Functional states',
    'Default (not selected) · Selected (filter applied) · Disabled. Click any chip to toggle its selected state.',
    previewChip({ label: 'Active' }),
    previewChip({ label: 'Active · 12', selected: true }),
    previewChip({ label: 'Archived', disabled: true }),
  );

  block('Sizes',
    'Default for primary toolbars and filter rows. Condensed for table headers, dense filter bars.',
    previewChip({ label: 'Default' }),
    previewChip({ label: 'Condensed', size: 'condensed' }),
  );

  block('Menu mode',
    'Set the menu attribute when clicking the chip should open a popover (e.g. choose filter values). The chip renders a chevron and dispatches scout-filter-chip-menu instead of toggling selection.',
    previewChip({ label: 'Status', menu: true }),
    previewChip({ label: 'Status: Active', menu: true, selected: true }),
    previewChip({ label: 'Date range', menu: true }),
  );

  block('Common pattern — filter row',
    'Multiple chips together filter a list. Selected chips visually pop with the brand-blue tint.',
    previewChip({ label: 'All', selected: true }),
    previewChip({ label: 'Personal' }),
    previewChip({ label: 'Business' }),
    previewChip({ label: 'Pending', selected: true }),
    previewChip({ label: 'Closed' }),
  );

  return wrap;
}

function filterChipControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const labelInput = ctrlText('fc-label', 'Filter');
  const sizeSel = ddSelect('fc-size', ['default', 'condensed'] as const);
  const selectedChk = ctrlCheck('fc-selected', 'Selected');
  const menuChk = ctrlCheck('fc-menu', 'Menu mode');
  const disabledChk = ctrlCheck('fc-disabled', 'Disabled');

  function render() {
    stage.replaceChildren(previewChip({
      label: labelInput.value || 'Filter',
      size: sizeSel.value as 'default' | 'condensed',
      selected: selectedChk.checked,
      menu: menuChk.checked,
      disabled: disabledChk.checked,
    }));
    const attrs: string[] = [];
    if (sizeSel.value !== 'default') attrs.push(`size="${sizeSel.value}"`);
    if (selectedChk.checked) attrs.push('selected');
    if (menuChk.checked) attrs.push('menu');
    if (disabledChk.checked) attrs.push('disabled');
    codePre.textContent = `<scout-filter-chip${attrs.length ? ' ' + attrs.join(' ') : ''}>${labelInput.value || 'Filter'}</scout-filter-chip>`;
  }
  for (const c of [labelInput, sizeSel, selectedChk, menuChk, disabledChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Label', 'fc-label', labelInput),
    ctrlField('Size', 'fc-size', sizeSel),
    el('div', { class: 'ctrl-checks' },
      selectedChk,
      menuChk,
      disabledChk,
    ),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function filterChipGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Patterns that make filtering fast and obvious.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewChip({ label: 'Active · 12', selected: true }),
          'Show match counts in the chip label when filtering reveals a manageable set. The number reinforces what the filter does.'),
        doCard(previewChip({ label: 'Status', menu: true }),
          'Use menu mode when one chip should reveal multiple choices (status, date range, owner). The chevron tells users a popover opens.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Patterns that confuse the chip\'s role.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewChip({ label: 'Save', selected: true }),
          "Don't use chips for actions (saving, submitting). Use a button. Chips are for toggling filter state, not commands."),
        dontCard(previewChip({ label: 'Filter by status, account type, or balance range across all customers' }),
          "Don't write long chip labels. Keep to 1–3 words. Truncated chips are unreadable in dense filter rows."),
      )));
}

function filterChipContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use sentence case ("Active", "Pending review", "Last 30 days").'),
        el('li', {}, 'Be concise. 1–3 words is ideal; never more than 4.'),
        el('li', {}, 'Use plural for category filters: "Customers", "Accounts". Singular for state filters: "Active", "Pending".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Match counts'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Append " · {count}" when showing match counts: "Active · 12".'),
        el('li', {}, 'Use the en dot (·) — middle dot, surrounded by spaces — not parentheses or brackets.'),
        el('li', {}, "Don't show counts in menu-mode chips; the menu itself shows item counts."),
      )));
}

function filterChipAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Toggle mode: chips render as <button> with aria-pressed reflecting the selected state.'),
        el('li', {}, 'Menu mode: chips set aria-haspopup="true" so screen readers announce that activation opens a menu.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Tab focuses the chip. Enter/Space toggles (toggle mode) or opens the menu (menu mode).'),
        el('li', {}, 'Disabled chips are skipped in tab order.'),
        el('li', {}, 'Focus ring is a 2px outline at 1px offset on :focus-visible.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Selected state is conveyed by both color (blue tint) AND a leading checkmark — never color alone.'),
        el('li', {}, 'All states meet WCAG 2.1 AA contrast in light and dark themes.'),
      )));
}

function filterChipCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<!-- Toggle mode -->
<scout-filter-chip>Active</scout-filter-chip>
<scout-filter-chip selected>Active · 12</scout-filter-chip>

<!-- Menu mode (consumer manages selected state) -->
<scout-filter-chip menu>Status</scout-filter-chip>
<scout-filter-chip menu selected>Status: Active</scout-filter-chip>

<!-- Listen for state changes -->
<script>
  document.querySelector('scout-filter-chip')
    .addEventListener('scout-filter-chip-change', (e) => {
      console.log('Selected:', e.detail.selected);
    });
</script>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/filter-chip @scout/tokens lit\n\nimport '@scout/filter-chip';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'size'), el('td', {}, '"default" | "condensed"'), el('td', {}, '"default"'), el('td', {}, 'Density preset.')),
            el('tr', {}, el('td', {}, 'selected'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Selected/active filter state.')),
            el('tr', {}, el('td', {}, 'menu'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Renders chevron; dispatches menu event instead of toggling.')),
            el('tr', {}, el('td', {}, 'disabled'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disables interaction.')),
          )))));
}

app.append(componentPage(
  'components-filter-chip',
  'Filter chip',
  'Selectable tag for filtering content. Toggles selection state by default; in menu mode, opens a popover for value selection.',
  [
    { id: 'preview', label: 'Preview', content: filterChipPreview() },
    { id: 'controls', label: 'Controls', content: filterChipControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: filterChipGuidelines() },
    { id: 'content', label: 'Content', content: filterChipContent() },
    { id: 'accessibility', label: 'Accessibility', content: filterChipAccessibility() },
    { id: 'code', label: 'Code', content: filterChipCode() },
  ],
));

// =================================================================
// Inline alert (real Lit component from @scout/inline-alert)
// =================================================================
import '@scout/inline-alert';

type IAStatus = 'informational' | 'favorable' | 'warning' | 'critical';
type IASize = 'default' | 'condensed';

interface IAOpts {
  status?: IAStatus;
  size?: IASize;
  title?: string;
  message?: string;
  action?: string;
  closable?: boolean;
}

function previewInlineAlert(opts: IAOpts = {}): HTMLElement {
  const {
    status = 'informational',
    size = 'default',
    title,
    message = 'A message about the alert.',
    action,
    closable = false,
  } = opts;
  const a = document.createElement('scout-inline-alert');
  a.setAttribute('status', status);
  a.setAttribute('size', size);
  if (closable) a.setAttribute('closable', '');
  if (title) {
    const t = document.createElement('span');
    t.setAttribute('slot', 'title');
    t.textContent = title;
    a.appendChild(t);
  }
  a.appendChild(document.createTextNode(message));
  if (action) {
    const btn = document.createElement('scout-button');
    btn.setAttribute('slot', 'action');
    btn.setAttribute('variant', 'tertiary');
    btn.setAttribute('size', 'condensed');
    btn.textContent = action;
    a.appendChild(btn);
  }
  return a;
}

function inlineAlertPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };
  block(
    'Statuses',
    'Each status conveys a semantic meaning. Informational for neutral notes, favorable for success, warning for non-blocking risk, critical for blocking issues.',
    el('div', { class: 'preview-stack' },
      previewInlineAlert({ status: 'informational', title: 'New feature available', message: 'Account searching now supports partial matches across all fields.' }),
      previewInlineAlert({ status: 'favorable', title: 'Payment posted', message: 'The customer\'s payment of $124.50 has been successfully applied.' }),
      previewInlineAlert({ status: 'warning', title: 'Verify identity', message: 'This account requires identity verification before changes can be made.' }),
      previewInlineAlert({ status: 'critical', title: 'Account locked', message: 'This account has been locked due to suspicious activity. Contact fraud team before proceeding.' }),
    ),
  );
  block(
    'Sizes',
    'Default for primary content surfaces. Condensed for dense UIs, sidebars, and toolbars.',
    el('div', { class: 'preview-stack' },
      previewInlineAlert({ status: 'informational', size: 'default', message: 'Default size — comfortable padding for primary content.' }),
      previewInlineAlert({ status: 'informational', size: 'condensed', message: 'Condensed — tighter padding for dense surfaces.' }),
    ),
  );
  block(
    'With action and close',
    'Add a tertiary button or link in the action slot. Add closable for a dismiss button. Combine for full functionality.',
    el('div', { class: 'preview-stack' },
      previewInlineAlert({ status: 'warning', title: 'Update your payment method', message: 'Your card ending in 4242 expires next month.', action: 'Update card' }),
      previewInlineAlert({ status: 'informational', message: 'A new build of Ember is available.', closable: true }),
      previewInlineAlert({ status: 'critical', title: 'Connection lost', message: 'Reconnect to continue.', action: 'Retry', closable: true }),
    ),
  );
  return wrap;
}

function inlineAlertControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const statusSel = ddSelect('ia-status', ['informational', 'favorable', 'warning', 'critical'] as const);
  const sizeSel = ddSelect('ia-size', ['default', 'condensed'] as const);
  const titleInput = ctrlText('ia-title', 'Title');
  const messageInput = ctrlText('ia-message', 'Message about this alert.');
  const actionInput = ctrlText('ia-action', '');
  const closableChk = ctrlCheck('ia-closable', 'Closable');

  function render() {
    stage.replaceChildren(previewInlineAlert({
      status: statusSel.value as IAStatus,
      size: sizeSel.value as IASize,
      title: titleInput.value || undefined,
      message: messageInput.value,
      action: actionInput.value || undefined,
      closable: closableChk.checked,
    }));
    const attrs: string[] = [];
    if (statusSel.value !== 'informational') attrs.push(`status="${statusSel.value}"`);
    if (sizeSel.value !== 'default') attrs.push(`size="${sizeSel.value}"`);
    if (closableChk.checked) attrs.push('closable');
    const titleSlot = titleInput.value ? `\n  <span slot="title">${titleInput.value}</span>` : '';
    const actionSlot = actionInput.value ? `\n  <scout-button slot="action" variant="tertiary" size="condensed">${actionInput.value}</scout-button>` : '';
    codePre.textContent = `<scout-inline-alert${attrs.length ? ' ' + attrs.join(' ') : ''}>${titleSlot}\n  ${messageInput.value}${actionSlot}\n</scout-inline-alert>`;
  }

  for (const c of [statusSel, sizeSel, titleInput, messageInput, actionInput, closableChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }

  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);

  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Status', 'ia-status', statusSel),
    ctrlField('Size', 'ia-size', sizeSel),
    ctrlField('Title', 'ia-title', titleInput),
    ctrlField('Message', 'ia-message', messageInput),
    ctrlField('Action', 'ia-action', actionInput),
    el('div', { class: 'ctrl-checks' }, closableChk),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function inlineAlertGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Patterns that surface alerts where users actually need them.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewInlineAlert({ status: 'critical', title: 'Account locked', message: 'Contact fraud team before making any changes.' }),
          'Place inline alerts immediately above or near the content they apply to. Critical alerts that block actions belong in the user\'s line of sight.'),
        doCard(previewInlineAlert({ status: 'warning', message: 'Your card ending in 4242 expires next month.', action: 'Update card' }),
          'Pair warnings with an actionable next step. The action slot is for resolving the issue, not dismissing it.'),
      ),
    ),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Patterns that overuse the component or hide important information.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewInlineAlert({ status: 'informational', message: 'Welcome.' }),
          "Don't use inline alerts for trivial confirmations or greetings. Use snackbars for transient feedback or just plain text."),
        dontCard(previewInlineAlert({ status: 'critical', message: 'Generic error.' }),
          "Don't write vague critical messages. Tell the user what went wrong AND what to do about it."),
      ),
    ),
  );
}

function inlineAlertContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Title'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use a title only when the message needs scanning at a glance. Short alerts often don\'t need one.'),
        el('li', {}, 'Use sentence case ("Check your account", not "Check Your Account").'),
        el('li', {}, 'Lead with the noun of concern: "Payment posted" beats "Your payment was posted".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Message'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'State the facts plainly. Tell the user what happened or what they need to know.'),
        el('li', {}, 'For warnings and critical alerts, follow the message with what the user can do about it.'),
        el('li', {}, 'Keep messages under two sentences. If you need more, link out via the action slot.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Action'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use a tertiary button or text link in the action slot — never a primary button.'),
        el('li', {}, 'Action labels are verbs: "Update card", "Retry", "View details". No "Click here".'),
      )));
}

function inlineAlertAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & semantics'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The component sets role="alert" so assistive tech announces the message when it appears.'),
        el('li', {}, 'Status (informational/favorable/warning/critical) is conveyed by both color AND a status icon, never color alone.'),
        el('li', {}, 'Close button has an aria-label of "Close alert".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Action and close buttons receive native focus and respond to Enter/Space.'),
        el('li', {}, 'No keyboard trap; focus moves naturally between the action and close controls.'),
      )));
}

function inlineAlertCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-inline-alert status="warning" closable>
  <span slot="title">Verify identity</span>
  This account requires identity verification before changes can be made.
  <scout-button slot="action" variant="tertiary" size="condensed">Verify now</scout-button>
</scout-inline-alert>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' },
        `pnpm add @scout/inline-alert @scout/tokens lit

import '@scout/inline-alert';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'status'), el('td', {}, '"informational" | "favorable" | "warning" | "critical"'), el('td', {}, '"informational"'), el('td', {}, 'Status of the alert.')),
            el('tr', {}, el('td', {}, 'size'), el('td', {}, '"default" | "condensed"'), el('td', {}, '"default"'), el('td', {}, 'Padding density.')),
            el('tr', {}, el('td', {}, 'closable'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Renders a close button.')),
          )))));
}

app.append(componentPage(
  'components-inline-alert',
  'Inline alert',
  'Contextual message embedded in the page flow. Used for non-blocking notifications relevant to the surrounding content.',
  [
    { id: 'preview', label: 'Preview', content: inlineAlertPreview() },
    { id: 'controls', label: 'Controls', content: inlineAlertControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: inlineAlertGuidelines() },
    { id: 'content', label: 'Content', content: inlineAlertContent() },
    { id: 'accessibility', label: 'Accessibility', content: inlineAlertAccessibility() },
    { id: 'code', label: 'Code', content: inlineAlertCode() },
  ],
));

// =================================================================
// Link (real Lit component from @scout/link)
// =================================================================
import '@scout/link';

const ARROW_RIGHT_PATH = 'M12.22 5.22a.75.75 0 0 1 1.06 0l6 6a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 1 1-1.06-1.06l4.72-4.72H4.25a.75.75 0 0 1 0-1.5h12.69l-4.72-4.72a.75.75 0 0 1 0-1.06Z';

interface LinkOpts {
  label?: string;
  href?: string;
  type?: 'inline' | 'standalone' | 'hyperlink';
  size?: 'default' | 'condensed';
  iconPosition?: 'leading' | 'trailing' | 'none';
  disabled?: boolean;
}

function previewLink(opts: LinkOpts = {}): HTMLElement {
  const {
    label = 'Read the docs',
    href = '#',
    type = 'standalone',
    size = 'default',
    iconPosition = 'none',
    disabled = false,
  } = opts;
  const link = document.createElement('scout-link');
  link.setAttribute('href', href);
  link.setAttribute('type', type);
  link.setAttribute('size', size);
  if (disabled) link.setAttribute('disabled', '');

  if (iconPosition !== 'none') {
    const slot = iconPosition === 'leading' ? 'icon-leading' : 'icon-trailing';
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('slot', slot);
    svgEl.setAttribute('viewBox', '0 0 24 24');
    svgEl.setAttribute('fill', 'currentColor');
    svgEl.setAttribute('aria-hidden', 'true');
    svgEl.setAttribute('width', '14');
    svgEl.setAttribute('height', '14');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', ARROW_RIGHT_PATH);
    path.setAttribute('fill-rule', 'evenodd');
    path.setAttribute('clip-rule', 'evenodd');
    svgEl.appendChild(path);
    link.appendChild(svgEl);
  }
  link.appendChild(document.createTextNode(label));
  return link;
}

function linkPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block('Types',
    'Inline lives within paragraph text. Standalone is a block-level CTA. Hyperlink is for external destinations and auto-renders an "open in new tab" icon.',
    el('div', { class: 'preview-stack' },
      el('p', { style: 'margin: 0; font-size: var(--scout-font-size-14); line-height: var(--scout-font-line-height-21);' },
        'Inline links sit inside flowing text — like ',
        previewLink({ label: 'this one', type: 'inline' }),
        ' — and inherit the paragraph\'s font size and color treatment.',
      ),
      previewLink({ label: 'Read the docs', type: 'standalone' }),
      el('p', { style: 'margin: 0; font-size: var(--scout-font-size-14); line-height: var(--scout-font-line-height-21);' },
        'External destinations use the hyperlink type, which adds an icon: visit ',
        previewLink({ label: 'heroicons.com', href: 'https://heroicons.com', type: 'hyperlink' }),
        ' to browse the icon set.',
      ),
    ),
  );

  block('Layouts (standalone)',
    'Standalone links can have a leading icon, trailing icon, or no icon. Inline and hyperlink types are layout-fixed.',
    el('div', { class: 'preview-stack' },
      previewLink({ label: 'No icon', type: 'standalone' }),
      previewLink({ label: 'Leading icon', type: 'standalone', iconPosition: 'leading' }),
      previewLink({ label: 'Trailing icon', type: 'standalone', iconPosition: 'trailing' }),
    ),
  );

  block('Sizes',
    'Default is body-sized. Condensed pairs with body-small typography or dense surfaces.',
    el('div', { class: 'preview-stack' },
      previewLink({ label: 'Default', type: 'standalone' }),
      previewLink({ label: 'Condensed', type: 'standalone', size: 'condensed' }),
    ),
  );

  block('Disabled',
    'Disabled links are inert (no pointer, removed from tab order) and visually de-emphasized.',
    el('div', { class: 'preview-stack' },
      previewLink({ label: 'Disabled link', type: 'standalone', disabled: true }),
      previewLink({ label: 'Disabled with icon', type: 'standalone', iconPosition: 'trailing', disabled: true }),
    ),
  );

  return wrap;
}

function linkControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const labelInput = ctrlText('lk-label', 'Read the docs');
  const hrefInput = ctrlText('lk-href', '#');
  const typeSel = ddSelect('lk-type', ['standalone', 'inline', 'hyperlink'] as const);
  const sizeSel = ddSelect('lk-size', ['default', 'condensed'] as const);
  const iconSel = ddSelect('lk-icon', ['none', 'leading', 'trailing'] as const);
  const disabledChk = ctrlCheck('lk-disabled', 'Disabled');

  function render() {
    stage.replaceChildren(previewLink({
      label: labelInput.value || 'Link',
      href: hrefInput.value,
      type: typeSel.value as 'inline' | 'standalone' | 'hyperlink',
      size: sizeSel.value as 'default' | 'condensed',
      iconPosition: iconSel.value as 'none' | 'leading' | 'trailing',
      disabled: disabledChk.checked,
    }));
    const attrs: string[] = [`href="${hrefInput.value}"`];
    if (typeSel.value !== 'standalone') attrs.push(`type="${typeSel.value}"`);
    if (sizeSel.value !== 'default') attrs.push(`size="${sizeSel.value}"`);
    if (disabledChk.checked) attrs.push('disabled');
    const slotMarkup = iconSel.value === 'leading'
      ? `\n  <svg slot="icon-leading">…</svg>` :
      iconSel.value === 'trailing'
        ? `\n  <svg slot="icon-trailing">…</svg>` : '';
    codePre.textContent = `<scout-link ${attrs.join(' ')}>${slotMarkup}\n  ${labelInput.value || 'Link'}\n</scout-link>`;
  }
  for (const c of [labelInput, hrefInput, typeSel, sizeSel, iconSel, disabledChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Label', 'lk-label', labelInput),
    ctrlField('Href', 'lk-href', hrefInput),
    ctrlField('Type', 'lk-type', typeSel),
    ctrlField('Size', 'lk-size', sizeSel),
    ctrlField('Icon position', 'lk-icon', iconSel),
    el('div', { class: 'ctrl-checks' }, disabledChk),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function linkGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Patterns that respect link affordances and accessibility.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewLink({ label: 'View invoice details', type: 'standalone', iconPosition: 'trailing' }),
          'Use a trailing arrow on standalone CTA links to signal forward navigation.'),
        doCard(previewLink({ label: 'heroicons.com', href: 'https://heroicons.com', type: 'hyperlink' }),
          'Use the hyperlink type for external destinations. The auto-rendered icon and target="_blank" handling are built in.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Patterns that confuse link role.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewLink({ label: 'Save', type: 'standalone' }),
          "Don't use links for actions that change state (save, submit, delete). Use a Button — links are for navigation."),
        dontCard(previewLink({ label: 'Click here', type: 'inline' }),
          "Don't use \"Click here\" or \"Read more\" as the link text. The label should describe the destination on its own (\"View invoice details\")."),
      )));
}

function linkContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use sentence case ("Read the docs", "View account details").'),
        el('li', {}, 'Make the label describe the destination — never "Click here" or "Read more".'),
        el('li', {}, 'Front-load the noun: "Account details" beats "Details for this account".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'When to use which type'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Inline — within paragraphs and tables, where the link blends into surrounding text.'),
        el('li', {}, 'Standalone — block-level navigation CTAs (e.g. "View all customers", "Manage payment methods").'),
        el('li', {}, 'Hyperlink — for any URL that opens an external domain. The icon and new-tab behavior come for free.'),
      )));
}

function linkAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Semantics'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Renders as a native <a> with the configured href. Browser handles middle-click, ctrl-click, keyboard, and assistive tech naturally.'),
        el('li', {}, 'Hyperlink type sets target="_blank" rel="noopener noreferrer" by default.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Focus'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, '2px outline at 2px offset on :focus-visible — clearly separable from text.'),
        el('li', {}, 'Disabled links are removed from the tab order and have aria-disabled="true".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Inline and hyperlink links are always underlined so users don\'t rely on color alone.'),
        el('li', {}, 'All states meet WCAG 2.1 AA contrast in light and dark themes.'),
      )));
}

function linkCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<!-- Inline (within paragraph text) -->
<p>
  See the <scout-link href="/docs" type="inline">documentation</scout-link>
  for details.
</p>

<!-- Standalone CTA with trailing icon -->
<scout-link href="/customers" type="standalone">
  <svg slot="icon-trailing">…</svg>
  View all customers
</scout-link>

<!-- External hyperlink -->
<scout-link href="https://heroicons.com" type="hyperlink">
  Hero Icons
</scout-link>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/link @scout/tokens lit\n\nimport '@scout/link';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'href'), el('td', {}, 'string'), el('td', {}, '"#"'), el('td', {}, 'URL.')),
            el('tr', {}, el('td', {}, 'type'), el('td', {}, '"inline" | "standalone" | "hyperlink"'), el('td', {}, '"standalone"'), el('td', {}, 'Visual treatment.')),
            el('tr', {}, el('td', {}, 'size'), el('td', {}, '"default" | "condensed"'), el('td', {}, '"default"'), el('td', {}, 'Density preset (standalone only).')),
            el('tr', {}, el('td', {}, 'disabled'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disables interaction; removes from tab order.')),
            el('tr', {}, el('td', {}, 'target / rel'), el('td', {}, 'string'), el('td', {}, 'auto for hyperlink'), el('td', {}, 'Native anchor attributes; hyperlink type defaults to _blank + noopener.')),
          )))));
}

app.append(componentPage(
  'components-link',
  'Link',
  'Anchor for navigation between files and external pages. Three types — inline (within text), standalone (block CTA), and hyperlink (external).',
  [
    { id: 'preview', label: 'Preview', content: linkPreview() },
    { id: 'controls', label: 'Controls', content: linkControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: linkGuidelines() },
    { id: 'content', label: 'Content', content: linkContent() },
    { id: 'accessibility', label: 'Accessibility', content: linkAccessibility() },
    { id: 'code', label: 'Code', content: linkCode() },
  ],
));

// =================================================================
// Multiselect (real Lit component from @scout/multiselect)
// =================================================================
import '@scout/multiselect';

const MS_TAG_OPTIONS = [
  { value: 'fraud', label: 'Fraud risk' },
  { value: 'high-value', label: 'High value' },
  { value: 'pending-payment', label: 'Pending payment' },
  { value: 'verified', label: 'Identity verified' },
  { value: 'expiring', label: 'Card expiring soon' },
  { value: 'overdue', label: 'Overdue balance' },
  { value: 'auto-pay', label: 'Auto-pay enabled' },
  { value: 'paperless', label: 'Paperless billing' },
  { value: 'closed', label: 'Account closed' },
  { value: 'archived', label: 'Archived' },
];

interface MSOpts {
  label?: string;
  placeholder?: string;
  values?: string[];
  helper?: string;
  error?: string;
  size?: 'default' | 'condensed';
  disabled?: boolean;
  showCounter?: boolean;
  showClearAll?: boolean;
  showSelectAll?: boolean;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
}

function previewMultiselect(opts: MSOpts = {}): HTMLElement {
  const ms = document.createElement('scout-multiselect');
  if (opts.label) ms.setAttribute('label', opts.label);
  if (opts.placeholder) ms.setAttribute('placeholder', opts.placeholder);
  if (opts.values?.length) ms.setAttribute('values', opts.values.join(','));
  if (opts.helper) ms.setAttribute('helper', opts.helper);
  if (opts.error) ms.setAttribute('error', opts.error);
  if (opts.size) ms.setAttribute('size', opts.size);
  if (opts.disabled) ms.setAttribute('disabled', '');
  if (opts.showCounter) ms.setAttribute('show-counter', '');
  if (opts.showClearAll) ms.setAttribute('show-clear-all', '');
  if (opts.showSelectAll === false) ms.removeAttribute('show-select-all');
  for (const o of opts.options ?? MS_TAG_OPTIONS) {
    const opt = document.createElement('scout-multiselect-option');
    opt.setAttribute('value', o.value);
    if (o.disabled) opt.setAttribute('disabled', '');
    opt.textContent = o.label;
    ms.appendChild(opt);
  }
  return ms;
}

function multiselectPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block('Default',
    'Empty multiselect with a placeholder. Click to open the menu, type to filter, click options to select. Selected items appear as removable chips inside the input.',
    previewMultiselect({ label: 'Customer tags', placeholder: 'Select tags…', helper: 'Filter customer list by tag(s)' }),
  );

  block('Filled',
    'When at least one value is selected, chips replace the placeholder. Backspace from an empty input removes the last chip.',
    previewMultiselect({ label: 'Customer tags', values: ['fraud', 'high-value', 'expiring'] }),
  );

  block('With select all + counter + clear all',
    'Set show-select-all (default), show-counter, and show-clear-all to render the menu header utilities. Counter updates live.',
    previewMultiselect({
      label: 'Customer tags',
      values: ['fraud', 'verified'],
      showCounter: true,
      showClearAll: true,
    }),
  );

  block('Sizes',
    'Default for primary forms. Condensed for filter bars and table-row selectors.',
    el('div', { class: 'preview-stack' },
      previewMultiselect({ label: 'Default', size: 'default', values: ['fraud', 'verified'] }),
      previewMultiselect({ label: 'Condensed', size: 'condensed', values: ['fraud', 'verified'] }),
    ),
  );

  block('Error',
    'When error is set, the input border turns red and the message appears below.',
    previewMultiselect({ label: 'Customer tags', error: 'Select at least one tag.' }),
  );

  block('Disabled',
    'Disabled multiselects cannot be opened or interacted with.',
    previewMultiselect({ label: 'Customer tags (disabled)', values: ['fraud'], disabled: true }),
  );

  return wrap;
}

function multiselectControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const labelInput = ctrlText('ms-label', 'Customer tags');
  const placeholderInput = ctrlText('ms-ph', 'Select tags…');
  const helperInput = ctrlText('ms-help', '');
  const errorInput = ctrlText('ms-err', '');
  const sizeSel = ddSelect('ms-size', ['default', 'condensed'] as const);
  const counterChk = ctrlCheck('ms-counter', 'Counter');
  const clearAllChk = ctrlCheck('ms-clear', 'Clear all');
  const selectAllChk = ctrlCheck('ms-selall', 'Select all', { checked: true });
  const disabledChk = ctrlCheck('ms-disabled', 'Disabled');

  function render() {
    stage.replaceChildren(previewMultiselect({
      label: labelInput.value,
      placeholder: placeholderInput.value,
      helper: helperInput.value || undefined,
      error: errorInput.value || undefined,
      size: sizeSel.value as 'default' | 'condensed',
      disabled: disabledChk.checked,
      showCounter: counterChk.checked,
      showClearAll: clearAllChk.checked,
      showSelectAll: selectAllChk.checked,
    }));
    const attrs: string[] = [`label="${labelInput.value}"`, `placeholder="${placeholderInput.value}"`];
    if (helperInput.value) attrs.push(`helper="${helperInput.value}"`);
    if (errorInput.value) attrs.push(`error="${errorInput.value}"`);
    if (sizeSel.value !== 'default') attrs.push(`size="${sizeSel.value}"`);
    if (disabledChk.checked) attrs.push('disabled');
    if (counterChk.checked) attrs.push('show-counter');
    if (clearAllChk.checked) attrs.push('show-clear-all');
    if (!selectAllChk.checked) attrs.push('show-select-all="false"');
    codePre.textContent = `<scout-multiselect ${attrs.join(' ')}>\n  <scout-multiselect-option value="fraud">Fraud risk</scout-multiselect-option>\n  <scout-multiselect-option value="verified">Identity verified</scout-multiselect-option>\n  …\n</scout-multiselect>`;
  }
  for (const c of [labelInput, placeholderInput, helperInput, errorInput, sizeSel, counterChk, clearAllChk, selectAllChk, disabledChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Label', 'ms-label', labelInput),
    ctrlField('Placeholder', 'ms-ph', placeholderInput),
    ctrlField('Helper', 'ms-help', helperInput),
    ctrlField('Error', 'ms-err', errorInput),
    ctrlField('Size', 'ms-size', sizeSel),
    el('div', { class: 'ctrl-checks' },
      selectAllChk,
      counterChk,
      clearAllChk,
      disabledChk,
    ),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function multiselectGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Patterns that match user expectations for selecting multiple values.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewMultiselect({ label: 'Tags', values: ['fraud', 'verified'], showCounter: true, showClearAll: true }),
          'Show the counter and clear-all when option lists are long (10+ items). They give users a quick read of selection state.'),
        doCard(previewMultiselect({ label: 'Tags', placeholder: 'Search tags…' }),
          'Always allow typing to filter when option lists exceed 8 items. The searchable input makes long lists scannable.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Patterns that frustrate users.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewMultiselect({ label: 'Active', options: [{ value: 'y', label: 'Yes' }, { value: 'n', label: 'No' }] }),
          "Don't use a multiselect for mutually exclusive choices. Use a Checkbox group or Radio buttons."),
        dontCard(previewMultiselect({ label: 'All 200 customers', placeholder: 'Search…' }),
          "Don't use a multiselect for thousands of options. Switch to a dedicated typeahead/picker pattern with debounced server search."),
      )));
}

function multiselectContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use sentence case ("Customer tags", "Filter by status").'),
        el('li', {}, 'Plural noun for what the user selects: "Tags", "Owners", "Statuses".'),
        el('li', {}, 'Always provide a label, even when a placeholder is set. Placeholders disappear once chips appear.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Placeholder'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Action-oriented: "Select tags…", "Search statuses…", "Choose owners…".'),
        el('li', {}, 'End with an ellipsis to signal more options exist than visible.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Helper / error messages'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Helper: explain what filtering does or list constraints ("Filter customer list by tag(s)").'),
        el('li', {}, 'Error: name what\'s wrong and how to fix it ("Select at least one tag").'),
      )));
}

function multiselectAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & semantics'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Trigger uses aria-haspopup="listbox" + aria-expanded reflecting open state.'),
        el('li', {}, 'Menu uses role="listbox" + aria-multiselectable="true".'),
        el('li', {}, 'Each option uses role="option" with aria-selected reflecting current selection.'),
        el('li', {}, 'Chip remove buttons have aria-label that names what\'s being removed ("Remove Fraud risk").'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Tab focuses the input. Arrow Down opens the menu and navigates options.'),
        el('li', {}, 'Enter toggles the active option.'),
        el('li', {}, 'Escape closes the menu and clears the search query.'),
        el('li', {}, 'Backspace from an empty input removes the last chip — keyboard-only users can deselect without reaching for the X.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Form association'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Uses ElementInternals; selected values submit as repeated FormData entries with the configured name attribute.'),
      )));
}

function multiselectCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-multiselect
  label="Customer tags"
  placeholder="Select tags…"
  helper="Filter customer list by tag(s)"
  show-counter
  show-clear-all
  name="tags"
>
  <scout-multiselect-option value="fraud">Fraud risk</scout-multiselect-option>
  <scout-multiselect-option value="high-value">High value</scout-multiselect-option>
  <scout-multiselect-option value="verified">Identity verified</scout-multiselect-option>
  <scout-multiselect-option value="expiring">Card expiring soon</scout-multiselect-option>
</scout-multiselect>

<!-- Set selected values via JS -->
<script>
  document.querySelector('scout-multiselect').values = ['fraud', 'verified'];
  document.querySelector('scout-multiselect')
    .addEventListener('scout-multiselect-change', (e) => console.log(e.detail.values));
</script>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/multiselect @scout/tokens lit\n\nimport '@scout/multiselect';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'label'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Field label.')),
            el('tr', {}, el('td', {}, 'placeholder'), el('td', {}, 'string'), el('td', {}, '"Select…"'), el('td', {}, 'Empty-state placeholder text.')),
            el('tr', {}, el('td', {}, 'values'), el('td', {}, 'string[] (or comma-separated attr)'), el('td', {}, '[]'), el('td', {}, 'Currently-selected values.')),
            el('tr', {}, el('td', {}, 'helper'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Helper text rendered below.')),
            el('tr', {}, el('td', {}, 'error'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Error message; sets invalid state.')),
            el('tr', {}, el('td', {}, 'size'), el('td', {}, '"default" | "condensed"'), el('td', {}, '"default"'), el('td', {}, 'Density preset.')),
            el('tr', {}, el('td', {}, 'show-select-all'), el('td', {}, 'boolean'), el('td', {}, 'true'), el('td', {}, 'Render the Select all toggle in the menu header.')),
            el('tr', {}, el('td', {}, 'show-counter'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Render "{n} of {total}" counter in menu header.')),
            el('tr', {}, el('td', {}, 'show-clear-all'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Render Clear all button in menu header.')),
            el('tr', {}, el('td', {}, 'disabled'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disables interaction.')),
            el('tr', {}, el('td', {}, 'name'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Form name (ElementInternals).')),
          )))));
}

app.append(componentPage(
  'components-multiselect',
  'Multiselect',
  'Select multiple options from a dropdown list. Searchable, with chips for selected values, optional select-all, counter, and clear-all.',
  [
    { id: 'preview', label: 'Preview', content: multiselectPreview() },
    { id: 'controls', label: 'Controls', content: multiselectControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: multiselectGuidelines() },
    { id: 'content', label: 'Content', content: multiselectContent() },
    { id: 'accessibility', label: 'Accessibility', content: multiselectAccessibility() },
    { id: 'code', label: 'Code', content: multiselectCode() },
  ],
));

// =================================================================
// Notification badge (real Lit component from @scout/notification-badge)
// =================================================================
import '@scout/notification-badge';

type NBSize = 'xx-small' | 'x-small' | 'small' | 'medium';

function previewNotificationBadge(opts: { size?: NBSize; count?: string } = {}): HTMLElement {
  const { size = 'medium', count } = opts;
  const b = document.createElement('scout-notification-badge');
  b.setAttribute('size', size);
  if (count !== undefined) b.textContent = count;
  return b;
}

function notificationBadgePreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, ...children: HTMLElement[]) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row' }, ...children),
    ));
  };

  // Helper that renders a labeled cell so sizes are easy to compare
  const cell = (label: string, ...children: HTMLElement[]) =>
    el('div', { class: 'control-cell' },
      el('div', { class: 'control-cell__stage' }, ...children),
      el('span', { class: 'control-cell__label' }, label),
    );

  block(
    'Sizes',
    'XX-Small and X-Small are dot-only (no number). Small and Medium can show 1–2 digit numbers.',
    cell('XX-Small (6px)', previewNotificationBadge({ size: 'xx-small' })),
    cell('X-Small (8px)', previewNotificationBadge({ size: 'x-small' })),
    cell('Small (16px)', previewNotificationBadge({ size: 'small', count: '3' })),
    cell('Medium (20px)', previewNotificationBadge({ size: 'medium', count: '12' })),
  );

  block(
    'Numbers',
    'Single digit, two digits, and "99+" for overflow. The badge auto-widens to accommodate the content.',
    cell('1', previewNotificationBadge({ size: 'medium', count: '1' })),
    cell('12', previewNotificationBadge({ size: 'medium', count: '12' })),
    cell('99+', previewNotificationBadge({ size: 'medium', count: '99+' })),
  );

  // Show in context: paired with a button + avatar
  const btnWithBadge = (() => {
    const wrap = el('div', { style: 'position: relative; display: inline-block;' });
    const btn = document.createElement('scout-button');
    btn.setAttribute('variant', 'secondary');
    btn.textContent = 'Inbox';
    wrap.appendChild(btn);
    const badge = previewNotificationBadge({ size: 'small', count: '3' });
    badge.setAttribute('style', 'position: absolute; top: -6px; right: -6px;');
    wrap.appendChild(badge);
    return wrap;
  })();

  const avatarWithBadge = (() => {
    const a = document.createElement('scout-avatar');
    a.setAttribute('initials', 'HM');
    a.setAttribute('size', 'large');
    a.setAttribute('color', 'blue');
    a.setAttribute('notification', '');
    return a;
  })();

  block(
    'In context',
    'Composes naturally inside other components — avatars, buttons, icons. The avatar component below already uses the notification badge internally.',
    cell('On a button', btnWithBadge),
    cell('On an avatar', avatarWithBadge),
  );

  return wrap;
}

function notificationBadgeControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const sizeSel = ddSelect('nb-size', ['xx-small', 'x-small', 'small', 'medium'] as const);
  sizeSel.value = 'medium';
  const countInput = ctrlText('nb-count', '3');

  // The Number field only applies to the count variants (small / medium).
  // Dot variants (xx-small / x-small) ignore the value, so disable the
  // field when one of those is active.
  const countField = ctrlField('Number (small/medium only)', 'nb-count', countInput);

  function render() {
    const size = sizeSel.value as NBSize;
    const isCountSize = size === 'small' || size === 'medium';
    setFieldDisabled(countField, countInput, !isCountSize);

    const count = isCountSize ? countInput.value : '';
    stage.replaceChildren(previewNotificationBadge({ size, count: count || undefined }));
    const slot = isCountSize && count ? count : '';
    codePre.textContent = `<scout-notification-badge size="${size}">${slot}</scout-notification-badge>`;
  }
  for (const c of [sizeSel, countInput]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Size', 'nb-size', sizeSel),
    countField,
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function notificationBadgeGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Patterns that draw attention proportionally.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewNotificationBadge({ size: 'medium', count: '99+' }),
          'Use "99+" for overflow when the actual count exceeds two digits. Don\'t let the badge stretch wider than its host.'),
        doCard(previewNotificationBadge({ size: 'xx-small' }),
          'Use the dot variants (XX-small, X-small) when the user only needs to know there\'s activity, not the exact count.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Patterns that overwhelm or mislead.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewNotificationBadge({ size: 'medium', count: '1241' }),
          "Don't let unbounded numbers run. Always cap at \"99+\" so badges have a predictable max width."),
        dontCard(previewNotificationBadge({ size: 'medium', count: '0' }),
          "Don't render a badge with zero count. Hide the badge entirely when there's nothing to notify about."),
      )));
}

function notificationBadgeContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Numbers'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Show exact counts up to 99. Use "99+" for anything higher.'),
        el('li', {}, "Don't render with 0 — remove the badge instead."),
        el('li', {}, "Don't combine number with letters or words. The badge is for at-a-glance scanning."),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Sizes'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'XX-Small / X-Small — dot only. Use on avatars, top-bar icons, low-emphasis surfaces.'),
        el('li', {}, 'Small — number badge for table rows, list items.'),
        el('li', {}, 'Medium — number badge for primary nav, prominent counts.'),
      )));
}

function notificationBadgeAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The badge uses role="status" with aria-label="Notification" so assistive tech announces it.'),
        el('li', {}, 'When wrapping a button or avatar, the parent should describe the notification context (e.g. aria-label="Inbox, 3 unread").'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & contrast'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'White number on red.500 base meets WCAG 2.1 AA contrast.'),
        el('li', {}, 'The "stroke" border defaults to the page background, giving a clean punched-out edge over any surface.'),
        el('li', {}, 'Override the stroke per-instance via the --cnx-notification-stroke-color custom property when nesting on a non-page surface.'),
      )));
}

function notificationBadgeCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<!-- Dot only -->
<scout-notification-badge size="x-small"></scout-notification-badge>

<!-- Numbered -->
<scout-notification-badge size="medium">12</scout-notification-badge>

<!-- Overflow -->
<scout-notification-badge size="medium">99+</scout-notification-badge>

<!-- Inside another component (manual placement) -->
<div style="position: relative;">
  <scout-button>Inbox</scout-button>
  <scout-notification-badge
    size="small"
    style="position: absolute; top: -6px; right: -6px;"
  >3</scout-notification-badge>
</div>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/notification-badge @scout/tokens lit\n\nimport '@scout/notification-badge';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Custom properties'),
      el('p', { class: 'preview-block__lede' }, 'Override per-instance:'),
      el('pre', { class: 'code-block' },
        `scout-notification-badge {
  --cnx-notification-stroke-color: var(--scout-color-cool-gray-100);
}`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'size'), el('td', {}, '"xx-small" | "x-small" | "small" | "medium"'), el('td', {}, '"medium"'), el('td', {}, 'Badge size. xx-small/x-small are dot-only.')),
          )))));
}

app.append(componentPage(
  'components-notification-badge',
  'Notification badge',
  'Small indicator that signals new activity. Used to draw attention without interrupting the user\'s workflow. Composes inside avatars, icons, and buttons.',
  [
    { id: 'preview', label: 'Preview', content: notificationBadgePreview() },
    { id: 'controls', label: 'Controls', content: notificationBadgeControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: notificationBadgeGuidelines() },
    { id: 'content', label: 'Content', content: notificationBadgeContent() },
    { id: 'accessibility', label: 'Accessibility', content: notificationBadgeAccessibility() },
    { id: 'code', label: 'Code', content: notificationBadgeCode() },
  ],
));

// =================================================================
// Overlay + Dialog + Disclosure dialog (real Lit from @scout/overlay + @scout/dialog)
// =================================================================
import '@scout/overlay';
import '@scout/dialog';

// --- Overlay docs page ---

function previewOverlayDemo(): HTMLElement {
  const wrap = el('div', { style: 'position: relative; height: 200px; border: 1px dashed var(--scout-border-secondary); border-radius: 8px; overflow: hidden; padding: 16px;' });
  wrap.append(el('p', { style: 'margin: 0 0 12px; font-size: 14px;' }, 'Sample content. Click the button to render the overlay over this surface.'));
  const trigger = document.createElement('scout-button');
  trigger.setAttribute('variant', 'secondary');
  trigger.setAttribute('size', 'condensed');
  trigger.textContent = 'Show overlay (3s)';
  const overlay = document.createElement('scout-overlay');
  overlay.setAttribute('style', 'position: absolute;');
  trigger.addEventListener('click', () => {
    overlay.setAttribute('open', '');
    setTimeout(() => overlay.removeAttribute('open'), 3000);
  });
  overlay.addEventListener('scout-overlay-click', () => overlay.removeAttribute('open'));
  wrap.append(trigger, overlay);
  return wrap;
}

function overlayPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  wrap.append(el('div', { class: 'preview-block' },
    el('h3', { class: 'preview-block__title' }, 'Default'),
    el('p', { class: 'preview-block__lede' }, 'A semi-transparent scrim. The overlay covers its parent (or the viewport when fixed-positioned) and dims everything behind. Click triggers a `scout-overlay-click` event so the parent can close the dialog.'),
    el('div', { class: 'preview-row preview-row--block' }, previewOverlayDemo()),
  ));
  return wrap;
}

function overlayCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-overlay open></scout-overlay>

<!-- Listen for click to dismiss -->
<script>
  document.querySelector('scout-overlay')
    .addEventListener('scout-overlay-click', (e) => {
      e.target.removeAttribute('open');
    });
</script>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/overlay @scout/tokens lit\n\nimport '@scout/overlay';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Notes'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Used internally by Dialog, Disclosure dialog, and (future) Drawer. Most consumers don\'t use Overlay directly — Dialog renders one for you.'),
        el('li', {}, 'Renders at z-index 1000 (token z-index.overlay). Dialog renders at 2000 (z-index.modal), so the overlay always sits beneath.'),
        el('li', {}, 'Background color uses the `background.scrim` semantic token, which themes correctly across light/dark.'),
      )));
}

app.append(componentPage(
  'components-overlay',
  'Overlay',
  'Semi-transparent scrim that dims content beneath a dialog or drawer. Composed automatically by Dialog and Disclosure dialog.',
  [
    { id: 'preview', label: 'Preview', content: overlayPreview() },
    { id: 'code', label: 'Code', content: overlayCode() },
  ],
));

// --- Dialog docs page ---

interface DialogOpts {
  title?: string;
  body?: string;
  size?: 'small' | 'medium' | 'large';
  closable?: boolean;
  alert?: { status: 'informational' | 'favorable' | 'warning' | 'critical'; message: string };
  primaryLabel?: string;
  primaryVariant?: 'primary' | 'critical' | 'action';
  secondaryLabel?: string;
}

function previewDialogDemo(opts: DialogOpts = {}): HTMLElement {
  const {
    title = 'Confirm deletion',
    body = 'Are you sure you want to delete this account? This cannot be undone.',
    size = 'medium',
    closable = true,
    alert,
    primaryLabel = 'Delete account',
    primaryVariant = 'critical',
    secondaryLabel = 'Cancel',
  } = opts;

  const wrap = el('div', { style: 'min-height: 60px;' });
  const trigger = document.createElement('scout-button');
  trigger.setAttribute('variant', 'secondary');
  trigger.textContent = `Open dialog (${size})`;
  wrap.append(trigger);

  trigger.addEventListener('click', () => {
    const dialog = document.createElement('scout-dialog');
    dialog.setAttribute('open', '');
    dialog.setAttribute('size', size);
    if (!closable) dialog.removeAttribute('closable');

    const titleEl = document.createElement('span');
    titleEl.setAttribute('slot', 'title');
    titleEl.textContent = title;
    dialog.append(titleEl);

    if (alert) {
      const al = document.createElement('scout-inline-alert');
      al.setAttribute('slot', 'alert');
      al.setAttribute('status', alert.status);
      al.textContent = alert.message;
      dialog.append(al);
    }

    const bodyEl = document.createElement('p');
    bodyEl.style.margin = '0';
    bodyEl.textContent = body;
    dialog.append(bodyEl);

    const close = () => dialog.remove();
    dialog.addEventListener('scout-dialog-close', close);

    if (secondaryLabel) {
      const sec = document.createElement('scout-button');
      sec.setAttribute('slot', 'actions');
      sec.setAttribute('variant', 'secondary');
      sec.textContent = secondaryLabel;
      sec.addEventListener('click', close);
      dialog.append(sec);
    }
    if (primaryLabel) {
      const pri = document.createElement('scout-button');
      pri.setAttribute('slot', 'actions');
      pri.setAttribute('variant', primaryVariant);
      pri.textContent = primaryLabel;
      pri.addEventListener('click', close);
      dialog.append(pri);
    }

    document.body.appendChild(dialog);
  });

  return wrap;
}

function dialogPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, ...children: HTMLElement[]) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row' }, ...children),
    ));
  };

  block('Confirmation dialog',
    'A standard dialog for confirming a destructive action. Click outside the panel or press Escape to dismiss.',
    previewDialogDemo({
      title: 'Confirm deletion',
      body: 'Are you sure you want to delete this account? This cannot be undone.',
      primaryLabel: 'Delete account',
      primaryVariant: 'critical',
    }),
  );

  block('With inline alert',
    'Use the alert slot to surface critical state context inside the dialog.',
    previewDialogDemo({
      title: 'Cancel subscription',
      body: 'Cancelling now ends auto-pay and the customer will lose access at the end of the current billing period.',
      alert: { status: 'warning', message: 'This change is effective immediately.' },
      primaryLabel: 'Cancel subscription',
      primaryVariant: 'critical',
    }),
  );

  block('Sizes',
    'Small for tight confirmations. Medium for typical content (default). Large for forms and longer flows.',
    previewDialogDemo({ size: 'small', title: 'Reset filters?', body: 'Clears all currently applied filters.', primaryLabel: 'Reset', primaryVariant: 'primary' }),
    previewDialogDemo({ size: 'medium' }),
    previewDialogDemo({ size: 'large', title: 'Edit account details', body: 'A larger dialog suits forms with multiple fields, longer body copy, or guided multi-step flows.', primaryLabel: 'Save', primaryVariant: 'primary' }),
  );

  return wrap;
}

function dialogCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-dialog open size="medium">
  <span slot="title">Confirm deletion</span>

  <scout-inline-alert slot="alert" status="warning">
    This action cannot be undone.
  </scout-inline-alert>

  <p>Are you sure you want to delete this account?</p>

  <scout-button slot="actions" variant="secondary">Cancel</scout-button>
  <scout-button slot="actions" variant="critical">Delete account</scout-button>
</scout-dialog>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/dialog @scout/tokens lit\n\nimport '@scout/dialog';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'open'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'When set, the dialog renders.')),
            el('tr', {}, el('td', {}, 'size'), el('td', {}, '"small" | "medium" | "large"'), el('td', {}, '"medium"'), el('td', {}, 'Width preset.')),
            el('tr', {}, el('td', {}, 'closable'), el('td', {}, 'boolean'), el('td', {}, 'true'), el('td', {}, 'Show X close button + allow Escape / scrim-click dismiss.')),
          )))));
}

app.append(componentPage(
  'components-dialog',
  'Dialog',
  'Modal surface that disables the page behind it. Use for confirmations, simple flows, important actions, and timeout warnings.',
  [
    { id: 'preview', label: 'Preview', content: dialogPreview() },
    { id: 'code', label: 'Code', content: dialogCode() },
  ],
));

// --- Disclosure dialog docs page ---

function previewDisclosureDemo(opts: { type?: 'simple' | 'automated'; languages?: string; requireCheckbox?: boolean } = {}): HTMLElement {
  const { type = 'simple', languages = 'en,es', requireCheckbox = false } = opts;
  const wrap = el('div', { style: 'min-height: 60px;' });
  const trigger = document.createElement('scout-button');
  trigger.setAttribute('variant', 'secondary');
  trigger.textContent = `Open ${type} disclosure`;
  wrap.append(trigger);

  trigger.addEventListener('click', () => {
    const dlg = document.createElement('scout-disclosure-dialog');
    dlg.setAttribute('open', '');
    dlg.setAttribute('type', type);
    dlg.setAttribute('languages', languages);
    dlg.setAttribute('language', languages.split(',')[0]!);
    if (requireCheckbox) dlg.setAttribute('require-checkbox', '');

    const title = document.createElement('span');
    title.setAttribute('slot', 'title');
    title.textContent = 'Identity verification disclosure';
    dlg.append(title);

    const subtitle = document.createElement('span');
    subtitle.setAttribute('slot', 'subtitle');
    subtitle.textContent = 'Read aloud verbatim before continuing';
    dlg.append(subtitle);

    const en = document.createElement('div');
    en.setAttribute('data-language', 'en');
    en.innerHTML = '<p style="margin:0 0 8px">By proceeding, the customer consents to identity verification using their date of birth, last four digits of their SSN, and current address.</p><p style="margin:0">This information will be used solely to confirm identity and will not be shared with third parties.</p>';
    dlg.append(en);

    const es = document.createElement('div');
    es.setAttribute('data-language', 'es');
    es.innerHTML = '<p style="margin:0 0 8px">Al proceder, el cliente consiente la verificación de identidad utilizando su fecha de nacimiento, los últimos cuatro dígitos de su SSN y dirección actual.</p><p style="margin:0">Esta información se usará únicamente para confirmar la identidad y no se compartirá con terceros.</p>';
    dlg.append(es);

    if (requireCheckbox) {
      const ack = document.createElement('span');
      ack.setAttribute('slot', 'acknowledgement');
      ack.textContent = 'I confirm the customer has been read this disclosure verbatim.';
      dlg.append(ack);
    }

    const close = () => dlg.remove();
    dlg.addEventListener('scout-disclosure-close', close);

    const cancel = document.createElement('scout-button');
    cancel.setAttribute('slot', 'actions');
    cancel.setAttribute('variant', 'secondary');
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', close);
    dlg.append(cancel);

    const confirm = document.createElement('scout-button');
    confirm.setAttribute('slot', 'actions');
    confirm.setAttribute('variant', 'primary');
    confirm.textContent = 'Confirm';
    confirm.addEventListener('click', close);
    dlg.append(confirm);

    document.body.appendChild(dlg);
  });

  return wrap;
}

function disclosurePreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, ...children: HTMLElement[]) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row' }, ...children),
    ));
  };

  block('Simple disclosure',
    'Title, optional subtitle, language tabs, body content per language, action buttons. Use for any compliance disclosure the agent reads aloud.',
    previewDisclosureDemo({ type: 'simple', languages: 'en,es' }),
  );

  block('Automated disclosure',
    'Renders a banner reminding the agent that the system is reading the disclosure aloud — used in flows where the system narrates over the phone line.',
    previewDisclosureDemo({ type: 'automated', languages: 'en,es,fr' }),
  );

  block('With acknowledgement checkbox',
    'When require-checkbox is set, the primary action stays disabled until the agent toggles the acknowledgement checkbox.',
    previewDisclosureDemo({ type: 'simple', languages: 'en,es', requireCheckbox: true }),
  );

  return wrap;
}

function disclosureCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-disclosure-dialog
  open
  type="simple"
  languages="en,es,fr"
  language="en"
  require-checkbox
>
  <span slot="title">Identity verification disclosure</span>
  <span slot="subtitle">Read aloud verbatim</span>

  <div data-language="en">
    <p>By proceeding, the customer consents to…</p>
  </div>
  <div data-language="es">
    <p>Al proceder, el cliente consiente…</p>
  </div>
  <div data-language="fr">
    <p>En procédant, le client consent…</p>
  </div>

  <span slot="acknowledgement">
    I confirm the customer has been read this disclosure verbatim.
  </span>

  <scout-button slot="actions" variant="secondary">Cancel</scout-button>
  <scout-button slot="actions" variant="primary">Confirm</scout-button>
</scout-disclosure-dialog>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/dialog @scout/tokens lit\n\nimport '@scout/dialog';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'open'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Renders the disclosure.')),
            el('tr', {}, el('td', {}, 'type'), el('td', {}, '"simple" | "automated"'), el('td', {}, '"simple"'), el('td', {}, 'Automated shows a banner reminding agent the system reads the disclosure.')),
            el('tr', {}, el('td', {}, 'languages'), el('td', {}, 'string'), el('td', {}, '"en"'), el('td', {}, 'Comma-separated language codes (e.g. "en,es,fr").')),
            el('tr', {}, el('td', {}, 'language'), el('td', {}, 'string'), el('td', {}, '"en"'), el('td', {}, 'Currently displayed language.')),
            el('tr', {}, el('td', {}, 'closable'), el('td', {}, 'boolean'), el('td', {}, 'true'), el('td', {}, 'Show X close button + Escape dismiss.')),
            el('tr', {}, el('td', {}, 'require-checkbox'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disables primary action until acknowledged is true.')),
            el('tr', {}, el('td', {}, 'acknowledged'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Acknowledgement checkbox state.')),
          )))));
}

app.append(componentPage(
  'components-disclosure-dialog',
  'Disclosure dialog',
  'Specialized modal that forces agents to read legal/compliance content verbatim before continuing. Adds language tabs, optional acknowledgement, and Simple vs. Automated types.',
  [
    { id: 'preview', label: 'Preview', content: disclosurePreview() },
    { id: 'code', label: 'Code', content: disclosureCode() },
  ],
));

// =================================================================
// Snackbar (real Lit component from @scout/snackbar)
// =================================================================
import '@scout/snackbar';

type SBStatus = 'success' | 'warning' | 'critical';

function previewSnackbar(opts: { status?: SBStatus; description?: string; duration?: number } = {}): HTMLElement {
  const { status = 'success', description = 'Account created.', duration = 0 } = opts;
  const sb = document.createElement('scout-snackbar');
  sb.setAttribute('status', status);
  sb.setAttribute('duration', String(duration));
  sb.textContent = description;
  return sb;
}

function snackbarPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };
  block(
    'Statuses',
    'Use success for completed actions, warning for non-blocking issues that completed anyway, critical for failed actions.',
    el('div', { class: 'preview-stack' },
      previewSnackbar({ status: 'success', description: 'Account created successfully.' }),
      previewSnackbar({ status: 'warning', description: 'Saved with warnings — review address fields.' }),
      previewSnackbar({ status: 'critical', description: 'Could not save — connection lost.' }),
    ),
  );
  block(
    'Auto-dismiss',
    'Snackbars auto-dismiss after `duration` ms. Default is 4000. Set duration="0" to disable. Click the button to trigger a real auto-dismissing snackbar.',
    el('div', { class: 'preview-stack' },
      (() => {
        const trigger = document.createElement('scout-button');
        trigger.setAttribute('variant', 'secondary');
        trigger.textContent = 'Trigger snackbar (4s)';
        const stage = el('div', { style: 'min-height: 60px;' });
        trigger.addEventListener('click', () => {
          const sb = previewSnackbar({ status: 'success', description: 'Triggered! Auto-dismissing in 4 seconds…', duration: 4000 });
          stage.appendChild(sb);
        });
        return el('div', {}, trigger, stage);
      })(),
    ),
  );
  return wrap;
}

function snackbarControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const statusSel = ddSelect('sb-status', ['success', 'warning', 'critical'] as const);
  const descInput = ctrlText('sb-desc', 'Account created.');
  const durationInput = ctrlText('sb-duration', '0', { type: 'number' });

  function render() {
    stage.replaceChildren(previewSnackbar({
      status: statusSel.value as SBStatus,
      description: descInput.value,
      duration: Number(durationInput.value) || 0,
    }));
    const attrs: string[] = [];
    if (statusSel.value !== 'success') attrs.push(`status="${statusSel.value}"`);
    if (Number(durationInput.value) !== 4000) attrs.push(`duration="${Number(durationInput.value) || 0}"`);
    codePre.textContent = `<scout-snackbar${attrs.length ? ' ' + attrs.join(' ') : ''}>\n  ${descInput.value}\n</scout-snackbar>`;
  }
  for (const c of [statusSel, descInput, durationInput]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Status', 'sb-status', statusSel),
    ctrlField('Description', 'sb-desc', descInput),
    ctrlField('Duration (ms, 0 = no auto-dismiss)', 'sb-duration', durationInput),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function snackbarGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Use snackbars for transient confirmation that doesn\'t block the user.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewSnackbar({ status: 'success', description: 'Payment of $124.50 applied.' }),
          'Confirm successful actions briefly so the user knows it worked, then get out of the way.'),
        doCard(previewSnackbar({ status: 'critical', description: 'Could not save — retrying…' }),
          'Use critical for transient failures the system is auto-retrying. For blocking errors, use an Inline alert instead.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Snackbars are for transient feedback only.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewSnackbar({ status: 'critical', description: 'Account permanently deleted. This cannot be undone.' }),
          "Don't use snackbars for irreversible or critical actions. The user might miss the auto-dismiss. Use a confirmation dialog or inline alert."),
        dontCard(previewSnackbar({ status: 'success', description: 'Welcome to Ember! Here are 5 tips to get started…' }),
          "Don't put long content in snackbars. Keep it under one short sentence. Use Inline alert for anything longer."),
      )));
}

function snackbarContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Description'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Keep descriptions under one short sentence — they auto-dismiss in seconds.'),
        el('li', {}, 'Lead with the verb that just happened: "Saved", "Sent", "Updated".'),
        el('li', {}, 'For failures, name the failure and what\'s happening next: "Could not save — retrying…".'),
      )));
}

function snackbarAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & live regions'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Snackbars use role="status" and aria-live="polite" so screen readers announce the message without interrupting.'),
        el('li', {}, 'Status is conveyed by both color AND a status icon — color is never the only signal.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Auto-dismiss & motion'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Default duration is 4000ms. Increase for longer messages; 0 disables auto-dismiss for cases when the user should explicitly dismiss.'),
        el('li', {}, 'Use a parent stack/portal to manage multiple snackbars; this component is responsible for one message.'),
      )));
}

function snackbarCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-snackbar status="success" duration="4000">
  Account created successfully.
</scout-snackbar>

// Programmatic
const sb = document.createElement('scout-snackbar');
sb.status = 'critical';
sb.duration = 0;
sb.textContent = 'Save failed — try again.';
document.body.appendChild(sb);`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/snackbar @scout/tokens lit\n\nimport '@scout/snackbar';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'status'), el('td', {}, '"success" | "warning" | "critical"'), el('td', {}, '"success"'), el('td', {}, 'Status of the message.')),
            el('tr', {}, el('td', {}, 'duration'), el('td', {}, 'number'), el('td', {}, '4000'), el('td', {}, 'Auto-dismiss in ms; 0 disables.')),
          )))));
}

app.append(componentPage(
  'components-snackbar',
  'Snackbar',
  'Temporary, low-impact toast notification confirming an action the application has performed. Auto-dismisses by default.',
  [
    { id: 'preview', label: 'Preview', content: snackbarPreview() },
    { id: 'controls', label: 'Controls', content: snackbarControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: snackbarGuidelines() },
    { id: 'content', label: 'Content', content: snackbarContent() },
    { id: 'accessibility', label: 'Accessibility', content: snackbarAccessibility() },
    { id: 'code', label: 'Code', content: snackbarCode() },
  ],
));

// =================================================================
// Status dot (real Lit component from @scout/status-dot)
// =================================================================
import '@scout/status-dot';
import type { StatusDotType, StatusDotSize } from '@scout/status-dot';

interface SDotOpts {
  type?: StatusDotType;
  size?: StatusDotSize;
  label?: string;
}

function previewStatusDot(opts: SDotOpts = {}): HTMLElement {
  const d = document.createElement('scout-status-dot');
  if (opts.type) d.setAttribute('type', opts.type);
  if (opts.size) d.setAttribute('size', opts.size);
  d.appendChild(document.createTextNode(opts.label ?? 'Status'));
  return d;
}

function statusDotPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Statuses',
    'Five semantic status colors. The dot is the signal; the text is the label.',
    el('div', { class: 'preview-stack' },
      previewStatusDot({ type: 'informational', label: 'New activity' }),
      previewStatusDot({ type: 'neutral',       label: 'Inactive' }),
      previewStatusDot({ type: 'success',       label: 'Active' }),
      previewStatusDot({ type: 'warning',       label: 'Pending review' }),
      previewStatusDot({ type: 'critical',      label: 'Past due' }),
    ),
  );

  block(
    'Sizes',
    'Default for primary surfaces (cards, account headers). Condensed for table rows and dense lists where vertical space is constrained.',
    el('div', { class: 'preview-stack' },
      previewStatusDot({ type: 'success', label: 'Active', size: 'default' }),
      previewStatusDot({ type: 'success', label: 'Active', size: 'condensed' }),
    ),
  );

  // Realistic in-context demo — a small "table row" sample using only divs +
  // status dots so the reader can see how it sits in real layouts.
  block(
    'In a table row',
    'Status dot is at home in dense data tables, lined up to the left of the row label. Use the condensed size to keep the row height tight.',
    (() => {
      const tableLike = el('div', { class: 'sd-rows' });
      const rows: Array<[string, StatusDotType, string]> = [
        ['Acct ····2204', 'success',  'Active'],
        ['Acct ····0099', 'warning',  'Pending review'],
        ['Acct ····4429', 'critical', 'Past due'],
        ['Acct ····7831', 'neutral',  'Closed'],
      ];
      for (const [acct, type, label] of rows) {
        tableLike.append(
          el('div', { class: 'sd-row' },
            el('span', { class: 'sd-row__acct' }, acct),
            previewStatusDot({ type, label, size: 'condensed' }),
          ),
        );
      }
      return tableLike;
    })(),
  );

  return wrap;
}

function statusDotControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const typeSel = ddSelect('sdot-type', ['informational', 'neutral', 'success', 'warning', 'critical']);
  const sizeSel = ddSelect('sdot-size', ['default', 'condensed']);
  const labelInput = ctrlText('sdot-label', 'Active');

  function render() {
    stage.replaceChildren(previewStatusDot({
      type: typeSel.value as StatusDotType,
      size: sizeSel.value as StatusDotSize,
      label: labelInput.value || 'Status',
    }));
    const attrs: string[] = [`type="${typeSel.value}"`];
    if (sizeSel.value !== 'default') attrs.push(`size="${sizeSel.value}"`);
    codePre.textContent = `<scout-status-dot ${attrs.join(' ')}>${labelInput.value || 'Status'}</scout-status-dot>`;
  }
  for (const c of [typeSel, sizeSel, labelInput]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Status', 'sdot-type', typeSel),
    ctrlField('Size', 'sdot-size', sizeSel),
    ctrlField('Label', 'sdot-label', labelInput),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function statusDotGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Use status dot only to communicate status — the live state of an entity (active, pending, blocked).'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewStatusDot({ type: 'success', label: 'Active' }),
          'Use it next to an entity name (account, customer, ticket) to communicate its current state.'),
        doCard(previewStatusDot({ type: 'critical', label: 'Past due', size: 'condensed' }),
          'Use the condensed size in dense data-table rows. Pair with a brief, clear label.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Status dot is not for general categories, callouts, or decoration.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewStatusDot({ type: 'informational', label: 'Premium' }),
          "Don't use status dot for category labels (\"Premium\", \"Beta\", \"AI\"). Use a badge instead — those are categories, not statuses."),
        dontCard(previewStatusDot({ type: 'success', label: 'New' }),
          "Don't use status dot for callouts or attention-getters. Reach for a badge with the appropriate type — `informational` low-emphasis is the conventional \"New\" affordance."),
      )));
}

function statusDotContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Label copy'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use a short, recognizable status: "Active", "Pending review", "Past due", "Closed".'),
        el('li', {}, 'Sentence case. Avoid trailing punctuation.'),
        el('li', {}, 'Match the label to the dot color: green = positive state, yellow = needs attention, red = blocking, blue = informational, gray = inactive.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'When to use which color'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Success — healthy, completed, verified state.'),
        el('li', {}, 'Warning — in-progress or needs attention; not an error.'),
        el('li', {}, 'Critical — error, blocked, or destructive state.'),
        el('li', {}, 'Informational — informative, neutral notification of state.'),
        el('li', {}, 'Neutral — inactive, archived, closed.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Status dot vs. badge'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Status dot — communicates state of an entity.'),
        el('li', {}, 'Badge — communicates a category, count, or flag (Premium, Beta, New, 12 unread).'),
      )));
}

function statusDotAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & redundancy'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Status is communicated by both color (the dot) AND a text label — never relying on color alone.'),
        el('li', {}, 'The dot is rendered with aria-hidden="true"; the label is the accessible name. Screen-reader users hear the status word, not "circle".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Contrast'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Dot fills (green.600, yellow.600, red.600, etc.) meet WCAG 1.4.11 non-text contrast against surface and page tokens.'),
        el('li', {}, 'Label color is the standard text-display-primary token, which meets AA against all surface backgrounds.'),
      )));
}

function statusDotCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-status-dot type="success">Active</scout-status-dot>
<scout-status-dot type="warning">Pending review</scout-status-dot>
<scout-status-dot type="critical">Past due</scout-status-dot>

<!-- Condensed for table rows -->
<scout-status-dot type="success" size="condensed">Active</scout-status-dot>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/status-dot @scout/tokens lit\n\nimport '@scout/status-dot';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'type'), el('td', {}, '"informational" | "neutral" | "success" | "warning" | "critical"'), el('td', {}, '"neutral"'), el('td', {}, 'Semantic status.')),
            el('tr', {}, el('td', {}, 'size'), el('td', {}, '"default" | "condensed"'),                                          el('td', {}, '"default"'), el('td', {}, 'Density preset.')),
          )))),
  );
}

app.append(componentPage(
  'components-status-dot',
  'Status dot',
  'Colored dot + adjacent text for inline status indicators. Five status colors and two sizes. Status only — not for general categories or callouts.',
  [
    { id: 'preview', label: 'Preview', content: statusDotPreview() },
    { id: 'controls', label: 'Controls', content: statusDotControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: statusDotGuidelines() },
    { id: 'content', label: 'Content', content: statusDotContent() },
    { id: 'accessibility', label: 'Accessibility', content: statusDotAccessibility() },
    { id: 'code', label: 'Code', content: statusDotCode() },
  ],
));

// =================================================================
// System outage (real Lit component from @scout/system-outage)
// =================================================================
import '@scout/system-outage';

type SOStatus = 'platform-wide-outage' | 'feature-outage' | 'outage-restored';

function previewSystemOutage(opts: { status?: SOStatus; title?: string; description?: string; link?: string; closable?: boolean } = {}): HTMLElement {
  const {
    status = 'platform-wide-outage',
    title = 'Ember is currently down',
    description = 'We\'re working to restore service. Estimated time to recovery: 15 minutes.',
    link,
    closable = true,
  } = opts;
  const so = document.createElement('scout-system-outage');
  so.setAttribute('status', status);
  if (!closable) so.removeAttribute('closable');
  const t = document.createElement('span');
  t.setAttribute('slot', 'title');
  t.textContent = title;
  so.appendChild(t);
  so.appendChild(document.createTextNode(description));
  if (link) {
    const a = document.createElement('a');
    a.setAttribute('slot', 'link');
    a.setAttribute('href', '#');
    a.textContent = link;
    so.appendChild(a);
  }
  return so;
}

function systemOutagePreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };
  block(
    'Statuses',
    'Three statuses cover the lifecycle of a system event: full outage (red), partial degradation (yellow), and recovery (green).',
    el('div', { class: 'preview-stack' },
      previewSystemOutage({ status: 'platform-wide-outage', title: 'Ember is currently down', description: 'We\'re working to restore service. Estimated time to recovery: 15 minutes.', link: 'Check status page' }),
      previewSystemOutage({ status: 'feature-outage', title: 'Payments are temporarily unavailable', description: 'Other Ember features are working normally. Payment processing will resume shortly.', link: 'View affected features' }),
      previewSystemOutage({ status: 'outage-restored', title: 'Service restored', description: 'All systems are operational. Past incident details available on the status page.', link: 'Read incident report' }),
    ),
  );
  return wrap;
}

function systemOutageControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const statusSel = ddSelect('so-status', ['platform-wide-outage', 'feature-outage', 'outage-restored'] as const);
  const titleInput = ctrlText('so-title', 'Ember is currently down');
  const descInput = ctrlText('so-desc', 'Estimated time to recovery: 15 minutes.');
  const linkInput = ctrlText('so-link', 'Check status page');
  const closableChk = ctrlCheck('so-closable', 'Closable', { checked: true });

  function render() {
    stage.replaceChildren(previewSystemOutage({
      status: statusSel.value as SOStatus,
      title: titleInput.value,
      description: descInput.value,
      link: linkInput.value || undefined,
      closable: closableChk.checked,
    }));
    const linkSlot = linkInput.value ? `\n  <a slot="link" href="/status">${linkInput.value}</a>` : '';
    codePre.textContent = `<scout-system-outage status="${statusSel.value}"${closableChk.checked ? '' : ' closable="false"'}>\n  <span slot="title">${titleInput.value}</span>\n  ${descInput.value}${linkSlot}\n</scout-system-outage>`;
  }
  for (const c of [statusSel, titleInput, descInput, linkInput, closableChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Status', 'so-status', statusSel),
    ctrlField('Title', 'so-title', titleInput),
    ctrlField('Description', 'so-desc', descInput),
    ctrlField('Link', 'so-link', linkInput),
    el('div', { class: 'ctrl-checks' }, closableChk),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function systemOutageGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Use system outage banners to give users a clear, system-wide view of what\'s happening.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewSystemOutage({ status: 'platform-wide-outage', title: 'Ember is currently down', description: 'Estimated time to recovery: 15 minutes.', link: 'Check status page' }),
          'Anchor the banner at the very top of the application — above all other UI — so it\'s the first thing users see.'),
        doCard(previewSystemOutage({ status: 'outage-restored', title: 'Service restored', description: 'All systems operational.', closable: true }),
          'Confirm recovery so users know they can resume normal work. Restored banners can be dismissed.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Banners are for system-wide events, not individual issues.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewSystemOutage({ status: 'platform-wide-outage', title: 'Could not load this customer', description: 'Try again in a moment.' }),
          "Don't use system outage banners for per-action errors. That's what Inline alerts are for."),
        dontCard(previewSystemOutage({ status: 'feature-outage', title: 'Slow', description: 'Things are loading a bit slower than usual.' }),
          "Don't use the banner to surface minor issues. Reserve it for genuine outages users need to know about."),
      )));
}

function systemOutageContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Title'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Lead with the affected system or feature: "Ember is currently down", "Payments are temporarily unavailable".'),
        el('li', {}, 'Use sentence case.'),
        el('li', {}, 'Avoid jargon. Users want to know what they can\'t do, not internal service names.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Description'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Set expectations: when will it be fixed, what should the user do in the meantime.'),
        el('li', {}, 'For restored banners, confirm recovery and link to a post-incident report.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Link'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Link to a public status page or incident detail. Underlined for clarity.'),
        el('li', {}, 'Use action verbs: "Check status page", "View affected features", "Read incident report".'),
      )));
}

function systemOutageAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & live regions'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Platform-wide outage uses role="alert" so it\'s announced immediately by screen readers.'),
        el('li', {}, 'Feature outage and outage restored use role="status" with aria-live="polite".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & focus'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'White text on the colored background meets WCAG 2.1 AA contrast for all three statuses.'),
        el('li', {}, 'Status is reinforced with a status icon — never relying on color alone.'),
        el('li', {}, 'The close button receives a visible focus ring against the saturated background.'),
      )));
}

function systemOutageCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-system-outage status="platform-wide-outage">
  <span slot="title">Ember is currently down</span>
  We're working to restore service. ETA: 15 minutes.
  <a slot="link" href="/status">Check status page</a>
</scout-system-outage>

<scout-system-outage status="feature-outage">
  <span slot="title">Payments are temporarily unavailable</span>
  Other features are working normally.
</scout-system-outage>

<scout-system-outage status="outage-restored">
  <span slot="title">Service restored</span>
  All systems are operational.
</scout-system-outage>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/system-outage @scout/tokens lit\n\nimport '@scout/system-outage';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'status'), el('td', {}, '"platform-wide-outage" | "feature-outage" | "outage-restored"'), el('td', {}, '"platform-wide-outage"'), el('td', {}, 'Status of the system event.')),
            el('tr', {}, el('td', {}, 'closable'), el('td', {}, 'boolean'), el('td', {}, 'true'), el('td', {}, 'Whether the user can dismiss the banner.')),
          )))));
}

app.append(componentPage(
  'components-system-outage',
  'System outage',
  'Full-width banner notifying users of current or upcoming downtime, maintenance, or service restoration.',
  [
    { id: 'preview', label: 'Preview', content: systemOutagePreview() },
    { id: 'controls', label: 'Controls', content: systemOutageControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: systemOutageGuidelines() },
    { id: 'content', label: 'Content', content: systemOutageContent() },
    { id: 'accessibility', label: 'Accessibility', content: systemOutageAccessibility() },
    { id: 'code', label: 'Code', content: systemOutageCode() },
  ],
));

// =================================================================
// Tabs (real Lit components from @scout/tabs)
// =================================================================
import '@scout/tabs';

interface TabSpec {
  value: string;
  label: string;
  icon?: string; // Hero-icon name, optional
  disabled?: boolean;
}

function previewTabs(opts: { tabs: TabSpec[]; value?: string }): HTMLElement {
  const tabs = document.createElement('scout-tabs');
  if (opts.value) tabs.setAttribute('value', opts.value);
  for (const t of opts.tabs) {
    const tab = document.createElement('scout-tab');
    tab.setAttribute('value', t.value);
    if (t.disabled) tab.setAttribute('disabled', '');
    if (t.icon) {
      const icon = heroIconSvg(t.icon, 16);
      icon.setAttribute('slot', 'icon');
      tab.appendChild(icon);
    }
    tab.appendChild(document.createTextNode(t.label));
    tabs.appendChild(tab);
  }
  return tabs;
}

function tabsPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Default',
    'Two or more tabs in a horizontal row. The first tab is selected by default; click any tab to make it active.',
    previewTabs({
      tabs: [
        { value: 'overview',   label: 'Overview' },
        { value: 'activity',   label: 'Activity' },
        { value: 'documents',  label: 'Documents' },
        { value: 'preferences',label: 'Preferences' },
      ],
    }),
  );

  block(
    'With icons',
    'Tabs accept an optional leading icon via slot="icon". Use icons sparingly and consistently — either every tab has one, or none does.',
    previewTabs({
      tabs: [
        { value: 'summary',  label: 'Summary',   icon: 'document-text' },
        { value: 'payments', label: 'Payments',  icon: 'credit-card' },
        { value: 'disputes', label: 'Disputes',  icon: 'shield-exclamation' },
      ],
    }),
  );

  block(
    'With a disabled tab',
    'Disabled tabs are dimmed and unclickable. Use sparingly — a disabled tab implies the user once had access.',
    previewTabs({
      tabs: [
        { value: 'overview', label: 'Overview' },
        { value: 'activity', label: 'Activity' },
        { value: 'docs',     label: 'Documents', disabled: true },
        { value: 'prefs',    label: 'Preferences' },
      ],
    }),
  );

  // In-context demo: tabs swap a panel below
  block(
    'Wired to content panels',
    'The component is purely the tab list — consumers wire the scout-tabs-change event to whatever content swap they need.',
    (() => {
      const tabsEl = previewTabs({
        tabs: [
          { value: 'overview',  label: 'Overview' },
          { value: 'activity',  label: 'Activity' },
          { value: 'documents', label: 'Documents' },
        ],
      });
      const panel = el('div', { class: 'tabs-demo-panel' },
        el('h4', {}, 'Overview'),
        el('p', {}, 'High-level summary of the account: name, status, balance, and most-recent activity timestamp.'),
      );
      tabsEl.addEventListener('scout-tabs-change', (e) => {
        const v = (e as CustomEvent<{ value: string }>).detail.value;
        panel.replaceChildren();
        if (v === 'overview') panel.append(el('h4', {}, 'Overview'), el('p', {}, 'High-level summary of the account.'));
        if (v === 'activity') panel.append(el('h4', {}, 'Activity'), el('p', {}, 'Most recent calls, payments, and disputes — newest first.'));
        if (v === 'documents') panel.append(el('h4', {}, 'Documents'), el('p', {}, 'Uploaded statements, ID verifications, and signed agreements.'));
      });
      const wrap2 = el('div', {});
      wrap2.append(tabsEl, panel);
      return wrap2;
    })(),
  );

  return wrap;
}

function tabsControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const countInput = ctrlText('tb-count', '4', { type: 'number' });
  const valueInput = ctrlText('tb-value', 't1');
  const iconsChk = ctrlCheck('tb-icons', 'With icons');
  const disableLastChk = ctrlCheck('tb-disable', 'Disable last tab');

  function render() {
    const count = Math.max(2, Math.min(8, Number(countInput.value) || 4));
    const labels = ['Overview', 'Activity', 'Documents', 'Preferences', 'Statements', 'Disputes', 'Logs', 'Audit'];
    const icons  = ['document-text', 'clock', 'document', 'cog-6-tooth', 'document-check', 'shield-exclamation', 'queue-list', 'magnifying-glass'];
    const tabs: TabSpec[] = Array.from({ length: count }, (_, i) => ({
      value: `t${i + 1}`,
      label: labels[i] ?? `Tab ${i + 1}`,
      icon: iconsChk.checked ? icons[i] : undefined,
      disabled: disableLastChk.checked && i === count - 1,
    }));
    const node = previewTabs({ tabs, value: valueInput.value });
    node.addEventListener('scout-tabs-change', (e) => {
      valueInput.value = (e as CustomEvent<{ value: string }>).detail.value;
      updateCode(tabs);
    });
    stage.replaceChildren(node);
    updateCode(tabs);
  }
  function updateCode(tabs: TabSpec[]) {
    const lines = tabs
      .map((t) => `  <scout-tab value="${t.value}"${t.disabled ? ' disabled' : ''}>${t.label}</scout-tab>`)
      .join('\n');
    codePre.textContent = `<scout-tabs value="${valueInput.value}">\n${lines}\n</scout-tabs>`;
  }
  for (const c of [countInput, valueInput, iconsChk, disableLastChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Tab count', 'tb-count', countInput),
    ctrlField('Selected value', 'tb-value', valueInput),
    el('div', { class: 'ctrl-checks' },
      iconsChk,
      disableLastChk,
    ),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function tabsGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Use tabs when content is at the same hierarchy and the user benefits from seeing the labels at all times.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewTabs({
          tabs: [
            { value: 'overview', label: 'Overview' },
            { value: 'activity', label: 'Activity' },
            { value: 'documents',label: 'Documents' },
          ],
        }),
          'Use tabs to switch between sibling views of the same entity (an account, customer, ticket).'),
        doCard(previewTabs({
          tabs: [
            { value: 'summary',  label: 'Summary',  icon: 'document-text' },
            { value: 'payments', label: 'Payments', icon: 'credit-card' },
          ],
        }),
          'When you use icons, use them on every tab — never on just one or two. Mixed iconography is harder to scan.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Tabs are for navigation between siblings — not for actions, and never standalone.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewTabs({ tabs: [{ value: 'only', label: 'Overview' }] }),
          "Don't render a single solo tab. The component logs a console warning, but the right fix is to remove the tabs entirely or add a sibling."),
        dontCard(previewTabs({
          tabs: [
            { value: 'a', label: 'Submit' },
            { value: 'b', label: 'Cancel' },
          ],
        }),
          "Don't use tabs as buttons. Tabs swap a view; buttons trigger an action. \"Submit\" and \"Cancel\" belong in <scout-button>."),
      )));
}

function tabsContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Tab labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use sentence case noun phrases: "Overview", "Activity", "Documents".'),
        el('li', {}, 'Keep labels short and parallel — one or two words is ideal.'),
        el('li', {}, 'Avoid trailing counts inside the label ("Documents (12)"). If you need a count, use a sibling badge.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Tab count'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Two is the minimum. The component logs a console warning when only one tab is present.'),
        el('li', {}, 'Aim for two to seven tabs. More than that, the bar is hard to scan and starts to scroll.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Icons'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Optional. When present, every tab in the list should have one — never just some of them.'),
        el('li', {}, 'Pick icons that reinforce the label. Decorative icons add noise without aiding scannability.'),
      )));
}

function tabsAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & labelling'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The container renders role="tablist". Each tab is a real <button role="tab"> with aria-selected reflecting state.'),
        el('li', {}, 'The selected tab is the only one with tabindex="0"; non-selected tabs use tabindex="-1" — a single tab stop into the list, then arrow keys move within (consumer-managed).'),
        el('li', {}, 'Disabled tabs use the native disabled attribute, so they\'re skipped from the tab order automatically.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & focus'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Selected state combines color (interactive primary text + 2px bottom rail) AND a font-weight bump — never relying on color alone.'),
        el('li', {}, 'A 2px focus ring (interactive primary, offset −2px so it sits inside the click target) shows on keyboard focus.'),
        el('li', {}, 'Hover (cool-gray.100) and pressed (cool-gray.200) backgrounds meet WCAG AA against the label color.'),
      )));
}

function tabsCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-tabs value="overview">
  <scout-tab value="overview">Overview</scout-tab>
  <scout-tab value="activity">Activity</scout-tab>
  <scout-tab value="documents">Documents</scout-tab>
</scout-tabs>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'With icons'),
      el('pre', { class: 'code-block' },
        `<scout-tabs value="summary">
  <scout-tab value="summary">
    <svg slot="icon">…</svg>
    Summary
  </scout-tab>
  <scout-tab value="payments">
    <svg slot="icon">…</svg>
    Payments
  </scout-tab>
</scout-tabs>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Listening for change'),
      el('pre', { class: 'code-block' },
        `el.addEventListener('scout-tabs-change', (e) => {
  const { value } = e.detail;
  // Render the matching panel
});`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/tabs @scout/tokens lit\n\nimport '@scout/tabs';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props — scout-tabs'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'value'), el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Selected tab\'s value.')),
          )))),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props — scout-tab'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'value'),    el('td', {}, 'string'),  el('td', {}, '""'),    el('td', {}, 'Identifier emitted on selection.')),
            el('tr', {}, el('td', {}, 'disabled'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disables the tab.')),
            el('tr', {}, el('td', {}, 'selected'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Selection state. Set by the parent.')),
          )))),
  );
}

app.append(componentPage(
  'components-tabs',
  'Tabs',
  'Horizontal tab list for navigating between groups of related content at the same hierarchy. Optional leading icon per tab. Minimum of two tabs.',
  [
    { id: 'preview', label: 'Preview', content: tabsPreview() },
    { id: 'controls', label: 'Controls', content: tabsControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: tabsGuidelines() },
    { id: 'content', label: 'Content', content: tabsContent() },
    { id: 'accessibility', label: 'Accessibility', content: tabsAccessibility() },
    { id: 'code', label: 'Code', content: tabsCode() },
  ],
));

// =================================================================
// Text inputs (real Lit components from @scout/text-input)
// =================================================================
import '@scout/text-input';
import type { TextFieldVariant, TextInputSize } from '@scout/text-input';

interface TextFieldOpts {
  variant?: TextFieldVariant;
  size?: TextInputSize;
  label?: string;
  placeholder?: string;
  value?: string;
  helper?: string;
  error?: string;
  disabled?: boolean;
  optional?: boolean;
  confirmTarget?: string;
  id?: string;
}

function previewTextField(opts: TextFieldOpts = {}): HTMLElement {
  const f = document.createElement('scout-text-field');
  if (opts.variant) f.setAttribute('variant', opts.variant);
  if (opts.size) f.setAttribute('size', opts.size);
  if (opts.label) f.setAttribute('label', opts.label);
  if (opts.placeholder) f.setAttribute('placeholder', opts.placeholder);
  if (opts.value) f.setAttribute('value', opts.value);
  if (opts.helper) f.setAttribute('helper', opts.helper);
  if (opts.error) f.setAttribute('error', opts.error);
  if (opts.disabled) f.setAttribute('disabled', '');
  if (opts.optional) f.setAttribute('optional', '');
  if (opts.confirmTarget) f.setAttribute('confirm-target', opts.confirmTarget);
  if (opts.id) f.id = opts.id;
  return f;
}

interface TextAreaOpts {
  size?: TextInputSize;
  label?: string;
  placeholder?: string;
  value?: string;
  helper?: string;
  error?: string;
  disabled?: boolean;
  optional?: boolean;
  rows?: number;
}
function previewTextArea(opts: TextAreaOpts = {}): HTMLElement {
  const t = document.createElement('scout-text-area');
  if (opts.size) t.setAttribute('size', opts.size);
  if (opts.label) t.setAttribute('label', opts.label);
  if (opts.placeholder) t.setAttribute('placeholder', opts.placeholder);
  if (opts.value) t.setAttribute('value', opts.value);
  if (opts.helper) t.setAttribute('helper', opts.helper);
  if (opts.error) t.setAttribute('error', opts.error);
  if (opts.disabled) t.setAttribute('disabled', '');
  if (opts.optional) t.setAttribute('optional', '');
  if (typeof opts.rows === 'number') t.setAttribute('rows', String(opts.rows));
  return t;
}

function textInputPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  // Helper that lays out two columns of fields (default + condensed) for a variant.
  const variantPair = (
    title: string,
    description: string,
    a: HTMLElement,
    b: HTMLElement,
  ): HTMLElement =>
    el('div', { class: 'ti-variant' },
      el('div', { class: 'ti-variant__head' },
        el('h4', {}, title),
        el('p', {}, description),
      ),
      el('div', { class: 'ti-variant__pair' }, a, b),
    );

  // -- Plain text variants --
  const plainText = el('div', { class: 'ti-stack' },
    variantPair(
      'Text field',
      'Letters, numbers, and symbols. The default plain-text input.',
      previewTextField({ variant: 'text', label: 'Account name', placeholder: 'Jane Doe', helper: 'How the account appears on statements.' }),
      previewTextField({ variant: 'text', size: 'condensed', label: 'Account name', placeholder: 'Jane Doe' }),
    ),
    variantPair(
      'Text area',
      'Multi-line text with a resize gripper.',
      previewTextArea({ label: 'Notes', placeholder: 'What did the customer say on the call?', helper: 'Visible to all agents on this account.' }),
      previewTextArea({ size: 'condensed', label: 'Notes', placeholder: 'What did the customer say on the call?' }),
    ),
    variantPair(
      'Number',
      'Numeric only. Strips non-digits as you type.',
      previewTextField({ variant: 'number', label: 'Member ID', placeholder: '0', value: '102934' }),
      previewTextField({ variant: 'number', size: 'condensed', label: 'Member ID', placeholder: '0' }),
    ),
    variantPair(
      'Confirmation',
      'A pair of fields with a check shown when both values match. The second field points at the first via confirm-target.',
      el('div', { class: 'ti-confirm-pair' },
        previewTextField({ variant: 'sensitive-data', id: 'ti-ssn-1', label: 'SSN', placeholder: '123-45-6789' }),
        previewTextField({ variant: 'confirmation', confirmTarget: '#ti-ssn-1', label: 'Confirm SSN', placeholder: 'Re-enter to confirm', helper: 'Both values must match before submitting.' }),
      ),
      el('div', { class: 'ti-confirm-pair' },
        previewTextField({ variant: 'sensitive-data', size: 'condensed', id: 'ti-ssn-2', label: 'SSN', placeholder: '123-45-6789' }),
        previewTextField({ variant: 'confirmation', size: 'condensed', confirmTarget: '#ti-ssn-2', label: 'Confirm SSN', placeholder: 'Re-enter to confirm' }),
      ),
    ),
    variantPair(
      'Currency',
      'Dollars only. Auto-formats to two decimals on commit; leading $ is rendered inside the field.',
      previewTextField({ variant: 'currency', label: 'Statement balance', placeholder: '0.00', value: '1250.18' }),
      previewTextField({ variant: 'currency', size: 'condensed', label: 'Statement balance', placeholder: '0.00' }),
    ),
    variantPair(
      'Password',
      'Masks the value; eye icon toggles visibility.',
      previewTextField({ variant: 'password', label: 'Password', placeholder: 'Minimum 8 characters', value: 'super-secret' }),
      previewTextField({ variant: 'password', size: 'condensed', label: 'Password', placeholder: 'Minimum 8 characters' }),
    ),
    variantPair(
      'Phone',
      'Numeric input that auto-formats to 123-456-7890 as you type.',
      previewTextField({ variant: 'phone', label: 'Phone', placeholder: '555-014-2237', value: '5550142237' }),
      previewTextField({ variant: 'phone', size: 'condensed', label: 'Phone', placeholder: '555-014-2237' }),
    ),
    variantPair(
      'Search',
      'Leading search icon, trailing clear-x when there is content.',
      previewTextField({ variant: 'search', label: 'Search payments', placeholder: 'Search by name, date, or amount', value: 'Tran' }),
      previewTextField({ variant: 'search', size: 'condensed', placeholder: 'Search…' }),
    ),
    variantPair(
      'Sensitive data',
      'Like password — masks the value with an eye toggle. Use for SSN and other PII at rest.',
      previewTextField({ variant: 'sensitive-data', label: 'SSN', placeholder: '123-45-6789', value: '123-45-6789' }),
      previewTextField({ variant: 'sensitive-data', size: 'condensed', label: 'SSN', placeholder: '123-45-6789' }),
    ),
  );

  block(
    'Plain text variants',
    'Inputs that capture a value directly. All variants share label, placeholder, value, helper, and error semantics — the variant attr only changes formatting and trailing affordances.',
    plainText,
  );

  // -- Make-a-selection (popover-trigger) variants --
  const pickerVariants = el('div', { class: 'ti-stack' },
    variantPair(
      'Date picker',
      'Trailing calendar icon. Click to fire scout-text-field-trigger so the consumer can open a scout-popover-date.',
      previewTextField({ variant: 'date-picker', label: 'Payment date', placeholder: 'MM / DD / YYYY' }),
      previewTextField({ variant: 'date-picker', size: 'condensed', label: 'Payment date', placeholder: 'MM / DD / YYYY' }),
    ),
    variantPair(
      'Month picker',
      'Same shape as date picker, expected to open a month/year-only popover.',
      previewTextField({ variant: 'month-picker', label: 'Card expiry', placeholder: 'MM / YYYY' }),
      previewTextField({ variant: 'month-picker', size: 'condensed', label: 'Card expiry', placeholder: 'MM / YYYY' }),
    ),
    variantPair(
      'Time picker',
      'Trailing clock icon. Pair with scout-popover-time for a scroll-column time picker.',
      previewTextField({ variant: 'time-picker', label: 'Call time', placeholder: 'hh:mm AM' }),
      previewTextField({ variant: 'time-picker', size: 'condensed', label: 'Call time', placeholder: 'hh:mm AM' }),
    ),
  );

  block(
    'Plain text + selection variants',
    'Pickers — the user can either type a value directly or open a popover to pick one. The trailing icon emits scout-text-field-trigger; consumers wire it to the corresponding popover.',
    pickerVariants,
  );

  // -- Interactive states (using a default text field) --
  block(
    'Interactive states',
    'Every variant shares the same five interactive states plus the active functional state. Demonstrated on the plain text variant; the same styling applies to all eleven.',
    el('div', { class: 'ti-states-grid' },
      el('div', {}, el('h4', {}, 'Default'),  previewTextField({ label: 'Default',  placeholder: 'Enter value' })),
      el('div', {}, el('h4', {}, 'Active'),   previewTextField({ label: 'Active',   value: 'Jamie Tran' })),
      el('div', {}, el('h4', {}, 'Helper'),   previewTextField({ label: 'Helper',   placeholder: 'Enter value', helper: 'Helper text gives the user context.' })),
      el('div', {}, el('h4', {}, 'Error'),    previewTextField({ label: 'Error',    value: 'jamie@', error: 'Enter a valid email address.' })),
      el('div', {}, el('h4', {}, 'Disabled'), previewTextField({ label: 'Disabled', value: 'Read-only', disabled: true })),
    ),
  );

  return wrap;
}

function textInputControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const variantSel = ddSelect('ti-variant', [
    'text', 'number', 'confirmation', 'currency', 'password',
    'phone', 'search', 'sensitive-data',
    'date-picker', 'month-picker', 'time-picker',
  ]);
  const sizeSel = ddSelect('ti-size', ['default', 'condensed']);
  const labelInput = ctrlText('ti-label', 'Field label');
  const placeholderInput = ctrlText('ti-placeholder', 'Enter a value');
  const helperInput = ctrlText('ti-helper', '');
  const errorInput = ctrlText('ti-error', '');
  const valueInput = ctrlText('ti-value', '');
  const disabledChk = ctrlCheck('ti-disabled', 'Disabled');
  const optionalChk = ctrlCheck('ti-optional', 'Optional label');

  function render() {
    const node = previewTextField({
      variant: variantSel.value as TextFieldVariant,
      size: sizeSel.value as TextInputSize,
      label: labelInput.value,
      placeholder: placeholderInput.value,
      value: valueInput.value,
      helper: helperInput.value,
      error: errorInput.value,
      disabled: disabledChk.checked,
      optional: optionalChk.checked,
    });
    node.addEventListener('input', () => {
      valueInput.value = (node as any).value ?? '';
      updateCode();
    });
    stage.replaceChildren(node);
    updateCode();
  }
  function updateCode() {
    const attrs: string[] = [`variant="${variantSel.value}"`];
    if (sizeSel.value !== 'default') attrs.push(`size="${sizeSel.value}"`);
    if (labelInput.value) attrs.push(`label="${labelInput.value}"`);
    if (placeholderInput.value) attrs.push(`placeholder="${placeholderInput.value}"`);
    if (valueInput.value) attrs.push(`value="${valueInput.value}"`);
    if (helperInput.value) attrs.push(`helper="${helperInput.value}"`);
    if (errorInput.value) attrs.push(`error="${errorInput.value}"`);
    if (disabledChk.checked) attrs.push('disabled');
    if (optionalChk.checked) attrs.push('optional');
    codePre.textContent = `<scout-text-field\n  ${attrs.join('\n  ')}\n></scout-text-field>`;
  }
  for (const c of [variantSel, sizeSel, labelInput, placeholderInput, helperInput, errorInput, valueInput, disabledChk, optionalChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Variant', 'ti-variant', variantSel),
    ctrlField('Size', 'ti-size', sizeSel),
    ctrlField('Label', 'ti-label', labelInput),
    ctrlField('Placeholder', 'ti-placeholder', placeholderInput),
    ctrlField('Value', 'ti-value', valueInput),
    ctrlField('Helper', 'ti-helper', helperInput),
    ctrlField('Error', 'ti-error', errorInput),
    el('div', { class: 'ctrl-checks' },
      disabledChk,
      optionalChk,
    ),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function textInputGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Pick the variant that constrains the input to the value type you expect.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewTextField({ variant: 'phone', label: 'Phone', placeholder: '555-014-2237' }),
          'Use a typed variant (phone, currency, number, password, etc.) when the data has a known shape — formatting and masking happen for free.'),
        doCard(previewTextField({ variant: 'search', label: 'Search payments', placeholder: 'Search by name, date, or amount' }),
          'Use the search variant for filter inputs — the leading icon and clear-x are conventional and reduce label clutter.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Avoid the wrong variant — it changes the input contract for users and downstream code.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewTextField({ variant: 'text', label: 'Phone', placeholder: 'Phone number' }),
          "Don't use the plain text variant for typed values. Use phone for phone numbers, currency for money, etc."),
        dontCard(previewTextField({ variant: 'sensitive-data', label: 'Username', placeholder: 'Your username' }),
          "Don't use sensitive-data or password variants for non-sensitive content. Masking adds friction without security benefit."),
      )));
}

function textInputContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use sentence case noun phrases ("Account name", "Phone", "Statement balance"). Avoid trailing colons.'),
        el('li', {}, 'Always include a visible label. Placeholders are not labels — they disappear on input.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Placeholders'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use a sample value or format hint, not a restatement of the label. "555-014-2237" is better than "Phone number".'),
        el('li', {}, 'Keep placeholders short — they truncate at the field width.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Helper vs. error'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Helper sits below the field and explains the why — when in doubt, prefer helper to a tooltip.'),
        el('li', {}, 'Error replaces the helper when error is set, and switches the border to the error color. Errors are imperative ("Enter a valid email") and concrete.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Confirmation labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, '"Password" / "Confirm password". "SSN" / "Confirm SSN". Keep the noun the same; just prefix the verb.'),
        el('li', {}, 'The trailing checkmark only renders when both fields agree — never explain it in helper text.'),
      )));
}

function textInputAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & labelling'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Each field renders a real <label for> + native <input> / <textarea> — assistive tech reads the label as the accessible name.'),
        el('li', {}, 'When error is set, the field gets aria-invalid="true" and the message renders inside role="alert".'),
        el('li', {}, 'Variant icons (search, eye, calendar, clock) sit inside <button> elements with aria-label so they\'re reachable and announced.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Tab moves into and out of the field. Trailing icon buttons follow in DOM order so a single tab from the input lands on the toggle.'),
        el('li', {}, 'inputmode="decimal" / "tel" is set on currency / phone variants so mobile keyboards default to the numeric layout.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & focus'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Default border uses border-color-primary; hover/focus shifts to interactive primary; error uses border-color-error — three distinct hues never relying on color alone.'),
        el('li', {}, 'Focus is reinforced with a 2px ring offset 2px from the field edge.'),
      )));
}

function textInputCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<!-- Plain text -->
<scout-text-field label="Account name" placeholder="Jane Doe"></scout-text-field>

<!-- Currency: auto-formats to 2 decimals on blur -->
<scout-text-field variant="currency" label="Balance" placeholder="0.00"></scout-text-field>

<!-- Phone: formats to 555-014-2237 as you type -->
<scout-text-field variant="phone" label="Phone" placeholder="555-014-2237"></scout-text-field>

<!-- Password / Sensitive data: eye icon toggles visibility -->
<scout-text-field variant="password" label="Password"></scout-text-field>
<scout-text-field variant="sensitive-data" label="SSN"></scout-text-field>

<!-- Search: leading icon + clear-x when populated -->
<scout-text-field variant="search" label="Search" placeholder="Search…"></scout-text-field>

<!-- Confirmation: points at another field; checkmark renders when matched -->
<scout-text-field id="pw" variant="password" label="Password"></scout-text-field>
<scout-text-field variant="confirmation" confirm-target="#pw" label="Confirm password"></scout-text-field>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Pickers — wire to a popover'),
      el('pre', { class: 'code-block' },
        `<scout-text-field id="due" variant="date-picker" label="Payment date" placeholder="MM / DD / YYYY"></scout-text-field>

<script type="module">
  import '@scout/popover';
  document.querySelector('#due').addEventListener('scout-text-field-trigger', (e) => {
    // Open the matching popover-date positioned to the field.
  });
</script>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Text area'),
      el('pre', { class: 'code-block' },
        `<scout-text-area
  label="Notes"
  rows="4"
  placeholder="What did the customer say on the call?"
  helper="Visible to all agents on this account."
></scout-text-area>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/text-input @scout/tokens lit\n\nimport '@scout/text-input';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Variants'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Variant'), el('th', {}, 'Behavior'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'text'),            el('td', {}, 'Plain text input.')),
            el('tr', {}, el('td', {}, 'number'),          el('td', {}, 'Strips non-digits.')),
            el('tr', {}, el('td', {}, 'confirmation'),    el('td', {}, 'Renders a checkmark when value === confirm-target field\'s value.')),
            el('tr', {}, el('td', {}, 'currency'),        el('td', {}, 'Leading $; auto-formats to two decimals on commit.')),
            el('tr', {}, el('td', {}, 'password'),        el('td', {}, 'Masked; eye icon toggles visibility.')),
            el('tr', {}, el('td', {}, 'phone'),           el('td', {}, 'Formats as 555-014-2237.')),
            el('tr', {}, el('td', {}, 'search'),          el('td', {}, 'Leading search icon, trailing clear-x.')),
            el('tr', {}, el('td', {}, 'sensitive-data'),  el('td', {}, 'Masked; eye icon toggles visibility.')),
            el('tr', {}, el('td', {}, 'date-picker'),     el('td', {}, 'Trailing calendar; emits scout-text-field-trigger.')),
            el('tr', {}, el('td', {}, 'month-picker'),    el('td', {}, 'Trailing calendar; for month/year selection.')),
            el('tr', {}, el('td', {}, 'time-picker'),     el('td', {}, 'Trailing clock; emits scout-text-field-trigger.')),
          )))),
  );
}

app.append(componentPage(
  'components-text-input',
  'Text inputs',
  'Text field with eleven variants (text, number, currency, phone, password, search, sensitive data, confirmation, date / month / time pickers) and text area. Default and condensed sizes.',
  [
    { id: 'preview', label: 'Preview', content: textInputPreview() },
    { id: 'controls', label: 'Controls', content: textInputControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: textInputGuidelines() },
    { id: 'content', label: 'Content', content: textInputContent() },
    { id: 'accessibility', label: 'Accessibility', content: textInputAccessibility() },
    { id: 'code', label: 'Code', content: textInputCode() },
  ],
));

// =================================================================
// Tile (real Lit components from @scout/tile)
// =================================================================
import '@scout/tile';
import type { TileFunctionalState, TileFooter, WorkflowHeaderState } from '@scout/tile';

function makeTileButton(opts: {
  header?: string; subhead?: string; body?: string;
  state?: TileFunctionalState; disabled?: boolean;
}): HTMLElement {
  const t = document.createElement('scout-tile-button');
  t.setAttribute('header', opts.header ?? 'Header');
  if (opts.subhead) t.setAttribute('subhead', opts.subhead);
  if (opts.state) t.setAttribute('state', opts.state);
  if (opts.disabled) t.setAttribute('disabled', '');
  if (opts.body) t.appendChild(document.createTextNode(opts.body));
  return t;
}

function makeTile(opts: {
  header?: string; subhead?: string; eyebrow?: string;
  body?: string;
  badge?: { label: string; type?: 'informational' | 'warning' | 'success' | 'critical' | 'ai-summary' };
  headerButton?: boolean;
  state?: TileFunctionalState;
  footer?: TileFooter;
}): HTMLElement {
  const t = document.createElement('scout-tile');
  t.setAttribute('header', opts.header ?? 'Tile header');
  if (opts.subhead) t.setAttribute('subhead', opts.subhead);
  if (opts.state) t.setAttribute('state', opts.state);
  if (opts.footer) t.setAttribute('footer', opts.footer);
  if (opts.eyebrow) {
    const eb = document.createElement('span');
    eb.setAttribute('slot', 'eyebrow');
    eb.textContent = opts.eyebrow;
    t.appendChild(eb);
  }
  if (opts.badge) {
    const b = document.createElement('scout-badge');
    b.setAttribute('slot', 'badge');
    b.setAttribute('type', opts.badge.type ?? 'informational');
    b.setAttribute('emphasis', 'low');
    b.setAttribute('size', 'condensed');
    b.textContent = opts.badge.label;
    t.appendChild(b);
  }
  if (opts.headerButton) {
    const btn = document.createElement('button');
    btn.setAttribute('slot', 'header-button');
    btn.className = 'tile-overflow';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'More options');
    btn.textContent = '⋯';
    t.appendChild(btn);
  }
  if (opts.body) t.appendChild(document.createTextNode(opts.body));
  if (opts.footer === 'button-tertiary') {
    const cnxBtn = document.createElement('scout-button');
    cnxBtn.setAttribute('slot', 'footer');
    cnxBtn.setAttribute('variant', 'tertiary');
    cnxBtn.textContent = 'View all activity';
    t.appendChild(cnxBtn);
  }
  return t;
}

/** Lightweight footer-only preview used in the "footer types" stack.
 *  Renders just the horizontal divider + button row that sits at the
 *  bottom of a workflow tile, without the dot / header / body. */
function makeFooterPreview(buttons: Array<[label: string, variant: string]>): HTMLElement {
  const card = el('div', { class: 'wf-footer-preview' });
  card.append(document.createElement('scout-divider'));
  const row = el('div', { class: 'wf-footer-preview__row' });
  for (const [label, variant] of buttons) {
    const b = document.createElement('scout-button');
    b.setAttribute('variant', variant);
    b.textContent = label;
    row.append(b);
  }
  card.append(row);
  return card;
}

function makeTileWorkflow(opts: {
  step?: number; header?: string; subhead?: string;
  state?: WorkflowHeaderState; expanded?: boolean;
  functional?: TileFunctionalState;
  disabled?: boolean;
  noStep?: boolean;
  noEdit?: boolean;
  body?: string;
  footer?: 'cancel-save' | 'cancel-submit' | 'cancel-continue' | 'done' | 'none';
}): HTMLElement {
  const t = document.createElement('scout-tile-workflow');
  t.setAttribute('step', String(opts.step ?? 1));
  if (opts.noStep) t.setAttribute('no-step', '');
  if (opts.noEdit) t.setAttribute('no-edit', '');
  t.setAttribute('header', opts.header ?? 'Step header');
  if (opts.subhead) t.setAttribute('subhead', opts.subhead);
  if (opts.state) t.setAttribute('state', opts.state);
  if (opts.functional) t.setAttribute('functional', opts.functional);
  if (opts.expanded) t.setAttribute('expanded', '');
  if (opts.disabled) t.setAttribute('disabled', '');
  if (opts.body) t.appendChild(document.createTextNode(opts.body));
  // Footer button group
  const buildBtn = (label: string, variant: string) => {
    const b = document.createElement('scout-button');
    b.setAttribute('variant', variant);
    b.textContent = label;
    return b;
  };
  if (opts.footer && opts.footer !== 'none') {
    const wrap = document.createElement('div');
    wrap.setAttribute('slot', 'footer');
    wrap.style.display = 'flex';
    wrap.style.gap = 'var(--scout-space-8)';
    if (opts.footer === 'cancel-save')      { wrap.append(buildBtn('Cancel', 'tertiary'), buildBtn('Save', 'primary')); }
    if (opts.footer === 'cancel-submit')    { wrap.append(buildBtn('Cancel', 'tertiary'), buildBtn('Submit', 'action')); }
    if (opts.footer === 'cancel-continue')  { wrap.append(buildBtn('Cancel', 'tertiary'), buildBtn('Continue', 'primary')); }
    if (opts.footer === 'done')             { wrap.append(buildBtn('Done', 'primary')); }
    t.appendChild(wrap);
  }
  return t;
}

function tilePreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  // === Tile button ===
  // Showcase variants + functional states in a single section so the reader
  // sees every shape the tile-button takes without scrolling between blocks.
  block(
    'Tile button',
    'Single-action tile for overview / dashboard pages. The whole tile is one click target — never with internal links or buttons. Three functional states cover the lifecycle: default, loading (skeleton), and error.',
    el('div', { class: 'tile-grid' },
      makeTileButton({ header: 'Account summary', subhead: 'Balance · Status · Activity', body: 'View the customer\'s most recent state at a glance.' }),
      makeTileButton({ header: 'Disabled', subhead: 'Locked tile', body: 'Permission required to view.', disabled: true }),
      makeTileButton({ header: 'Loading', subhead: 'Fetching…', state: 'loading' }),
      makeTileButton({ header: 'Error', subhead: 'Couldn\'t load', state: 'error' }),
    ),
  );

  // === Tile ===
  block(
    'Tile',
    'Rich container with header eyebrow, title, badge, header button, subhead, and footer slots. Houses any combination of static info and interactive content. Three functional states cover the lifecycle: default, loading, and error.',
    el('div', { class: 'tile-stack' },
      makeTile({
        eyebrow: 'Customer',
        header: 'Jamie Tran',
        subhead: 'Premium · Member since 2021',
        badge: { label: 'New', type: 'informational' },
        headerButton: true,
        body: 'Last contact: payment dispute on May 18. Sentiment: frustrated. Outstanding action items: 1.',
        footer: 'button-tertiary',
      }),
      makeTile({
        eyebrow: 'AI summary',
        header: 'Call summary',
        badge: { label: 'AI', type: 'ai-summary' },
        body: 'Customer called about a $42.18 charge they didn\'t recognize. Verified identity via KBA. Initiated dispute and provided dispute reference. Customer was reassured by ETA of 5–7 business days. Follow-up email queued.',
        footer: 'show-more',
      }),
      makeTile({ header: 'Loading', subhead: 'Fetching…', state: 'loading' }),
      makeTile({ header: 'Error', subhead: 'Could not load', state: 'error' }),
    ),
  );

  // === Tile workflow ===
  block(
    'Tile workflow — header states',
    'Four header states: not-started (collapsed), active (expanded — exactly one per flow), completed-editable (collapsed, with Edit button), completed-locked (collapsed). State drives expansion, so only the active step shows its body and footer.',
    el('div', { class: 'tile-stack' },
      makeTileWorkflow({ step: 1, header: 'Not started', state: 'not-started' }),
      makeTileWorkflow({ step: 2, header: 'Select payment method', state: 'active',
        body: 'Choose how the customer wants to pay. Selection saves automatically.',
        footer: 'cancel-continue' }),
      makeTileWorkflow({ step: 3, header: 'Confirm address', subhead: 'On-file address', state: 'completed-editable' }),
      makeTileWorkflow({ step: 4, header: 'Completed - locked', state: 'completed-locked' }),
    ),
  );

  block(
    'Tile workflow — footer types',
    'Four canonical footer combinations cover most flows. Slot any other layout via slot="footer".',
    el('div', { class: 'tile-stack' },
      makeFooterPreview([['Cancel', 'tertiary'], ['Save', 'primary']]),
      makeFooterPreview([['Cancel', 'tertiary'], ['Submit', 'action']]),
      makeFooterPreview([['Cancel', 'tertiary'], ['Continue', 'primary']]),
      makeFooterPreview([['Done', 'primary']]),
    ),
  );

  block(
    'Tile workflow — functional states',
    'Default and disabled cover the resting interaction states; loading and error replace the body content while the header keeps its state.',
    el('div', { class: 'tile-stack' },
      makeTileWorkflow({ noStep: true, header: 'Default', subhead: 'Tap to expand', state: 'active' }),
      makeTileWorkflow({ noStep: true, header: 'Disabled', subhead: 'Locked while underwriting reviews', state: 'not-started', disabled: true }),
      makeTileWorkflow({ noStep: true, header: 'Loading data', state: 'active', expanded: true, functional: 'loading' }),
      makeTileWorkflow({ noStep: true, header: 'Couldn\'t load', state: 'active', expanded: true, functional: 'error' }),
    ),
  );

  return wrap;
}

function tileControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const variantSel = ddSelect('tl-variant', ['tile-button', 'tile', 'tile-workflow']);
  const stateSel = ddSelect('tl-state', ['default', 'loading', 'error']);
  const headerInput = ctrlText('tl-header', 'Tile header');
  const subheadInput = ctrlText('tl-subhead', 'Subhead text');
  const wfStateSel = ddSelect('tl-wf-state', ['not-started', 'active', 'completed-editable', 'completed-locked']);
  const wfFooterSel = ddSelect('tl-wf-footer', ['cancel-save', 'cancel-submit', 'cancel-continue', 'done', 'none']);
  const advFooterSel = ddSelect('tl-adv-footer', ['none', 'button-tertiary', 'show-more']);

  // Variant-specific fields stay visible at all times so the controls panel
  // tells the full story of every prop the component accepts. Fields whose
  // underlying property doesn't apply to the active variant are disabled
  // via the shared setFieldDisabled helper.
  const wfStateField   = ctrlField('Workflow state', 'tl-wf-state',  wfStateSel);
  const wfFooterField  = ctrlField('Workflow footer',       'tl-wf-footer', wfFooterSel);
  const advFooterField = ctrlField('Advanced footer',       'tl-adv-footer', advFooterSel);

  function render() {
    const v = variantSel.value;

    // Variant-gated enablement — workflow header state + footer only apply
    // to tile-workflow; advanced footer only applies to tile. Workflow footer
    // is also disabled when the step is "not-started" since the body/footer
    // are hidden in that state.
    const workflowApplies = v === 'tile-workflow';
    const advFooterApplies = v === 'tile';
    const notStarted = workflowApplies && wfStateSel.value === 'not-started';
    setFieldDisabled(wfStateField,   wfStateSel,   !workflowApplies);
    setFieldDisabled(wfFooterField,  wfFooterSel,  !workflowApplies || notStarted);
    setFieldDisabled(advFooterField, advFooterSel, !advFooterApplies);

    let node: HTMLElement;
    if (v === 'tile-button') {
      node = makeTileButton({
        header: headerInput.value,
        subhead: subheadInput.value,
        body: 'Body content of the tile sits here.',
        state: stateSel.value as TileFunctionalState,
      });
      codePre.textContent = `<scout-tile-button header="${headerInput.value}" subhead="${subheadInput.value}"${stateSel.value !== 'default' ? ` state="${stateSel.value}"` : ''}>\n  Body content\n</scout-tile-button>`;
    } else if (v === 'tile') {
      node = makeTile({
        header: headerInput.value,
        subhead: subheadInput.value,
        eyebrow: 'Eyebrow',
        badge: { label: 'New', type: 'informational' },
        headerButton: true,
        body: 'Body content. Drop any markup in the default slot.',
        state: stateSel.value as TileFunctionalState,
        footer: advFooterSel.value as TileFooter,
      });
      codePre.textContent = `<scout-tile header="${headerInput.value}" subhead="${subheadInput.value}"${stateSel.value !== 'default' ? ` state="${stateSel.value}"` : ''}${advFooterSel.value !== 'none' ? ` footer="${advFooterSel.value}"` : ''}>\n  <span slot="eyebrow">Eyebrow</span>\n  <scout-badge slot="badge" type="informational" emphasis="low" size="condensed">New</scout-badge>\n  Body content\n</scout-tile>`;
    } else {
      node = makeTileWorkflow({
        step: 1,
        header: headerInput.value,
        subhead: subheadInput.value,
        state: wfStateSel.value as WorkflowHeaderState,
        expanded: true,
        body: 'Step body. Inputs, dropdowns, tables go here.',
        footer: wfFooterSel.value as 'cancel-save' | 'cancel-submit' | 'cancel-continue' | 'done' | 'none',
        functional: stateSel.value as TileFunctionalState,
      });
      codePre.textContent = `<scout-tile-workflow step="1" header="${headerInput.value}" subhead="${subheadInput.value}" state="${wfStateSel.value}" expanded>\n  Step body\n  <div slot="footer">…</div>\n</scout-tile-workflow>`;
    }
    stage.replaceChildren(node);
  }
  for (const c of [variantSel, stateSel, headerInput, subheadInput, wfStateSel, wfFooterSel, advFooterSel]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Variant',          'tl-variant', variantSel),
    ctrlField('Functional state', 'tl-state',   stateSel),
    ctrlField('Header',           'tl-header',  headerInput),
    ctrlField('Subhead',          'tl-subhead', subheadInput),
    wfStateField,
    wfFooterField,
    advFooterField,
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function tileGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Pick the variant that matches the role of the tile.'),
      el('div', { class: 'do-dont-grid' },
        doCard(makeTileButton({ header: 'Account summary', subhead: 'Balance · Activity', body: 'Whole tile is one click target.' }),
          'Use tile-button on dashboards when the tile is itself the action — drill in to a record, jump to a screen.'),
        doCard(makeTileWorkflow({ step: 2, header: 'Confirm address', state: 'active', expanded: true,
          body: 'Use the workflow tile when the surface is part of a multi-step flow.', footer: 'cancel-continue' }),
          'Use tile-workflow inside multi-step flows. Stack several to walk the agent through a customer interaction.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Don\'t mix interactive elements into the wrong variant.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(makeTileButton({ header: 'Quick actions', subhead: 'Don\'t nest links inside', body: 'Edit · View · Delete' }),
          "Don't nest links or buttons inside a tile-button. The whole tile is the click target — competing actions break the contract."),
        dontCard(makeTile({ header: 'Don\'t use for steps', subhead: 'No status icon', body: 'Use a workflow tile for stepper-style flows.' }),
          "Don't use tile as a workflow step. The workflow variant has the status icon, edit affordance, and collapse semantics built in."),
      )));
}

function tileContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Headers'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Sentence case noun phrases — "Account summary", "Open disputes", "Confirm address".'),
        el('li', {}, 'Optional subhead carries the secondary detail (count, status, timestamp).'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Workflow steps'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Step labels are imperative verbs — "Verify identity", "Select payment method", "Review and submit".'),
        el('li', {}, 'Use completed-editable for steps the agent can revisit, completed-locked for steps that have hard-locked.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Footer copy'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Workflow footers follow four canonical patterns: Cancel / Save, Cancel / Submit, Cancel / Continue, Done.'),
        el('li', {}, 'Tertiary footer in tile is for navigation — "View all activity", "See related accounts".'),
      )));
}

function tileAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & labelling'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'tile-button renders a real <button> — keyboard, focus, and pointer behavior are native.'),
        el('li', {}, 'tile is a static container — the slotted header button carries the action role.'),
        el('li', {}, 'tile-workflow uses a <button> for the header/toggle with aria-expanded; the edit affordance has aria-label="Edit step".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'tile-button — Tab focuses; Enter or Space activates.'),
        el('li', {}, 'tile-workflow — Tab focuses the header; Enter or Space toggles. The edit button is a separate tab stop.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & focus'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'All variants ship with Border 0 and Elevation 0 per spec — separation comes from the surface fill against the page background.'),
        el('li', {}, 'Workflow status is communicated by both icon shape AND color — never relying on color alone.'),
        el('li', {}, 'Focus rings are 2px interactive primary, offset 2–4px depending on the variant.'),
      )));
}

function tileCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Tile button'),
      el('pre', { class: 'code-block' },
        `<scout-tile-button header="Account summary" subhead="Balance · Activity">
  Tap to drill in.
</scout-tile-button>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Tile'),
      el('pre', { class: 'code-block' },
        `<scout-tile header="Customer" subhead="Premium · Member since 2021" footer="show-more">
  <span slot="eyebrow">CUSTOMER</span>
  <scout-badge slot="badge" type="informational" emphasis="low" size="condensed">New</scout-badge>
  <button slot="header-button" aria-label="More options">⋯</button>
  Last contact: payment dispute on May 18. Sentiment: frustrated.
</scout-tile>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Tile workflow'),
      el('pre', { class: 'code-block' },
        `<scout-tile-workflow
  step="3"
  header="Select payment method"
  subhead="Required to continue"
  state="active"
  expanded
>
  <!-- inputs, dropdowns, tables -->
  <div slot="footer">
    <scout-button variant="tertiary">Cancel</scout-button>
    <scout-button variant="primary">Continue</scout-button>
  </div>
</scout-tile-workflow>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/tile @scout/tokens lit\n\nimport '@scout/tile';`)),
  );
}

app.append(componentPage(
  'components-tile',
  'Tile',
  'Three tile variants: tile-button (interactive), tile (rich content with header parts and footer), tile-workflow (collapsible step in a multi-step flow).',
  [
    { id: 'preview', label: 'Preview', content: tilePreview() },
    { id: 'controls', label: 'Controls', content: tileControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: tileGuidelines() },
    { id: 'content', label: 'Content', content: tileContent() },
    { id: 'accessibility', label: 'Accessibility', content: tileAccessibility() },
    { id: 'code', label: 'Code', content: tileCode() },
  ],
));

// =================================================================
// Toggle switch (real Lit component from @scout/toggle-switch)
// =================================================================
import '@scout/toggle-switch';
import type { ToggleSwitchSize, ToggleLabelPlacement } from '@scout/toggle-switch';

interface ToggleOpts {
  checked?: boolean;
  size?: ToggleSwitchSize;
  labelPlacement?: ToggleLabelPlacement;
  onVariant?: 'on' | 'on-critical';
  disabled?: boolean;
  label?: string;
}

function previewToggle(opts: ToggleOpts = {}): HTMLElement {
  const t = document.createElement('scout-toggle-switch');
  if (opts.checked) t.setAttribute('checked', '');
  if (opts.size) t.setAttribute('size', opts.size);
  if (opts.labelPlacement) t.setAttribute('label-placement', opts.labelPlacement);
  if (opts.onVariant) t.setAttribute('on-variant', opts.onVariant);
  if (opts.disabled) t.setAttribute('disabled', '');
  if (opts.label) t.appendChild(document.createTextNode(opts.label));
  return t;
}

function toggleSwitchPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Functional states',
    'Three functional states. `off` is the resting cool-gray track; `on` flips the track to interactive primary; `on-critical` paints the track red for destructive enables.',
    el('div', { class: 'preview-stack' },
      previewToggle({ label: 'Off' }),
      previewToggle({ label: 'On', checked: true }),
      previewToggle({ label: 'On — critical', checked: true, onVariant: 'on-critical' }),
    ),
  );

  block(
    'Sizes',
    'Default for forms; condensed for dense rows like settings tables.',
    el('div', { class: 'preview-stack' },
      previewToggle({ label: 'Default', checked: true }),
      previewToggle({ label: 'Condensed', size: 'condensed', checked: true }),
    ),
  );

  block(
    'Label placement',
    'Right (default) puts the label after the track; left places it before — useful in settings rows where the label leads.',
    el('div', { class: 'preview-stack' },
      previewToggle({ label: 'Notifications', checked: true, labelPlacement: 'right' }),
      previewToggle({ label: 'Allow analytics', checked: true, labelPlacement: 'left' }),
    ),
  );

  block(
    'Disabled',
    'Disabled state stops interaction; the underlying value is preserved.',
    el('div', { class: 'preview-stack' },
      previewToggle({ label: 'Disabled — off', disabled: true }),
      previewToggle({ label: 'Disabled — on', checked: true, disabled: true }),
    ),
  );

  return wrap;
}

function toggleSwitchControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const sizeSel = ddSelect('ts-size', ['default', 'condensed']);
  const placementSel = ddSelect('ts-placement', ['right', 'left']);
  const onSel = ddSelect('ts-on', ['on', 'on-critical']);
  const labelInput = ctrlText('ts-label', 'Notifications');
  const checkedChk = ctrlCheck('ts-checked', 'Checked', { checked: true });
  const disabledChk = ctrlCheck('ts-disabled', 'Disabled');

  function render() {
    const node = previewToggle({
      checked: checkedChk.checked,
      size: sizeSel.value as ToggleSwitchSize,
      labelPlacement: placementSel.value as ToggleLabelPlacement,
      onVariant: onSel.value as 'on' | 'on-critical',
      disabled: disabledChk.checked,
      label: labelInput.value,
    });
    node.addEventListener('change', () => {
      checkedChk.checked = (node as any).checked;
      updateCode();
    });
    stage.replaceChildren(node);
    updateCode();
  }
  function updateCode() {
    const attrs: string[] = [];
    if (checkedChk.checked) attrs.push('checked');
    if (sizeSel.value !== 'default') attrs.push(`size="${sizeSel.value}"`);
    if (placementSel.value !== 'right') attrs.push(`label-placement="${placementSel.value}"`);
    if (onSel.value !== 'on') attrs.push(`on-variant="${onSel.value}"`);
    if (disabledChk.checked) attrs.push('disabled');
    codePre.textContent = `<scout-toggle-switch${attrs.length ? ' ' + attrs.join(' ') : ''}>${labelInput.value}</scout-toggle-switch>`;
  }
  for (const c of [sizeSel, placementSel, onSel, labelInput, checkedChk, disabledChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Size', 'ts-size', sizeSel),
    ctrlField('Label placement', 'ts-placement', placementSel),
    ctrlField('On variant', 'ts-on', onSel),
    ctrlField('Label', 'ts-label', labelInput),
    el('div', { class: 'ctrl-checks' },
      checkedChk,
      disabledChk,
    ),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function toggleSwitchGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Use a toggle for binary settings that take effect immediately.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewToggle({ label: 'Email notifications', checked: true }),
          'Use for on/off settings — notification preferences, feature flags, autopay enrollment.'),
        doCard(previewToggle({ label: 'Allow third-party access', checked: true, onVariant: 'on-critical' }),
          'Use the on-critical variant when enabling has potential negative consequences. The red track flags it without blocking the action.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Don\'t use a toggle for actions or for choices that need confirmation.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewToggle({ label: 'Submit', checked: true }),
          "Don't use a toggle for actions. Toggles change settings; buttons trigger one-time actions."),
        dontCard(previewToggle({ label: 'Plan: Standard / Plus', checked: true }),
          "Don't use a toggle for non-binary choices. For two related options use radios with descriptive labels; for many options use a dropdown."),
      )));
}

function toggleSwitchContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use a noun phrase that names the setting — "Notifications", "Allow analytics", "Two-factor auth".'),
        el('li', {}, 'Sentence case. Avoid "Enable …" — the toggle\'s on state already implies enabled.'),
        el('li', {}, 'Keep labels under ~24 chars; use helper copy below if you need a longer explanation.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'On-critical'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Reserve for cases where enabling carries risk — "Disable two-factor auth", "Allow third-party data sharing".'),
        el('li', {}, 'Pair with helper or warning copy when the consequence isn\'t obvious from the label alone.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Placement'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Right (default) — best for forms where toggles sit next to other inputs.'),
        el('li', {}, 'Left — best for settings rows where the label is the primary scan target and the toggle confirms the value at the right edge.'),
      )));
}

function toggleSwitchAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & labelling'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The native input is exposed as role="switch" with `checked` reflecting the state, so screen readers announce "On" / "Off".'),
        el('li', {}, 'The slotted label is the accessible name; no extra aria-label needed.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Tab focuses the switch; Space or Enter toggles.'),
        el('li', {}, 'Disabled toggles are skipped from the tab order via the native disabled attribute.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & focus'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'State is communicated by both color AND knob position — never relying on color alone.'),
        el('li', {}, 'A 2px focus ring (interactive primary, offset 2px) appears around the track on keyboard focus.'),
      )));
}

function toggleSwitchCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-toggle-switch>Notifications</scout-toggle-switch>

<scout-toggle-switch checked size="condensed">Compact mode</scout-toggle-switch>

<scout-toggle-switch checked on-variant="on-critical">
  Allow third-party access
</scout-toggle-switch>

<scout-toggle-switch label-placement="left" checked>Allow analytics</scout-toggle-switch>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Listening for change'),
      el('pre', { class: 'code-block' },
        `el.addEventListener('change', () => {
  const next = el.checked;
  // persist + reflect in your store
});`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/toggle-switch @scout/tokens lit\n\nimport '@scout/toggle-switch';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'checked'),         el('td', {}, 'boolean'),                    el('td', {}, 'false'),     el('td', {}, 'On / off state.')),
            el('tr', {}, el('td', {}, 'size'),            el('td', {}, '"default" | "condensed"'),    el('td', {}, '"default"'), el('td', {}, 'Density preset.')),
            el('tr', {}, el('td', {}, 'label-placement'), el('td', {}, '"left" | "right"'),           el('td', {}, '"right"'),   el('td', {}, 'Label position relative to the track.')),
            el('tr', {}, el('td', {}, 'on-variant'),      el('td', {}, '"on" | "on-critical"'),       el('td', {}, '"on"'),      el('td', {}, 'Color treatment when checked.')),
            el('tr', {}, el('td', {}, 'disabled'),        el('td', {}, 'boolean'),                    el('td', {}, 'false'),     el('td', {}, 'Disables interaction.')),
            el('tr', {}, el('td', {}, 'name'),            el('td', {}, 'string'),                     el('td', {}, '""'),        el('td', {}, 'Form field name.')),
            el('tr', {}, el('td', {}, 'value'),           el('td', {}, 'string'),                     el('td', {}, '""'),        el('td', {}, 'Form value emitted when checked.')),
          )))),
  );
}

app.append(componentPage(
  'components-toggle-switch',
  'Toggle switch',
  'Quickly switch between two states (On / Off). Default and condensed sizes, optional left or right label, optional critical-on color treatment for destructive enables.',
  [
    { id: 'preview', label: 'Preview', content: toggleSwitchPreview() },
    { id: 'controls', label: 'Controls', content: toggleSwitchControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: toggleSwitchGuidelines() },
    { id: 'content', label: 'Content', content: toggleSwitchContent() },
    { id: 'accessibility', label: 'Accessibility', content: toggleSwitchAccessibility() },
    { id: 'code', label: 'Code', content: toggleSwitchCode() },
  ],
));

// =================================================================
// Pagination (real Lit component from @scout/pagination)
// =================================================================
import '@scout/pagination';

type PgLayout = 'item-dropdown' | 'page-numbers' | 'both';
type PgSize = 'default' | 'condensed';

interface PgOpts {
  page?: number;
  pageSize?: number;
  total?: number;
  layout?: PgLayout;
  size?: PgSize;
  disabled?: boolean;
}

function previewPagination(opts: PgOpts = {}): HTMLElement {
  const {
    page = 1,
    pageSize = 10,
    total = 200,
    layout = 'both',
    size = 'default',
    disabled = false,
  } = opts;
  const p = document.createElement('scout-pagination');
  p.setAttribute('page', String(page));
  p.setAttribute('page-size', String(pageSize));
  p.setAttribute('total', String(total));
  p.setAttribute('layout', layout);
  p.setAttribute('size', size);
  if (disabled) p.setAttribute('disabled', '');
  return p;
}

function paginationPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Layouts',
    'Three layouts cover the common use cases. Both is the default — items-per-page on the left, page navigation on the right. Use item-dropdown alone when total page count is unknown; use page-numbers alone when the page-size is fixed.',
    el('div', { class: 'preview-stack' },
      previewPagination({ layout: 'both' }),
      previewPagination({ layout: 'item-dropdown' }),
      previewPagination({ layout: 'page-numbers' }),
    ),
  );

  block(
    'Sizes',
    'Default for primary tables. Condensed for nested or secondary data regions where vertical space is at a premium.',
    el('div', { class: 'preview-stack' },
      previewPagination({ size: 'default' }),
      previewPagination({ size: 'condensed' }),
    ),
  );

  block(
    'Page-number ellipses',
    'When there are more than seven pages, the sequence shows first, last, current ± 1, and ellipses for the gaps.',
    el('div', { class: 'preview-stack' },
      previewPagination({ page: 1,  total: 500 }),
      previewPagination({ page: 5,  total: 500 }),
      previewPagination({ page: 25, total: 500 }),
      previewPagination({ page: 50, total: 500 }),
    ),
  );

  block(
    'Disabled',
    'When a table is loading or otherwise unactionable, disable pagination as a whole. All controls are dimmed and pointer events are blocked.',
    previewPagination({ disabled: true }),
  );

  return wrap;
}

function paginationControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const layoutSel = ddSelect('pg-layout', ['both', 'item-dropdown', 'page-numbers'] as const);
  const sizeSel = ddSelect('pg-size', ['default', 'condensed'] as const);
  const pageInput = ctrlText('pg-page', '1', { type: 'number' });
  const pageSizeInput = ctrlText('pg-pagesize', '10', { type: 'number' });
  const totalInput = ctrlText('pg-total', '200', { type: 'number' });
  const disabledChk = ctrlCheck('pg-disabled', 'Disabled');

  function render() {
    const node = previewPagination({
      page: Number(pageInput.value) || 1,
      pageSize: Number(pageSizeInput.value) || 10,
      total: Number(totalInput.value) || 0,
      layout: layoutSel.value as PgLayout,
      size: sizeSel.value as PgSize,
      disabled: disabledChk.checked,
    });
    // Keep the controls live as the user clicks within the preview
    node.addEventListener('scout-pagination-change', (e) => {
      const d = (e as CustomEvent<{ page: number; pageSize: number }>).detail;
      pageInput.value = String(d.page);
      pageSizeInput.value = String(d.pageSize);
      updateCode();
    });
    stage.replaceChildren(node);
    updateCode();
  }
  function updateCode() {
    const attrs = [
      `layout="${layoutSel.value}"`,
      `size="${sizeSel.value}"`,
      `page="${pageInput.value}"`,
      `page-size="${pageSizeInput.value}"`,
      `total="${totalInput.value}"`,
    ];
    if (disabledChk.checked) attrs.push('disabled');
    codePre.textContent = `<scout-pagination ${attrs.join(' ')}></scout-pagination>`;
  }
  // Layout gates page-input (only meaningful when page numbers render) and
  // page-size (only meaningful when the items-per-page dropdown renders).
  const pageField     = ctrlField('Page',      'pg-page',     pageInput);
  const pageSizeField = ctrlField('Page size', 'pg-pagesize', pageSizeInput);

  for (const c of [layoutSel, sizeSel, pageInput, pageSizeInput, totalInput, disabledChk]) {
    c.addEventListener('input', () => { applyGating(); render(); });
    c.addEventListener('change', () => { applyGating(); render(); });
  }
  function applyGating() {
    const layout = layoutSel.value;
    const showsPages    = layout === 'page-numbers' || layout === 'both';
    const showsItemDD   = layout === 'item-dropdown' || layout === 'both';
    setFieldDisabled(pageField,     pageInput,     !showsPages);
    setFieldDisabled(pageSizeField, pageSizeInput, !showsItemDD);
  }
  applyGating();
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Layout', 'pg-layout', layoutSel),
    ctrlField('Size', 'pg-size', sizeSel),
    pageField,
    pageSizeField,
    ctrlField('Total', 'pg-total', totalInput),
    el('div', { class: 'ctrl-checks' }, disabledChk),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function paginationGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Use pagination consistently across all paged data surfaces.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewPagination({ layout: 'both' }),
          'Anchor pagination to the bottom of the table or list. The full layout (items-per-page + page numbers) is the default.'),
        doCard(previewPagination({ size: 'condensed', layout: 'page-numbers' }),
          'Use the condensed size for nested or secondary tables where vertical space is constrained.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Avoid patterns that hide the user\'s position in the data.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewPagination({ layout: 'page-numbers', total: 5000 }),
          "Don't show pagination without a range readout when the dataset is large. Users need to know how far through they are."),
        dontCard(previewPagination({ layout: 'item-dropdown', total: 0 }),
          "Don't show pagination on empty result sets. Use an empty state instead."),
      )));
}

function paginationContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Range readout'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Format: "1–10 of 200". Use an en-dash between the bounds, never a hyphen.'),
        el('li', {}, 'When the total is zero, show "0 of 0" — never hide the readout.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Items per page'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Default options: 10, 25, 50, 100. Pick a set that suits your data — long-form rows favor smaller sets.'),
        el('li', {}, 'When the user changes the page size, preserve the first-visible item and reposition to the page that contains it.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Page numbers'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Show first, last, current, and the immediate neighbors of current. Insert ellipses for any gap of two or more.'),
        el('li', {}, 'Disable the prev chevron on page 1, and the next chevron on the last page.'),
      )));
}

function paginationAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & landmarks'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Page navigation is wrapped in a <nav aria-label="Pagination"> landmark.'),
        el('li', {}, 'The current page button carries aria-current="page" so screen readers announce position.'),
        el('li', {}, 'Chevron buttons have aria-label="Previous page" / "Next page". Page buttons have aria-label="Page N".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'All controls are reachable via Tab in DOM order. Enter or Space activates the focused button.'),
        el('li', {}, 'Disabled chevrons are skipped from the tab order.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & focus'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The selected page uses the interactive primary color with white text — meets WCAG AA contrast.'),
        el('li', {}, 'A 2px focus ring appears on every focusable control, offset 2px from the button edge.'),
      )));
}

function paginationCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-pagination
  layout="both"
  size="default"
  page="1"
  page-size="10"
  total="200"
  page-size-options="[10,25,50,100]"
></scout-pagination>

<scout-pagination layout="page-numbers" page="3" page-size="10" total="200"></scout-pagination>
<scout-pagination layout="item-dropdown" page="1" page-size="25" total="200"></scout-pagination>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/pagination @scout/dropdown @scout/tokens lit\n\nimport '@scout/pagination';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Events'),
      el('pre', { class: 'code-block' },
        `el.addEventListener('scout-pagination-change', (e) => {
  const { page, pageSize } = e.detail;
  // refetch your data
});`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'page'),               el('td', {}, 'number'), el('td', {}, '1'),                  el('td', {}, 'Current page (1-based).')),
            el('tr', {}, el('td', {}, 'page-size'),          el('td', {}, 'number'), el('td', {}, '10'),                 el('td', {}, 'Items per page.')),
            el('tr', {}, el('td', {}, 'total'),              el('td', {}, 'number'), el('td', {}, '0'),                  el('td', {}, 'Total item count across all pages.')),
            el('tr', {}, el('td', {}, 'page-size-options'),  el('td', {}, 'string (JSON array)'), el('td', {}, '"[10,25,50,100]"'), el('td', {}, 'Available items-per-page options.')),
            el('tr', {}, el('td', {}, 'layout'),             el('td', {}, '"item-dropdown" | "page-numbers" | "both"'), el('td', {}, '"both"'), el('td', {}, 'Which controls to render.')),
            el('tr', {}, el('td', {}, 'size'),               el('td', {}, '"default" | "condensed"'), el('td', {}, '"default"'), el('td', {}, 'Density.')),
            el('tr', {}, el('td', {}, 'disabled'),           el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disables all controls.')),
          )))));
}

app.append(componentPage(
  'components-pagination',
  'Pagination',
  'Page navigation for tables and paged content. Combines an items-per-page dropdown, a range readout, and numbered page buttons with prev/next chevrons.',
  [
    { id: 'preview', label: 'Preview', content: paginationPreview() },
    { id: 'controls', label: 'Controls', content: paginationControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: paginationGuidelines() },
    { id: 'content', label: 'Content', content: paginationContent() },
    { id: 'accessibility', label: 'Accessibility', content: paginationAccessibility() },
    { id: 'code', label: 'Code', content: paginationCode() },
  ],
));

// =================================================================
// Popover (real Lit family from @scout/popover)
// =================================================================
import '@scout/popover';

type PopPlacement = 'top' | 'bottom' | 'left' | 'right';
type TtVariant = 'simple' | 'advanced';
type TtTrigger = 'text' | 'info-icon';
type DateMode = 'single' | 'range' | 'month' | 'year';

function makeTriggerButton(label: string): HTMLElement {
  return el('button', { class: 'pop-trigger', slot: 'trigger', type: 'button' }, label);
}

function previewTooltip(opts: {
  variant?: TtVariant;
  trigger?: TtTrigger;
  placement?: PopPlacement;
  title?: string;
  body?: string;
  open?: boolean;
} = {}): HTMLElement {
  const tt = document.createElement('scout-tooltip');
  tt.setAttribute('variant', opts.variant ?? 'simple');
  tt.setAttribute('trigger', opts.trigger ?? 'text');
  tt.setAttribute('placement', opts.placement ?? 'top');
  if (opts.title) tt.setAttribute('title-text', opts.title);
  if (opts.open) tt.setAttribute('open', '');
  if ((opts.trigger ?? 'text') === 'text') {
    const span = document.createElement('span');
    span.setAttribute('slot', 'trigger');
    span.textContent = opts.title ? `What is ${opts.title}?` : 'Hover or focus me';
    tt.appendChild(span);
  }
  tt.appendChild(document.createTextNode(opts.body ?? 'A short, helpful explanation. Maximum three lines for the simple variant.'));
  return tt;
}

function previewPopoverMenu(opts: {
  label?: string;
  placement?: PopPlacement;
  open?: boolean;
} = {}): HTMLElement {
  const m = document.createElement('scout-popover-menu');
  if (opts.label) m.setAttribute('label', opts.label);
  m.setAttribute('placement', opts.placement ?? 'bottom');
  if (opts.open) m.setAttribute('open', '');
  m.appendChild(makeTriggerButton('Open menu'));
  for (const [val, lab, sel] of [
    ['view',   'View',     true],
    ['edit',   'Edit',     false],
    ['share',  'Share',    false],
    ['delete', 'Delete',   false],
  ] as const) {
    const item = document.createElement('scout-popover-menu-item');
    item.setAttribute('value', val);
    if (sel) item.setAttribute('selected', '');
    item.textContent = lab;
    m.appendChild(item);
  }
  return m;
}

function previewPopoverDate(opts: {
  type?: DateMode;
  label?: string;
  extended?: boolean;
  open?: boolean;
  marks?: { date: string; state: string }[];
  value?: string;
} = {}): HTMLElement {
  const d = document.createElement('scout-popover-date') as HTMLElement & {
    marks: { date: string; state: string }[];
  };
  d.setAttribute('type', opts.type ?? 'single');
  if (opts.label) d.setAttribute('label', opts.label);
  if (opts.extended) d.setAttribute('extended', '');
  if (opts.open) d.setAttribute('open', '');
  if (opts.value) d.setAttribute('value', opts.value);
  if (opts.marks) (d as any).marks = opts.marks;
  d.appendChild(makeTriggerButton('Pick a date'));
  return d;
}

function previewPopoverTime(opts: { label?: string; value?: string; open?: boolean } = {}): HTMLElement {
  const t = document.createElement('scout-popover-time');
  if (opts.label) t.setAttribute('label', opts.label);
  if (opts.value) t.setAttribute('value', opts.value);
  if (opts.open) t.setAttribute('open', '');
  t.appendChild(makeTriggerButton('Pick a time'));
  return t;
}

function popoverPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Tooltip — simple',
    'Plain-text helper attached to a text or info-icon trigger. Maximum three lines. Hover or focus to reveal.',
    el('div', { class: 'preview-stack preview-stack--inline' },
      previewTooltip({ variant: 'simple', trigger: 'text',     placement: 'top',    body: 'APR — the annual percentage rate is the yearly cost of borrowing.' }),
      previewTooltip({ variant: 'simple', trigger: 'info-icon', placement: 'right', body: 'CVV is the 3-digit code on the back of the card.' }),
    ),
  );

  block(
    'Tooltip — advanced',
    'Rich content; supports a title, paragraphs, inline alerts, and other elements. Larger surface, lighter background.',
    previewTooltip({
      variant: 'advanced',
      trigger: 'info-icon',
      placement: 'bottom',
      title: 'Statement balance',
      body: 'The amount you owe at the close of the most recent billing cycle. Pay this in full to avoid interest charges.',
      open: true,
    }),
  );

  block(
    'Tooltip — tip placement',
    'Four sides: top, bottom, left, right. Each opens with a 2px translate; tip points back to the trigger.',
    el('div', { class: 'preview-grid--tooltips' },
      previewTooltip({ placement: 'top',    body: 'Top placement.',    open: true, title: 'Top' }),
      previewTooltip({ placement: 'bottom', body: 'Bottom placement.', open: true, title: 'Bottom' }),
      previewTooltip({ placement: 'left',   body: 'Left placement.',   open: true, title: 'Left' }),
      previewTooltip({ placement: 'right',  body: 'Right placement.',  open: true, title: 'Right' }),
    ),
  );

  block(
    'Menu',
    'Single-select list anchored to a trigger. Use for quick actions on a row, file, or card. Closes on selection or click-outside.',
    el('div', { class: 'preview-stack preview-stack--inline' },
      previewPopoverMenu({ label: 'Actions', placement: 'bottom', open: true }),
      previewPopoverMenu({ placement: 'right' }),
    ),
  );

  block(
    'Date — single',
    'Pick one date. Past dates are dimmed. Today is announced via aria-current="date".',
    previewPopoverDate({ label: 'Payment date', type: 'single', open: true }),
  );

  block(
    'Date — range',
    'Pick a start and end date. Dates between bounds are highlighted; the start and end show as filled cells.',
    previewPopoverDate({ label: 'Statement period', type: 'range', open: true }),
  );

  block(
    'Date — month / year',
    'Compact pickers for cases where day-level precision isn\'t needed (e.g., expiry dates).',
    el('div', { class: 'preview-stack preview-stack--inline' },
      previewPopoverDate({ label: 'Card expiry — month', type: 'month', open: true }),
      previewPopoverDate({ label: 'Account year',        type: 'year',  open: true }),
    ),
  );

  block(
    'Date — extended view (with key)',
    'When dates carry meaning beyond "selected" (e.g., due / late / statement), turn on the extended view to render the legend below the grid. Marks are supplied via the `marks` property.',
    previewPopoverDate({
      label: 'Account dates',
      type: 'single',
      extended: true,
      open: true,
      marks: (() => {
        const today = new Date();
        const y = today.getFullYear(), m = today.getMonth();
        const iso = (d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        return [
          { date: iso(3),  state: 'statement' },
          { date: iso(15), state: 'due' },
          { date: iso(8),  state: 'late' },
          { date: iso(22), state: 'yellow' },
          { date: iso(28), state: 'green' },
        ];
      })(),
    }),
  );

  block(
    'Time',
    'Three-column scroll picker (hour, minute, AM/PM). The selected row sits in the highlighted band; clicking any row commits the selection.',
    previewPopoverTime({ label: 'Call time', value: '10:00 AM', open: true }),
  );

  return wrap;
}

function popoverControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const subSel = ddSelect('pop-sub', ['tooltip', 'menu', 'date', 'time']);
  const placementSel = ddSelect('pop-placement', ['top', 'bottom', 'left', 'right'], 'bottom');
  const variantSel = ddSelect('pop-variant', ['simple', 'advanced']);
  const triggerSel = ddSelect('pop-trigger', ['text', 'info-icon']);
  const typeSel = ddSelect('pop-type', ['single', 'range', 'month', 'year']);
  const labelInput = ctrlText('pop-label', '');
  const bodyInput = ctrlText('pop-body', 'A short, helpful explanation.');
  const openChk = ctrlCheck('pop-open', 'Open', { checked: true });
  const extendedChk = ctrlCheck('pop-extended', 'Extended view (date)');

  function render() {
    const sub = subSel.value;
    let node: HTMLElement;
    if (sub === 'tooltip') {
      node = previewTooltip({
        variant: variantSel.value as TtVariant,
        trigger: triggerSel.value as TtTrigger,
        placement: placementSel.value as PopPlacement,
        title: labelInput.value || undefined,
        body: bodyInput.value,
        open: openChk.checked,
      });
      codePre.textContent =
        `<scout-tooltip variant="${variantSel.value}" trigger="${triggerSel.value}" placement="${placementSel.value}"${labelInput.value ? ` title-text="${labelInput.value}"` : ''}${openChk.checked ? ' open' : ''}>\n  ${triggerSel.value === 'text' ? `<span slot="trigger">Hover me</span>\n  ` : ''}${bodyInput.value}\n</scout-tooltip>`;
    } else if (sub === 'menu') {
      node = previewPopoverMenu({
        label: labelInput.value || undefined,
        placement: placementSel.value as PopPlacement,
        open: openChk.checked,
      });
      codePre.textContent =
        `<scout-popover-menu placement="${placementSel.value}"${labelInput.value ? ` label="${labelInput.value}"` : ''}${openChk.checked ? ' open' : ''}>\n  <button slot="trigger">Open menu</button>\n  <scout-popover-menu-item value="view" selected>View</scout-popover-menu-item>\n  <scout-popover-menu-item value="edit">Edit</scout-popover-menu-item>\n  <scout-popover-menu-item value="share">Share</scout-popover-menu-item>\n  <scout-popover-menu-item value="delete">Delete</scout-popover-menu-item>\n</scout-popover-menu>`;
    } else if (sub === 'date') {
      node = previewPopoverDate({
        type: typeSel.value as DateMode,
        label: labelInput.value || undefined,
        extended: extendedChk.checked,
        open: openChk.checked,
      });
      codePre.textContent =
        `<scout-popover-date type="${typeSel.value}"${labelInput.value ? ` label="${labelInput.value}"` : ''}${extendedChk.checked ? ' extended' : ''}${openChk.checked ? ' open' : ''}>\n  <button slot="trigger">Pick a date</button>\n</scout-popover-date>`;
    } else {
      node = previewPopoverTime({
        label: labelInput.value || undefined,
        open: openChk.checked,
      });
      codePre.textContent =
        `<scout-popover-time${labelInput.value ? ` label="${labelInput.value}"` : ''}${openChk.checked ? ' open' : ''}>\n  <button slot="trigger">Pick a time</button>\n</scout-popover-time>`;
    }
    stage.replaceChildren(node);
  }

  for (const c of [subSel, placementSel, variantSel, triggerSel, typeSel, labelInput, bodyInput, openChk, extendedChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }

  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Sub-component', 'pop-sub', subSel),
    ctrlField('Placement', 'pop-placement', placementSel),
    ctrlField('Variant (tooltip)', 'pop-variant', variantSel),
    ctrlField('Trigger (tooltip)', 'pop-trigger', triggerSel),
    ctrlField('Type (date)', 'pop-type', typeSel),
    ctrlField('Label / title', 'pop-label', labelInput),
    ctrlField('Body (tooltip)', 'pop-body', bodyInput),
    el('div', { class: 'ctrl-checks' },
      openChk,
      extendedChk,
    ),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function popoverGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Use popovers to surface secondary information without leaving the page.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewTooltip({ trigger: 'info-icon', placement: 'top', body: 'APR — the annual cost of borrowing, expressed as a percentage.', open: true }),
          'Use simple tooltips to expand acronyms and define short phrases. Pair with an info icon next to the source term.'),
        doCard(previewPopoverDate({ label: 'Due date', type: 'single', extended: true, open: true }),
          'Use the extended date view (with key) when dates carry domain meaning beyond "selected" — due dates, statement dates, late markers.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Avoid using popovers for content that should be persistent or required to act on a task.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewTooltip({ variant: 'simple', body: 'This tooltip contains four full sentences of dense information that the user really needs to read carefully before continuing. It probably should not be in a tooltip at all and instead live in a dedicated help section or inline alert.', open: true }),
          "Don't pack long copy into a simple tooltip. If it spills past three lines, use the advanced variant or a different component."),
        dontCard(previewPopoverMenu({ label: 'Actions', placement: 'bottom', open: true }),
          "Don't use popover menus for primary navigation — they're for ad-hoc actions on a target. Persistent navigation belongs in the sidebar or topbar."),
      )));
}

function popoverContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Tooltip body'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Keep simple tooltips to one or two short sentences. Hard cap at three lines.'),
        el('li', {}, 'Lead with the term being defined: "APR — the annual cost of borrowing." not "The annual cost of borrowing, called APR."'),
        el('li', {}, 'Avoid duplicating visible body copy. The tooltip should add information, not restate.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Menu items'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use action verbs in present tense: "View", "Edit", "Share", "Delete".'),
        el('li', {}, 'Order destructive actions last and visually separate them when possible.'),
        el('li', {}, 'Use sentence case for labels.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Date labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Label every picker. "Payment date", "Statement period", "Card expiry — month".'),
        el('li', {}, 'Use the extended view\'s key to disambiguate states the user might not recognize at first glance (statement vs. due).'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Time format'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use 12-hour clock with AM / PM by default. The picker emits "hh:mm AM" / "hh:mm PM".'),
        el('li', {}, 'Pair with a time-zone hint nearby ("EST") when the time refers to a scheduled event.'),
      )));
}

function popoverAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & labelling'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Tooltips: the trigger carries aria-describedby pointing at the popover; the popover has role="tooltip".'),
        el('li', {}, 'Menus: the trigger carries aria-haspopup="menu" and aria-expanded reflects open state. Items have role="menuitem".'),
        el('li', {}, 'Date / time pickers: the surface has role="dialog". Day cells expose aria-current="date" for today.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Tooltips open on focus as well as hover.'),
        el('li', {}, 'Menus close on Escape and on click-outside; arrow keys move between items in the spec\'s next iteration.'),
        el('li', {}, 'Day cells are buttons reachable via Tab; Enter / Space selects.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & contrast'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Simple tooltip uses cool-gray.800 with white text — meets WCAG AA contrast.'),
        el('li', {}, 'Functional date states (due, late, statement) are distinguished by both color AND a dot position, never color alone.'),
        el('li', {}, '2px focus ring at every interactive cell, button and item.'),
      )));
}

function popoverCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Tooltip'),
      el('pre', { class: 'code-block' },
        `<scout-tooltip placement="top" trigger="info-icon" title-text="APR">
  The annual cost of borrowing, expressed as a percentage.
</scout-tooltip>

<scout-tooltip variant="advanced" placement="bottom" title-text="Statement balance">
  The amount owed at the close of the most recent billing cycle.
</scout-tooltip>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Menu'),
      el('pre', { class: 'code-block' },
        `<scout-popover-menu label="Actions" placement="bottom">
  <button slot="trigger">Open menu</button>
  <scout-popover-menu-item value="view" selected>View</scout-popover-menu-item>
  <scout-popover-menu-item value="edit">Edit</scout-popover-menu-item>
  <scout-popover-menu-item value="delete">Delete</scout-popover-menu-item>
</scout-popover-menu>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Date'),
      el('pre', { class: 'code-block' },
        `<scout-popover-date type="single" label="Payment date" extended>
  <button slot="trigger">Pick a date</button>
</scout-popover-date>

<!-- Apply functional state classes via the marks property -->
<script>
  const el = document.querySelector('scout-popover-date');
  el.marks = [
    { date: '2026-04-15', state: 'due' },
    { date: '2026-04-22', state: 'statement' },
    { date: '2026-04-08', state: 'late' },
  ];
</script>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Time'),
      el('pre', { class: 'code-block' },
        `<scout-popover-time label="Call time" value="10:00 AM">
  <button slot="trigger">Pick a time</button>
</scout-popover-time>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/popover @scout/tokens lit\n\nimport '@scout/popover';`)),
  );
}

app.append(componentPage(
  'components-popover',
  'Popover',
  'Anchored surface that appears after a trigger. Tooltip, menu, date and time pickers all share the same popover scaffold (tip placement, alignment, open/close).',
  [
    { id: 'preview', label: 'Preview', content: popoverPreview() },
    { id: 'controls', label: 'Controls', content: popoverControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: popoverGuidelines() },
    { id: 'content', label: 'Content', content: popoverContent() },
    { id: 'accessibility', label: 'Accessibility', content: popoverAccessibility() },
    { id: 'code', label: 'Code', content: popoverCode() },
  ],
));

// =================================================================
// Progress (real Lit family from @scout/progress)
// =================================================================
import '@scout/progress';
import type { StepperStep, ProgressGaugeSize, ProgressBarDisplay } from '@scout/progress';

function makeProgressBar(opts: {
  title?: string; value?: number; max?: number;
  display?: ProgressBarDisplay; left?: string; right?: string;
}): HTMLElement {
  const b = document.createElement('scout-progress-bar');
  if (opts.title) b.setAttribute('title-text', opts.title);
  b.setAttribute('value', String(opts.value ?? 60));
  b.setAttribute('max', String(opts.max ?? 100));
  b.setAttribute('display', opts.display ?? 'percentage');
  if (opts.left) b.setAttribute('left-label', opts.left);
  if (opts.right) b.setAttribute('right-label', opts.right);
  return b;
}

function makeProgressGauge(opts: {
  value?: number; max?: number; size?: ProgressGaugeSize; label?: string;
}): HTMLElement {
  const g = document.createElement('scout-progress-gauge');
  g.setAttribute('value', String(opts.value ?? 60));
  g.setAttribute('max', String(opts.max ?? 100));
  if (opts.size) g.setAttribute('size', opts.size);
  if (opts.label) g.setAttribute('label', opts.label);
  return g;
}

function makeStepper(opts: { orientation?: 'horizontal' | 'vertical'; steps: StepperStep[] }): HTMLElement {
  const s = document.createElement('scout-progress-stepper') as HTMLElement & { steps: StepperStep[] };
  s.setAttribute('orientation', opts.orientation ?? 'horizontal');
  s.steps = opts.steps;
  return s;
}

function makeTimeline(items: Array<{ title: string; subtitle?: string; body: string; expanded?: boolean }>): HTMLElement {
  const tl = document.createElement('scout-progress-timeline');
  for (const it of items) {
    const item = document.createElement('scout-progress-timeline-item');
    item.setAttribute('title-text', it.title);
    if (it.subtitle) item.setAttribute('subtitle', it.subtitle);
    if (it.expanded) item.setAttribute('expanded', '');
    item.textContent = it.body;
    tl.appendChild(item);
  }
  return tl;
}

function progressPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  // ----- Bar -----
  block(
    'Bar — display types',
    'Three display modes control the auto-readout above the track. Number ("12 / 20"), percentage ("60 %"), or bar-only when the bar itself carries the message.',
    el('div', { class: 'preview-stack' },
      makeProgressBar({ title: 'Onboarding', value: 12, max: 20, display: 'number' }),
      makeProgressBar({ title: 'Dispute review', value: 60, display: 'percentage' }),
      makeProgressBar({ title: 'Auto-saved', value: 80, display: 'bar-only' }),
      makeProgressBar({ title: 'Payment plan', value: 1250, max: 5000, left: '$1,250 paid', right: 'of $5,000' }),
    ),
  );

  // ----- Gauge -----
  block(
    'Gauge — sizes',
    'Four sizes from small (40px) to x-large (128px). The fill animates clockwise from 12 o\'clock; the percentage sits in the center; an optional label sits below.',
    el('div', { class: 'preview-row preview-row--gauges' },
      makeProgressGauge({ size: 'small',  value: 25, label: 'Small' }),
      makeProgressGauge({ size: 'medium', value: 50, label: 'Medium' }),
      makeProgressGauge({ size: 'large',  value: 75, label: 'Large' }),
      makeProgressGauge({ size: 'x-large', value: 92, label: 'X-large' }),
    ),
  );

  // ----- Horizontal stepper -----
  block(
    'Horizontal stepper — states',
    'Eight states cover every position in a flow: not-started, in-progress, completed, action-needed, expired, expired-completed, last-completed, last-awaiting.',
    el('div', { class: 'preview-stack' },
      makeStepper({
        orientation: 'horizontal',
        steps: [
          { label: 'Submit', state: 'completed', secondary: 'Apr 2' },
          { label: 'Review', state: 'completed', secondary: 'Apr 5' },
          { label: 'Verify', state: 'in-progress', secondary: 'In review', tooltip: 'Currently with the underwriting team.' },
          { label: 'Sign',   state: 'not-started' },
          { label: 'Funded', state: 'not-started' },
        ],
      }),
      makeStepper({
        orientation: 'horizontal',
        steps: [
          { label: 'Apply',  state: 'completed' },
          { label: 'Verify', state: 'action-needed', secondary: 'Action needed' },
          { label: 'Sign',   state: 'not-started' },
          { label: 'Funded', state: 'not-started' },
        ],
      }),
      makeStepper({
        orientation: 'horizontal',
        steps: [
          { label: 'Apply',  state: 'expired-completed', secondary: 'Apr 2' },
          { label: 'Verify', state: 'expired',           secondary: 'Window closed' },
          { label: 'Sign',   state: 'not-started' },
          { label: 'Funded', state: 'not-started' },
        ],
      }),
      makeStepper({
        orientation: 'horizontal',
        steps: [
          { label: 'Step 1', state: 'completed' },
          { label: 'Step 2', state: 'completed' },
          { label: 'Step 3', state: 'completed' },
          { label: 'Done!',  state: 'last-completed', secondary: 'All set' },
        ],
      }),
      makeStepper({
        orientation: 'horizontal',
        steps: [
          { label: 'Step 1', state: 'completed' },
          { label: 'Step 2', state: 'completed' },
          { label: 'Step 3', state: 'completed' },
          { label: 'Awaiting info', state: 'last-awaiting' },
        ],
      }),
    ),
  );

  // ----- Vertical stepper -----
  block(
    'Vertical stepper — states',
    'Same eight states, stacked. Use vertical when steps have meaningful secondary text or when horizontal real-estate is constrained.',
    makeStepper({
      orientation: 'vertical',
      steps: [
        { label: 'Application submitted', state: 'completed',     secondary: 'Apr 2 · Customer self-service' },
        { label: 'Documents reviewed',    state: 'completed',     secondary: 'Apr 5 · Underwriting' },
        { label: 'Identity verification', state: 'in-progress',   secondary: 'In review',           tooltip: 'Knowledge-based authentication in progress.' },
        { label: 'Funding source',        state: 'action-needed', secondary: 'Action needed — bank account required' },
        { label: 'Sign agreement',        state: 'not-started',   secondary: 'Pending previous step' },
        { label: 'Disbursement',          state: 'not-started' },
      ],
    }),
  );

  // ----- Timeline -----
  block(
    'Timeline',
    'Ordered events on a vertical rail. Each item has a title, optional subtitle, and a chevron control that toggles the body. Content is fully customizable per item.',
    makeTimeline([
      { title: 'Account opened',       subtitle: 'Apr 2 · 9:14 AM', body: 'Customer completed self-service application via the Ember portal.', expanded: true },
      { title: 'Identity verified',    subtitle: 'Apr 2 · 9:21 AM', body: 'KBA passed on first attempt.' },
      { title: 'Statement generated',  subtitle: 'May 1',           body: 'First statement available — total balance $345.18.' },
      { title: 'Payment scheduled',    subtitle: 'May 12',          body: 'Customer scheduled $345.18 payment for May 18 via autopay.' },
      { title: 'Payment received',     subtitle: 'May 18',          body: 'Payment posted; account brought current.' },
    ]),
  );

  return wrap;
}

function progressControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const subSel = ddSelect('pr-sub', ['bar', 'gauge', 'horizontal-stepper', 'vertical-stepper', 'timeline']);
  const valueInput = el('input', { type: 'range', id: 'pr-value', min: '0', max: '100', value: '60' }) as HTMLInputElement;
  const displaySel = ddSelect('pr-display', ['percentage', 'number', 'bar-only']);
  const sizeSel = ddSelect('pr-size', ['small', 'medium', 'large', 'x-large'], 'medium');
  const labelInput = ctrlText('pr-label', 'Onboarding');

  function render() {
    const sub = subSel.value;
    let node: HTMLElement;
    if (sub === 'bar') {
      node = makeProgressBar({
        title: labelInput.value || undefined,
        value: Number(valueInput.value),
        display: displaySel.value as ProgressBarDisplay,
      });
      codePre.textContent =
        `<scout-progress-bar value="${valueInput.value}" max="100" display="${displaySel.value}"${labelInput.value ? ` title-text="${labelInput.value}"` : ''}></scout-progress-bar>`;
    } else if (sub === 'gauge') {
      node = makeProgressGauge({
        size: sizeSel.value as ProgressGaugeSize,
        value: Number(valueInput.value),
        label: labelInput.value || undefined,
      });
      codePre.textContent =
        `<scout-progress-gauge size="${sizeSel.value}" value="${valueInput.value}" max="100"${labelInput.value ? ` label="${labelInput.value}"` : ''}></scout-progress-gauge>`;
    } else if (sub === 'horizontal-stepper' || sub === 'vertical-stepper') {
      const orientation = sub === 'horizontal-stepper' ? 'horizontal' : 'vertical';
      const steps: StepperStep[] = [
        { label: 'Apply',  state: 'completed' },
        { label: 'Verify', state: 'in-progress' },
        { label: 'Sign',   state: 'action-needed' },
        { label: 'Funded', state: 'not-started' },
      ];
      node = makeStepper({ orientation, steps });
      codePre.textContent =
        `<scout-progress-stepper orientation="${orientation}"></scout-progress-stepper>\n\n<script>\n  const el = document.querySelector('scout-progress-stepper');\n  el.steps = [\n    { label: 'Apply',  state: 'completed' },\n    { label: 'Verify', state: 'in-progress' },\n    { label: 'Sign',   state: 'action-needed' },\n    { label: 'Funded', state: 'not-started' },\n  ];\n</script>`;
    } else {
      node = makeTimeline([
        { title: 'Account opened', subtitle: 'Apr 2', body: 'Customer completed self-service application.', expanded: true },
        { title: 'First payment',  subtitle: 'May 18', body: 'Payment posted; account brought current.' },
      ]);
      codePre.textContent =
        `<scout-progress-timeline>\n  <scout-progress-timeline-item title-text="Account opened" subtitle="Apr 2" expanded>\n    Customer completed self-service application.\n  </scout-progress-timeline-item>\n  <scout-progress-timeline-item title-text="First payment" subtitle="May 18">\n    Payment posted; account brought current.\n  </scout-progress-timeline-item>\n</scout-progress-timeline>`;
    }
    stage.replaceChildren(node);
  }

  for (const c of [subSel, valueInput, displaySel, sizeSel, labelInput]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Sub-component', 'pr-sub', subSel),
    ctrlField('Value (bar / gauge)', 'pr-value', valueInput),
    ctrlField('Display (bar)', 'pr-display', displaySel),
    ctrlField('Size (gauge)', 'pr-size', sizeSel),
    ctrlField('Label / title', 'pr-label', labelInput),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function progressGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Pick the variant that matches the shape of your progress.'),
      el('div', { class: 'do-dont-grid' },
        doCard(makeProgressBar({ title: 'Payment plan', value: 1250, max: 5000, left: '$1,250 paid', right: 'of $5,000' }),
          'Use the bar for ratio progress with a clear total — paid down balances, file uploads, onboarding completion.'),
        doCard(makeStepper({
          orientation: 'horizontal',
          steps: [
            { label: 'Apply', state: 'completed' },
            { label: 'Verify', state: 'in-progress' },
            { label: 'Sign', state: 'not-started' },
          ],
        }),
          'Use a stepper when the flow has discrete, named stages and the user benefits from seeing where they are.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Avoid combinations that hide or duplicate progress information.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(makeStepper({
          orientation: 'horizontal',
          steps: Array.from({ length: 9 }, (_, i) => ({ label: `Step ${i + 1}`, state: i < 3 ? 'completed' : 'not-started' as const })),
        }),
          "Don't render more than ~6 steps in a horizontal stepper. Long flows go vertical or split across pages."),
        dontCard(makeProgressBar({ title: 'Loading…', value: 0, display: 'bar-only' }),
          "Don't show a 0% bar with no movement. Use a spinner or skeleton when the work hasn't started measurably."),
      )));
}

function progressContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Bar labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Title sits above the bar in sentence case.'),
        el('li', {}, 'Left / right labels are optional — use them when the bar represents money or a count and the auto-readout isn\'t meaningful enough.'),
        el('li', {}, 'When using `display="number"`, the readout reads "value / max" with thin spaces around the slash.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Stepper labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Step labels are verbs in sentence case: "Apply", "Verify", "Sign".'),
        el('li', {}, 'Secondary text is short — a date ("Apr 5") or a status hint ("In review", "Action needed").'),
        el('li', {}, 'Tooltips carry the long-form explanation; reserve for steps that genuinely need it.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Timeline'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Title is the event ("Account opened", "Statement generated").'),
        el('li', {}, 'Subtitle is the timestamp or actor — the supporting detail.'),
        el('li', {}, 'Body is the explanation. Long bodies stay collapsed by default; expand the most recent or most important entries.'),
      )));
}

function progressAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Bar and gauge use role="progressbar" with aria-valuenow / aria-valuemin / aria-valuemax.'),
        el('li', {}, 'Stepper renders role="list" and role="listitem" so screen readers count the steps.'),
        el('li', {}, 'Timeline-item toggle is a button with aria-expanded reflecting the open state.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & focus'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Step state is communicated by both color AND a glyph (number, check, exclamation) — never relying on color alone.'),
        el('li', {}, 'Action-needed and expired states meet WCAG AA contrast on the white surface.'),
        el('li', {}, 'Timeline toggles get a 2px focus ring offset 2px from the button edge.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Motion'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Bar and gauge animate to new values using motion.duration.base + easing.standard.'),
        el('li', {}, 'Animations honor prefers-reduced-motion via the upstream tokens; in user agents that report reduce, the components should skip the value transition.'),
      )));
}

function progressCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Bar'),
      el('pre', { class: 'code-block' },
        `<scout-progress-bar
  title-text="Onboarding"
  value="60"
  max="100"
  display="percentage"
></scout-progress-bar>

<scout-progress-bar
  title-text="Payment plan"
  value="1250"
  max="5000"
  left-label="$1,250 paid"
  right-label="of $5,000"
></scout-progress-bar>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Gauge'),
      el('pre', { class: 'code-block' },
        `<scout-progress-gauge size="medium" value="60" max="100" label="Storage"></scout-progress-gauge>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Stepper'),
      el('pre', { class: 'code-block' },
        `<scout-progress-stepper id="flow" orientation="horizontal"></scout-progress-stepper>

<script type="module">
  import '@scout/progress';
  document.querySelector('#flow').steps = [
    { label: 'Apply',  state: 'completed' },
    { label: 'Verify', state: 'in-progress', tooltip: 'In review with underwriting.' },
    { label: 'Sign',   state: 'action-needed' },
    { label: 'Funded', state: 'not-started' },
  ];
</script>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Timeline'),
      el('pre', { class: 'code-block' },
        `<scout-progress-timeline>
  <scout-progress-timeline-item title-text="Account opened" subtitle="Apr 2 · 9:14 AM" expanded>
    Customer completed self-service application.
  </scout-progress-timeline-item>
  <scout-progress-timeline-item title-text="Identity verified" subtitle="Apr 2 · 9:21 AM">
    KBA passed on first attempt.
  </scout-progress-timeline-item>
</scout-progress-timeline>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/progress @scout/tokens lit\n\nimport '@scout/progress';`)),
  );
}

app.append(componentPage(
  'components-progress',
  'Progress',
  'Bar, gauge, stepper (horizontal + vertical), and timeline. Communicate ratio, status, and step-by-step progression for long-running flows.',
  [
    { id: 'preview', label: 'Preview', content: progressPreview() },
    { id: 'controls', label: 'Controls', content: progressControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: progressGuidelines() },
    { id: 'content', label: 'Content', content: progressContent() },
    { id: 'accessibility', label: 'Accessibility', content: progressAccessibility() },
    { id: 'code', label: 'Code', content: progressCode() },
  ],
));

// =================================================================
// Radio (real Lit components from @scout/radio)
// =================================================================
import '@scout/radio';
import '@scout/badge';

interface RadioOpts {
  label?: string;
  value?: string;
  checked?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  secondary?: string;
  warning?: string;
  badge?: { label: string; type?: 'informational' | 'warning' | 'success' | 'critical' | 'neutral' | 'ai-summary' };
}

function previewRadio(opts: RadioOpts = {}): HTMLElement {
  const { label = 'Option', value = 'a', checked, disabled, invalid, secondary, warning, badge } = opts;
  const r = document.createElement('scout-radio');
  if (checked) r.setAttribute('checked', '');
  if (disabled) r.setAttribute('disabled', '');
  if (invalid) r.setAttribute('invalid', '');
  r.setAttribute('value', value);
  if (secondary) r.setAttribute('secondary', secondary);
  if (warning) r.setAttribute('warning', warning);
  r.appendChild(document.createTextNode(label));
  if (badge) {
    const b = document.createElement('scout-badge');
    b.setAttribute('slot', 'badge');
    b.setAttribute('type', badge.type ?? 'informational');
    b.setAttribute('emphasis', 'low');
    b.setAttribute('size', 'condensed');
    b.textContent = badge.label;
    r.appendChild(b);
  }
  return r;
}

interface RadioGroupOpts {
  label?: string;
  helper?: string;
  error?: string;
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  name?: string;
  value?: string;
  items: RadioOpts[];
}

function previewRadioGroup(opts: RadioGroupOpts): HTMLElement {
  const g = document.createElement('scout-radio-group');
  if (opts.label) g.setAttribute('label', opts.label);
  if (opts.helper) g.setAttribute('helper', opts.helper);
  if (opts.error) g.setAttribute('error', opts.error);
  if (opts.orientation) g.setAttribute('orientation', opts.orientation);
  if (opts.disabled) g.setAttribute('disabled', '');
  if (opts.name) g.setAttribute('name', opts.name);
  if (opts.value !== undefined) g.setAttribute('value', opts.value);
  for (const item of opts.items) g.appendChild(previewRadio(item));
  return g;
}

function radioPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Default — vertical orientation',
    'Vertical is the default. Use it for any list of three or more options or where the labels are long.',
    previewRadioGroup({
      label: 'Notification preference',
      helper: 'How should we contact you when a payment posts?',
      value: 'email',
      items: [
        { label: 'Email', value: 'email', secondary: 'jamie@ember.com' },
        { label: 'SMS',   value: 'sms',   secondary: '(555) 014-2237' },
        { label: 'Paper statement', value: 'paper', secondary: 'Mailed within 5 business days' },
      ],
    }),
  );

  block(
    'Horizontal orientation',
    'Use horizontal when the option set is small (two or three) and the labels are short.',
    previewRadioGroup({
      label: 'Statement format',
      orientation: 'horizontal',
      value: 'pdf',
      items: [
        { label: 'PDF', value: 'pdf' },
        { label: 'CSV', value: 'csv' },
        { label: 'JSON', value: 'json' },
      ],
    }),
  );

  block(
    'With badges',
    'Use a slotted `<scout-badge>` to highlight a recommended option, an early-access feature, or a status. Place the badge to the right of the label via slot="badge".',
    previewRadioGroup({
      label: 'Plan',
      helper: 'You can change your plan at any time.',
      value: 'standard',
      items: [
        { label: 'Standard',   value: 'standard',   secondary: 'For everyday accounts.', badge: { label: 'Recommended', type: 'informational' } },
        { label: 'Plus',       value: 'plus',       secondary: 'Adds dispute insurance and priority support.' },
        { label: 'AI assist',  value: 'ai',         secondary: 'Includes the AI summarizer in Ember.', badge: { label: 'Beta', type: 'ai-summary' } },
      ],
    }),
  );

  block(
    'With per-item warning',
    'Render a warning under a single option when picking it has consequences worth surfacing — without invalidating the entire group.',
    previewRadioGroup({
      label: 'Auto-pay source',
      value: 'savings',
      items: [
        { label: 'Checking — Wells Fargo ····2204', value: 'checking', secondary: 'Default funding source.' },
        { label: 'Savings — Wells Fargo ····0099',  value: 'savings',  secondary: 'Will draft on the statement due date.', warning: 'This account had a return last month.' },
        { label: 'Credit card — Visa ····4429',     value: 'card',     secondary: 'Convenience fees apply.' },
      ],
    }),
  );

  block(
    'Group error message',
    'When the group is invalid, set `error` on the group — every child radio renders the error border, and the message appears below.',
    previewRadioGroup({
      label: 'Risk profile',
      helper: 'Select one before continuing.',
      error: 'Select a risk profile to proceed.',
      items: [
        { label: 'Conservative', value: 'low' },
        { label: 'Balanced',     value: 'mid' },
        { label: 'Aggressive',   value: 'high' },
      ],
    }),
  );

  block(
    'Disabled — group',
    'Disabling the group disables every child radio. The selected value is preserved.',
    previewRadioGroup({
      label: 'Statement frequency',
      helper: 'Locked while the account is in review.',
      disabled: true,
      value: 'monthly',
      items: [
        { label: 'Monthly',   value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' },
        { label: 'Annual',    value: 'annual' },
      ],
    }),
  );

  return wrap;
}

function radioControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const orientationSel = ddSelect('rd-orient', ['vertical', 'horizontal']);
  const labelInput = ctrlText('rd-label', 'Notification preference');
  const helperInput = ctrlText('rd-helper', 'How should we contact you?');
  const errorInput = ctrlText('rd-error', '');
  const valueInput = ctrlText('rd-value', 'email');
  const disabledChk = ctrlCheck('rd-disabled', 'Disabled (group)');

  function render() {
    stage.replaceChildren(previewRadioGroup({
      label: labelInput.value,
      helper: helperInput.value,
      error: errorInput.value || undefined,
      orientation: orientationSel.value as 'vertical' | 'horizontal',
      disabled: disabledChk.checked,
      value: valueInput.value,
      items: [
        { label: 'Email', value: 'email' },
        { label: 'SMS',   value: 'sms' },
        { label: 'Paper', value: 'paper' },
      ],
    }));
    const attrs: string[] = [];
    if (labelInput.value)  attrs.push(`label="${labelInput.value}"`);
    if (helperInput.value) attrs.push(`helper="${helperInput.value}"`);
    if (errorInput.value)  attrs.push(`error="${errorInput.value}"`);
    if (orientationSel.value !== 'vertical') attrs.push(`orientation="${orientationSel.value}"`);
    if (disabledChk.checked) attrs.push('disabled');
    if (valueInput.value)  attrs.push(`value="${valueInput.value}"`);
    codePre.textContent =
      `<scout-radio-group ${attrs.join(' ')}>\n  <scout-radio value="email">Email</scout-radio>\n  <scout-radio value="sms">SMS</scout-radio>\n  <scout-radio value="paper">Paper</scout-radio>\n</scout-radio-group>`;
  }
  for (const c of [orientationSel, labelInput, helperInput, errorInput, valueInput, disabledChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  // Wire change events on the live preview so editing the radio updates the value field
  stage.addEventListener('scout-radio-change', (e) => {
    valueInput.value = (e as CustomEvent<{ value: string }>).detail.value;
    render();
  });
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Orientation', 'rd-orient', orientationSel),
    ctrlField('Group label', 'rd-label', labelInput),
    ctrlField('Group helper', 'rd-helper', helperInput),
    ctrlField('Group error', 'rd-error', errorInput),
    ctrlField('Selected value', 'rd-value', valueInput),
    el('div', { class: 'ctrl-checks' }, disabledChk),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function radioGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Use radios when the user must pick exactly one of two or more visible choices.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewRadioGroup({
          label: 'Statement format',
          orientation: 'horizontal',
          value: 'pdf',
          items: [
            { label: 'PDF', value: 'pdf' },
            { label: 'CSV', value: 'csv' },
          ],
        }),
          'Use horizontal when there are two or three short options. Keeps the form compact without forcing a dropdown.'),
        doCard(previewRadioGroup({
          label: 'Auto-pay source',
          value: 'checking',
          items: [
            { label: 'Checking — ····2204', value: 'checking', secondary: 'Default funding source.' },
            { label: 'Savings — ····0099',  value: 'savings',  secondary: 'Drafts on due date.' },
          ],
        }),
          'Use vertical with secondary text when the choice has consequences the user needs to read.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Avoid radios when the user might want to skip the choice or pick more than one.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewRadioGroup({
          label: 'Topics that interest you',
          orientation: 'horizontal',
          items: [
            { label: 'Billing',   value: 'billing' },
            { label: 'Disputes',  value: 'disputes' },
            { label: 'Promotions', value: 'promo' },
          ],
        }),
          "Don't use radios for multi-select. Reach for checkboxes — the visual contract is exclusive selection."),
        dontCard(previewRadioGroup({
          label: 'Country',
          orientation: 'horizontal',
          items: Array.from({ length: 12 }, (_, i) => ({ label: `Country ${i + 1}`, value: `c${i}` })),
        }),
          "Don't use radios for long option lists. Use a dropdown or multiselect when the count exceeds about six."),
      )));
}

function radioContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Group legend'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Pose the choice as a noun phrase: "Notification preference", "Statement format".'),
        el('li', {}, 'Sentence case. Avoid trailing colons — the legend is paired visually with its options.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Option labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Short, parallel labels: "Email" / "SMS" / "Paper", not "Email me" / "Get a text" / "Mail it".'),
        el('li', {}, 'Use secondary text for context that doesn\'t fit on the label line — a sender, a frequency, a fee.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Badges'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Reserve for genuine signal — "Recommended", "Beta", "New". Avoid using a badge on more than one option.'),
        el('li', {}, 'Use the warning badge type for "Beta" / "AI" content; informational for "Recommended"; success for "Verified".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Warning vs. error'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Warning sits on a single option and explains a non-blocking concern with that choice.'),
        el('li', {}, 'Error sits on the group and indicates the user must change their selection (or make one) to continue.'),
      )));
}

function radioAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & labelling'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The group renders a <fieldset>/<legend> for native screen-reader grouping, plus role="radiogroup" with aria-label fallback.'),
        el('li', {}, 'Each item is a real <input type="radio"> — focus, selection, and form submission behave natively.'),
        el('li', {}, 'When error is set, every child carries aria-invalid="true" and the message is announced via role="alert".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Tab moves into and out of the group; arrow keys cycle between radios within it (native behavior).'),
        el('li', {}, 'Space selects the focused radio. Disabled radios are skipped from the tab order.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & focus'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Selected state combines a filled inner dot AND a colored border — never relying on color alone.'),
        el('li', {}, 'The native input gets a 2px focus ring (interactive primary) offset 2px from the circle.'),
      )));
}

function radioCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-radio-group
  label="Notification preference"
  helper="How should we contact you?"
  value="email"
>
  <scout-radio value="email" secondary="jamie@ember.com">Email</scout-radio>
  <scout-radio value="sms"   secondary="(555) 014-2237">SMS</scout-radio>
  <scout-radio value="paper" warning="Mailed statements take 5 business days">
    Paper statement
  </scout-radio>
</scout-radio-group>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'With a badge'),
      el('pre', { class: 'code-block' },
        `<scout-radio value="standard">
  Standard
  <scout-badge slot="badge" type="informational" emphasis="low" size="condensed">Recommended</scout-badge>
</scout-radio>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Listening for changes'),
      el('pre', { class: 'code-block' },
        `el.addEventListener('scout-radio-change', (e) => {
  const { value } = e.detail;
  // value === selected radio's value attribute
});`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/radio @scout/tokens lit\n\nimport '@scout/radio';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props — scout-radio'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'checked'),    el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Selected state.')),
            el('tr', {}, el('td', {}, 'disabled'),   el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disables interaction.')),
            el('tr', {}, el('td', {}, 'invalid'),    el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Renders an error border.')),
            el('tr', {}, el('td', {}, 'value'),      el('td', {}, 'string'),  el('td', {}, '""'),    el('td', {}, 'Form value emitted when checked.')),
            el('tr', {}, el('td', {}, 'secondary'),  el('td', {}, 'string'),  el('td', {}, '""'),    el('td', {}, 'Secondary text under the label.')),
            el('tr', {}, el('td', {}, 'warning'),    el('td', {}, 'string'),  el('td', {}, '""'),    el('td', {}, 'Per-item warning message.')),
          )))),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props — scout-radio-group'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'label'),       el('td', {}, 'string'),                          el('td', {}, '""'),         el('td', {}, 'Group legend.')),
            el('tr', {}, el('td', {}, 'helper'),      el('td', {}, 'string'),                          el('td', {}, '""'),         el('td', {}, 'Group secondary text.')),
            el('tr', {}, el('td', {}, 'error'),       el('td', {}, 'string'),                          el('td', {}, '""'),         el('td', {}, 'Group error message; marks all children invalid.')),
            el('tr', {}, el('td', {}, 'orientation'), el('td', {}, '"vertical" | "horizontal"'),      el('td', {}, '"vertical"'), el('td', {}, 'Layout direction.')),
            el('tr', {}, el('td', {}, 'disabled'),    el('td', {}, 'boolean'),                         el('td', {}, 'false'),      el('td', {}, 'Disables every child.')),
            el('tr', {}, el('td', {}, 'name'),        el('td', {}, 'string'),                          el('td', {}, '"cnx-radio-N"'), el('td', {}, 'Shared form name.')),
            el('tr', {}, el('td', {}, 'value'),       el('td', {}, 'string'),                          el('td', {}, '""'),         el('td', {}, 'Currently-selected value.')),
          )))),
  );
}

app.append(componentPage(
  'components-radio',
  'Radio',
  'Single-select form input rendered as a group of mutually-exclusive radio buttons. Optional badge, secondary text, per-item warning, group helper and error.',
  [
    { id: 'preview', label: 'Preview', content: radioPreview() },
    { id: 'controls', label: 'Controls', content: radioControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: radioGuidelines() },
    { id: 'content', label: 'Content', content: radioContent() },
    { id: 'accessibility', label: 'Accessibility', content: radioAccessibility() },
    { id: 'code', label: 'Code', content: radioCode() },
  ],
));

// =================================================================
// Segmented control (real Lit components from @scout/segmented-control)
// =================================================================
import '@scout/segmented-control';

interface SegSpec { value: string; label: string; disabled?: boolean }

function previewSegmented(opts: {
  segments: SegSpec[];
  value?: string;
  size?: 'default' | 'condensed';
  disabled?: boolean;
}): HTMLElement {
  const sc = document.createElement('scout-segmented-control');
  if (opts.value) sc.setAttribute('value', opts.value);
  if (opts.size) sc.setAttribute('size', opts.size);
  if (opts.disabled) sc.setAttribute('disabled', '');
  for (const s of opts.segments) {
    const seg = document.createElement('scout-segment');
    seg.setAttribute('value', s.value);
    if (s.disabled) seg.setAttribute('disabled', '');
    seg.textContent = s.label;
    sc.appendChild(seg);
  }
  return sc;
}

function segmentedPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Default',
    'Two to five short options. The selected segment lifts onto a white pill via elevation.1; the rest sit on the cool-gray.100 track.',
    el('div', { class: 'preview-stack preview-stack--inline' },
      previewSegmented({
        value: 'list',
        segments: [
          { value: 'list',   label: 'List' },
          { value: 'grid',   label: 'Grid' },
          { value: 'kanban', label: 'Kanban' },
        ],
      }),
      previewSegmented({
        value: 'monthly',
        segments: [
          { value: 'monthly',   label: 'Monthly' },
          { value: 'quarterly', label: 'Quarterly' },
          { value: 'annual',    label: 'Annual' },
        ],
      }),
    ),
  );

  block(
    'Sizes',
    'Default for primary surfaces; condensed for table headers, dialog footers, and other dense rows.',
    el('div', { class: 'preview-stack preview-stack--inline' },
      previewSegmented({
        value: 'list', size: 'default',
        segments: [{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }, { value: 'kanban', label: 'Kanban' }],
      }),
      previewSegmented({
        value: 'list', size: 'condensed',
        segments: [{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }, { value: 'kanban', label: 'Kanban' }],
      }),
    ),
  );

  block(
    'With a disabled segment',
    'Disabled segments are dimmed and unclickable. Use sparingly — usually a permission or licensing gate.',
    previewSegmented({
      value: 'monthly',
      segments: [
        { value: 'monthly',  label: 'Monthly' },
        { value: 'annual',   label: 'Annual' },
        { value: 'lifetime', label: 'Lifetime', disabled: true },
      ],
    }),
  );

  block(
    'Disabled — entire control',
    'Disable the whole control during loading or when permission is missing.',
    previewSegmented({
      disabled: true, value: 'list',
      segments: [{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }],
    }),
  );

  // ----- Language tabs variant ---------------------------------------------
  // Sub-component built on top of segmented-control: a labeled language picker
  // with a trailing divider. Used inside share-with-customer surfaces so the
  // agent can preview each translation before sending.
  const languageTabs = (langs: Array<{ value: string; label: string; disabled?: boolean }>, value: string) => {
    const lt = document.createElement('scout-language-tabs') as HTMLElement & {
      languages: typeof langs; value: string;
    };
    lt.languages = langs;
    lt.value = value;
    return lt;
  };

  block(
    'Language tabs',
    'Specialized variant for switching between translations. Anatomy: optional label + segmented control of language options + trailing divider that separates the picker from the translated content below. Common host: the share-with-customer surface.',
    el('div', { class: 'preview-stack' },
      languageTabs(
        [
          { value: 'en', label: 'English' },
          { value: 'es', label: 'Spanish' },
        ],
        'en',
      ),
      languageTabs(
        [
          { value: 'en', label: 'English' },
          { value: 'es', label: 'Spanish' },
          { value: 'fr', label: 'French' },
        ],
        'es',
      ),
    ),
  );

  return wrap;
}

function segmentedControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const sizeSel = ddSelect('seg-size', ['default', 'condensed']);
  const valueInput = ctrlText('seg-value', 'list');
  const countInput = ctrlText('seg-count', '3', { type: 'number' });
  const disabledChk = ctrlCheck('seg-disabled', 'Disabled');

  function render() {
    const labels = ['List', 'Grid', 'Kanban', 'Calendar', 'Map'];
    const count = Math.max(2, Math.min(5, Number(countInput.value) || 3));
    const segments: SegSpec[] = Array.from({ length: count }, (_, i) => ({
      value: labels[i].toLowerCase(),
      label: labels[i],
    }));
    const node = previewSegmented({
      value: valueInput.value || segments[0].value,
      size: sizeSel.value as 'default' | 'condensed',
      disabled: disabledChk.checked,
      segments,
    });
    node.addEventListener('scout-segmented-change', (e) => {
      valueInput.value = (e as CustomEvent<{ value: string }>).detail.value;
      updateCode(segments);
    });
    stage.replaceChildren(node);
    updateCode(segments);
  }
  function updateCode(segments: SegSpec[]) {
    const lines = segments
      .map((s) => `  <scout-segment value="${s.value}">${s.label}</scout-segment>`)
      .join('\n');
    codePre.textContent =
      `<scout-segmented-control value="${valueInput.value}"${sizeSel.value !== 'default' ? ` size="${sizeSel.value}"` : ''}${disabledChk.checked ? ' disabled' : ''}>\n${lines}\n</scout-segmented-control>`;
  }
  for (const c of [sizeSel, valueInput, countInput, disabledChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Size', 'seg-size', sizeSel),
    ctrlField('Selected value', 'seg-value', valueInput),
    ctrlField('Segment count (2–5)', 'seg-count', countInput),
    el('div', { class: 'ctrl-checks' }, disabledChk),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function segmentedGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Use segmented controls for two to five short, parallel options that fit on one line.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewSegmented({ value: 'list', segments: [{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }, { value: 'kanban', label: 'Kanban' }] }),
          'Use to flip a view of the same dataset (list / grid / kanban). The user sees every option at once and the result updates in place.'),
        doCard(previewSegmented({ value: 'm', size: 'condensed', segments: [{ value: 'm', label: 'Monthly' }, { value: 'q', label: 'Quarterly' }, { value: 'a', label: 'Annual' }] }),
          'Use the condensed size in dense headers — chart selectors, table toolbars, dialog footers.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Don\'t use segmented controls for actions or for long option lists.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewSegmented({ value: 's', segments: [{ value: 's', label: 'Submit' }, { value: 'c', label: 'Cancel' }] }),
          "Don't use a segmented control as a button group. Segments switch a setting; buttons trigger an action."),
        dontCard(previewSegmented({ value: 'a', segments: [{ value: 'a', label: 'Apr' }, { value: 'b', label: 'May' }, { value: 'c', label: 'Jun' }, { value: 'd', label: 'Jul' }, { value: 'e', label: 'Aug' }, { value: 'f', label: 'Sep' }] }),
          "Don't render more than five segments — labels truncate, the active highlight gets ambiguous. Use a dropdown or radios for longer lists."),
      )));
}

function segmentedContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Segment labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Sentence case, short — one to two words. "List", "Grid", "Kanban".'),
        el('li', {}, 'Parallel form across all segments — all nouns, or all timeframes ("Monthly", "Quarterly", "Annual").'),
        el('li', {}, 'Avoid mixing icon-only and text segments. If you use an icon, use one on every segment.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Count'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Two minimum. The component logs a console warning when fewer than two segments are slotted.'),
        el('li', {}, 'Five maximum. Past five, scannability drops and the active pill gets cramped.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Segmented control vs. tabs'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Segmented control — flips a setting in place; the page beneath stays stable.'),
        el('li', {}, 'Tabs — switches between distinct content panels at the same hierarchy.'),
      )));
}

function segmentedAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & labelling'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Container exposes role="radiogroup". Each segment renders as a real <button role="radio"> with aria-checked reflecting state.'),
        el('li', {}, 'Only the selected segment carries tabindex="0" so the group has a single tab stop. Arrow-key cycling within the group is consumer-managed in this iteration.'),
        el('li', {}, 'Disabled segments use the native disabled attribute, so they\'re skipped from the tab order automatically.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & focus'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Selection state is communicated by both color and an elevation lift — never relying on color alone.'),
        el('li', {}, 'A 2px focus ring (interactive primary, offset −2px) appears around the focused segment on keyboard focus.'),
        el('li', {}, 'Hover (cool-gray.100) and pressed (cool-gray.200) backgrounds meet WCAG AA against the label color.'),
      )));
}

function segmentedCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-segmented-control value="list">
  <scout-segment value="list">List</scout-segment>
  <scout-segment value="grid">Grid</scout-segment>
  <scout-segment value="kanban">Kanban</scout-segment>
</scout-segmented-control>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Listening for change'),
      el('pre', { class: 'code-block' },
        `el.addEventListener('scout-segmented-change', (e) => {
  const { value } = e.detail;
  // value === selected segment's value attribute
});`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Language tabs'),
      el('pre', { class: 'code-block' },
        `<!-- Scout language tabs only support English, Spanish, and French.
     The default \`languages\` list is all three; pass a subset to limit the
     picker. Other ISO tags are stripped with a console warning. -->
<scout-language-tabs id="lang" label="Language"></scout-language-tabs>

<script type="module">
  import '@scout/segmented-control';
  const el = document.querySelector('#lang');
  el.languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
  ];
  el.value = 'en';
  el.addEventListener('scout-language-change', (e) => {
    const { value } = e.detail;  // 'en' | 'es' | 'fr'
    // Swap the translation displayed below the picker.
  });
</script>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/segmented-control @scout/tokens lit\n\nimport '@scout/segmented-control';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props — scout-segmented-control'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'value'),    el('td', {}, 'string'), el('td', {}, '""'), el('td', {}, 'Selected segment\'s value.')),
            el('tr', {}, el('td', {}, 'size'),     el('td', {}, '"default" | "condensed"'), el('td', {}, '"default"'), el('td', {}, 'Density preset.')),
            el('tr', {}, el('td', {}, 'disabled'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disables every child segment.')),
          )))),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props — scout-segment'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'value'),    el('td', {}, 'string'), el('td', {}, '""'),  el('td', {}, 'Identifier emitted on selection.')),
            el('tr', {}, el('td', {}, 'disabled'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disables this segment.')),
            el('tr', {}, el('td', {}, 'selected'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Selection state. Set by the parent.')),
          )))),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props — scout-language-tabs'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'label'),     el('td', {}, 'string'),                          el('td', {}, '"Language"'), el('td', {}, 'Optional label rendered above the picker.')),
            el('tr', {}, el('td', {}, 'value'),     el('td', {}, 'string'),                          el('td', {}, '""'),         el('td', {}, 'Selected language tag.')),
            el('tr', {}, el('td', {}, 'size'),      el('td', {}, '"default" | "condensed"'),         el('td', {}, '"default"'),  el('td', {}, 'Density preset; forwarded to the segmented control.')),
            el('tr', {}, el('td', {}, 'disabled'),  el('td', {}, 'boolean'),                         el('td', {}, 'false'),      el('td', {}, 'Disables every language segment.')),
            el('tr', {}, el('td', {}, 'languages'), el('td', {}, 'LanguageTabSpec[] (JS prop)'),     el('td', {}, '[]'),         el('td', {}, 'Array of { value, label, disabled? }.')),
          )))),
  );
}

app.append(componentPage(
  'components-segmented-control',
  'Segmented control',
  'Pill-style group of mutually-exclusive segments. Use when the user must pick exactly one of two to five short options that fit on one line.',
  [
    { id: 'preview', label: 'Preview', content: segmentedPreview() },
    { id: 'controls', label: 'Controls', content: segmentedControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: segmentedGuidelines() },
    { id: 'content', label: 'Content', content: segmentedContent() },
    { id: 'accessibility', label: 'Accessibility', content: segmentedAccessibility() },
    { id: 'code', label: 'Code', content: segmentedCode() },
  ],
));

// =================================================================
// Sensitive data (real Lit component from @scout/sensitive-data)
// =================================================================
import '@scout/sensitive-data';
import type { SensitiveDataLayout } from '@scout/sensitive-data';

interface SDOpts {
  value?: string;
  layout?: SensitiveDataLayout;
  revealed?: boolean;
  disabled?: boolean;
  maskVisibleTail?: number;
}

function previewSensitive(opts: SDOpts = {}): HTMLElement {
  const { value = '123-45-6789', layout = 'icon-label', revealed, disabled, maskVisibleTail } = opts;
  const sd = document.createElement('scout-sensitive-data');
  if (layout) sd.setAttribute('layout', layout);
  if (revealed) sd.setAttribute('revealed', '');
  if (disabled) sd.setAttribute('disabled', '');
  if (typeof maskVisibleTail === 'number') sd.setAttribute('mask-visible-tail', String(maskVisibleTail));
  sd.appendChild(document.createTextNode(value));
  return sd;
}

function sensitivePreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Default — masked at rest',
    'The value is hidden behind dot masks until the user clicks Show. Click again to hide. The toggle labels are always "Show" / "Hide" and cannot be changed.',
    el('div', { class: 'preview-stack preview-stack--inline' },
      previewSensitive({ value: '123-45-6789' }),
      previewSensitive({ value: '123-45-6789', revealed: true }),
    ),
  );

  block(
    'Layouts',
    'Three layouts. Icon + label is the default (most discoverable); icon-only fits dense rows like tables; label-only is for surfaces where iconography would feel decorative.',
    el('div', { class: 'preview-stack' },
      previewSensitive({ value: '4242 4242 4242 4242', layout: 'icon-label' }),
      previewSensitive({ value: '4242 4242 4242 4242', layout: 'icon-only' }),
      previewSensitive({ value: '4242 4242 4242 4242', layout: 'label-only' }),
    ),
  );

  block(
    'Partial reveal — last 4',
    'Set mask-visible-tail to leave the trailing characters un-masked. The classic "····1234" pattern lets the user confirm which card or account they\'re looking at without revealing the full number.',
    el('div', { class: 'preview-stack' },
      previewSensitive({ value: '4242 4242 4242 4242', maskVisibleTail: 4 }),
      previewSensitive({ value: '123-45-6789', maskVisibleTail: 4 }),
    ),
  );

  block(
    'Disabled',
    'Disable the toggle when the user lacks the entitlement to view the value. The mask remains visible; the toggle is dimmed and unclickable.',
    previewSensitive({ value: '123-45-6789', disabled: true }),
  );

  return wrap;
}

function sensitiveControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const layoutSel = ddSelect('sd-layout', ['icon-label', 'icon-only', 'label-only']);
  const valueInput = ctrlText('sd-value', '123-45-6789');
  const tailInput = ctrlText('sd-tail', '0', { type: 'number' });
  const revealedChk = ctrlCheck('sd-revealed', 'Revealed');
  const disabledChk = ctrlCheck('sd-disabled', 'Disabled');

  function render() {
    stage.replaceChildren(previewSensitive({
      value: valueInput.value || ' ',
      layout: layoutSel.value as SensitiveDataLayout,
      revealed: revealedChk.checked,
      disabled: disabledChk.checked,
      maskVisibleTail: Number(tailInput.value) || 0,
    }));
    const attrs: string[] = [`layout="${layoutSel.value}"`];
    if (revealedChk.checked) attrs.push('revealed');
    if (disabledChk.checked) attrs.push('disabled');
    if (Number(tailInput.value) > 0) attrs.push(`mask-visible-tail="${tailInput.value}"`);
    codePre.textContent =
      `<scout-sensitive-data ${attrs.join(' ')}>\n  ${valueInput.value}\n</scout-sensitive-data>`;
  }
  // Reflect user clicks back into the controls so the checkbox stays accurate
  stage.addEventListener('scout-sensitive-data-toggle', (e) => {
    revealedChk.checked = (e as CustomEvent<{ revealed: boolean }>).detail.revealed;
    render();
  });
  for (const c of [layoutSel, valueInput, tailInput, revealedChk, disabledChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Layout', 'sd-layout', layoutSel),
    ctrlField('Value', 'sd-value', valueInput),
    ctrlField('Visible tail (chars)', 'sd-tail', tailInput),
    el('div', { class: 'ctrl-checks' },
      revealedChk,
      disabledChk,
    ),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function sensitiveGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  // We can't easily preview "wrong labels" since the component refuses them,
  // so we render a fake span styled to look like the component for the don't.
  const fakeSensitive = (label: string) => el('span', { class: 'sd-fake' },
    el('span', {}, '••••••••1234'),
    el('button', { class: 'sd-fake__btn', type: 'button' }, label),
  );
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Mask anything that could be misused if seen over the user\'s shoulder.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewSensitive({ value: '4242 4242 4242 4242', maskVisibleTail: 4 }),
          'Mask full card numbers, account numbers, and SSNs by default. Use mask-visible-tail to expose the last four so the user can identify the right record.'),
        doCard(previewSensitive({ value: '123-45-6789', layout: 'icon-only' }),
          'Use the icon-only layout in tables and dense lists. The eye glyph is universal enough to stand alone next to a masked value.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Don\'t alter the toggle copy or use this component for non-sensitive content.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(fakeSensitive('Reveal'),
          "Don't change the toggle labels. They're always \"Show\" / \"Hide\" — \"Reveal\", \"Unmask\", \"View full number\" all break the contract."),
        dontCard(previewSensitive({ value: 'Jamie Tran' }),
          "Don't mask non-sensitive content. Names, generic IDs, and most labels don't need this treatment — masking adds friction without security benefit."),
      )));
}

function sensitiveContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Toggle labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Always "Show" when masked, "Hide" when revealed. Never localize, abbreviate, or substitute synonyms.'),
        el('li', {}, 'The component enforces this: the labels are NOT exposed as a property and cannot be overridden.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Mask character'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Default mask is the bullet character ("•"). Override via mask-char only when the surrounding type doesn\'t render bullets cleanly (some monospace stacks).'),
        el('li', {}, 'The mask preserves the un-masked tail when mask-visible-tail is set. Use 4 for credit cards and SSNs; full mask for usernames and tokens.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'When to use which layout'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Icon + label — forms and detail pages. Most discoverable.'),
        el('li', {}, 'Icon only — table cells, dense rows, repeating elements.'),
        el('li', {}, 'Label only — print-style or accessibility-first surfaces where a glyph would feel decorative.'),
      )));
}

function sensitiveAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & labelling'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The toggle is a real <button type="button"> with aria-pressed reflecting the revealed state.'),
        el('li', {}, 'In icon-only layout, the button carries an aria-label with the current verb ("Show" or "Hide").'),
        el('li', {}, 'The masked string is rendered with aria-hidden so screen readers don\'t announce dot characters; the actual value is in the slot and accessible when revealed.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The toggle is in the natural tab order. Enter or Space toggles the revealed state.'),
        el('li', {}, 'Disabled toggles are skipped from tab order via the native disabled attribute.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & focus'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'A 2px focus ring (interactive primary, offset 2px) appears around the toggle on keyboard focus.'),
        el('li', {}, 'Hover (blue.50) and pressed (blue.100) backgrounds meet WCAG AA contrast against the toggle text.'),
      )));
}

function sensitiveCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-sensitive-data layout="icon-label">
  123-45-6789
</scout-sensitive-data>

<!-- Reveal only the last four characters -->
<scout-sensitive-data layout="icon-label" mask-visible-tail="4">
  4242 4242 4242 4242
</scout-sensitive-data>

<!-- Icon-only for table cells -->
<scout-sensitive-data layout="icon-only">
  123-45-6789
</scout-sensitive-data>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Listening for toggle'),
      el('pre', { class: 'code-block' },
        `el.addEventListener('scout-sensitive-data-toggle', (e) => {
  const { revealed } = e.detail;
  // Audit-log the reveal in apps that require it
});`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/sensitive-data @scout/tokens lit\n\nimport '@scout/sensitive-data';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'revealed'),          el('td', {}, 'boolean'),                                  el('td', {}, 'false'),         el('td', {}, 'Visibility state.')),
            el('tr', {}, el('td', {}, 'layout'),            el('td', {}, '"icon-label" | "icon-only" | "label-only"'), el('td', {}, '"icon-label"'),  el('td', {}, 'Toggle affordance.')),
            el('tr', {}, el('td', {}, 'disabled'),          el('td', {}, 'boolean'),                                  el('td', {}, 'false'),         el('td', {}, 'Disables the toggle.')),
            el('tr', {}, el('td', {}, 'mask-char'),         el('td', {}, 'string'),                                   el('td', {}, '"•"'),           el('td', {}, 'Character used to render the mask.')),
            el('tr', {}, el('td', {}, 'mask-visible-tail'), el('td', {}, 'number'),                                   el('td', {}, '0'),             el('td', {}, 'Trailing characters left un-masked.')),
          )))),
  );
}

app.append(componentPage(
  'components-sensitive-data',
  'Sensitive data',
  'Masks PII (SSN, account number, full card number) by default with a Show / Hide toggle. The toggle copy is fixed — always "Show" / "Hide".',
  [
    { id: 'preview', label: 'Preview', content: sensitivePreview() },
    { id: 'controls', label: 'Controls', content: sensitiveControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: sensitiveGuidelines() },
    { id: 'content', label: 'Content', content: sensitiveContent() },
    { id: 'accessibility', label: 'Accessibility', content: sensitiveAccessibility() },
    { id: 'code', label: 'Code', content: sensitiveCode() },
  ],
));

// =================================================================
// Share with customer (real Lit component from @scout/share-with-customer)
// =================================================================
import '@scout/share-with-customer';
import type { ShareLanguageSpec } from '@scout/share-with-customer';

function previewShareWithCustomer(opts: {
  label?: string;
  languages?: ShareLanguageSpec[];
  body?: string;
}): HTMLElement {
  const sw = document.createElement('scout-share-with-customer') as HTMLElement & {
    languages: ShareLanguageSpec[];
  };
  if (opts.label) sw.setAttribute('label', opts.label);
  if (opts.languages) sw.languages = opts.languages;
  if (opts.body && !opts.languages) sw.appendChild(document.createTextNode(opts.body));
  return sw;
}

function shareWithCustomerPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Default',
    'Body text agent reads aloud to the customer. No language tabs when only one translation is needed.',
    previewShareWithCustomer({
      body: "Hi, I see you're calling about the recent charge on your account. Before I look into the details, can you confirm the last four digits of your card and your billing zip code?",
    }),
  );

  block(
    'With language tabs',
    'Pass a `languages` array — the component renders the language tab picker and swaps the body text when the agent picks a translation.',
    previewShareWithCustomer({
      languages: [
        {
          value: 'en', label: 'English',
          body: "Hi, I see you're calling about the recent charge on your account. Before I look into the details, can you confirm the last four digits of your card and your billing zip code?",
        },
        {
          value: 'es', label: 'Spanish',
          body: 'Hola, veo que llama por un cargo reciente en su cuenta. Antes de revisar los detalles, ¿puede confirmar los últimos cuatro dígitos de su tarjeta y su código postal?',
        },
        {
          value: 'fr', label: 'French',
          body: "Bonjour, je vois que vous appelez au sujet d'un paiement récent sur votre compte. Avant de regarder les détails, pouvez-vous confirmer les quatre derniers chiffres de votre carte et votre code postal ?",
        },
      ],
    }),
  );

  block(
    'Custom label',
    'Override the header label when the message is for a specific moment — "Verify identity", "Quote disclosure", "Closing statement".',
    previewShareWithCustomer({
      label: 'Verify identity',
      body: 'I need to verify your identity before I can discuss this account. Can you confirm the full address on file and the last payment amount?',
    }),
  );

  return wrap;
}

function shareWithCustomerControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const labelInput = ctrlText('sw-label', 'Share with customer');
  const bodyInput = ctrlText(
    'sw-body',
    "Hi, can you confirm the last four digits of your card and your billing zip code?",
  );
  const langsChk = ctrlCheck('sw-langs', 'With language tabs');

  function render() {
    if (langsChk.checked) {
      stage.replaceChildren(previewShareWithCustomer({
        label: labelInput.value,
        languages: [
          { value: 'en', label: 'English', body: bodyInput.value },
          { value: 'es', label: 'Spanish', body: 'Hola, ¿puede confirmar los últimos cuatro dígitos de su tarjeta y su código postal?' },
        ],
      }));
      codePre.textContent = `<scout-share-with-customer id="msg" label="${labelInput.value}"></scout-share-with-customer>\n\n<script type="module">\n  import '@scout/share-with-customer';\n  document.querySelector('#msg').languages = [\n    { value: 'en', label: 'English', body: '${bodyInput.value}' },\n    { value: 'es', label: 'Spanish', body: 'Hola, …' },\n  ];\n</script>`;
    } else {
      stage.replaceChildren(previewShareWithCustomer({ label: labelInput.value, body: bodyInput.value }));
      codePre.textContent = `<scout-share-with-customer label="${labelInput.value}">\n  ${bodyInput.value}\n</scout-share-with-customer>`;
    }
  }
  for (const c of [labelInput, bodyInput, langsChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Label', 'sw-label', labelInput),
    ctrlField('Body', 'sw-body', bodyInput),
    el('div', { class: 'ctrl-checks' }, langsChk),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function shareWithCustomerGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Use share-with-customer for messages the agent reads aloud — disclosures, identity verifications, scripted prompts.'),
      el('div', { class: 'do-dont-grid' },
        doCard(previewShareWithCustomer({
          label: 'Verify identity',
          body: 'Can you confirm the full address on file and the last payment amount?',
        }),
          'Use a clear label that describes the moment ("Verify identity", "Closing statement"). Keep the body conversational — agents read it as-is.'),
        doCard(previewShareWithCustomer({
          languages: [
            { value: 'en', label: 'English', body: 'Hi, how can I help today?' },
            { value: 'es', label: 'Spanish', body: 'Hola, ¿en qué puedo ayudarle hoy?' },
          ],
        }),
          'Add language tabs when the same content needs translation. The agent picks the language and reads aloud.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Don\'t use share-with-customer for agent-only notes or for editable input.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewShareWithCustomer({
          body: 'INTERNAL NOTE: Customer escalated last call; check supervisor flag before continuing.',
        }),
          "Don't put internal notes here. The component contract is \"read aloud\" — internal-only content belongs in a non-customer-facing component (alert, tile body)."),
        dontCard(previewShareWithCustomer({
          body: 'Type the customer\'s confirmation number here:',
        }),
          "Don't use the body as a prompt for input. Use scout-text-field for capture; share-with-customer is read-only."),
      )));
}

function shareWithCustomerContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Body voice'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Write in conversational second person — "Can you confirm…", "I need to verify…".'),
        el('li', {}, 'Avoid stage directions and parentheticals. Agents read the body aloud verbatim; bracketed instructions get spoken too.'),
        el('li', {}, 'Keep it under ~60 words. If a script is longer, split it across two share-with-customer surfaces in sequence.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Label'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Default is "Share with customer"; override with a moment-specific label when the agent benefits from context.'),
        el('li', {}, '"Verify identity", "Quote disclosure", "Closing statement", "Hold message".'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Translations'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Pass `languages: [{ value, label, body }, …]` for built-in language tabs. The component handles the swap.'),
        el('li', {}, 'When only one translation exists, slot the body directly — language tabs aren\'t rendered.'),
      )));
}

function shareWithCustomerAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & labelling'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The surface uses role="note" with the label as its accessible name; screen readers announce the moment first, then the body.'),
        el('li', {}, 'When language tabs are present, the inner scout-language-tabs preserves its radiogroup semantics — the active language is announced.'),
        el('li', {}, 'The icon is decorative and aria-hidden.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & contrast'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Surface uses fill.primary (blue-50) over the border-color blue-100 so the message visibly stands apart from surrounding workflow tile content.'),
        el('li', {}, 'Body text uses text-display-primary, meeting WCAG AA against the blue-50 fill.'),
      )));
}

function shareWithCustomerCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<!-- Single-language: slot the body directly -->
<scout-share-with-customer label="Verify identity">
  Can you confirm the full address on file and the last payment amount?
</scout-share-with-customer>

<!-- With language tabs: pass the languages array -->
<scout-share-with-customer id="opener"></scout-share-with-customer>

<script type="module">
  import '@scout/share-with-customer';
  document.querySelector('#opener').languages = [
    { value: 'en', label: 'English', body: 'Hi, how can I help today?' },
    { value: 'es', label: 'Spanish', body: 'Hola, ¿en qué puedo ayudarle hoy?' },
    { value: 'fr', label: 'French',  body: 'Bonjour, comment puis-je vous aider aujourd\'hui ?' },
  ];
</script>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Listening for language change'),
      el('pre', { class: 'code-block' },
        `el.addEventListener('scout-share-language-change', (e) => {
  const { value } = e.detail;  // 'en' | 'es' | 'zh' | …
  // log which translation the agent read to the customer
});`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/share-with-customer @scout/segmented-control @scout/tokens lit\n\nimport '@scout/share-with-customer';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'label'),     el('td', {}, 'string'),                  el('td', {}, '"Share with customer"'), el('td', {}, 'Header label.')),
            el('tr', {}, el('td', {}, 'value'),     el('td', {}, 'string'),                  el('td', {}, '""'),                    el('td', {}, 'Currently-selected language tag.')),
            el('tr', {}, el('td', {}, 'languages'), el('td', {}, 'ShareLanguageSpec[] (JS prop)'), el('td', {}, '[]'),               el('td', {}, 'Translations: { value, label, body, disabled? }.')),
          )))),
  );
}

app.append(componentPage(
  'components-share-with-customer',
  'Share with customer',
  'Agent-facing message displayed inside a workflow tile. The body text is intended to be read aloud to the customer; supports an optional language tab picker for translations.',
  [
    { id: 'preview', label: 'Preview', content: shareWithCustomerPreview() },
    { id: 'controls', label: 'Controls', content: shareWithCustomerControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: shareWithCustomerGuidelines() },
    { id: 'content', label: 'Content', content: shareWithCustomerContent() },
    { id: 'accessibility', label: 'Accessibility', content: shareWithCustomerAccessibility() },
    { id: 'code', label: 'Code', content: shareWithCustomerCode() },
  ],
));

// =================================================================
// Show more (real Lit component from @scout/show-more)
// =================================================================
import '@scout/show-more';
import type { ShowMoreSize } from '@scout/show-more';

interface ShowMoreOpts {
  expanded?: boolean;
  size?: ShowMoreSize;
  showLabel?: string;
  hideLabel?: string;
  disabled?: boolean;
}

function previewShowMore(opts: ShowMoreOpts = {}): HTMLElement {
  const sm = document.createElement('scout-show-more');
  if (opts.expanded) sm.setAttribute('expanded', '');
  if (opts.size) sm.setAttribute('size', opts.size);
  if (opts.showLabel) sm.setAttribute('show-label', opts.showLabel);
  if (opts.hideLabel) sm.setAttribute('hide-label', opts.hideLabel);
  if (opts.disabled) sm.setAttribute('disabled', '');
  return sm;
}

/** A self-contained truncating wrapper that hooks the show-more toggle to a clamped body. */
function showMoreDemoBody(text: string): HTMLElement {
  const wrap = el('div', { class: 'show-more-demo' });
  const body = el('div', { class: 'show-more-demo__body' }, text);
  const toggle = previewShowMore({});
  toggle.addEventListener('scout-show-more-toggle', (e) => {
    const { expanded } = (e as CustomEvent<{ expanded: boolean }>).detail;
    body.classList.toggle('show-more-demo__body--expanded', expanded);
  });
  wrap.append(body, toggle);
  return wrap;
}

function showMorePreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Default',
    'Click the toggle to expand or collapse. The chevron rotates 180° on expand; the label switches between "Show more" and "Show less".',
    el('div', { class: 'preview-stack' },
      previewShowMore({}),
      previewShowMore({ expanded: true }),
    ),
  );

  block(
    'Sizes',
    'Default for primary surfaces (cards, tiles, body content). Condensed for table rows and dense lists where vertical space is constrained.',
    el('div', { class: 'preview-stack' },
      previewShowMore({ size: 'default' }),
      previewShowMore({ size: 'condensed' }),
    ),
  );

  block(
    'In a card',
    'The Card component composes scout-show-more under the hood when its show-more attribute is set. Click "Show more" to see the truncated body expand.',
    (() => {
      const c = document.createElement('scout-card');
      c.setAttribute('background', 'cool-gray-100');
      c.setAttribute('ai-callout', '');
      c.setAttribute('show-more', '');
      c.appendChild(document.createTextNode(
        'Customer mentioned a recurring charge issue. Last call was 2 days ago. Identity verified. ' +
        'Customer was guided through the dispute flow and submitted a formal dispute, which is now ' +
        'with underwriting. The expected resolution window is 5–7 business days; the customer was ' +
        'told to expect an email when the dispute clears or when additional documentation is needed.',
      ));
      return c;
    })(),
  );

  block(
    'Standalone — clamped paragraph',
    'Outside of Card, you can wire the toggle to your own height-clamped body. The component manages its own state and emits scout-show-more-toggle so consumers can toggle their layout.',
    showMoreDemoBody(
      'Scout is the design system that powers Ember, Snag, and several internal tools at the company. It ' +
      'standardizes color, type, spacing, motion, and z-index — and ships a small library of web components ' +
      'that consume those tokens. Components live in their own packages so product teams can pull only what ' +
      'they need; the core is published privately to npm. Density and theme are scoped via data-attributes ' +
      'on the root element so a single page can host multiple themed surfaces.',
    ),
  );

  block(
    'Disabled',
    'Disabled state stays in the tab order semantics (skipped via disabled attribute). Use this when an action is gated, e.g., during loading.',
    previewShowMore({ disabled: true }),
  );

  return wrap;
}

function showMoreControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const sizeSel = ddSelect('sm-size', ['default', 'condensed']);
  const showInput = ctrlText('sm-show', 'Show more');
  const hideInput = ctrlText('sm-hide', 'Show less');
  const expandedChk = ctrlCheck('sm-expanded', 'Expanded');
  const disabledChk = ctrlCheck('sm-disabled', 'Disabled');

  // The two label inputs gate by Expanded — only the visible label applies
  // at any given moment. Show label = collapsed; Hide label = expanded.
  const showField = ctrlField('Show label', 'sm-show', showInput);
  const hideField = ctrlField('Hide label', 'sm-hide', hideInput);

  function render() {
    setFieldDisabled(showField, showInput,  expandedChk.checked);
    setFieldDisabled(hideField, hideInput, !expandedChk.checked);

    stage.replaceChildren(previewShowMore({
      size: sizeSel.value as ShowMoreSize,
      showLabel: showInput.value,
      hideLabel: hideInput.value,
      expanded: expandedChk.checked,
      disabled: disabledChk.checked,
    }));
    const attrs: string[] = [];
    if (sizeSel.value !== 'default') attrs.push(`size="${sizeSel.value}"`);
    if (showInput.value !== 'Show more') attrs.push(`show-label="${showInput.value}"`);
    if (hideInput.value !== 'Show less') attrs.push(`hide-label="${hideInput.value}"`);
    if (expandedChk.checked) attrs.push('expanded');
    if (disabledChk.checked) attrs.push('disabled');
    codePre.textContent = `<scout-show-more${attrs.length ? ' ' + attrs.join(' ') : ''}></scout-show-more>`;
  }
  // Sync the live preview clicks back into the controls
  stage.addEventListener('scout-show-more-toggle', (e) => {
    expandedChk.checked = (e as CustomEvent<{ expanded: boolean }>).detail.expanded;
    render();
  });
  for (const c of [sizeSel, showInput, hideInput, expandedChk, disabledChk]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Size', 'sm-size', sizeSel),
    showField,
    hideField,
    el('div', { class: 'ctrl-checks' },
      expandedChk,
      disabledChk,
    ),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function showMoreGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Use show-more to keep dense surfaces compact while leaving the full content one click away.'),
      el('div', { class: 'do-dont-grid' },
        doCard(showMoreDemoBody('Long-form summary that gets clamped after three lines and reveals on demand. The user can scan the surface without losing their place; the rest is visible after a single tap.'),
          'Use it inside cards and tiles for AI summaries and call notes. Pair with a 3-line height clamp so the truncation is predictable.'),
        doCard(previewShowMore({ size: 'condensed' }),
          'Use the condensed size in data-table rows where every vertical pixel matters.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Avoid using show-more in places where the user expects everything to be visible.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewShowMore({ showLabel: 'Read more', hideLabel: 'Read less' }),
          "Don't change the labels casually. Stick with \"Show more\" / \"Show less\" unless you have a strong product reason — varied copy across surfaces erodes muscle memory."),
        dontCard(previewShowMore({}),
          "Don't use show-more for primary calls to action. It's a disclosure affordance, not a button — never use it to submit, save, or navigate."),
      )));
}

function showMoreContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Default labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, '"Show more" when collapsed, "Show less" when expanded.'),
        el('li', {}, 'Sentence case in English. Localize via the show-label / hide-label attributes.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Custom labels'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Override only when context demands it — e.g., "Show all 12 items" → "Show fewer".'),
        el('li', {}, 'Keep the verb consistent across both states. "Show / Hide" or "Expand / Collapse", not a mix.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Placement'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Place the toggle at the bottom of the truncated content, left-aligned with the body.'),
        el('li', {}, 'Inside Card, the show-more attribute handles placement automatically.'),
      )));
}

function showMoreAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & labelling'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The toggle is a real <button type="button"> with aria-expanded reflecting the open state.'),
        el('li', {}, 'The visible label ("Show more" / "Show less") doubles as the accessible name; no extra aria-label needed.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Tab moves focus to the toggle. Enter or Space toggles the state.'),
        el('li', {}, 'Disabled toggles are skipped from the tab order via the native disabled attribute.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & focus'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Default text uses interactive primary; hover adds an underline; pressed shifts to blue.700.'),
        el('li', {}, '2px focus ring (interactive primary, offset 2px) on keyboard focus.'),
        el('li', {}, 'Chevron rotation honors prefers-reduced-motion via the upstream tokens.'),
      )));
}

function showMoreCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el('pre', { class: 'code-block' },
        `<scout-show-more></scout-show-more>

<!-- Condensed for tables -->
<scout-show-more size="condensed"></scout-show-more>

<!-- Custom labels -->
<scout-show-more show-label="Show all 12" hide-label="Show fewer"></scout-show-more>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Listening for toggle'),
      el('pre', { class: 'code-block' },
        `el.addEventListener('scout-show-more-toggle', (e) => {
  const { expanded } = e.detail;
  // Toggle the height clamp on your body element
});`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Used inside Card'),
      el('pre', { class: 'code-block' },
        `<!-- Card composes scout-show-more under the hood -->
<scout-card background="cool-gray-100" ai-callout show-more>
  Long-form summary text that gets clamped to ~3 lines.
</scout-card>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/show-more @scout/tokens lit\n\nimport '@scout/show-more';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'expanded'),    el('td', {}, 'boolean'),                el('td', {}, 'false'),     el('td', {}, 'Open/closed state.')),
            el('tr', {}, el('td', {}, 'size'),        el('td', {}, '"default" | "condensed"'),el('td', {}, '"default"'), el('td', {}, 'Density preset.')),
            el('tr', {}, el('td', {}, 'show-label'),  el('td', {}, 'string'),                 el('td', {}, '"Show more"'),el('td', {}, 'Label rendered when collapsed.')),
            el('tr', {}, el('td', {}, 'hide-label'),  el('td', {}, 'string'),                 el('td', {}, '"Show less"'),el('td', {}, 'Label rendered when expanded.')),
            el('tr', {}, el('td', {}, 'disabled'),    el('td', {}, 'boolean'),                el('td', {}, 'false'),     el('td', {}, 'Disables the toggle.')),
          )))),
  );
}

app.append(componentPage(
  'components-show-more',
  'Show more',
  'Collapse / expand toggle used inside cards, tiles, and data-table rows to reveal additional content. Default and condensed sizes.',
  [
    { id: 'preview', label: 'Preview', content: showMorePreview() },
    { id: 'controls', label: 'Controls', content: showMoreControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: showMoreGuidelines() },
    { id: 'content', label: 'Content', content: showMoreContent() },
    { id: 'accessibility', label: 'Accessibility', content: showMoreAccessibility() },
    { id: 'code', label: 'Code', content: showMoreCode() },
  ],
));

// =================================================================
// Skeleton loader (real Lit component from @scout/skeleton)
// =================================================================
import '@scout/skeleton';
import type { SkeletonShape } from '@scout/skeleton';

interface SkOpts {
  shape?: SkeletonShape;
  width?: string;
  height?: string;
  radius?: string;
  style?: string;
}

function previewSkeleton(opts: SkOpts = {}): HTMLElement {
  const sk = document.createElement('scout-skeleton');
  if (opts.shape) sk.setAttribute('shape', opts.shape);
  if (opts.width) sk.setAttribute('width', opts.width);
  if (opts.height) sk.setAttribute('height', opts.height);
  if (opts.radius) sk.setAttribute('radius', opts.radius);
  if (opts.style) sk.setAttribute('style', opts.style);
  return sk;
}

function skeletonPreview(): HTMLElement {
  const wrap = el('div', { class: 'tab-content' });
  const block = (heading: string, lede: string, content: HTMLElement) => {
    wrap.append(el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    ));
  };

  block(
    'Shape presets',
    'Three presets cover the common cases. Use line for text rows, block for cards or images, and circle for avatars and dots.',
    el('div', { class: 'preview-stack' },
      previewSkeleton({ shape: 'line' }),
      previewSkeleton({ shape: 'block' }),
      previewSkeleton({ shape: 'circle' }),
    ),
  );

  block(
    'Custom dimensions',
    'Override width / height / radius via attributes for any custom shape — a thumbnail strip, a tag chip, a button placeholder.',
    el('div', { class: 'preview-stack' },
      previewSkeleton({ width: '60%', height: '24px' }),
      previewSkeleton({ width: '120px', height: '32px', radius: 'var(--scout-radius-4)' }),
      previewSkeleton({ width: '320px', height: '180px', radius: 'var(--scout-radius-8)' }),
    ),
  );

  // Compose realistic loading layouts so the reader sees the component in context.
  block(
    'Card placeholder',
    'A typical AI-summary card while the LLM response is in flight: a thin meta line, a title row, and three body lines clamped at three.',
    el('div', { class: 'skeleton-demo-card' },
      previewSkeleton({ shape: 'line', style: 'width: 30%; height: 12px;' }),
      previewSkeleton({ shape: 'line', style: 'width: 80%; height: 18px; margin-top: 12px;' }),
      previewSkeleton({ shape: 'line', style: 'margin-top: 12px;' }),
      previewSkeleton({ shape: 'line', style: 'margin-top: 8px;' }),
      previewSkeleton({ shape: 'line', style: 'width: 70%; margin-top: 8px;' }),
    ),
  );

  block(
    'Row of avatars + names',
    'Combines a circle for the avatar with two line skeletons for the name and supporting text. Pattern repeats for every loading row.',
    el('div', { class: 'skeleton-demo-list' },
      ...[1, 2, 3].map(() =>
        el('div', { class: 'skeleton-demo-row' },
          previewSkeleton({ shape: 'circle' }),
          el('div', { class: 'skeleton-demo-row__text' },
            previewSkeleton({ shape: 'line', style: 'width: 40%; height: 14px;' }),
            previewSkeleton({ shape: 'line', style: 'width: 65%; height: 12px; margin-top: 8px;' }),
          ),
        ),
      ),
    ),
  );

  return wrap;
}

function skeletonControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });
  const stage = el('div', { class: 'preview-stage preview-stage--block' });
  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

  const shapeSel = ddSelect('sk-shape', ['line', 'block', 'circle']);
  const widthInput = ctrlText('sk-width', '');
  const heightInput = ctrlText('sk-height', '');
  const radiusInput = ctrlText('sk-radius', '');

  function render() {
    stage.replaceChildren(previewSkeleton({
      shape: shapeSel.value as SkeletonShape,
      width: widthInput.value || undefined,
      height: heightInput.value || undefined,
      radius: radiusInput.value || undefined,
    }));
    const attrs: string[] = [`shape="${shapeSel.value}"`];
    if (widthInput.value) attrs.push(`width="${widthInput.value}"`);
    if (heightInput.value) attrs.push(`height="${heightInput.value}"`);
    if (radiusInput.value) attrs.push(`radius="${radiusInput.value}"`);
    codePre.textContent = `<scout-skeleton ${attrs.join(' ')}></scout-skeleton>`;
  }
  for (const c of [shapeSel, widthInput, heightInput, radiusInput]) {
    c.addEventListener('input', render);
    c.addEventListener('change', render);
  }
  const ctrlField = (l: string, f: string, c: HTMLElement) =>
    el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Shape', 'sk-shape', shapeSel),
    ctrlField('Width (CSS length)', 'sk-width', widthInput),
    ctrlField('Height (CSS length)', 'sk-height', heightInput),
    ctrlField('Radius (CSS length)', 'sk-radius', radiusInput),
  );
  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
    el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
  queueMicrotask(render);
  return wrap;
}

function skeletonGuidelines(): HTMLElement {
  const doCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  const dontCard = (p: HTMLElement, c: string) =>
    el('div', { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
      el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
      el('p', {}, c));
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
      el('p', { class: 'preview-block__lede' }, 'Use skeletons to mirror the shape of incoming content so the layout doesn\'t shift when it lands.'),
      el('div', { class: 'do-dont-grid' },
        doCard(el('div', { class: 'skeleton-demo-card' },
          previewSkeleton({ shape: 'line', style: 'width: 30%; height: 12px;' }),
          previewSkeleton({ shape: 'line', style: 'width: 80%; height: 18px; margin-top: 12px;' }),
          previewSkeleton({ shape: 'line', style: 'margin-top: 12px;' }),
          previewSkeleton({ shape: 'line', style: 'width: 70%; margin-top: 8px;' }),
        ),
          'Match the eventual content layout — same column count, same line breaks. Reserves the exact space the real content will occupy.'),
        doCard(el('div', { class: 'skeleton-demo-row' },
          previewSkeleton({ shape: 'circle' }),
          el('div', { class: 'skeleton-demo-row__text' },
            previewSkeleton({ shape: 'line', style: 'width: 40%; height: 14px;' }),
            previewSkeleton({ shape: 'line', style: 'width: 65%; height: 12px; margin-top: 8px;' }),
          ),
        ),
          'Compose primitives. A row is just a circle plus two lines; a table cell is a line of the right width. Don\'t reach for a custom skeleton for every layout.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
      el('p', { class: 'preview-block__lede' }, 'Avoid using skeletons for short waits or for content the user can\'t do anything about.'),
      el('div', { class: 'do-dont-grid' },
        dontCard(previewSkeleton({ shape: 'block', style: 'height: 32px;' }),
          "Don't render a skeleton for waits under ~300ms. The animation flashes more than it informs — better to render the empty state."),
        dontCard(el('div', {},
          previewSkeleton({ shape: 'line', style: 'width: 60px;' }),
          previewSkeleton({ shape: 'line', style: 'width: 30%; margin-top: 6px;' }),
        ),
          "Don't size skeletons that don't match the eventual content. A short skeleton followed by long real content causes the layout shift the component is meant to prevent."),
      )));
}

function skeletonContent(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'When to use'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Use for any content that takes longer than ~300ms to load and has a known shape.'),
        el('li', {}, 'Use for cards, lists, tables, and avatar / image regions.'),
        el('li', {}, 'Use for AI-generated content while the model streams a response — the skeleton fades to text as tokens arrive.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'When not to use'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'For waits under ~300ms — a flicker hurts more than it helps.'),
        el('li', {}, 'For unknown-shape content — use an indeterminate spinner instead.'),
        el('li', {}, 'For background work the user can\'t see — use the snackbar component.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Composition'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Build complex placeholders by composing the three presets — circle + two lines = a list row, three lines = a paragraph.'),
        el('li', {}, 'Match the dimensions of the real content as closely as possible to prevent layout shift on swap.'),
      )));
}

function skeletonAccessibility(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Roles & status'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'The skeleton is a role="status" region with aria-busy="true" and aria-live="polite", so screen readers announce "Loading" once.'),
        el('li', {}, 'When the real content lands, remove the skeleton from the DOM — don\'t hide it with display:none. The status region is dropped, the live region settles, the user moves on.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Motion'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Shimmer cycle uses motion-duration-deliberate (1200ms) — slow enough to feel calm, fast enough to confirm activity.'),
        el('li', {}, 'When the user has prefers-reduced-motion: reduce, the shimmer is dropped and the skeleton renders as a flat fill.'),
      )),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color'),
      el('ul', { class: 'guideline-list' },
        el('li', {}, 'Resting fill is cool-gray.100; the shimmer pass is cool-gray.200 — both meet WCAG decorative-content criteria.'),
        el('li', {}, 'On dark surfaces, override --scout-skeleton-base and --scout-skeleton-shimmer to a darker pair.'),
      )));
}

function skeletonCode(): HTMLElement {
  return el('div', { class: 'tab-content guidelines-layout' },
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Shape presets'),
      el('pre', { class: 'code-block' },
        `<scout-skeleton shape="line"></scout-skeleton>
<scout-skeleton shape="block"></scout-skeleton>
<scout-skeleton shape="circle"></scout-skeleton>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Custom dimensions'),
      el('pre', { class: 'code-block' },
        `<scout-skeleton width="60%" height="24px"></scout-skeleton>
<scout-skeleton width="120px" height="32px" radius="var(--scout-radius-4)"></scout-skeleton>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Composing a list row'),
      el('pre', { class: 'code-block' },
        `<div style="display: flex; gap: 12px; align-items: flex-start;">
  <scout-skeleton shape="circle"></scout-skeleton>
  <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
    <scout-skeleton shape="line" width="40%"></scout-skeleton>
    <scout-skeleton shape="line" width="65%" height="12px"></scout-skeleton>
  </div>
</div>`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Theming'),
      el('pre', { class: 'code-block' },
        `/* Tint the skeleton on a dark surface */
.dark-card scout-skeleton {
  --scout-skeleton-base: var(--scout-color-cool-gray-700);
  --scout-skeleton-shimmer: var(--scout-color-cool-gray-600);
}`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Install / register'),
      el('pre', { class: 'code-block' }, `pnpm add @scout/skeleton @scout/tokens lit\n\nimport '@scout/skeleton';`)),
    el('section', { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el('div', { class: 'props-table-wrap' },
        el('table', { class: 'props-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'shape'),  el('td', {}, '"line" | "block" | "circle"'), el('td', {}, '"line"'), el('td', {}, 'Convenience preset.')),
            el('tr', {}, el('td', {}, 'width'),  el('td', {}, 'string (CSS length)'),         el('td', {}, '""'),     el('td', {}, 'Width override.')),
            el('tr', {}, el('td', {}, 'height'), el('td', {}, 'string (CSS length)'),         el('td', {}, '""'),     el('td', {}, 'Height override.')),
            el('tr', {}, el('td', {}, 'radius'), el('td', {}, 'string (CSS length)'),         el('td', {}, '""'),     el('td', {}, 'Border-radius override.')),
          )))),
  );
}

app.append(componentPage(
  'components-skeleton',
  'Skeleton loader',
  'Animated placeholder shape that reserves space while content is loading. Three preset shapes (line, block, circle) plus full attribute overrides.',
  [
    { id: 'preview', label: 'Preview', content: skeletonPreview() },
    { id: 'controls', label: 'Controls', content: skeletonControls() },
    { id: 'guidelines', label: 'Usage guidelines', content: skeletonGuidelines() },
    { id: 'content', label: 'Content', content: skeletonContent() },
    { id: 'accessibility', label: 'Accessibility', content: skeletonAccessibility() },
    { id: 'code', label: 'Code', content: skeletonCode() },
  ],
));

// =================================================================
// PATTERNS
// =================================================================
import '@scout/anchor-links';

{
  const grid = el(
    'div',
    { class: 'foundation-grid' },
    overviewTile({
      title: 'Anchor links',
      summary: 'Vertical menu that links to in-page sections. Auto-scroll mode highlights the active section as the user scrolls; manual mode is click-only.',
      href: 'patterns-anchor-links',
    }),
    overviewTile({ title: 'Data display',      summary: 'Lists, tables, and grids for showing structured records at scale. Sorting, density, empty + loading states.', comingSoon: true }),
    overviewTile({
      title: 'Data table',
      summary: 'Rows and columns of structured data. Optional table / section / column headers, expandable rows, selectable rows, and a paginated or show-more footer.',
      href: 'patterns-data-table',
    }),
    overviewTile({ title: 'Data viz',         summary: 'Charts and visualizations for trends, comparisons, and distributions. Tokenized colors, accessible legends, responsive sizing.', comingSoon: true }),
    overviewTile({ title: 'Filter',           summary: 'Faceted filter rail + chip summary. Multi-select, date ranges, clear-all.', comingSoon: true }),
    overviewTile({ title: 'Form',             summary: 'Field grouping, inline validation, submission states, error summaries.', comingSoon: true }),
    overviewTile({ title: 'Search',           summary: 'Global search input + result list. Type-ahead, keyboard navigation, recent queries.', comingSoon: true }),
  );
  app.append(
    page(
      'patterns-overview',
      categoryBanner(
        'Patterns',
        'Combinations of components that solve recurring UX problems. Cross-product patterns live in core; product-specific patterns live in product repos and can be promoted upward.',
      ),
      grid,
    ),
  );
}

// -----------------------------------------------------------------
// Anchor links pattern — uses the same six-tab componentPage template as
// every component (Preview / Controls / Usage guidelines / Content /
// Accessibility / Code). Patterns and components share this scaffold so
// the two are interchangeable from the docs reader's perspective.
// -----------------------------------------------------------------
{
  type AnchorItem = { id: string; label: string; disabled?: boolean };
  type AnchorMode = 'auto-scroll' | 'manual';

  function makeAnchorLinks(opts: {
    mode: AnchorMode;
    items: AnchorItem[];
    active?: string;
    scrollRoot?: string;
  }): HTMLElement {
    const al = document.createElement('scout-anchor-links') as HTMLElement & {
      mode: string;
      items: AnchorItem[];
      active: string;
      scrollRoot: string;
    };
    al.setAttribute('mode', opts.mode);
    al.items = opts.items;
    if (opts.active) al.setAttribute('active', opts.active);
    if (opts.scrollRoot) al.setAttribute('scroll-root', opts.scrollRoot);
    if (opts.mode === 'manual') al.setAttribute('prevent-scroll', '');
    return al;
  }

  /** Demo body with five labeled sections so auto-scroll has something to track. */
  function demoBody(prefix: string): HTMLElement {
    const sections = [
      { id: `${prefix}-overview`,    title: 'Overview',    body: 'High-level introduction to the topic. Two or three sentences set context for the rest of the page. The user lands here first.' },
      { id: `${prefix}-billing`,     title: 'Billing',     body: 'Account-level billing summary. Cards on file, autopay status, and recent statements. This section is normally the longest.' },
      { id: `${prefix}-payments`,    title: 'Payments',    body: 'History of payments made on the account. Filters for date range, status, and amount. Linkable rows lead to payment detail.' },
      { id: `${prefix}-disputes`,    title: 'Disputes',    body: 'Open and resolved disputes. Each row shows status, amount, and last action. Critical disputes are flagged with a badge.' },
      { id: `${prefix}-preferences`, title: 'Preferences', body: 'Customer-facing communication preferences: email, SMS, paper. Changes here propagate immediately to all downstream channels.' },
    ];
    const wrap = el('div', { class: 'pattern-demo-body', id: `${prefix}-scroll-root` });
    for (const s of sections) {
      wrap.append(
        el('section', { id: s.id, class: 'pattern-demo-section' },
          el('h3', {}, s.title),
          el('p', {}, s.body),
          el('p', {}, s.body),
          el('p', {}, s.body),
        ),
      );
    }
    return wrap;
  }

  const previewBlock = (heading: string, lede: string, content: HTMLElement) =>
    el('div', { class: 'preview-block' },
      el('h3', { class: 'preview-block__title' }, heading),
      el('p', { class: 'preview-block__lede' }, lede),
      el('div', { class: 'preview-row preview-row--block' }, content),
    );

  // ----- Preview tab -----
  function anchorLinksPreview(): HTMLElement {
    const wrap = el('div', { class: 'tab-content' });

    const items: AnchorItem[] = [
      { id: 'al-demo-overview',    label: 'Overview' },
      { id: 'al-demo-billing',     label: 'Billing' },
      { id: 'al-demo-payments',    label: 'Payments' },
      { id: 'al-demo-disputes',    label: 'Disputes' },
      { id: 'al-demo-preferences', label: 'Preferences' },
    ];
    const itemsManual: AnchorItem[] = items.map((i) => ({ ...i, id: i.id.replace('al-demo', 'al-manual') }));

    wrap.append(
      previewBlock(
        'Auto-scroll',
        'As the user scrolls the body, the active tab is automatically highlighted. Clicking a tab smooth-scrolls to its section.',
        el('div', { class: 'pattern-demo' },
          makeAnchorLinks({ mode: 'auto-scroll', items, active: 'al-demo-overview', scrollRoot: '#al-demo-scroll-root' }),
          demoBody('al-demo'),
        ),
      ),
      previewBlock(
        'Manual (not auto-scroll)',
        'The user must click a tab to navigate; the active tab updates only on click. Use this when sections are long-form or not vertically stacked.',
        el('div', { class: 'pattern-demo' },
          makeAnchorLinks({ mode: 'manual', items: itemsManual, active: 'al-manual-overview', scrollRoot: '#al-manual-scroll-root' }),
          demoBody('al-manual'),
        ),
      ),
      previewBlock(
        'Tab label states',
        'Hover, focus, and pressed all use blue.50 / blue.100 backgrounds. The selected tab carries a 2px left rail in the interactive primary color and shifts its label to interactive primary. Disabled tabs are dimmed and pointer-blocked.',
        el('div', { class: 'pattern-states-grid' },
          el('div', {},
            el('p', { class: 'preview-block__lede' }, 'Default — none active'),
            makeAnchorLinks({ mode: 'manual', items: [
              { id: 'al-states-1a', label: 'Account summary' },
              { id: 'al-states-1b', label: 'Statements' },
              { id: 'al-states-1c', label: 'Payments' },
            ]}),
          ),
          el('div', {},
            el('p', { class: 'preview-block__lede' }, 'Selected — second tab'),
            makeAnchorLinks({ mode: 'manual', items: [
              { id: 'al-states-2a', label: 'Account summary' },
              { id: 'al-states-2b', label: 'Statements' },
              { id: 'al-states-2c', label: 'Payments' },
            ], active: 'al-states-2b' }),
          ),
          el('div', {},
            el('p', { class: 'preview-block__lede' }, 'Disabled — third tab'),
            makeAnchorLinks({ mode: 'manual', items: [
              { id: 'al-states-3a', label: 'Account summary' },
              { id: 'al-states-3b', label: 'Statements' },
              { id: 'al-states-3c', label: 'Disputes', disabled: true },
            ], active: 'al-states-3a' }),
          ),
        ),
      ),
    );

    return wrap;
  }

  // ----- Controls tab -----
  function anchorLinksControls(): HTMLElement {
    const wrap = el('div', { class: 'tab-content controls-layout' });
    const stage = el('div', { class: 'preview-stage preview-stage--block' });
    const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;

    const modeSel = ddSelect('al-mode', ['auto-scroll', 'manual']);
    const countInput = ctrlText('al-count', '5', { type: 'number' });
    const activeInput = ctrlText('al-active', '1', { type: 'number' });
    const disableLastChk = ctrlCheck('al-disable', 'Disable last item');

    function render() {
      stage.replaceChildren();
      const count = Math.max(2, Math.min(8, Number(countInput.value) || 5));
      const activeIdx = Math.max(1, Math.min(count, Number(activeInput.value) || 1));
      const labels = ['Overview', 'Billing', 'Payments', 'Disputes', 'Preferences', 'Statements', 'Disclosures', 'Activity'];
      const items: AnchorItem[] = Array.from({ length: count }, (_, i) => ({
        id: `al-ctrl-${i}`,
        label: labels[i] ?? `Section ${i + 1}`,
        disabled: disableLastChk.checked && i === count - 1,
      }));
      stage.append(
        el('div', { class: 'pattern-demo' },
          makeAnchorLinks({
            mode: modeSel.value as AnchorMode,
            items,
            active: items[activeIdx - 1]?.id,
            scrollRoot: '#al-ctrl-scroll-root',
          }),
          (() => {
            const body = el('div', { class: 'pattern-demo-body', id: 'al-ctrl-scroll-root' });
            for (const it of items) {
              body.append(
                el('section', { id: it.id, class: 'pattern-demo-section' },
                  el('h3', {}, it.label),
                  el('p', {}, 'Section body. The auto-scroll mode highlights this tab when the section enters the upper third of the scroll container.'),
                  el('p', {}, 'Section body. The auto-scroll mode highlights this tab when the section enters the upper third of the scroll container.'),
                ),
              );
            }
            return body;
          })(),
        ),
      );

      const itemsLines = items
        .map((it) => `    { id: '${it.id}', label: '${it.label}'${it.disabled ? ', disabled: true' : ''} },`)
        .join('\n');
      codePre.textContent =
        `<scout-anchor-links id="links" mode="${modeSel.value}"${modeSel.value === 'manual' ? ' prevent-scroll' : ''}></scout-anchor-links>\n\n` +
        `<script type="module">\n  import '@scout/anchor-links';\n  const el = document.querySelector('#links');\n  el.items = [\n${itemsLines}\n  ];\n  el.active = '${items[activeIdx - 1]?.id ?? ''}';\n</script>`;
    }
    for (const c of [modeSel, countInput, activeInput, disableLastChk]) {
      c.addEventListener('input', render);
      c.addEventListener('change', render);
    }
    const ctrlField = (l: string, f: string, c: HTMLElement) =>
      el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
    const panel = el('div', { class: 'ctrl-panel' },
      el('h3', { class: 'preview-block__title' }, 'Properties'),
      ctrlField('Mode', 'al-mode', modeSel),
      ctrlField('Item count', 'al-count', countInput),
      ctrlField('Active item (1-based)', 'al-active', activeInput),
      el('div', { class: 'ctrl-checks' }, disableLastChk),
    );
    wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage,
      el('div', { class: 'code-wrap' }, el('h3', { class: 'preview-block__title' }, 'Code'), codePre)));
    queueMicrotask(render);
    return wrap;
  }

  // ----- Guidelines tab -----
  function anchorLinksGuidelines(): HTMLElement {
    const items: AnchorItem[] = [
      { id: 'al-do-1a', label: 'Overview' },
      { id: 'al-do-1b', label: 'Billing' },
      { id: 'al-do-1c', label: 'Payments' },
    ];
    const longList: AnchorItem[] = Array.from({ length: 14 }, (_, i) => ({
      id: `al-dont-${i}`,
      label: `Section ${i + 1}`,
    }));
    const doCard = (p: HTMLElement, c: string) =>
      el('div', { class: 'do-card' },
        el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
        el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
        el('p', {}, c));
    const dontCard = (p: HTMLElement, c: string) =>
      el('div', { class: 'dont-card' },
        el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
        el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
        el('p', {}, c));
    return el('div', { class: 'tab-content guidelines-layout' },
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
        el('p', { class: 'preview-block__lede' }, 'Use anchor links for long-form pages with three or more clearly named sections.'),
        el('div', { class: 'do-dont-grid' },
          doCard(makeAnchorLinks({ mode: 'auto-scroll', items, active: 'al-do-1a' }),
            'Use auto-scroll when the page is a continuous reading flow — settings, account detail, policies. The active tab tracks the user as they scroll.'),
          doCard(makeAnchorLinks({ mode: 'manual', items: items.map((i) => ({ ...i, id: i.id + '-m' })), active: 'al-do-1b-m' }),
            'Use manual mode when sections live in tabs, modals, or drawers — anywhere a single visual scroll doesn\'t exist.'),
        )),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
        el('p', { class: 'preview-block__lede' }, 'Avoid using anchor links as a substitute for primary navigation.'),
        el('div', { class: 'do-dont-grid' },
          dontCard(makeAnchorLinks({ mode: 'manual', items: longList }),
            "Don't render more than ~8 items. Long lists turn anchor links into a directory and make the active highlight ambiguous — use a sidebar or table of contents."),
          dontCard(makeAnchorLinks({ mode: 'manual', items: [{ id: 'al-dont-x', label: 'Home' }, { id: 'al-dont-y', label: 'Customers' }, { id: 'al-dont-z', label: 'Reports' }] }),
            "Don't use anchor links for cross-page navigation. Each item must point at an in-page section."),
        )));
  }

  // ----- Content tab -----
  function anchorLinksContent(): HTMLElement {
    return el('div', { class: 'tab-content guidelines-layout' },
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Tab labels'),
        el('ul', { class: 'guideline-list' },
          el('li', {}, 'Use sentence case. "Account summary", "Payment history".'),
          el('li', {}, 'One or two words is ideal; never wrap. The component truncates with an ellipsis past the column width.'),
          el('li', {}, 'Match the in-page section heading exactly. Mismatched copy makes the active highlight feel disconnected.'),
        )),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Item count'),
        el('ul', { class: 'guideline-list' },
          el('li', {}, 'Aim for three to seven items. Fewer than three doesn\'t justify the menu; more than seven hurts scannability.'),
          el('li', {}, 'Order by reading flow, not alphabetically. Anchor links mirror page structure.'),
        )),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Tags'),
        el('ul', { class: 'guideline-list' },
          el('li', {}, 'Optional inline tag — used sparingly for "soon", "beta", "new". Renders as a yellow warning badge.'),
          el('li', {}, 'Don\'t pair a tag with the active state. The combined visual weight competes for attention.'),
        )));
  }

  // ----- Accessibility tab -----
  function anchorLinksAccessibility(): HTMLElement {
    return el('div', { class: 'tab-content guidelines-layout' },
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Roles & landmarks'),
        el('ul', { class: 'guideline-list' },
          el('li', {}, 'The component renders a <nav aria-label="On-page navigation"> landmark.'),
          el('li', {}, 'The active tab carries aria-current="true" so screen readers announce the user\'s position.'),
          el('li', {}, 'Disabled tabs use aria-disabled="true" and tabindex="-1" so they\'re skipped from the tab order.'),
        )),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Keyboard'),
        el('ul', { class: 'guideline-list' },
          el('li', {}, 'Tabs are reachable via Tab in DOM order. Enter or Space activates the focused tab.'),
          el('li', {}, 'In auto-scroll mode the activated tab smooth-scrolls the target into view; in manual mode it triggers the consumer\'s click handler.'),
        )),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Color & focus'),
        el('ul', { class: 'guideline-list' },
          el('li', {}, 'A 2px focus ring (interactive primary, offset 2px) appears on every focusable tab.'),
          el('li', {}, 'Active state is communicated by both color (interactive primary text + blue.50 background) AND a 2px left rail — never relying on color alone.'),
        )));
  }

  // ----- Code tab -----
  function anchorLinksCode(): HTMLElement {
    return el('div', { class: 'tab-content guidelines-layout' },
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
        el('pre', { class: 'code-block' },
          `<scout-anchor-links id="links" mode="auto-scroll"></scout-anchor-links>

<script type="module">
  import '@scout/anchor-links';
  const el = document.querySelector('#links');
  el.items = [
    { id: 'overview',     label: 'Overview' },
    { id: 'billing',      label: 'Billing' },
    { id: 'payments',     label: 'Payments' },
    { id: 'disputes',     label: 'Disputes' },
    { id: 'preferences',  label: 'Preferences' },
  ];
  el.addEventListener('scout-anchor-change', (e) => {
    console.log('active section:', e.detail.id);
  });
</script>`)),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Manual mode (page-router)'),
        el('pre', { class: 'code-block' },
          `<!-- Manual mode + prevent-scroll lets the native <a href="#id"> handle hash navigation;
     the consumer subscribes to scout-anchor-change for click handling. -->
<scout-anchor-links id="sidebar-nav" mode="manual" prevent-scroll></scout-anchor-links>`)),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Install / register'),
        el('pre', { class: 'code-block' }, `pnpm add @scout/anchor-links @scout/badge @scout/tokens lit\n\nimport '@scout/anchor-links';`)),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Props'),
        el('div', { class: 'props-table-wrap' },
          el('table', { class: 'props-table' },
            el('thead', {}, el('tr', {}, el('th', {}, 'Prop'), el('th', {}, 'Type'), el('th', {}, 'Default'), el('th', {}, 'Description'))),
            el('tbody', {},
              el('tr', {}, el('td', {}, 'mode'),           el('td', {}, '"auto-scroll" | "manual"'),     el('td', {}, '"auto-scroll"'), el('td', {}, 'Highlight behavior.')),
              el('tr', {}, el('td', {}, 'active'),         el('td', {}, 'string'),                       el('td', {}, '""'),            el('td', {}, 'Currently-active item id.')),
              el('tr', {}, el('td', {}, 'scroll-root'),    el('td', {}, 'string (CSS selector)'),        el('td', {}, '""'),            el('td', {}, 'Scroll container; defaults to window.')),
              el('tr', {}, el('td', {}, 'prevent-scroll'), el('td', {}, 'boolean'),                       el('td', {}, 'false'),         el('td', {}, 'When set, click does not scrollIntoView; the native <a> handles hash navigation.')),
              el('tr', {}, el('td', {}, 'items'),          el('td', {}, 'AnchorLinkItem[]'),             el('td', {}, '[]'),            el('td', {}, 'Menu items: { id, label, disabled?, tag? }.')),
            )))),
    );
  }

  app.append(componentPage(
    'patterns-anchor-links',
    'Anchor links',
    'Vertical menu list that links to in-page sections. Available in two modes: auto-scroll (active tab updates as the user scrolls) and manual (click-only).',
    [
      { id: 'preview', label: 'Preview', content: anchorLinksPreview() },
      { id: 'controls', label: 'Controls', content: anchorLinksControls() },
      { id: 'guidelines', label: 'Usage guidelines', content: anchorLinksGuidelines() },
      { id: 'content', label: 'Content', content: anchorLinksContent() },
      { id: 'accessibility', label: 'Accessibility', content: anchorLinksAccessibility() },
      { id: 'code', label: 'Code', content: anchorLinksCode() },
    ],
    'pattern',
  ));
}

// -----------------------------------------------------------------
// Data table pattern — composed from existing Scout components rather
// than a standalone Lit element, so the docs assemble the markup directly.
// Each variant (display-only, selectable, expandable, paginated, show-more)
// is rendered as a real <table> styled by tokens, with checkboxes,
// pagination, show-more, and accordion content slotted in from their
// respective component packages.
// -----------------------------------------------------------------
{
  type DTSize = 'default' | 'condensed';
  type DTRow = {
    /** Stable identifier for the row, used for selection state. */
    id: string;
    /** Cell values keyed by column id. Strings render as text. */
    cells: Record<string, string>;
    /** Optional secondary text rendered below the first cell. */
    secondary?: string;
    /** Optional expandable detail content (string or HTMLElement). */
    detail?: string | HTMLElement;
  };
  type DTColumn = {
    id: string;
    label: string;
    sortable?: boolean;
    align?: 'left' | 'right';
    width?: string;
  };

  // === Sample data ================================================
  const accountColumns: DTColumn[] = [
    { id: 'name',    label: 'Account',  sortable: true },
    { id: 'plan',    label: 'Plan' },
    { id: 'status',  label: 'Status' },
    { id: 'balance', label: 'Balance', align: 'right', sortable: true },
  ];
  const accountRows: DTRow[] = [
    { id: 'a1', cells: { name: 'Hannah Mezzadri',  plan: 'Premium',  status: 'enrolled',   balance: '$0.00'   }, secondary: 'acct ····4429' },
    { id: 'a2', cells: { name: 'Jordan Diaz',      plan: 'Standard', status: 'pending',    balance: '$124.50' }, secondary: 'acct ····8861' },
    { id: 'a3', cells: { name: 'Ali Bautista',     plan: 'Premium',  status: 'enrolled',   balance: '$0.00'   }, secondary: 'acct ····0042' },
    { id: 'a4', cells: { name: 'Sam Caro',         plan: 'Lite',     status: 'unenrolled', balance: '—'       }, secondary: 'acct ····7715' },
    { id: 'a5', cells: { name: 'Rin Ito',          plan: 'Standard', status: 'canceled',   balance: '—'       }, secondary: 'acct ····3320' },
  ];

  // === Helpers ====================================================
  /** Render a status cell as a low-emphasis Scout badge so the docs
   *  dogfood the prescriptive enrollment-lifecycle variants we just
   *  added (Enrolled / Pending / Unenrolled / Canceled). */
  function statusBadge(value: string): HTMLElement {
    const map: Record<string, { type: string; label: string }> = {
      enrolled:   { type: 'success',  label: 'Enrolled'   },
      pending:    { type: 'warning',  label: 'Pending'    },
      unenrolled: { type: 'neutral',  label: 'Unenrolled' },
      canceled:   { type: 'critical', label: 'Canceled'   },
    };
    const meta = map[value] ?? { type: 'neutral', label: value };
    const b = document.createElement('scout-badge');
    b.setAttribute('type', meta.type);
    b.setAttribute('emphasis', 'low');
    b.textContent = meta.label;
    return b;
  }

  /** Build the <thead> column-header row. Adds a sort affordance to
   *  sortable columns and an optional leading checkbox cell when the
   *  table is selectable. */
  function thead(opts: {
    columns: DTColumn[];
    selectable?: boolean;
    expandable?: boolean;
    sortKey?: string | null;
    sortDir?: 'asc' | 'desc';
    onSort?: (key: string) => void;
    onToggleAll?: (selected: boolean) => void;
    allSelected?: boolean;
    someSelected?: boolean;
  }): HTMLElement {
    const tr = el('tr', { class: 'dt-row dt-row--header' });
    if (opts.selectable) {
      const cell = el('th', { class: 'dt-cell dt-cell--select', scope: 'col' });
      const cb = document.createElement('scout-checkbox') as HTMLElement & { checked: boolean; indeterminate: boolean };
      cb.setAttribute('aria-label', 'Select all rows');
      if (opts.allSelected) cb.setAttribute('checked', '');
      else if (opts.someSelected) cb.setAttribute('indeterminate', '');
      // Treat a click while partially-selected as "clear all".
      cb.addEventListener('change', () => {
        const next = opts.someSelected ? false : cb.checked;
        opts.onToggleAll?.(next);
      });
      cell.append(cb);
      tr.append(cell);
    }
    if (opts.expandable) {
      tr.append(el('th', { class: 'dt-cell dt-cell--expand', 'aria-hidden': 'true' }));
    }
    for (const col of opts.columns) {
      const cell = el('th', {
        class: `dt-cell dt-cell--header${col.align === 'right' ? ' dt-cell--right' : ''}`,
        scope: 'col',
        'aria-sort': col.sortable
          ? opts.sortKey === col.id
            ? (opts.sortDir === 'desc' ? 'descending' : 'ascending')
            : 'none'
          : '',
      });
      if (col.sortable) {
        const isActive = opts.sortKey === col.id;
        const iconName = isActive && opts.sortDir === 'desc' ? 'arrow-down' : 'arrow-up';
        const btn = el('button', { class: 'dt-sort', type: 'button' },
          el('span', {}, col.label),
          el('span', { class: `dt-sort__icon${isActive ? '' : ' dt-sort__icon--inactive'}`, 'aria-hidden': 'true' },
            heroIconSvg(iconName, 14)),
        );
        btn.addEventListener('click', () => opts.onSort?.(col.id));
        cell.append(btn);
      } else {
        cell.append(document.createTextNode(col.label));
      }
      tr.append(cell);
    }
    return tr;
  }

  /** Render a single body row with optional select / expand affordances. */
  function bodyRow(row: DTRow, opts: {
    columns: DTColumn[];
    selectable?: boolean;
    selected?: Set<string>;
    onToggle?: (id: string, selected: boolean) => void;
    expandable?: boolean;
    expanded?: Set<string>;
    onExpand?: (id: string, open: boolean) => void;
    secondaryText?: boolean;
  }): HTMLElement[] {
    const tr = el('tr', {
      class: `dt-row dt-row--body${opts.selected?.has(row.id) ? ' dt-row--selected' : ''}`,
    });

    if (opts.selectable) {
      const cell = el('td', { class: 'dt-cell dt-cell--select' });
      const cb = document.createElement('scout-checkbox') as HTMLElement & { checked: boolean };
      cb.setAttribute('aria-label', `Select ${row.cells[opts.columns[0]?.id ?? ''] ?? row.id}`);
      if (opts.selected?.has(row.id)) cb.setAttribute('checked', '');
      cb.addEventListener('change', () => {
        opts.onToggle?.(row.id, cb.checked);
      });
      cell.append(cb);
      tr.append(cell);
    }

    if (opts.expandable) {
      const cell = el('td', { class: 'dt-cell dt-cell--expand' });
      const isOpen = !!opts.expanded?.has(row.id);
      const btn = el('button', {
        type: 'button',
        class: `dt-expand-btn${isOpen ? ' dt-expand-btn--open' : ''}`,
        'aria-expanded': String(isOpen),
        'aria-label': isOpen ? 'Collapse row' : 'Expand row',
      });
      const chevron = heroIconSvg('chevron-right', 20);
      chevron.classList.add('dt-expand-icon');
      btn.append(chevron);
      btn.addEventListener('click', () => opts.onExpand?.(row.id, !isOpen));
      cell.append(btn);
      tr.append(cell);
    }

    opts.columns.forEach((col, i) => {
      const cell = el('td', {
        class: `dt-cell dt-cell--body${col.align === 'right' ? ' dt-cell--right' : ''}`,
      });
      const value = row.cells[col.id] ?? '';
      if (col.id === 'status') {
        cell.append(statusBadge(value));
      } else if (i === 0 && row.secondary && opts.secondaryText !== false) {
        cell.append(
          el('div', { class: 'dt-cell__primary' }, value),
          el('div', { class: 'dt-cell__secondary' }, row.secondary),
        );
      } else {
        cell.append(document.createTextNode(value));
      }
      tr.append(cell);
    });

    const out: HTMLElement[] = [tr];

    // Expandable detail row — rendered as a second <tr> that the toggle
    // shows/hides. Spans the full set of columns (plus select / expand
    // affordance cells) so the detail content fills the row width.
    if (opts.expandable && opts.expanded?.has(row.id)) {
      const totalCols = opts.columns.length + (opts.selectable ? 1 : 0) + 1;
      const detail = el('tr', { class: 'dt-row dt-row--detail' },
        el('td', { class: 'dt-cell dt-cell--detail', colspan: String(totalCols) },
          el('div', { class: 'dt-detail-body' },
            typeof row.detail === 'string' || row.detail === undefined
              ? document.createTextNode(typeof row.detail === 'string'
                  ? row.detail
                  : `Expanded detail for ${row.cells[opts.columns[0]?.id ?? ''] ?? row.id}. Anything you'd put in a side panel — call notes, payment history, related accounts — fits here.`)
              : row.detail,
          ),
        ),
      );
      out.push(detail);
    }

    return out;
  }

  /** Optional table-level header strip rendered above the column headers. */
  function tableHeaderRow(opts: {
    title: string;
    description?: string;
    action?: { label: string; href?: string; onClick?: () => void };
    columnSpan: number;
  }): HTMLElement {
    const tr = el('tr', { class: 'dt-row dt-row--table-header' });
    const cell = el('th', { class: 'dt-cell dt-cell--table-header', colspan: String(opts.columnSpan), scope: 'colgroup' });
    const row = el('div', { class: 'dt-table-header__row' },
      el('div', { class: 'dt-table-header__copy' },
        el('div', { class: 'dt-table-header__title' }, opts.title),
        ...(opts.description
          ? [el('div', { class: 'dt-table-header__description' }, opts.description)]
          : []),
      ),
    );
    if (opts.action) {
      const btn = document.createElement('scout-button');
      btn.setAttribute('variant', 'tertiary');
      btn.setAttribute('size', 'condensed');
      btn.textContent = opts.action.label;
      if (opts.action.onClick) btn.addEventListener('click', opts.action.onClick);
      row.append(el('div', { class: 'dt-table-header__action' }, btn));
    }
    cell.append(row);
    tr.append(cell);
    return tr;
  }

  /** Optional in-body section header — separates rows into named groups. */
  function sectionHeaderRow(label: string, columnSpan: number): HTMLElement {
    return el('tr', { class: 'dt-row dt-row--section' },
      el('th', { class: 'dt-cell dt-cell--section', colspan: String(columnSpan), scope: 'colgroup' }, label),
    );
  }

  /** Top-level data-table builder. Accepts options for every variant
   *  (selectable, expandable, sectioned, sized, with a header row and
   *  any of the supported footers) and returns a fully-wired HTMLElement. */
  function buildDataTable(opts: {
    columns: DTColumn[];
    rows: DTRow[];
    size?: DTSize;
    header?: { title: string; description?: string; action?: { label: string; onClick?: () => void } };
    sections?: Array<{ label: string; rowIds: string[] }>;
    selectable?: boolean;
    expandable?: boolean;
    footer?: 'none' | 'pagination' | 'show-more';
    secondaryText?: boolean;
  }): HTMLElement {
    const size = opts.size ?? 'default';
    const selected = new Set<string>();
    const expanded = new Set<string>();
    let allSelected = false;
    let showMoreCount = 3;
    let sortKey: string | null = null;
    let sortDir: 'asc' | 'desc' = 'asc';

    const wrap = el('div', {
      class: `dt-pattern dt-pattern--${size}`,
      role: 'region',
      'aria-label': opts.header?.title ?? 'Data table',
    });

    /** Sort comparator that handles currency / numeric / em-dash cells.
     *  Em-dashes ("—") sort to the bottom regardless of direction. */
    function compareCells(a: string, b: string): number {
      const aDash = a === '—' || a === '';
      const bDash = b === '—' || b === '';
      if (aDash && bDash) return 0;
      if (aDash) return 1;
      if (bDash) return -1;
      const an = Number(a.replace(/[^0-9.\-]/g, ''));
      const bn = Number(b.replace(/[^0-9.\-]/g, ''));
      if (!isNaN(an) && !isNaN(bn) && a.match(/\d/) && b.match(/\d/)) return an - bn;
      return a.localeCompare(b);
    }

    function rerender() {
      const totalCols = opts.columns.length + (opts.selectable ? 1 : 0) + (opts.expandable ? 1 : 0);
      const table = el('table', { class: 'dt-table' });
      const head = el('thead', {});

      if (opts.header) {
        head.append(tableHeaderRow({
          title: opts.header.title,
          description: opts.header.description,
          action: opts.header.action,
          columnSpan: totalCols,
        }));
      }

      head.append(thead({
        columns: opts.columns,
        selectable: opts.selectable,
        expandable: opts.expandable,
        sortKey,
        sortDir,
        allSelected: selected.size > 0 && selected.size === opts.rows.length,
        someSelected: selected.size > 0 && selected.size < opts.rows.length,
        onToggleAll: (sel) => {
          allSelected = sel;
          if (sel) for (const r of opts.rows) selected.add(r.id);
          else selected.clear();
          rerender();
        },
        onSort: (key) => {
          if (sortKey === key) {
            sortDir = sortDir === 'asc' ? 'desc' : 'asc';
          } else {
            sortKey = key;
            sortDir = 'asc';
          }
          rerender();
        },
      }));

      const body = el('tbody', {});

      // Apply sort first, then any show-more row clamp.
      const sortedRows = sortKey
        ? [...opts.rows].sort((a, b) => {
            const av = a.cells[sortKey!] ?? '';
            const bv = b.cells[sortKey!] ?? '';
            const cmp = compareCells(av, bv);
            return sortDir === 'asc' ? cmp : -cmp;
          })
        : opts.rows;
      const visibleRows = opts.footer === 'show-more'
        ? sortedRows.slice(0, showMoreCount)
        : sortedRows;

      if (opts.sections && opts.sections.length) {
        for (const sec of opts.sections) {
          body.append(sectionHeaderRow(sec.label, totalCols));
          for (const id of sec.rowIds) {
            const r = visibleRows.find((row) => row.id === id);
            if (!r) continue;
            for (const node of bodyRow(r, {
              columns: opts.columns,
              selectable: opts.selectable,
              selected,
              onToggle: (rid, sel) => {
                if (sel) selected.add(rid); else selected.delete(rid);
                allSelected = selected.size === opts.rows.length;
                rerender();
              },
              expandable: opts.expandable,
              expanded,
              onExpand: (rid, open) => {
                if (open) expanded.add(rid); else expanded.delete(rid);
                rerender();
              },
              secondaryText: opts.secondaryText,
            })) body.append(node);
          }
        }
      } else {
        for (const r of visibleRows) {
          for (const node of bodyRow(r, {
            columns: opts.columns,
            selectable: opts.selectable,
            selected,
            onToggle: (rid, sel) => {
              if (sel) selected.add(rid); else selected.delete(rid);
              allSelected = selected.size === opts.rows.length;
              rerender();
            },
            expandable: opts.expandable,
            expanded,
            onExpand: (rid, open) => {
              if (open) expanded.add(rid); else expanded.delete(rid);
              rerender();
            },
            secondaryText: opts.secondaryText,
          })) body.append(node);
        }
      }

      table.append(head, body);

      const scroll = el('div', { class: 'dt-scroll' }, table);
      const parts: (Node | string)[] = [scroll];

      // Footer: pagination uses scout-pagination; show-more uses
      // scout-show-more. Either is rendered as a sibling block below
      // the <table> so it has room to breathe and isn't constrained by
      // a colspan cell.
      if (opts.footer === 'pagination') {
        const p = document.createElement('scout-pagination') as HTMLElement & {
          page: number; pageSize: number; total: number;
        };
        p.setAttribute('total', String(opts.rows.length * 8));
        p.setAttribute('page', '1');
        p.setAttribute('page-size', '10');
        p.setAttribute('layout', 'both');
        parts.push(el('div', { class: 'dt-footer' }, p));
      } else if (opts.footer === 'show-more') {
        const sm = document.createElement('scout-show-more') as HTMLElement & { expanded: boolean };
        if (showMoreCount >= opts.rows.length) sm.setAttribute('expanded', '');
        sm.addEventListener('scout-show-more-toggle', (e: Event) => {
          const detail = (e as CustomEvent<{ expanded: boolean }>).detail;
          showMoreCount = detail.expanded ? opts.rows.length : 3;
          rerender();
        });
        parts.push(el('div', { class: 'dt-footer dt-footer--show-more' }, sm));
      }

      wrap.replaceChildren(...parts);
    }

    rerender();
    return wrap;
  }

  // === Preview tab ================================================
  function dataTablePreview(): HTMLElement {
    const wrap = el('div', { class: 'tab-content' });
    const block = (heading: string, lede: string, content: HTMLElement) => {
      wrap.append(el('div', { class: 'preview-block' },
        el('h3', { class: 'preview-block__title' }, heading),
        el('p', { class: 'preview-block__lede' }, lede),
        el('div', { class: 'preview-row preview-row--block' }, content),
      ));
    };

    block('Display only',
      'Rows and columns of structured data with column headers and an optional table header. No selection, no expansion — read-only at-a-glance reference.',
      buildDataTable({
        columns: accountColumns,
        rows: accountRows,
        header: { title: 'Customer accounts', description: 'All active and recent enrollments for this household.' },
      }),
    );

    block('Selectable rows',
      'Each row gets a leading checkbox; the column-header checkbox selects or clears all rows at once. Selected rows pick up an interactive surface tint.',
      buildDataTable({
        columns: accountColumns,
        rows: accountRows,
        selectable: true,
        header: { title: 'Customer accounts' },
      }),
    );

    block('Expandable rows',
      'Each row gets a leading chevron; expanding reveals a detail content row beneath. Use for context that would otherwise need a side-panel — call notes, payment history, related records.',
      buildDataTable({
        columns: accountColumns,
        rows: accountRows.slice(0, 3),
        expandable: true,
      }),
    );

    block('Sectioned rows',
      'Optional in-body section headers separate rows into named groups (e.g., by month). The header spans the full row width and shares the same surface treatment as the table header.',
      buildDataTable({
        columns: accountColumns,
        rows: accountRows,
        sections: [
          { label: 'Active',   rowIds: ['a1', 'a3'] },
          { label: 'Inactive', rowIds: ['a2', 'a4', 'a5'] },
        ],
      }),
    );

    block('Footer — pagination',
      'Page through long datasets via the pagination component. Items-per-page dropdown, range readout, prev / next chevrons, and numbered page buttons all token-driven.',
      buildDataTable({
        columns: accountColumns,
        rows: accountRows,
        header: { title: 'Customer accounts' },
        footer: 'pagination',
      }),
    );

    block('Footer — show more',
      'Clamp the visible row count and reveal the rest via the show-more toggle. Use when the dataset is short enough to render in full but long enough to crowd the page.',
      buildDataTable({
        columns: accountColumns,
        rows: accountRows,
        header: { title: 'Customer accounts' },
        footer: 'show-more',
      }),
    );

    block('Sizes',
      'Default for general-purpose surfaces. Condensed tightens row height and typography for data-dense surfaces (agent desktops, dashboards).',
      el('div', { class: 'preview-stack' },
        buildDataTable({ columns: accountColumns, rows: accountRows.slice(0, 3), size: 'default'   }),
        buildDataTable({ columns: accountColumns, rows: accountRows.slice(0, 3), size: 'condensed' }),
      ),
    );

    return wrap;
  }

  // === Controls tab ===============================================
  function dataTableControls(): HTMLElement {
    const wrap = el('div', { class: 'tab-content controls-layout' });
    const stage = el('div', { class: 'preview-stage preview-stage--block' });

    const sizeSel       = ddSelect('dt-size',   ['default', 'condensed'] as const);
    const footerSel     = ddSelect('dt-footer', ['none', 'pagination', 'show-more'] as const);
    const titleInput    = ctrlText('dt-title',    'Customer accounts');
    const subtitleInput = ctrlText('dt-subtitle', 'All active and recent enrollments for this household.');
    const headerChk     = ctrlCheck('dt-header',        'Table header',           { checked: true });
    const selectableChk = ctrlCheck('dt-selectable',    'Selectable rows');
    const expandableChk = ctrlCheck('dt-expandable',    'Expandable rows');
    const sectionedChk  = ctrlCheck('dt-sectioned',     'Sectioned rows');
    const secondaryChk  = ctrlCheck('dt-secondary-txt', 'Show secondary text in cells', { checked: true });

    function rerender() {
      stage.replaceChildren(buildDataTable({
        columns: accountColumns,
        rows: accountRows,
        size: sizeSel.value as DTSize,
        header: headerChk.checked
          ? { title: titleInput.value, description: subtitleInput.value || undefined }
          : undefined,
        selectable: selectableChk.checked,
        expandable: expandableChk.checked,
        sections: sectionedChk.checked
          ? [
              { label: 'Active',   rowIds: ['a1', 'a3'] },
              { label: 'Inactive', rowIds: ['a2', 'a4', 'a5'] },
            ]
          : undefined,
        footer: footerSel.value === 'none' ? 'none' : (footerSel.value as 'pagination' | 'show-more'),
        secondaryText: secondaryChk.checked,
      }));
    }
    for (const c of [sizeSel, footerSel, titleInput, subtitleInput, headerChk, selectableChk, expandableChk, sectionedChk, secondaryChk]) {
      c.addEventListener('input', rerender);
      c.addEventListener('change', rerender);
    }
    const ctrlField = (l: string, f: string, c: HTMLElement) =>
      el('div', { class: 'ctrl-field' }, el('label', { for: f }, l), c);
    const panel = el('div', { class: 'ctrl-panel' },
      el('h3', { class: 'preview-block__title' }, 'Properties'),
      ctrlField('Size',     'dt-size',     sizeSel),
      ctrlField('Footer',   'dt-footer',   footerSel),
      ctrlField('Title',    'dt-title',    titleInput),
      ctrlField('Subtitle', 'dt-subtitle', subtitleInput),
      el('div', { class: 'ctrl-checks' },
        headerChk,
        selectableChk,
        expandableChk,
        sectionedChk,
        secondaryChk,
      ),
    );
    wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage));
    queueMicrotask(rerender);
    return wrap;
  }

  // === Usage guidelines ===========================================
  function dataTableGuidelines(): HTMLElement {
    const doCard = (p: HTMLElement, c: string) =>
      el('div', { class: 'do-card' },
        el('div', { class: 'do-dont-header' }, heroIconSvg('check-circle', 16), ' Do'),
        el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
        el('p', {}, c));
    const dontCard = (p: HTMLElement, c: string) =>
      el('div', { class: 'dont-card' },
        el('div', { class: 'do-dont-header' }, heroIconSvg('x-circle', 16), " Don't"),
        el('div', { class: 'do-dont-preview do-dont-preview--block' }, p),
        el('p', {}, c));
    return el('div', { class: 'tab-content guidelines-layout' },
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Anatomy'),
        el('p', { class: 'preview-block__lede' },
          'A data table is composed of smaller parts that work together. Each is optional except cells.'),
        el('ul', { class: 'guideline-list' },
          el('li', {}, el('strong', {}, 'Table header'),  ' (optional) — describes the table. Anatomy: title, tooltip (optional), small button (optional), link (optional).'),
          el('li', {}, el('strong', {}, 'Section header'), ' (optional) — describes a group of content/rows within a table (e.g., separating content by month). Anatomy: label, tooltip (optional), small button (optional), link (optional).'),
          el('li', {}, el('strong', {}, 'Column header'),  ' (optional) — describes the content within a column. Can be used to sort. Anatomy: label, tooltip (optional), sortable (optional), checkbox (optional), badge (optional).'),
          el('li', {}, el('strong', {}, 'Cells'),          ' — specific data within the table. Anatomy: cell label, secondary text (optional). Types: text, link, checkbox, icon, button. Sizes: default, condensed.'),
          el('li', {}, el('strong', {}, 'Footer'),         ' (optional) — displays at the bottom of the table. Types: show more or pagination.'),
        ),
      ),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Rows'),
        el('p', { class: 'preview-block__lede' },
          'Rows can be display-only, expandable, or selectable. Each row mode brings its own affordances and states.'),
        el('ul', { class: 'guideline-list' },
          el('li', {}, el('strong', {}, 'Expandable rows'), ' — use the scout-accordion component. Lets the user expand and collapse a row to reveal more information. Interactive states: default, hover, focus, pressed, disabled. Functional states: expanded, collapsed. Layout: chevron on left or right.'),
          el('li', {}, el('strong', {}, 'Selectable rows'), ' — use the scout-checkbox component. Lets the user select a row, multiple rows, or all rows via the parent checkbox at the top of the table. Interactive states: default, hover, focus, pressed, disabled. Functional states: selected, not selected. Layout: left-only.'),
        ),
      ),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading do-heading' }, heroIconSvg('check-circle', 20), ' Do'),
        el('p', { class: 'preview-block__lede' }, 'Patterns that keep the table scannable and accessible.'),
        el('div', { class: 'do-dont-grid' },
          doCard(buildDataTable({ columns: accountColumns, rows: accountRows.slice(0, 3), header: { title: 'Customer accounts' } }),
            'Use a table header to describe the table when the page does not already make the dataset obvious.'),
          doCard(buildDataTable({ columns: accountColumns, rows: accountRows.slice(0, 3), size: 'condensed' }),
            'Use the condensed size on data-dense surfaces (agent desktops, dashboards) to fit more rows above the fold without losing legibility.'),
        ),
      ),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading dont-heading' }, heroIconSvg('x-circle', 20), " Don't"),
        el('p', { class: 'preview-block__lede' }, 'Patterns that obscure structure or fight the user.'),
        el('div', { class: 'do-dont-grid' },
          dontCard(buildDataTable({ columns: accountColumns, rows: accountRows, selectable: true, expandable: true }),
            "Don't combine selection and expansion in the same row unless you genuinely need both. Two leading affordances make the row harder to scan."),
        ),
      ),
    );
  }

  // === Content ====================================================
  function dataTableContent(): HTMLElement {
    return el('div', { class: 'tab-content guidelines-layout' },
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Cell types'),
        el('ul', { class: 'guideline-list' },
          el('li', {}, 'Text — primary value, optional secondary line for context (account number, timestamp).'),
          el('li', {}, 'Link — for navigable values (a name that opens the customer record). Use scout-link.'),
          el('li', {}, 'Checkbox — selection only; never use a checkbox cell for editable boolean data.'),
          el('li', {}, 'Icon — for status icons paired with a badge or used as a low-emphasis affordance.'),
          el('li', {}, 'Button — small, in-row actions. Reserve for truly per-row actions; bulk actions belong in the table header.'),
        ),
      ),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Footer'),
        el('ul', { class: 'guideline-list' },
          el('li', {}, el('strong', {}, 'Show more'), ' — inherits the scout-show-more component. When clicked, shows the rest of the data.'),
          el('li', {}, el('strong', {}, 'Pagination'), " — inherits scout-pagination. Lets users page individually via arrows, jump to first/last via double arrows, choose items-per-page via the inherited dropdown, and reads “first–last of total” inline."),
        ),
      ),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Functions'),
        el('ul', { class: 'guideline-list' },
          el('li', {}, 'Display only — the default. Read-only data with optional sorting.'),
          el('li', {}, 'Selectable — leading checkbox column for row selection (single or multi).'),
          el('li', {}, 'Expandable — leading chevron column that reveals an inline detail row.'),
          el('li', {}, 'Accordion — uses the scout-accordion component for the expand/collapse mechanism.'),
        ),
      ),
    );
  }

  // === Accessibility ==============================================
  function dataTableAccessibility(): HTMLElement {
    return el('div', { class: 'tab-content guidelines-layout' },
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Semantics'),
        el('ul', { class: 'guideline-list' },
          el('li', {}, 'Use a real <table> element. Column headers use <th scope="col">, section headers use <th scope="colgroup">.'),
          el('li', {}, 'Sortable column headers expose aria-sort = ascending | descending | none.'),
          el('li', {}, 'The table-level header is rendered as a <th colspan> in <thead> so screen readers announce it before the column headers.'),
        ),
      ),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Selection'),
        el('ul', { class: 'guideline-list' },
          el('li', {}, 'Each row checkbox carries an aria-label that names the row (e.g., "Select Hannah Mezzadri").'),
          el('li', {}, 'The header checkbox toggles all rows; its aria-label reads "Select all rows".'),
          el('li', {}, 'Selected rows pick up a token-driven background tint that meets WCAG 2.1 AA contrast against the text.'),
        ),
      ),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Expansion'),
        el('ul', { class: 'guideline-list' },
          el('li', {}, 'Each expand toggle is a real <button> with aria-expanded reflecting the open state.'),
          el('li', {}, 'The detail content is a sibling <tr> in the DOM, so screen readers reach it via tabbing past the toggle.'),
          el('li', {}, 'Honors prefers-reduced-motion: the chevron rotation collapses to no transition.'),
        ),
      ),
    );
  }

  // === Code =======================================================
  function dataTableCode(): HTMLElement {
    return el('div', { class: 'tab-content guidelines-layout' },
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Install / register'),
        el('pre', { class: 'code-block' },
          `pnpm add @scout/checkbox @scout/badge @scout/pagination @scout/show-more @scout/accordion @scout/tokens lit\n\nimport '@scout/checkbox';\nimport '@scout/badge';\nimport '@scout/pagination';\nimport '@scout/show-more';\nimport '@scout/accordion';`)),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Markup'),
        el('pre', { class: 'code-block' },
          `<table class="dt-table">\n  <thead>\n    <!-- Optional table header -->\n    <tr class="dt-row--table-header">\n      <th colspan="4">Customer accounts</th>\n    </tr>\n    <!-- Column headers -->\n    <tr>\n      <th scope="col">\n        <scout-checkbox aria-label="Select all rows"></scout-checkbox>\n      </th>\n      <th scope="col" aria-sort="ascending">Account</th>\n      <th scope="col">Status</th>\n      <th scope="col">Balance</th>\n    </tr>\n  </thead>\n  <tbody>\n    <!-- Optional section header -->\n    <tr class="dt-row--section">\n      <th colspan="4" scope="colgroup">Active</th>\n    </tr>\n    <tr>\n      <td><scout-checkbox aria-label="Select Hannah Mezzadri"></scout-checkbox></td>\n      <td>Hannah Mezzadri</td>\n      <td><scout-badge type="success" emphasis="low" size="condensed">Enrolled</scout-badge></td>\n      <td>$0.00</td>\n    </tr>\n  </tbody>\n</table>\n\n<!-- Footer: pagination OR show-more -->\n<scout-pagination total="240" page="1" page-size="10" layout="both"></scout-pagination>`)),
      el('section', { class: 'guideline-section' },
        el('h3', { class: 'guideline-heading' }, 'Anatomy'),
        el('div', { class: 'props-table-wrap' },
          el('table', { class: 'props-table' },
            el('thead', {}, el('tr', {}, el('th', {}, 'Part'), el('th', {}, 'Required'), el('th', {}, 'Description'))),
            el('tbody', {},
              el('tr', {}, el('td', {}, 'Table header'),  el('td', {}, 'Optional'), el('td', {}, 'Describes the table. Title + optional tooltip / small button / link.')),
              el('tr', {}, el('td', {}, 'Section header'), el('td', {}, 'Optional'), el('td', {}, 'Describes a group of rows. Title + optional tooltip / small button / link.')),
              el('tr', {}, el('td', {}, 'Column header'),  el('td', {}, 'Optional'), el('td', {}, 'Describes a column. Sortable, checkbox-prefixed, or badge-tagged variants.')),
              el('tr', {}, el('td', {}, 'Cells'),          el('td', {}, 'Required'), el('td', {}, 'The data. Text, link, checkbox, icon, or button. Default or condensed size.')),
              el('tr', {}, el('td', {}, 'Footer'),         el('td', {}, 'Optional'), el('td', {}, 'Show-more toggle or pagination. Use one or none.')),
            )))),
    );
  }

  app.append(componentPage(
    'patterns-data-table',
    'Data table',
    'Rows and columns of structured data composed from smaller Scout parts — table header, section header, column headers, cells, and an optional footer — that work together to keep content clear and organized.',
    [
      { id: 'preview', label: 'Preview', content: dataTablePreview() },
      { id: 'controls', label: 'Controls', content: dataTableControls() },
      { id: 'guidelines', label: 'Usage guidelines', content: dataTableGuidelines() },
      { id: 'content', label: 'Content', content: dataTableContent() },
      { id: 'accessibility', label: 'Accessibility', content: dataTableAccessibility() },
      { id: 'code', label: 'Code', content: dataTableCode() },
    ],
    'pattern',
  ));
}

// =================================================================
// TEMPLATES
// =================================================================
{
  const grid = el(
    'div',
    { class: 'foundation-grid' },
    overviewTile({
      title: 'Dashboard',
      summary: 'Header + stat cards + chart row + activity table. The default landing for product home views.',
      comingSoon: true,
    }),
  );
  app.append(
    page(
      'templates-overview',
      categoryBanner(
        'Templates',
        'Page-level layouts that combine patterns and components. Templates standardize the high-level shape of pages across products.',
      ),
      grid,
    ),
  );
}

// =================================================================
// ROUTER — sidebar <scout-anchor-links> instances drive page switching
// =================================================================

type NavSection = {
  el: HTMLElement & { items: AnchorLinkItem[]; active: string };
  items: AnchorLinkItem[];
};

const navSections: NavSection[] = [
  {
    el: document.getElementById('nav-foundation') as NavSection['el'],
    items: [
      { id: 'foundation-overview', label: 'Overview' },
      { id: 'foundation-theming',  label: 'Theming' },
      { id: 'foundation-brand',    label: 'Brand' },
    ],
  },
  {
    el: document.getElementById('nav-tokens') as NavSection['el'],
    items: [
      { id: 'tokens-overview', label: 'Overview' },
      { id: 'colors',          label: 'Color' },
      { id: 'typography',      label: 'Typography' },
      { id: 'iconography',     label: 'Iconography' },
      { id: 'spacing',         label: 'Spacing' },
      { id: 'radius',          label: 'Corner radius' },
      { id: 'border',          label: 'Border width' },
      { id: 'stroke',          label: 'Stroke' },
      { id: 'elevation',       label: 'Elevation' },
      { id: 'motion',          label: 'Motion' },
      { id: 'z-index',         label: 'Z-index' },
    ],
  },
  {
    el: document.getElementById('nav-components') as NavSection['el'],
    items: [
      { id: 'components-overview',          label: 'Overview' },
      { id: 'components-accordion',         label: 'Accordion' },
      { id: 'components-address',           label: 'Address' },
      { id: 'components-avatar',            label: 'Avatar' },
      { id: 'components-badge',             label: 'Badge' },
      { id: 'components-breadcrumb',        label: 'Breadcrumb' },
      { id: 'components-button',            label: 'Button' },
      { id: 'components-card',              label: 'Card' },
      { id: 'components-checkbox',          label: 'Checkbox' },
      { id: 'components-control',           label: 'Control' },
      { id: 'components-data-pair',         label: 'Data pair' },
      { id: 'components-data-unavailable',  label: 'Data unavailable' },
      { id: 'components-dialog',            label: 'Dialog' },
      { id: 'components-disclosure-dialog', label: 'Disclosure dialog' },
      { id: 'components-divider',           label: 'Divider' },
      { id: 'components-dropdown',          label: 'Dropdown' },
      { id: 'components-error-state',       label: 'Error state' },
      { id: 'components-filter-chip',       label: 'Filter chip' },
      { id: 'components-inline-alert',      label: 'Inline alert' },
      { id: 'components-link',              label: 'Link' },
      { id: 'components-multiselect',       label: 'Multiselect' },
      { id: 'components-notification-badge',label: 'Notification badge' },
      { id: 'components-overlay',           label: 'Overlay' },
      { id: 'components-pagination',        label: 'Pagination' },
      { id: 'components-popover',           label: 'Popover' },
      { id: 'components-progress',          label: 'Progress' },
      { id: 'components-radio',             label: 'Radio' },
      { id: 'components-segmented-control', label: 'Segmented control' },
      { id: 'components-sensitive-data',    label: 'Sensitive data' },
      { id: 'components-share-with-customer', label: 'Share with customer' },
      { id: 'components-show-more',         label: 'Show more' },
      { id: 'components-skeleton',          label: 'Skeleton loader' },
      { id: 'components-snackbar',          label: 'Snackbar' },
      { id: 'components-status-dot',        label: 'Status dot' },
      { id: 'components-system-outage',     label: 'System outage' },
      { id: 'components-tabs',              label: 'Tabs' },
      { id: 'components-text-input',        label: 'Text inputs' },
      { id: 'components-tile',              label: 'Tile' },
      { id: 'components-toggle-switch',     label: 'Toggle switch' },
    ],
  },
  {
    el: document.getElementById('nav-patterns') as NavSection['el'],
    items: [
      { id: 'patterns-overview',      label: 'Overview' },
      { id: 'patterns-anchor-links',  label: 'Anchor links' },
      { id: 'patterns-data-display',  label: 'Data display',     disabled: true, tag: 'Soon' },
      { id: 'patterns-data-table',    label: 'Data table' },
      { id: 'patterns-data-viz',      label: 'Data viz',         disabled: true, tag: 'Soon' },
      { id: 'patterns-filter',        label: 'Filter',           disabled: true, tag: 'Soon' },
      { id: 'patterns-form',          label: 'Form',             disabled: true, tag: 'Soon' },
      { id: 'patterns-search',        label: 'Search',           disabled: true, tag: 'Soon' },
    ],
  },
  {
    el: document.getElementById('nav-templates') as NavSection['el'],
    items: [
      { id: 'templates-overview',     label: 'Overview' },
      { id: 'templates-dashboard',    label: 'Dashboard',     disabled: true, tag: 'Soon' },
    ],
  },
];

// Push items into each anchor-links element. queueMicrotask gives the custom
// elements one tick to upgrade before we set properties.
queueMicrotask(() => {
  for (const s of navSections) if (s.el) s.el.items = s.items;
});

const pages = Array.from(document.querySelectorAll<HTMLElement>('.page'));
const validIds = new Set(pages.map((p) => p.id));
const defaultId = 'foundation-overview';

// Disable the browser's automatic scroll restoration so back/forward and
// hash navigation always land at the top of the new page.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function scrollToTop() {
  // The page can scroll at any of three levels depending on viewport / layout
  // (document scrolling element, html, or the main element if it ever gains
  // overflow). Hit all three with `behavior: 'instant'` so the new page always
  // appears at Y=0 with no animation flash.
  const opts: ScrollToOptions = { top: 0, left: 0, behavior: 'instant' as ScrollBehavior };
  document.scrollingElement?.scrollTo(opts);
  document.documentElement.scrollTo(opts);
  document.getElementById('app')?.scrollTo(opts);
  window.scrollTo(opts);
}

function showPage(id: string) {
  const target = validIds.has(id) ? id : defaultId;
  for (const p of pages) p.classList.toggle('active', p.id === target);
  // Sync each sidebar anchor-links instance — only the section containing the
  // active id will end up with that id highlighted; others fall back to ''.
  for (const s of navSections) {
    if (!s.el) continue;
    s.el.active = s.items.some((it) => it.id === target) ? target : '';
  }
  // Reset scroll so each "page" starts at Y=0. Run twice — once now, and once
  // after layout settles in the next animation frame — to beat browsers that
  // restore scroll on hashchange after our handler has already fired.
  scrollToTop();
  requestAnimationFrame(scrollToTop);
}

function idFromHash(): string {
  return (location.hash || `#${defaultId}`).slice(1);
}

// Listen for clicks bubbled up from each scout-anchor-links instance. The
// component's `prevent-scroll` mode lets the native `<a href="#id">` push the
// hash; we hook the bubbled event for mobile-drawer-close + redundant page
// swap (in case hashchange races on first paint).
for (const s of navSections) {
  if (!s.el) continue;
  s.el.addEventListener('scout-anchor-change', (e) => {
    const id = (e as CustomEvent<{ id: string }>).detail.id;
    if (id !== idFromHash()) {
      // The native <a href> will update the hash, but we update eagerly so the
      // page swap doesn't wait on the hashchange event tick.
      history.replaceState(null, '', `#${id}`);
    }
    showPage(id);
    if (window.matchMedia('(max-width: 960px)').matches) {
      document.body.classList.remove('nav-open');
    }
  });
}

// Browser back/forward + native hash navigation also drives showPage
window.addEventListener('hashchange', () => showPage(idFromHash()));
window.addEventListener('popstate', () => showPage(idFromHash()));

// Initial render
showPage(idFromHash());

// =================================================================
// Mobile nav (hamburger) toggle
// =================================================================

const navToggle = document.getElementById('nav-toggle');
const scrim = document.getElementById('sidebar-scrim');
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

mq.addEventListener('change', (e) => {
  if (!e.matches) closeNav();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.classList.contains('nav-open')) closeNav();
});
