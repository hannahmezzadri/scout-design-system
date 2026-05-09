# Scout

Enterprise design system powering 8+ internal tools.

## Stack

- **Components**: Lit (Web Components, Shadow DOM)
- **Styling**: design tokens as CSS custom properties, `::part()` for overrides
- **Distribution**: private npm registry, independent versioning via Changesets
- **Forms**: native via ElementInternals
- **i18n**: `@lit/localize` (EN / ES / FR)
- **Accessibility**: WCAG 2.1 AA
- **Monorepo**: pnpm workspaces + Turborepo

## Tiers

1. **Core** — tokens, primitives, components, foundational patterns
2. **Shared** — cross-product patterns + page templates
3. **Product** — product-scoped patterns (live in product repos, can be promoted)

## Packages

- `@scout-ds/tokens` — design tokens (CSS, TS, JSON, Tailwind preset)

## Development

```bash
pnpm install
pnpm build
```
