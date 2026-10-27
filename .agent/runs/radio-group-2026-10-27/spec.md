# Radio Group Spec

## 1. Purpose

Radio Group lets users select exactly one option from a mutually exclusive set. It preserves native radio semantics and form behavior while adding:

- A shared sliding indicator when multiple options are present.
- A spring-based press response on pointer interaction.
- A scale-in indicator for a standalone radio.
- Optional per-option descriptions exposed to assistive technology.

The component is intended for settings, forms, and other choices where all options should remain visible. It is not a replacement for `Tabs`, `Select`, or a standalone toggle.

## 2. Pattern Selection

Primary pattern: **Form Control Pattern**.

Radio Group is a user input control and must follow the existing native-input approach used by `CheckBox` and `Switch`:

- Native `<input type="radio">` elements provide form submission, checked state, disabled behavior, and baseline accessibility.
- Visual tracks and indicators are separate, `aria-hidden` elements.
- `useControllableState` from `seam-hooks` manages controlled and uncontrolled group values.
- `useEventCallback` from `seam-hooks` stabilizes internal callbacks where needed.
- `useId` from `react` generates group, input, label, and description relationships.
- `cx` from `utils/cx` merges component and consumer class names.

Secondary pattern: **Navigation Pattern**, limited to the shared-layout indicator technique.

The selected radio indicator uses Motion `layoutId` and `INDICATOR_SPRING`, consistent with the Tabs indicator rule. This does not make Radio Group a navigation component: it must not use Tabs roles, Tabs panels, or Tabs keyboard semantics.

No overlay primitives, portals, focus traps, or click-away behavior are required.

### Composition

```tsx
<RadioGroup
  value={value}
  defaultValue="standard"
  onValueChange={setValue}
  orientation="vertical"
  aria-label="Delivery speed"
>
  <RadioGroupItem
    value="standard"
    label="Standard"
    description="Arrives in 3–5 business days"
  />
  <RadioGroupItem
    value="express"
    label="Express"
    description="Arrives the next business day"
  />
</RadioGroup>
```

`RadioGroup` supplies group state and configuration through context. `RadioGroupItem` consumes that context and renders its native input, label, optional description, and visual control.

## 3. States

### Group states

| State              | Source                                                        | Behavior                                                                     |
| ------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Uncontrolled       | `defaultValue` supplied, `value` absent                       | Group owns the current value                                                 |
| Controlled         | `value` supplied                                              | Parent owns the current value; selection requests go through `onValueChange` |
| Empty              | Neither value matches an item                                 | No item is checked; no selected indicator is shown                           |
| Horizontal         | `orientation="horizontal"`                                    | Items flow horizontally and wrap when necessary                              |
| Vertical           | `orientation="vertical"`                                      | Items stack vertically                                                       |
| Disabled item      | Item `disabled={true}`                                        | Only that item is unavailable                                                |
| Invalid descendant | Consumer supplies `aria-invalid` or native validation applies | Item exposes invalid semantics; visual styling follows form-control tokens   |

There is no required group-level `disabled`, `required`, or `name` prop in the initial API. These remain open questions rather than silently expanding the requested API.

### Item states

| State                | Visual and behavioral treatment                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Default              | Unchecked visual control with primary label                                                                            |
| Hover                | Border changes to `var(--uk-border-strong)` when enabled                                                               |
| Focus-visible        | Native input focus produces a visible ring on the visual control                                                       |
| Checked              | Control uses primary colors and displays the indicator                                                                 |
| Pressed              | Visual control scales to `var(--uk-scale-press)` while actively pressed                                                |
| Disabled             | Native input is disabled; pointer interaction and selection are prevented; reduced opacity communicates unavailability |
| Checked and disabled | Selected appearance remains visible but muted                                                                          |
| Description present  | Secondary text appears below the label and is associated through `aria-describedby`                                    |
| Missing label        | Permitted only when the item receives an external accessible name; otherwise flagged as an accessibility failure       |

### State styling tokens

