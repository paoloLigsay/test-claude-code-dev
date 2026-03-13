---
paths:
  - "components/**/*.tsx"
---

- Use existing UI primitives from `components/ui/` before creating new elements:
  - `Button` — variants: `default`, `primary`, `ghost`, `destructive`. Sizes: `sm`, `md`, `lg`. Accepts `icon` prop.
  - `Input` — uses `inputSize` prop (`sm`, `md`), not `size`.
  - `IconButton` — icon-only button wrapper.
  - `DropdownMenu` — positioned dropdown with menu items.
  - `Modal` — centered overlay with `title`, `onClose`, `children`, `footer` props.
- Icons come from `lucide-react` only.
- Use Tailwind classes matching the existing neutral/brand color scheme (neutral-700, neutral-800, brand, etc.).
