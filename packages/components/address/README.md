# @scout-ds/address

`<scout-address>` — Scout's pre-formatted address display.

## Install

```bash
pnpm add @scout-ds/address @scout-ds/tokens lit
```

## Use

```html
<scout-address label="Home address" favorite>
  123 Main St<br />
  Apt 4B<br />
  Brooklyn, NY 11201
  <span slot="meta">Last verified Mar 2024 · Primary</span>
</scout-address>

<scout-address label="Mailing address" select-tool="radio" name="primary-addr" value="addr-1" selected>
  500 Park Ave<br />
  New York, NY 10022
</scout-address>

<scout-address size="single-line">
  123 Main St, Apt 4B, Brooklyn, NY 11201
</scout-address>

<scout-address do-not-disclose label="Backup address">
  PO Box 123<br />
  Anywhere, USA
</scout-address>
```

## API

| Attribute          | Type                                | Default   | Description |
| ------------------ | ----------------------------------- | --------- | ----------- |
| `label`            | string                              | `""`      | Optional label rendered above the body. |
| `size`             | `"full"\|"condensed"\|"single-line"` | `"full"`  | Layout density. |
| `select-tool`      | `"none"\|"checkbox"\|"radio"`        | `"none"`  | Renders a selector to the left of the address. |
| `orientation`      | `"stacked"\|"inline"`                | `"stacked"` | Stacked = label above body. |
| `favorite`         | boolean                              | `false`   | Renders a star next to the label. |
| `do-not-disclose`  | boolean                              | `false`   | Renders a privacy banner above the address. |
| `selected`         | boolean                              | `false`   | Toggles the selector's checked state. |
| `disabled`         | boolean                              | `false`   | Disables interaction. |
| `name` / `value`   | string                               | `""`      | Form name/value for the internal selector. |

### Slots

| Slot | Purpose |
| --- | --- |
| (default) | Body copy. Use `<br>` for multi-line layouts. |
| `meta` | Secondary meta copy. |

### Events

`scout-address-change` — bubbling, composed. `event.detail = { selected: boolean, value: string }`.

## Privacy

The `do-not-disclose` attribute renders a banner reminding agents that
the customer has flagged this address as not for third-party disclosure.
The address remains visible — agents need to see it — but the banner
is a clear visual reminder that's also exposed to assistive tech via
`role="note"`.