- Default control border: `var(--uk-border)`.
- Hover border: `var(--uk-border-strong)`.
- Control background: `var(--uk-surface)`.
- Checked background/border: `var(--uk-primary-solid)`.
- Indicator: `var(--uk-primary-contrast)`.
- Label: `var(--uk-text)`.
- Description: `var(--uk-text-muted)`.
- Focus ring: `var(--uk-focus-ring)`.
- Control radius: `var(--uk-radius-full)`.
- Item spacing and label/control gap: existing `--uk-space-*` tokens.
- Label text: `var(--uk-text-md)`.
- Description text: `var(--uk-text-sm)`.

No new color, spacing, radius, duration, or z-index tokens are introduced.

## 4. Public API

### Exports

```ts
export { RadioGroup, RadioGroupItem } from "./RadioGroup";

export type {
  RadioGroupProps,
  RadioGroupItemProps,
  RadioGroupOrientation,
} from "./RadioGroup";
```

The components may also be available as compound properties if that matches the final export convention, but the named exports above are the canonical API.

### Types

```ts
import type {
  ChangeEvent,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

export type RadioGroupOrientation = "horizontal" | "vertical";

export interface RadioGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange" | "children"
> {
  /** Controlled selected value. */
  value?: string;

  /** Initial selected value for an uncontrolled group. */
  defaultValue?: string;

  /** Called with the newly selected value. */
  onValueChange?: (value: string) => void;

  /** Layout direction. Defaults to "vertical". */
  orientation?: RadioGroupOrientation;

  /** RadioGroupItem children. */
  children?: ReactNode;

  /** Merged onto the group root. */
  className?: string;

  /** Accessible name when no visible external label exists. */
  "aria-label"?: string;

  /** ID of an external element that labels the group. */
  "aria-labelledby"?: string;
}

export interface RadioGroupItemProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | "type"
  | "value"
  | "checked"
  | "defaultChecked"
  | "children"
  | "className"
  | "size"
> {
  /** Value submitted and returned when this item is selected. */
  value: string;

  /** Visible option label. */
  label: ReactNode;

  /** Optional supporting text displayed below the label. */
  description?: ReactNode;

  /** Prevents focus and selection through the native disabled input. */
  disabled?: boolean;

  /** Merged onto the outer item wrapper, not the native input. */
  className?: string;

  /** Optional stable native input ID. */
  id?: string;
}
```

### API behavior

- `value` and `defaultValue` follow the existing `useControllableState` contract.
- `onValueChange` fires only when selection changes, not when a controlled group rerenders with the same value.
- Clicking an already selected item does not unselect it and does not emit a duplicate change.
- `RadioGroup` does not accept arbitrary non-item interactive children as part of the radio set.
- `orientation` defaults to `"vertical"` and is reflected with `aria-orientation` on the group.
- `className` on the group and item is merged with `cx`; internal classes remain present.
- Item `id` identifies the native input. If omitted, an ID is generated with `useId()`.
- Label and description IDs derive from the resolved input ID.
- The visible label is associated using a native `<label htmlFor={inputId}>`.
- The description is associated using `aria-describedby` on the native input.
- Additional native input props supported by the inherited interface, such as `name`, `required`, `autoFocus`, `onFocus`, and `onBlur`, are forwarded to the input.
- Group-level rest props are forwarded to the root `<div>`.
- Item rest props are forwarded to the native input, not the visual wrapper.
- The group root is not itself a form control and does not receive `disabled`.

### DOM structure

The implementation should preserve this semantic order:

```tsx
<div role="radiogroup" className="radio-group">
  <span className="radio-group-item">
    <span className="radio-group-control">
      <input type="radio" />
      <span className="radio-group-track" aria-hidden="true">
        <motion.span className="radio-group-indicator" />
      </span>
    </span>
    <span className="radio-group-copy">
      <label htmlFor="...">Label</label>
      <span id="...">Description</span>
    </span>
  </span>
</div>
```

Exact element names may change to satisfy native label click behavior and valid HTML, but the input must remain native, the visual control must remain hidden from assistive technology, and description text must remain in the accessibility description rather than the accessible name.

## 5. Keyboard Behavior

Radio Group follows native radio-group keyboard behavior rather than the automatic-activation Tabs model.

