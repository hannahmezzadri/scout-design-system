# @connex/accordion

`<connex-accordion>` and `<connex-accordion-item>` — Connex's accordion Web Components.

## Install

```bash
pnpm add @connex/accordion @connex/tokens lit
```

## Use

```html
<!-- Load Connex tokens once at the app root -->
<link rel="stylesheet" href="node_modules/@connex/tokens/dist/css/tokens.css" />

<connex-accordion mode="single" size="md" icon-position="right" divider>
  <connex-accordion-item label="What is Connex?" expanded>
    Connex is the enterprise design system powering Empath and 7+ other products.
  </connex-accordion-item>
  <connex-accordion-item label="How do I install?">
    Components ship to a private npm registry. See the docs site for setup.
  </connex-accordion-item>
  <connex-accordion-item label="Disabled item" disabled>
    This row cannot be toggled.
  </connex-accordion-item>
</connex-accordion>
```

```ts
// Auto-registers <connex-accordion> and <connex-accordion-item>
import '@connex/accordion';
```

## API

### `<connex-accordion>`

| Attribute       | Type                  | Default   | Description                                              |
| --------------- | --------------------- | --------- | -------------------------------------------------------- |
| `mode`          | `"single"` \| `"multi"` | `"multi"` | `single` collapses peers when one opens; `multi` allows many. |
| `size`          | `"sm"` \| `"md"` \| `"lg"` | `"md"`    | Density preset propagated to all child items.            |
| `icon-position` | `"left"` \| `"right"` | `"right"` | Where the chevron sits relative to the label.            |
| `divider`       | boolean               | `false`   | Renders a 1px rule between items.                        |

### `<connex-accordion-item>`

| Attribute  | Type    | Default | Description                                  |
| ---------- | ------- | ------- | -------------------------------------------- |
| `label`    | string  | `""`    | Header label rendered next to the chevron.   |
| `expanded` | boolean | `false` | Whether the content is visible. Reflective.  |
| `disabled` | boolean | `false` | Disables interaction; skips tab order.       |

### Events

`connex-accordion-toggle` — bubbles, composed. `event.detail = { expanded: boolean }`.

## Accessibility

- Trigger renders as a native `<button>`; activates on Enter and Space.
- `aria-expanded` reflects the state of the row.
- The content region uses `role="region"` and `aria-labelledby` pointing at the trigger.
- `prefers-reduced-motion: reduce` collapses transitions to instant.

## Styling hooks

All visual values come from `@connex/tokens` so theme/density/brand toggles
on `<html>` are honored automatically. Override per-instance with the
following CSS custom properties (rare):

```css
connex-accordion {
  --_cnx-accordion-padding-block: 1rem;
  --_cnx-accordion-padding-inline: 1.5rem;
}
```
