# @scout-ds/button

`<scout-button>` — Scout's clickable button Web Component.

## Install

```bash
pnpm add @scout-ds/button @scout-ds/tokens lit
```

## Use

```html
<scout-button variant="primary" size="default">Save changes</scout-button>

<scout-button variant="action">
  <svg slot="icon-leading">…</svg>
  Add account
</scout-button>

<scout-button variant="critical" loading>Deleting…</scout-button>

<form>
  <scout-button type="submit" variant="primary">Submit</scout-button>
  <scout-button type="reset" variant="secondary">Reset</scout-button>
</form>
```

```ts
import '@scout-ds/button';
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

`<scout-button>` uses the [ElementInternals API](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals).
When inside a `<form>`:
- `type="submit"` → `form.requestSubmit()`
- `type="reset"`  → `form.reset()`

## Accessibility

- Renders as a native `<button>`. Keyboard focus, Enter and Space activation.
- Visible focus ring at `:focus-visible`.
- `disabled` skips tab order; `loading` sets `aria-busy="true"`.
- Color contrast meets WCAG 2.1 AA against the page background in light and dark.
- Honors `prefers-reduced-motion: reduce`.