| Key         | Behavior                                                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Tab         | Enters the group at the checked radio. If none is checked, enters at the first enabled radio according to native browser behavior. |
| Shift + Tab | Leaves the group toward the previous focusable element.                                                                            |
| Arrow Right | Moves focus and selection to the next enabled radio in a horizontal group; wraps at the end.                                       |
| Arrow Left  | Moves focus and selection to the previous enabled radio in a horizontal group; wraps at the start.                                 |
| Arrow Down  | Moves focus and selection to the next enabled radio in a vertical group; wraps at the end.                                         |
| Arrow Up    | Moves focus and selection to the previous enabled radio in a vertical group; wraps at the end.                                     |
| Space       | Selects the focused radio if it is not already selected.                                                                           |
| Enter       | No custom selection behavior; native form behavior is preserved.                                                                   |
| Home / End  | No custom behavior in the initial version.                                                                                         |

### Differences from the Form Control Pattern

The pattern lists Radio as future work and does not define its keyboard behavior. This spec adds native radio-group navigation:

- Focus and checked state move together for arrow-key selection.
- Disabled items are skipped.
- Selection wraps in both directions.
- `onValueChange` fires for arrow-key selection exactly as it does for pointer selection.
- The implementation must not add Tabs-style manual activation or require Enter to confirm an arrow-key move.

### Roving tabindex

Native radio behavior is preferred. If a custom roving-tabindex implementation is required for consistent cross-browser behavior:

- The checked enabled item has `tabIndex=0`.
- Other items have `tabIndex=-1`.
- If no item is checked, the first enabled item has `tabIndex=0`.
- If all items are disabled, no item enters the tab order.
- Arrow-key handling must preserve native input focus and must not create a second tab stop on the visual control.

### Orientation

Only the orientation-relevant arrow pair is handled by custom logic, if custom logic is necessary:

- Horizontal: Left/Right.
- Vertical: Up/Down.

Unrelated arrow keys retain native browser behavior. This avoids hijacking page scrolling unnecessarily.

## 6. Accessibility

### Roles and naming

| Element           | Role / element                                          | Required semantics                               |
| ----------------- | ------------------------------------------------------- | ------------------------------------------------ |
| Group root        | `role="radiogroup"` on a `<div>`                        | Groups the native radios and exposes orientation |
| Native item input | `<input type="radio">`                                  | Retains native radio role and checked state      |
| Visual track      | `<span aria-hidden="true">`                             | Excluded from the accessibility tree             |
| Indicator         | `<span aria-hidden="true">` or inherited hidden subtree | Decorative only                                  |
| Label             | Native `<label>`                                        | Supplies the input accessible name               |
| Description       | Associated text element                                 | Supplies supplementary accessible description    |

### Group attributes

- `role="radiogroup"`.
- `aria-orientation={orientation}`.
- `aria-label` when supplied.
- `aria-labelledby` when supplied.
- If both naming props are supplied, `aria-labelledby` takes precedence according to normal accessible-name computation.
- Every group must have an accessible name through at least one of those props or another explicit consumer-provided labeling mechanism.
- Do not generate a visible group label automatically.

### Item attributes

- Native `type="radio"`.
- Native `checked`, `disabled`, `name`, and `value` behavior as applicable.
- `id` resolved from the item prop or `useId()`.
- Label `htmlFor` matches the input ID.
- `aria-describedby` references the description ID only when `description` is present.
- Consumer-provided `aria-describedby` IDs must be preserved and combined with the generated description ID rather than overwritten.
- `aria-invalid` and other consumer ARIA attributes are forwarded to the native input.
- Do not manually add `role="radio"` or `aria-checked` unless required to correct a concrete native-semantics issue; native inputs already expose these.

### Description behavior

Descriptions must:

1. Render visually below their option label.
2. Remain associated with the corresponding radio, not the entire group.
3. Be announced as supplementary information after the accessible name.
4. Not be duplicated inside the label.
5. Accept `ReactNode`, while consumers remain responsible for avoiding nested interactive content that would confuse label activation.

### Focus and motion accessibility

