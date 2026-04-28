# @scout/accordion

`<scout-accordion>` and `<scout-accordion-item>` — Scout's accordion Web Components.

## Install

```bash
pnpm add @scout/accordion @scout/tokens lit
```

## Use

```html
<!-- Load Scout tokens once at the app root -->
<link rel="stylesheet" href="node_modules/@scout/tokens/dist/css/tokens.css" />

<scout-accordion mode="single" size="md" icon-position="right" divider>
  <scout-accordion-item label="What is Scout?" expanded>
    Scout is the enterprise design system powering Empath and 7+ other products.
  </scout-accordion-item>
  <scout-accordion-item label="How do I install?">
    Components ship to a private npm registry. See the docs site for setup.
  </scout-accordion-item>
  <scout-accordion-item label="Disabled item" disabled>
    This row cannot be toggled.
  </scout-accordion-item>
</scout-accordion>
```

```ts
// Auto-registers <scout-accordion> and <scout-accordion-item>
import '@scout/accordion';
```

## API

### `<scout-accordion>`

| Attribute       | Type                  | Default   | Description                                              |
| --------------- | --------------------- | --------- | -------------------------------------------------------- |
| `mode`          | `"single"` \| `"multi"` | `"multi"` | `single` collapses peers when one opens; `multi` allows many. |
| `size`          | `"sm"` \| `"md"` \| `"lg"` | `"md"`    | Density preset propagated to all child items.            |
| `icon-position` | `"left"` \| `"right"` | `"right"` | Where the chevron sits relative to the label.            |
| `divider`       | boolean               | `false`   | Renders a 1px rule between items.                        |

### `<scout-accordion-item>`

| Attribute  | Type    | Default | Description                                  |
| ---------- | ------- | ------- | -------------------------------------------- |
| `label`    | string  | `""`    | Header label rendered next to the chevron.   |
| `expanded` | boolean | `false` | Whether the content is visible. Reflective.  |
| `disabled` | boolean | `false` | Disables interaction; skips tab order.       |

### Events

`scout-accordion-toggle` — bubbles, composed. `event.detail = { expanded: boolean }`.

## Accessibility

- Trigger renders as a native `<button>`; activates on Enter and Space.
- `aria-expanded` reflects the state of the row.
- The content region uses `role="region"` and `aria-labelledby` pointing at the trigger.
- `prefers-reduced-motion: reduce` collapses transitions to instant.

## Styling hooks

All visual values come from `@scout/tokens` so theme/density/brand toggles
on `<html>` are honored automatically. Override per-instance with the
following CSS custom properties (rare):

```css
scout-accordion {
  --_cnx-accordion-padding-block: 1rem;
  --_cnx-accordion-padding-inline: 1.5rem;
}
```
