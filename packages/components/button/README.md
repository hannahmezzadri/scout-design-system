# @connex/button

`<connex-button>` — Connex's clickable button Web Component.

## Install

```bash
pnpm add @connex/button @connex/tokens lit
```

## Use

```html
<connex-button variant="primary" size="default">Save changes</connex-button>

<connex-button variant="action">
  <svg slot="icon-leading">…</svg>
  Add account
</connex-button>

<connex-button variant="critical" loading>Deleting…</connex-button>

<form>
  <connex-button type="submit" variant="primary">Submit</connex-button>
  <connex-button type="reset" variant="secondary">Reset</connex-button>
</form>
```

```ts
import '@connex/button';
```

## API

| Attribute  | Type | Default | Description |
| --- | --- | --- | --- |
| `variant`  | `"primary" \| "secondary" \| "tertiary" \| "action" \| "critical" \| "critical-tertiary"` | `"primary"` | Visual hierarchy. |
| `size`     | `"default" \| "condensed"` | `"default"` | Density preset. |
| `type`     | `"button" \| "submit" \| "reset"` | `"button"` | Form-association behavior. |
| `disabled` | boolean | `false` | Disables interaction; skips tab order. |
| `loading`  | boolean | `false` | Shows a spinner and sets `aria-busy="true"`. |

### Slots

| Slot | Purpose |
| --- | --- |
| (default) | Label content |
| `icon-leading`  | Icon before the label |
| `icon-trailing` | Icon after the label |

### Form association

`<connex-button>` uses the [ElementInternals API](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals).
When inside a `<form>`:
- `type="submit"` → `form.requestSubmit()`
- `type="reset"`  → `form.reset()`

## Accessibility

- Renders as a native `<button>`. Keyboard focus, Enter and Space activation.
- Visible focus ring at `:focus-visible`.
- `disabled` skips tab order; `loading` sets `aria-busy="true"`.
- Color contrast meets WCAG 2.1 AA against the page background in light and dark.
- Honors `prefers-reduced-motion: reduce`.