- Focus indication uses `:focus-visible` and `var(--uk-focus-ring)`.
- Focus must never be indicated by color alone.
- Disabled items are not focusable.
- Motion is decorative and never changes selection timing or focus order.
- `useReducedMotion()` must disable shared-layout sliding, spring press, and indicator scaling.
- Reduced-motion selection changes use `REDUCED_MOTION_TRANSITION` with opacity only, or an immediate state change where an opacity transition adds no value.
- CSS press feedback must also be disabled or made non-spatial under `prefers-reduced-motion: reduce`.

## 7. Failure States

| Failure                                  | Required handling                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Item rendered outside a group            | Throw a clear development-time error, consistent with other compound components; do not render a silently nonfunctional control |
| Duplicate item values                    | Development-time warning; production behavior must not crash, but selection and shared-indicator identity may be ambiguous      |
| Controlled `value` matches no item       | Render no checked item and no selected indicator; do not select a fallback automatically                                        |
| `defaultValue` matches no item           | Start with no selection                                                                                                         |
| Empty group                              | Render an empty named radiogroup without throwing                                                                               |
| All items disabled                       | No item is tabbable or selectable                                                                                               |
| Currently selected item becomes disabled | Preserve the controlled value; the item remains checked and disabled, but keyboard navigation skips it                          |
| Selected item unmounts                   | Remove its indicator cleanly; do not automatically choose another item or emit a change                                         |
| Controlled parent rejects a change       | UI remains at the controlled `value`; no internal fallback selection is committed                                               |
| Missing group accessible name            | Development-time accessibility warning where practical                                                                          |
| Empty or missing item label              | Require an external accessible name; otherwise warn in development                                                              |
| Duplicate consumer-supplied item IDs     | Native ID collision behavior is possible; warn in development when detected                                                     |
| Description removed while focused        | Remove its ID from `aria-describedby` in the same render                                                                        |
| Rapid repeated selection                 | Latest selection wins; Motion retargets the shared indicator without queuing stale animations                                   |
| Radio used alone                         | Standalone scale-in behavior is used; no shared-layout indicator is created                                                     |
| Form reset                               | Native uncontrolled behavior should be verified; controlled groups remain owned by the parent                                   |

The component must not silently coerce invalid values, auto-select the first enabled item, or convert a controlled group into an uncontrolled one.

## 8. Motion Gate

### Frequency and purpose

Radio selection is a frequent form interaction. Motion is therefore limited to two short, local responses:

1. **Selection continuity:** the indicator moves between options so users can track which member of the set became selected.
2. **Press confirmation:** a brief spring response confirms pointer contact without delaying input.

Motion must not animate the entire group, labels, descriptions, focus rings, or layout dimensions. It must not delay `onValueChange`, focus, form updates, or native checked state.

### Multiple radios: shared sliding indicator

When more than one enabled or rendered radio participates in the same group:

- Use one Motion shared-layout identity for the selected indicator.
- The indicator is rendered inside the checked item’s visual track.
- Assign a group-stable `layoutId`, derived from the group’s `useId()`, so indicators from different groups never animate together.
- On selection change, Motion transfers the indicator from the previous item to the new item.
- Use `INDICATOR_SPRING` from `motion.ts`:

```ts
transition = { INDICATOR_SPRING };
```

- Do not calculate `translateX` or `translateY` from item indexes.
- Do not assume equal item widths, heights, or gaps.
- Horizontal and vertical groups use the same shared-layout implementation.
- If there is no previous selection, the indicator appears with the standalone scale-in treatment rather than sliding from an arbitrary location.
- If the previous item unmounts, the indicator appears in the new item without attempting to measure the removed item.

This follows the Navigation Pattern’s indicator rule while retaining form-control semantics.

### Single radio: scale-in indicator

When a group contains only one radio item:

- Do not use shared-layout sliding.
- On first selection, animate the indicator from a small scale to its final scale.
- Use `UI_SPRING` for the scale-in response.
- Unchecked state removes or hides the indicator without a large exit movement.
- Native radio behavior still prevents pointer-click deselection of an already checked radio.

Suggested visual states:

```ts
initial={{ opacity: 0, scale: 0 }}
animate={{ opacity: 1, scale: 1 }}
transition={UI_SPRING}
```

