// Connex docs — page-based router. Sidebar clicks switch which page is visible.
// No anchor scrolling. Each sidebar link corresponds to one .page element.

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

function page(id: string, ...children: (Node | string)[]): HTMLElement {
  return el('section', { id, class: 'page', 'data-page': id }, ...children);
}

function header(title: string, lede: string): HTMLElement {
  return el('div', { class: 'page-header' }, el('h2', {}, title), el('p', { class: 'lede' }, lede));
}

function categoryBanner(title: string, lede: string): HTMLElement {
  return el('div', { class: 'category-banner' }, el('h1', {}, title), el('p', {}, lede));
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

// foundation-overview
{
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
    page(
      'foundation-overview',
      categoryBanner(
        'Foundation',
        'The principles, theming model, and accessibility baseline that every Connex token, component, and pattern is built on.',
      ),
      header(
        'Architecture',
        'Connex is structured as a private monorepo. Each package versions independently and ships to a private npm registry.',
      ),
      cards,
    ),
  );
}

// foundation-theming
{
  const grid = el('div', { class: 'foundation-grid' });
  grid.append(
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

  app.append(
    page(
      'foundation-theming',
      header(
        'Theming',
        'Themes are scoped via data attributes on any element (typically <html>). Switching theme/density/brand is a single attribute change — no rebundle, no FOUC.',
      ),
      grid,
    ),
  );
}

// foundation-density
app.append(
  page(
    'foundation-density',
    header(
      'Density',
      'Default vs. condensed. Condensed tightens typography line-heights so data-dense interfaces (agent desktops, tables) read more compactly without losing legibility.',
    ),
  ),
);

// foundation-accessibility
app.append(
  page(
    'foundation-accessibility',
    header(
      'Accessibility',
      'WCAG 2.1 AA is the baseline for color contrast, focus indicators, keyboard navigation, and screen-reader semantics. Components honor `prefers-reduced-motion`. Logical CSS properties (margin-inline, padding-block) are used throughout for future RTL support.',
    ),
  ),
);

// foundation-motion-principles
app.append(
  page(
    'foundation-motion-principles',
    header(
      'Motion principles',
      'Motion is purposeful: enter motion decelerates (eases the user in), exit motion accelerates (gets out of the way), hover/focus is fast (≤150ms). Every animated component honors `prefers-reduced-motion: reduce` by collapsing durations to 0.',
    ),
  ),
);

// =================================================================
// TOKENS
// =================================================================

// tokens-overview
app.append(
  page(
    'tokens-overview',
    categoryBanner(
      'Tokens',
      'The atomic visual values of Connex. Three layers: primitives (raw values), semantic (purposeful aliases), composite (component-level token bundles).',
    ),
  ),
);

// colors
{
  const wrap = page(
    'colors',
    header(
      'Colors',
      'Primitive color scales (100 lightest → 800 darkest), alpha overlays for scrims, plus white and black anchors.',
    ),
  );
  const hues = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'];
  for (const hue of hues) {
    wrap.append(subhead(hue.charAt(0).toUpperCase() + hue.slice(1)));
    const grid = el('div', { class: 'grid dense' });
    for (const stop of ['100', '200', '300', '400', '500', '600', '700', '800']) {
      grid.append(colorSwatch(`color-${hue}-${stop}`, `${hue}.${stop}`));
    }
    wrap.append(grid);
  }
  wrap.append(subhead('Alpha (black-based scrims)'));
  const alphaGrid = el('div', { class: 'grid dense' });
  for (const stop of ['100', '200', '300', '400', '500', '600', '700', '800']) {
    alphaGrid.append(colorSwatch(`color-alpha-${stop}`, `alpha.${stop}`));
  }
  wrap.append(alphaGrid);

  wrap.append(subhead('Alpha-white (for dark surfaces)'));
  const aWhite = el('div', { class: 'grid dense' });
  for (const stop of ['100', '200', '300', '400', '500', '600', '700', '800']) {
    aWhite.append(colorSwatch(`color-alpha-white-${stop}`, `alpha-white.${stop}`));
  }
  wrap.append(aWhite);

  wrap.append(subhead('Anchors'));
  const anchors = el('div', { class: 'grid dense' });
  anchors.append(colorSwatch('color-white', 'white'));
  anchors.append(colorSwatch('color-black', 'black'));
  wrap.append(anchors);

  app.append(wrap);
}

// brand
{
  const wrap = page(
    'brand',
    header(
      'Brand',
      'Per-product brand colors, scoped via [data-brand]. Switch the Brand control above to see the active set update.',
    ),
  );
  const brands: Array<[string, string[]]> = [
    ['connex', ['light', 'primary', 'dark']],
    ['empath', ['primary', 'accent']],
    ['sage', ['primary', 'cream']],
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
  app.append(wrap);
}

// typography
{
  const wrap = page(
    'typography',
    header(
      'Typography',
      'Composite typography tokens. Literata for heading + display, Inter for everything else. Toggle Density to compare default vs. condensed.',
    ),
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
    wrap.append(
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
  app.append(wrap);
}

// spacing
{
  const wrap = page('spacing', header('Spacing', '4-based scale. Use these for padding, margin, gap.'));
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
    header('Corner radius', 'Border-radius scale. 999 = fully rounded (pill / circle).'),
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
  const wrap = page('border', header('Border width', 'Border thickness scale.'));
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

// elevation
{
  const wrap = page('elevation', header('Elevation', 'Box-shadow tokens. Levels 1–4 increase in depth.'));
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
    header('Z-index', 'Stacking layers. Higher tokens always render above lower tokens.'),
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

// semantic
{
  const wrap = page(
    'semantic',
    header(
      'Semantic',
      'Aliases that components consume. Switch theme/density above to watch them shift.',
    ),
  );

  wrap.append(subhead('Text — display'));
  const tDisplay = el('div', { class: 'grid' });
  for (const k of ['primary', 'secondary', 'info', 'warning', 'error', 'success', 'increase', 'decrease']) {
    tDisplay.append(colorSwatch(`text-display-${k}`, `text.display.${k}`));
  }
  wrap.append(tDisplay);

  wrap.append(subhead('Text — interactive'));
  const tInter = el('div', { class: 'grid' });
  for (const k of ['primary', 'secondary', 'info', 'warning', 'error', 'success', 'increase', 'decrease']) {
    tInter.append(colorSwatch(`text-interactive-${k}`, `text.interactive.${k}`));
  }
  wrap.append(tInter);

  wrap.append(subhead('Icon — display'));
  const iDisplay = el('div', { class: 'grid' });
  for (const k of ['primary', 'secondary', 'info', 'warning', 'error', 'success', 'increase', 'decrease']) {
    iDisplay.append(colorSwatch(`icon-display-${k}`, `icon.display.${k}`));
  }
  wrap.append(iDisplay);

  wrap.append(subhead('Border'));
  const borders = el('div', { class: 'grid' });
  for (const k of ['primary', 'secondary', 'knockout', 'info', 'warning', 'error', 'success']) {
    borders.append(colorSwatch(`border-color-${k}`, `border-color.${k}`));
  }
  wrap.append(borders);

  wrap.append(subhead('Background'));
  const bgs = el('div', { class: 'grid' });
  for (const k of ['page', 'surface', 'scrim']) {
    bgs.append(colorSwatch(`background-${k}`, `background.${k}`));
  }
  wrap.append(bgs);

  app.append(wrap);
}

// =================================================================
// COMPONENTS
// =================================================================

// --- Component page template (flexible tabs)
type ComponentTab = { id: string; label: string; content: HTMLElement };

function componentPage(id: string, name: string, description: string, tabs: ComponentTab[]): HTMLElement {
  const tabList = el('div', { class: 'component-tabs', role: 'tablist', 'aria-label': `${name} sections` });
  const panels = el('div', { class: 'component-panels' });

  tabs.forEach((t, i) => {
    const isFirst = i === 0;
    const btn = el(
      'button',
      {
        type: 'button',
        class: `component-tab${isFirst ? ' active' : ''}`,
        role: 'tab',
        id: `tab-${id}-${t.id}`,
        'aria-controls': `panel-${id}-${t.id}`,
        'aria-selected': isFirst ? 'true' : 'false',
        tabindex: isFirst ? '0' : '-1',
      },
      t.label,
    );
    tabList.append(btn);

    const panel = el(
      'div',
      {
        class: `component-panel${isFirst ? ' active' : ''}`,
        role: 'tabpanel',
        id: `panel-${id}-${t.id}`,
        'aria-labelledby': `tab-${id}-${t.id}`,
        tabindex: '0',
      },
      t.content,
    );
    panels.append(panel);
  });

  // Wire tab switching (scoped to this component page)
  const buttons = Array.from(tabList.querySelectorAll<HTMLButtonElement>('.component-tab'));
  const panelEls = Array.from(panels.querySelectorAll<HTMLElement>('.component-panel'));
  buttons.forEach((b, i) => {
    b.addEventListener('click', () => {
      buttons.forEach((bb, j) => {
        const active = j === i;
        bb.classList.toggle('active', active);
        bb.setAttribute('aria-selected', String(active));
        bb.setAttribute('tabindex', active ? '0' : '-1');
      });
      panelEls.forEach((p, j) => p.classList.toggle('active', j === i));
    });
    b.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
      buttons[next]?.click();
    });
  });

  return page(
    id,
    el(
      'div',
      { class: 'component-page-header' },
      el('span', { class: 'component-eyebrow' }, 'Component'),
      el('h1', { class: 'component-title' }, name),
      el('p', { class: 'component-description' }, description),
    ),
    tabList,
    panels,
  );
}

// --- Button mock (CSS-only stand-in for the eventual Lit component)
type BtnVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
type BtnSize = 'sm' | 'md' | 'lg';
interface BtnOpts {
  variant?: BtnVariant;
  size?: BtnSize;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  leadingIcon?: string;
  trailingIcon?: string;
}

function previewButton(opts: BtnOpts = {}): HTMLButtonElement {
  const {
    variant = 'primary',
    size = 'md',
    label = 'Button',
    disabled = false,
    loading = false,
    leadingIcon,
    trailingIcon,
  } = opts;

  const btn = el('button', {
    type: 'button',
    class: `cnx-btn cnx-btn--${variant} cnx-btn--${size}${loading ? ' cnx-btn--loading' : ''}`,
  }) as HTMLButtonElement;
  if (disabled) btn.setAttribute('disabled', '');
  if (loading) btn.setAttribute('aria-busy', 'true');

  if (loading) btn.append(el('span', { class: 'cnx-btn__spinner', 'aria-hidden': 'true' }));
  else if (leadingIcon)
    btn.append(el('span', { class: 'cnx-btn__icon', 'aria-hidden': 'true' }, leadingIcon));

  btn.append(el('span', { class: 'cnx-btn__label' }, label));

  if (!loading && trailingIcon)
    btn.append(el('span', { class: 'cnx-btn__icon', 'aria-hidden': 'true' }, trailingIcon));

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
    'Four hierarchies of button. Use primary for the single most important action, secondary for supporting actions, tertiary for low-emphasis actions, and destructive for irreversible actions.',
    previewButton({ variant: 'primary', label: 'Primary' }),
    previewButton({ variant: 'secondary', label: 'Secondary' }),
    previewButton({ variant: 'tertiary', label: 'Tertiary' }),
    previewButton({ variant: 'destructive', label: 'Destructive' }),
  );

  block(
    'Sizes',
    'Three sizes. Use medium by default. Small for dense UI like toolbars and tables; large for prominent CTAs.',
    previewButton({ size: 'sm', label: 'Small' }),
    previewButton({ size: 'md', label: 'Medium' }),
    previewButton({ size: 'lg', label: 'Large' }),
  );

  block(
    'States',
    'States express what the button is doing or whether it can be used.',
    previewButton({ label: 'Default' }),
    previewButton({ label: 'Disabled', disabled: true }),
    previewButton({ label: 'Loading…', loading: true }),
  );

  block(
    'With icons',
    'Icons must be paired with a text label. Icon-only buttons require an aria-label and use a separate IconButton component (forthcoming).',
    previewButton({ label: 'Continue', trailingIcon: '→' }),
    previewButton({ label: 'Add', leadingIcon: '+' }),
    previewButton({ variant: 'secondary', label: 'Filter', leadingIcon: '⚲' }),
  );

  return wrap;
}

// --- Button — Controls tab (live prop editor)
function buttonControls(): HTMLElement {
  const wrap = el('div', { class: 'tab-content controls-layout' });

  // Stage (renders the button live)
  const stage = el('div', { class: 'preview-stage' });
  function render() {
    stage.replaceChildren(
      previewButton({
        variant: variantSel.value as BtnVariant,
        size: sizeSel.value as BtnSize,
        label: labelInput.value || 'Button',
        disabled: disabledChk.checked,
        loading: loadingChk.checked,
        leadingIcon: leadingChk.checked ? '+' : undefined,
        trailingIcon: trailingChk.checked ? '→' : undefined,
      }),
    );
    codePre.textContent = renderCode();
  }

  function renderCode() {
    const attrs: string[] = [];
    if (variantSel.value !== 'primary') attrs.push(`variant="${variantSel.value}"`);
    if (sizeSel.value !== 'md') attrs.push(`size="${sizeSel.value}"`);
    if (disabledChk.checked) attrs.push('disabled');
    if (loadingChk.checked) attrs.push('loading');
    if (leadingChk.checked) attrs.push('leading-icon="plus"');
    if (trailingChk.checked) attrs.push('trailing-icon="arrow-right"');
    const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
    return `<connex-button${attrStr}>${labelInput.value || 'Button'}</connex-button>`;
  }

  // Form controls
  const variantSel = el('select', { id: 'ctrl-variant' },
    ...(['primary', 'secondary', 'tertiary', 'destructive'] as const).map((v) =>
      el('option', { value: v }, v.charAt(0).toUpperCase() + v.slice(1)),
    ),
  ) as HTMLSelectElement;

  const sizeSel = el('select', { id: 'ctrl-size' },
    ...(['sm', 'md', 'lg'] as const).map((s) => el('option', { value: s }, s.toUpperCase())),
  ) as HTMLSelectElement;
  sizeSel.value = 'md';

  const labelInput = el('input', { type: 'text', id: 'ctrl-label', value: 'Button' }) as HTMLInputElement;

  const disabledChk = el('input', { type: 'checkbox', id: 'ctrl-disabled' }) as HTMLInputElement;
  const loadingChk = el('input', { type: 'checkbox', id: 'ctrl-loading' }) as HTMLInputElement;
  const leadingChk = el('input', { type: 'checkbox', id: 'ctrl-leading' }) as HTMLInputElement;
  const trailingChk = el('input', { type: 'checkbox', id: 'ctrl-trailing' }) as HTMLInputElement;

  for (const ctrl of [variantSel, sizeSel, labelInput, disabledChk, loadingChk, leadingChk, trailingChk]) {
    ctrl.addEventListener('input', render);
    ctrl.addEventListener('change', render);
  }

  const ctrlField = (labelText: string, htmlFor: string, control: HTMLElement) =>
    el('div', { class: 'ctrl-field' },
      el('label', { for: htmlFor }, labelText),
      control,
    );

  const ctrlChecks = el('div', { class: 'ctrl-checks' },
    el('label', {}, disabledChk, ' Disabled'),
    el('label', {}, loadingChk, ' Loading'),
    el('label', {}, leadingChk, ' Leading icon'),
    el('label', {}, trailingChk, ' Trailing icon'),
  );

  const panel = el('div', { class: 'ctrl-panel' },
    el('h3', { class: 'preview-block__title' }, 'Properties'),
    ctrlField('Variant', 'ctrl-variant', variantSel),
    ctrlField('Size', 'ctrl-size', sizeSel),
    ctrlField('Label', 'ctrl-label', labelInput),
    ctrlChecks,
  );

  const codePre = el('pre', { class: 'code-block' }) as HTMLPreElement;
  const codeWrap = el('div', { class: 'code-wrap' },
    el('h3', { class: 'preview-block__title' }, 'Code'),
    codePre,
  );

  wrap.append(panel, el('div', { class: 'ctrl-stage-wrap' }, stage, codeWrap));

  // Initial render
  queueMicrotask(render);
  return wrap;
}

// --- Button — Usage guidelines (Do and Don't, separate sections)
function buttonGuidelines(): HTMLElement {
  const doCard = (preview: HTMLElement | HTMLElement[], copy: string) =>
    el(
      'div',
      { class: 'do-card' },
      el('div', { class: 'do-dont-header' }, '✓ Do'),
      el(
        'div',
        { class: `do-dont-preview${Array.isArray(preview) ? ' do-dont-preview--row' : ''}` },
        ...(Array.isArray(preview) ? preview : [preview]),
      ),
      el('p', {}, copy),
    );

  const dontCard = (preview: HTMLElement | HTMLElement[], copy: string) =>
    el(
      'div',
      { class: 'dont-card' },
      el('div', { class: 'do-dont-header' }, '✗ Don\'t'),
      el(
        'div',
        { class: `do-dont-preview${Array.isArray(preview) ? ' do-dont-preview--row' : ''}` },
        ...(Array.isArray(preview) ? preview : [preview]),
      ),
      el('p', {}, copy),
    );

  return el(
    'div',
    { class: 'tab-content guidelines-layout' },

    // Do
    el(
      'section',
      { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading do-heading' }, 'Do'),
      el(
        'p',
        { class: 'preview-block__lede' },
        'Patterns that strengthen hierarchy and make a button\'s action obvious.',
      ),
      el(
        'div',
        { class: 'do-dont-grid' },
        doCard(
          previewButton({ variant: 'primary', label: 'Save changes' }),
          'Use one primary button per view to anchor the most important action.',
        ),
        doCard(
          previewButton({ label: 'Add account', leadingIcon: '+' }),
          'Pair icons with clear text labels. The icon reinforces meaning without replacing language.',
        ),
        doCard(
          previewButton({ variant: 'destructive', label: 'Delete account' }),
          'For destructive actions, name the consequence in the label.',
        ),
        doCard(
          [
            previewButton({ variant: 'primary', label: 'Save' }),
            previewButton({ variant: 'secondary', label: 'Cancel' }),
          ],
          'Pair a primary action with a secondary, low-emphasis cancel option.',
        ),
      ),
    ),

    // Don't
    el(
      'section',
      { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading dont-heading' }, 'Don\'t'),
      el(
        'p',
        { class: 'preview-block__lede' },
        'Patterns that weaken hierarchy or confuse the user about what an action will do.',
      ),
      el(
        'div',
        { class: 'do-dont-grid' },
        dontCard(
          [
            previewButton({ variant: 'primary', label: 'Save' }),
            previewButton({ variant: 'primary', label: 'Continue' }),
            previewButton({ variant: 'primary', label: 'Submit' }),
          ],
          'Don\'t stack multiple primary buttons together — users won\'t know which action takes precedence.',
        ),
        dontCard(
          previewButton({ label: 'Click here to perform the requested action now' }),
          'Don\'t write long, vague labels. Use 1–3 word verb phrases.',
        ),
        dontCard(
          previewButton({ variant: 'destructive', label: 'Yes' }),
          'Don\'t use generic confirm-style labels for destructive actions. "Yes" doesn\'t tell the user what they\'re destroying.',
        ),
        dontCard(
          previewButton({ variant: 'tertiary', label: 'OK', size: 'sm' }),
          'Don\'t use tertiary buttons for primary actions — there\'s no visual hierarchy to anchor the user\'s next step.',
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
    el(
      'section',
      { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Writing button labels'),
      el(
        'p',
        { class: 'preview-block__lede' },
        'Buttons live or die on their label. A good label tells the user exactly what will happen when they click.',
      ),
      el(
        'ul',
        { class: 'guideline-list' },
        el('li', {}, 'Use sentence case ("Save changes", not "Save Changes" or "SAVE CHANGES").'),
        el('li', {}, 'Lead with a verb. Buttons describe an action: "Add", "Submit", "Cancel".'),
        el('li', {}, 'Keep labels under 3 words when possible. If you need more, you probably need a different component.'),
        el('li', {}, 'Avoid redundancy. "Save" beats "Save now"; "Cancel" beats "Cancel this action".'),
        el('li', {}, 'For destructive actions, name the consequence: "Delete account", not "Yes" or "Confirm".'),
        el('li', {}, 'Match the verb tense to the user\'s intent. "Add" is invitational; "Added" is confirmational and shouldn\'t live on a button.'),
      ),
    ),
    el(
      'section',
      { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Localization'),
      el(
        'ul',
        { class: 'guideline-list' },
        el('li', {}, 'Reserve at least 30% extra horizontal space for translated strings. German and French labels often run longer than English.'),
        el('li', {}, 'Don\'t concatenate fragments to build a label — translate the full string. Avoid: "Add" + " " + entityType.'),
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
    el(
      'section',
      { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Keyboard & focus'),
      el(
        'ul',
        { class: 'guideline-list' },
        el('li', {}, 'Renders as a native <button>. Receives keyboard focus and is activated by Enter and Space.'),
        el('li', {}, 'Visible focus ring uses a 2px outline at offset 2px on :focus-visible. Never disable focus styles.'),
        el('li', {}, 'Disabled buttons set the `disabled` attribute and are skipped in tab order.'),
        el('li', {}, 'No keyboard trap: focus moves naturally to the next focusable element.'),
      ),
    ),
    el(
      'section',
      { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Screen readers'),
      el(
        'ul',
        { class: 'guideline-list' },
        el('li', {}, 'Loading buttons set aria-busy="true" so assistive tech announces the state.'),
        el('li', {}, 'Icon-only buttons require an aria-label that matches the visual intent ("Close", "Search").'),
        el('li', {}, 'Decorative icons inside text buttons set aria-hidden="true" so they\'re not announced twice.'),
      ),
    ),
    el(
      'section',
      { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Color & motion'),
      el(
        'ul',
        { class: 'guideline-list' },
        el('li', {}, 'Color contrast meets WCAG 2.1 AA against background-page in both light and dark themes.'),
        el('li', {}, 'Status (info, success, warning, error) is never conveyed by color alone — pair with text or icons.'),
        el('li', {}, 'Honors prefers-reduced-motion: state transitions and the loading spinner collapse for users who request reduced motion.'),
      ),
    ),
  );
}

// --- Button — Code
function buttonCode(): HTMLElement {
  return el(
    'div',
    { class: 'tab-content guidelines-layout' },
    el(
      'section',
      { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'HTML / Web Component'),
      el(
        'pre',
        { class: 'code-block' },
        `<connex-button variant="primary" size="md">
  Save changes
</connex-button>

<connex-button variant="secondary" size="md" leading-icon="plus">
  Add account
</connex-button>

<connex-button variant="destructive" loading>
  Deleting…
</connex-button>`,
      ),
    ),
    el(
      'section',
      { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'React (via @connex/react wrapper)'),
      el(
        'pre',
        { class: 'code-block' },
        `import { Button } from '@connex/react';

<Button variant="primary" onClick={save}>
  Save changes
</Button>`,
      ),
    ),
    el(
      'section',
      { class: 'guideline-section' },
      el('h3', { class: 'guideline-heading' }, 'Props'),
      el(
        'div',
        { class: 'props-table-wrap' },
        el(
          'table',
          { class: 'props-table' },
          el('thead', {},
            el('tr', {},
              el('th', {}, 'Prop'),
              el('th', {}, 'Type'),
              el('th', {}, 'Default'),
              el('th', {}, 'Description'),
            ),
          ),
          el('tbody', {},
            el('tr', {}, el('td', {}, 'variant'), el('td', {}, '"primary" | "secondary" | "tertiary" | "destructive"'), el('td', {}, '"primary"'), el('td', {}, 'Visual hierarchy.')),
            el('tr', {}, el('td', {}, 'size'), el('td', {}, '"sm" | "md" | "lg"'), el('td', {}, '"md"'), el('td', {}, 'Button size.')),
            el('tr', {}, el('td', {}, 'disabled'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Disable interaction.')),
            el('tr', {}, el('td', {}, 'loading'), el('td', {}, 'boolean'), el('td', {}, 'false'), el('td', {}, 'Show spinner and set aria-busy.')),
            el('tr', {}, el('td', {}, 'leading-icon'), el('td', {}, 'string'), el('td', {}, '—'), el('td', {}, 'Hero Icon name placed before the label.')),
            el('tr', {}, el('td', {}, 'trailing-icon'), el('td', {}, 'string'), el('td', {}, '—'), el('td', {}, 'Hero Icon name placed after the label.')),
          ),
        ),
      ),
    ),
  );
}

// --- Components overview
{
  function componentLink(id: string, name: string, summary: string): HTMLElement {
    return el(
      'a',
      { class: 'component-link-card', href: `#${id}` },
      el('h4', {}, name),
      el('p', {}, summary),
      el('span', { class: 'component-link-card__arrow' }, '→'),
    );
  }

  const grid = el(
    'div',
    { class: 'foundation-grid' },
    componentLink('components-button', 'Button', 'Primary, secondary, tertiary, destructive variants. Sizes: small, medium, large. Loading and icon states.'),
    emptyPanel('Input', 'Text, email, number, password. Native form association. Validation states wired to border-color.error and text-display-error.'),
    emptyPanel('Modal', 'Focus-trapped, dismissible, scrim-backed. Uses elevation.4 + motion.duration.slow on enter.'),
    emptyPanel('Table', 'Sortable, virtualized, sticky-header. Condensed-density-aware row heights.'),
    emptyPanel('Tabs', 'Horizontal and vertical orientations. Keyboard navigation, ARIA tablist semantics.'),
    emptyPanel('Toast', 'Stack of dismissible notifications. Status variants (info, success, warning, error). Reduced-motion compliant.'),
  );
  app.append(
    page(
      'components-overview',
      categoryBanner(
        'Components',
        'Reusable Lit Web Components built on Connex tokens. Form-associated via ElementInternals, accessible to WCAG 2.1 AA, framework-agnostic with React wrappers.',
      ),
      grid,
    ),
  );
}

// --- Button page
app.append(
  componentPage(
    'components-button',
    'Button',
    'Triggers an action or navigates to a new view. Buttons are the primary way users interact with Connex products.',
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
// PATTERNS
// =================================================================
{
  const grid = el(
    'div',
    { class: 'foundation-grid' },
    emptyPanel('Empty state', 'Illustration, headline, description, primary action. Used when data is missing or unavailable.'),
    emptyPanel('Form', 'Field grouping, inline validation, submission states, error summaries.'),
    emptyPanel('Workflow stepper', 'Linear multi-step processes (close account, make payment). Progress indicator and back/next controls.'),
    emptyPanel('Data table pattern', 'Toolbar + table + pagination. Filtering, sorting, bulk actions, row selection.'),
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

// =================================================================
// TEMPLATES
// =================================================================
{
  const grid = el(
    'div',
    { class: 'foundation-grid' },
    emptyPanel('Settings page', 'Sidebar navigation + scrolling content with section anchors. Used for any preference or configuration UI.'),
    emptyPanel('Dashboard', 'Header + stat cards + chart row + activity table. The default landing for product home views.'),
    emptyPanel('Detail view', 'Header with key actions, metadata strip, tabbed body. Used for entity pages (customer, account, ticket).'),
    emptyPanel('List + filter', 'Filter sidebar + searchable, sortable list + detail panel. Used for any list-heavy product surface.'),
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
// ROUTER — sidebar links switch which .page is visible (no scrolling)
// =================================================================

const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav-group li a'));
const pages = Array.from(document.querySelectorAll<HTMLElement>('.page'));
const validIds = new Set(pages.map((p) => p.id));
const defaultId = 'foundation-overview';

function showPage(id: string) {
  const target = validIds.has(id) ? id : defaultId;
  for (const p of pages) p.classList.toggle('active', p.id === target);
  for (const a of links) {
    const li = a.closest('li');
    if (!li) continue;
    li.classList.toggle('active', a.getAttribute('href') === `#${target}`);
  }
  // Scroll the main content area to top so each "page" starts fresh
  document.getElementById('app')?.scrollTo({ top: 0 });
  window.scrollTo({ top: 0 });
}

function idFromHash(): string {
  return (location.hash || `#${defaultId}`).slice(1);
}

// Intercept clicks: update hash, no native scroll
for (const a of links) {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('#')) return;
    e.preventDefault();
    const id = href.slice(1);
    if (id !== idFromHash()) {
      history.pushState(null, '', `#${id}`);
    }
    showPage(id);
    // On mobile, close the drawer after selection
    if (window.matchMedia('(max-width: 960px)').matches) {
      document.body.classList.remove('nav-open');
    }
  });
}

// Browser back/forward updates the page
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