The exact starting scale may be tuned during implementation, but it must remain a local scale/opacity animation and must not introduce a new motion token.

### Press feedback

Pointer press feedback applies to both single and grouped radios:

- On press, the visual control scales toward `var(--uk-scale-press)` (`0.97`).
- Release returns to scale `1` with a small spring response.
- Use `UI_SPRING` for Motion-driven press/release.
- The response must complete quickly and must not bounce the whole label or item row.
- Keyboard selection does not simulate a pointer press.
- Disabled items never animate on attempted interaction.
- Press feedback must not interfere with native click, label activation, or focus.

If implemented in CSS rather than Motion, use the Inline Pattern’s existing press rule:

```css
.radio-group-item:active .radio-group-track {
  transform: scale(var(--uk-scale-press));
  transition-duration: var(--uk-duration-fast);
}
```

However, the requirement explicitly calls for spring press feedback, so Motion with `UI_SPRING` is the default implementation. CSS-only press feedback is acceptable only as a reduced-motion or non-JavaScript fallback and must not claim to provide a spring.

### Reduced motion

When `useReducedMotion()` returns true:

- Do not use `layoutId` sliding between items.
- Do not apply scale-based press feedback.
- Do not scale the standalone indicator from zero.
- Use `REDUCED_MOTION_TRANSITION` for any retained opacity change.
- Selection, focus, and descriptions update immediately and identically to the full-motion version.

### Motion token summary

| Scenario                                | Implementation                   | Token                                              |
| --------------------------------------- | -------------------------------- | -------------------------------------------------- |
| Indicator moves between multiple radios | Motion shared `layoutId`         | `INDICATOR_SPRING`                                 |
| Standalone radio indicator appears      | Motion scale + opacity           | `UI_SPRING`                                        |
| Pointer press/release                   | Motion local control scale       | `UI_SPRING`, target `var(--uk-scale-press)`        |
| Reduced-motion state change             | Opacity only or immediate update | `REDUCED_MOTION_TRANSITION`                        |
| Hover/focus/disabled styling            | CSS transition                   | `var(--uk-transition)` / `var(--uk-duration-fast)` |

No `AnimatePresence` is required unless implementation testing shows it is necessary for standalone indicator exit. If added, it must not keep unchecked native semantics alive after selection changes.

## 9. Test Plan

### Rendering and API

- Renders a `radiogroup` with vertical orientation by default.
- Applies horizontal and vertical `aria-orientation` values correctly.
- Forwards group `className`, rest props, `aria-label`, and `aria-labelledby`.
- Merges item `className` without removing internal classes.
- Uses consumer item `id` for input/label association.
- Generates unique IDs when item `id` is absent.
- Forwards native input props such as `name`, `required`, and `aria-invalid`.
- Does not forward item-only props to invalid DOM locations.

### Controlled and uncontrolled selection

- `defaultValue` selects the matching item initially.
- Clicking an unselected item updates uncontrolled state.
- Clicking the selected item does not clear it.
- Clicking the selected item does not emit a duplicate `onValueChange`.
- Controlled `value` determines the checked item after rerenders.
- Controlled selection calls `onValueChange` with the new value.
- A controlled group does not visually commit a rejected change.
- Switching between controlled and uncontrolled modes follows the existing `useControllableState` policy and test conventions.
- An unmatched controlled or default value renders no selected item.
- Selecting by clicking the visible label works.
- Clicking a noninteractive description activates the associated radio only if native label/wrapper behavior intentionally supports it; the test must match the final DOM decision.

### Description and accessibility

- Label supplies the native radio’s accessible name.
- Description is referenced by `aria-describedby`.
- Description is not included twice in the accessible name.
- Items without descriptions do not receive a dangling description ID.
- Existing consumer `aria-describedby` values are preserved and merged.
- Description updates and removal update the accessibility relationship.
- Group accessible name resolves from `aria-label`.
- Group accessible name resolves from `aria-labelledby`.
- Visual track and indicator are hidden from assistive technology.
- Disabled items expose native disabled state.
- Focus-visible styling is present and uses the focus-ring token.
- Automated accessibility checks report no avoidable violations for labeled groups, described items, disabled items, and horizontal layouts.

### Keyboard

Test in both orientations:

- Tab enters at the checked item.
- With no selection, Tab enters at the first enabled item.
- Only one enabled item is in the group’s normal tab order.
- Arrow keys move focus and selection together.
- Navigation wraps from last to first and first to last.
- Disabled items are skipped.
- `onValueChange` fires for keyboard selection.
- Space selects the focused unchecked item.
- Space on an already selected item does not deselect it.
- Enter does not introduce custom selection behavior.
- Horizontal custom handling is limited to Left/Right; vertical custom handling is limited to Up/Down.
- Focus remains visible after keyboard selection.
- Tabbing away does not trap focus.

Native browser radio behavior differs across engines, so keyboard tests should run in the project’s supported browser automation environment rather than relying exclusively on jsdom.

### Forms

- Selected value participates in native form submission when `name` is provided.
- Disabled checked input follows native form submission rules.
- Native validation and `required` behavior are preserved when supplied.
- Form reset behavior is tested for uncontrolled groups.
- Controlled groups remain synchronized to their parent after form events.

### Motion

Use Motion-aware tests and avoid asserting intermediate spring frames.

- Multiple items use a group-unique shared `layoutId`.
- Separate groups do not share indicator layout identities.
- Changing selection moves the indicator to the newly checked item.
- Indicator positioning does not depend on equal item dimensions or index-based transforms.
- First selection does not slide from an unrelated item.
- Rapid selection changes retarget the indicator without duplicate visible indicators after settling.
- A single item uses scale-in behavior rather than shared sliding.
- Pointer press applies press scale and release returns to rest.
- Disabled items do not press-animate.
- Keyboard selection does not trigger pointer press animation.
- Reduced motion disables sliding, scale-in, and spring press.
- Reduced motion preserves immediate checked state and focus behavior.
- Removing the selected item does not leave a detached indicator or throw a Motion layout error.

### Failure and robustness

- Item outside a group produces the documented development error.
- Duplicate values produce the documented warning.
- Empty groups render without crashing.
- All-disabled groups have no tabbable radio.
- Selected item unmount cleans up layout and description relationships.
- Missing accessible names produce development warnings where implemented.
- Rapid mount/unmount and orientation changes do not produce stale `aria-describedby` or `layoutId` state.

### Visual coverage

Storybook or equivalent visual cases should include:

1. Vertical group with a selected item.
2. Horizontal group with unequal label lengths.
3. Long descriptions and wrapped text.
4. Single radio, unchecked and checked.
5. No initial selection.
6. Disabled unchecked and disabled checked items.
7. Keyboard focus-visible.
8. Invalid item.
9. Dark mode.
10. Reduced motion.
11. Controlled group whose parent rejects changes.
12. Multiple groups on the same page to verify isolated shared indicators.

## 10. Open Questions

1. **Group form defaults:** Should the initial API add group-level `name`, `required`, and `disabled` props? Native radio groups normally share a `name`, but these props were not included in the requested API. Until confirmed, consumers can provide `name` and `required` per item, and disabled state remains per item.

2. **Standalone usage:** Does “single Radio” mean a `RadioGroup` containing exactly one `RadioGroupItem`, or is a separately exported standalone `Radio` component required? This spec assumes the former and does not add an unrequested export.

3. **Native versus custom arrow handling:** Should implementation rely entirely on native same-`name` radio navigation, or normalize orientation-specific arrows and wrapping with custom logic? Cross-browser tests should decide. Any custom implementation must preserve native semantics and the keyboard contract above.

4. **Duplicate values:** Should duplicate item values be a development warning only, or a hard development error? This spec proposes a warning because production rendering should remain resilient.

5. **Press feedback scope:** Should spring press feedback animate only the circular control, as specified here, or the full item including label and description? Animating only the control is recommended to avoid text movement and layout distraction.

6. **Group orientation wrapping:** Should horizontal groups wrap by default or remain on one line with overflow handling? This spec recommends wrapping with existing spacing tokens and no new overflow behavior.

7. **Description interactivity:** Should interactive content inside `description` be explicitly unsupported? The recommended contract is supporting text only; interactive content can interfere with label activation and accessible descriptions.
