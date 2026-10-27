# Badge Component Spec

## 1. Purpose

`Badge` is a compact inline component for displaying status, category, or metadata. It renders short text or a small status label with a semantic color variant and can optionally expose a dismiss action.

Typical uses:

- Status labels such as “Active”, “Pending”, or “Failed”
- Category or environment labels
- Metadata attached to an item
- Dismissible filter or classification labels

`Badge` is not a general-purpose button, link, or input. If the entire label should perform an action, use `Button` or another appropriate interactive component instead.

## 2. Pattern Selection

**Primary pattern: `inline`**

`Badge` follows the Inline Pattern because its core responsibility is displaying a small piece of status or metadata inline. It does not open an overlay, collect form input, or switch between views.

Reused primitives and conventions:

- `cx` from `utils/cx` for class-name composition
- Existing design tokens for color, spacing, typography, radius, focus, and transitions
- `useReducedMotion` from `motion/react` only if a Motion-based presence animation is implemented
- `AnimatePresence` from `motion/react` only for optional animated mount/unmount at the usage boundary

The optional dismiss button is a small inline extension of the pattern. It does not make `Badge` a form control: dismissal is an action on the badge, not a value-editing interaction.

No new component pattern is introduced.

## 3. States

### Visual states

| State         | Description                                                                          | Implementation                                                                                  |
| ------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Default       | Displays the badge label using the selected variant                                  | Root inline element with variant class or data attribute                                        |
| Hover         | Only applies to the dismiss button; the badge itself has no required hover treatment | Dismiss button `:hover`                                                                         |
| Focus visible | A visible focus ring appears on the dismiss button                                   | Dismiss button `:focus-visible` using `--uk-focus-ring`                                         |
| Pressed       | Dismiss button provides subtle press feedback                                        | `transform: scale(var(--uk-scale-press))` during `:active`                                      |
| Disabled      | Optional dismiss action is unavailable                                               | Native `disabled` on the dismiss button; reduced opacity and no pointer interaction             |
| Dismissing    | Optional transient state while an exit animation runs                                | Managed by the consumer or an `AnimatePresence` boundary; not a separate controlled badge value |
| Dismissed     | Badge is no longer rendered                                                          | Consumer removes it after `onDismiss`; `Badge` does not maintain hidden internal state          |

### Variants

| Variant   | Intended meaning                       | Token direction                                  |
| --------- | -------------------------------------- | ------------------------------------------------ |
| `default` | Neutral metadata or unspecified status | `--uk-surface`, `--uk-text`, `--uk-border`       |
| `primary` | Primary or informational emphasis      | `--uk-primary` with a readable surface treatment |
| `success` | Successful, active, or positive status | `--uk-success` with a readable surface treatment |
| `warning` | Warning or attention-required status   | `--uk-warning` with a readable surface treatment |
| `danger`  | Error, destructive, or failed status   | `--uk-danger` with a readable surface treatment  |

Variant styling must preserve readable contrast in both light and dark color schemes. Semantic foreground tokens must not be assumed to work as text on an equally saturated semantic background without verification.

### Content states

- Text-only badge
- Badge with dismiss button
- Badge with an icon or other leading visual supplied as children, if the consumer includes one
- Empty content is invalid for normal usage; see Failure States

## 4. Public API

The component is a single inline component rather than a compound component.

```ts
export type BadgeVariant =
  "default" | "primary" | "success" | "warning" | "danger";

export interface BadgeProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "onChange"
> {
  /**
   * Visual and semantic color treatment.
   * @default "default"
   */
  variant?: BadgeVariant;

  /**
   * Badge content. Keep this short; Badge does not provide truncation or
   * multi-line layout behavior.
   */
  children: React.ReactNode;

  /**
   * Called when the dismiss button is activated.
   * Providing this callback enables the dismiss button unless
   * `dismissible={false}` is explicitly supplied.
   */
  onDismiss?: (
    event:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLButtonElement>,
  ) => void;

  /**
   * Explicitly controls whether the dismiss button is rendered.
   * When true, `onDismiss` should also be provided.
   * @default Boolean(onDismiss)
   */
  dismissible?: boolean;

  /**
   * Accessible name for the dismiss button.
   * Required when the dismiss button is enabled.
   * Example: "Remove Active status" or "Dismiss Beta badge".
   */
  dismissLabel?: string;

  /**
   * Disables only the dismiss action. The badge remains visible and readable.
   * @default false
   */
  dismissDisabled?: boolean;

  /**
   * Optional class applied to the dismiss button for integration-specific
   * styling. The root continues to use `className`.
   */
  dismissButtonClassName?: string;
}

export declare function Badge(props: BadgeProps): React.JSX.Element;
```

### Export contract

Add the following exports through the package entry point:

```ts
export { Badge } from "./Badge";
export type { BadgeProps, BadgeVariant } from "./Badge";
```

### API behavior

- The root renders as a native `<span>` by default.
- Root attributes such as `id`, `className`, `style`, `title`, and `data-*` are forwarded to the root.
- `className` is merged with internal classes using `cx`.
- The root ref is forwarded to the `<span>` if the library’s existing components use ref forwarding; the public type should then be exposed consistently with those components.
- `onDismiss` does not automatically remove the badge. The consumer owns conditional rendering and any associated application state.
- The dismiss control renders as a native `<button type="button">`.
- The dismiss control uses a decorative `aria-hidden="true"` close icon and receives its accessible name from `dismissLabel`.
- `dismissDisabled` maps to the button’s native `disabled` attribute.
- `dismissible={false}` suppresses the dismiss button even if `onDismiss` is present.
- `dismissible={true}` without `onDismiss` is a development-time configuration error; see Failure States.

## 5. Keyboard Behavior

The badge root is not focusable and has no keyboard interaction.

The optional dismiss button follows native button keyboard behavior:

| Key           | Behavior                                                               |
| ------------- | ---------------------------------------------------------------------- |
| `Tab`         | Moves focus to the dismiss button when it is enabled                   |
| `Shift + Tab` | Moves focus away in reverse order                                      |
| `Enter`       | Activates dismissal and calls `onDismiss`                              |
| `Space`       | Activates dismissal and calls `onDismiss` using native button behavior |
| `Escape`      | No behavior                                                            |
| Arrow keys    | No behavior                                                            |

### Differences from the Inline Pattern

The Inline Pattern does not define component-specific keyboard behavior for `Badge`. This spec adds only the native keyboard behavior of the optional dismiss button. No roving tabindex, custom key handler, or badge-level keyboard shortcut is introduced.

If dismissal removes the badge while its button has focus, the consumer should move focus to a logical adjacent control when the surrounding workflow requires it. `Badge` cannot infer the correct destination and must not arbitrarily focus `document.body`.

## 6. Accessibility

### Root semantics

- Default root element: `<span>`.
- Default role: none; the badge’s text remains available in the normal accessibility tree.
- Do not add `role="status"` by default. A badge is often static metadata, and making every badge a live region would create unnecessary announcements.
- Consumers may supply `role="status"` and an appropriate `aria-live` value when a specific badge announces dynamic status changes.
- Consumers may supply `aria-label` only when visible content does not already provide an adequate accessible name.
- Color must not be the only means of communicating status. The badge text or surrounding context must convey the meaning.

### Dismiss button

- Use a native `<button type="button">`.
- Provide an accessible name through `aria-label={dismissLabel}`.
- The label should identify what is being dismissed, especially when multiple badges are present.
- The close icon is decorative and uses `aria-hidden="true"` and `focusable="false"` where applicable.
- Disabled state uses the native `disabled` attribute.
- Focus styling uses `:focus-visible` and `--uk-focus-ring`.
- The dismiss button must remain distinguishable from the badge label and must not rely solely on a hover state to become visible to keyboard users.

### Suggested structure

```tsx
<span className="badge" data-variant="success">
  <span className="badge-label">Active</span>
  <button type="button" aria-label="Dismiss Active badge">
    <svg aria-hidden="true">{/* close icon */}</svg>
  </button>
</span>
```

The structure may be simplified when no dismiss button is present, but the label and control semantics must remain equivalent.

## 7. Failure States

| Failure or edge case                            | Required behavior                                                                                                                                                                                                                                        |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dismissible={true}` without `onDismiss`        | Emit a development-only warning. Do not render a button that appears functional but does nothing; either suppress the button or throw in development, with the chosen behavior applied consistently and tested. Preferred: warn and suppress the button. |
| Dismiss button enabled without `dismissLabel`   | Emit a development-only warning. Use a generic fallback such as `"Dismiss badge"` only as a fallback, not as the recommended API. Tests must verify that an accessible name still exists.                                                                |
| `onDismiss` supplied with `dismissible={false}` | Do not render the dismiss button and do not call the callback. A development-only warning is optional.                                                                                                                                                   |
| Empty or `null` children                        | Render no meaningful badge content; emit a development-only warning because an empty badge has no status to communicate. Do not render a dismiss-only badge unless explicitly supported by a future API.                                                 |
| Very long content                               | Do not silently truncate. Allow normal inline layout behavior and document that consumers are responsible for concise labels or providing their own constrained container.                                                                               |
| Dismiss handler throws                          | Do not swallow the error. Allow the application’s normal error handling to process it.                                                                                                                                                                   |
| Badge unmounts while focused                    | No internal focus restoration is attempted. The consumer manages focus if removal would otherwise leave the workflow unclear.                                                                                                                            |
| Repeated rapid dismissal                        | Native button behavior may produce repeated events until the consumer removes or disables the badge. Consumers performing asynchronous work should set `dismissDisabled` or remove the badge immediately.                                                |
| Disabled dismiss button                         | `onDismiss` is not called by pointer or keyboard interaction. The badge label remains readable.                                                                                                                                                          |
| Reduced motion                                  | Any optional presence animation uses `REDUCED_MOTION_TRANSITION` and contains no positional movement.                                                                                                                                                    |
| Missing semantic contrast in a theme            | This is an implementation defect, not a runtime fallback case. Variant styles must be checked in both light and dark schemes before release.                                                                                                             |

## 8. Motion Gate

### Frequency

**High-frequency inline display.** Badges may appear many times in lists, tables, filters, and status-heavy screens. Dismissal may also occur repeatedly.

### Purpose

Motion is not required to understand the badge or its state. The default implementation therefore has no entrance animation and no Motion dependency in the normal render path.

The only standard feedback is on the dismiss button:

- Hover color or background change
- Optional press feedback
- Focus-ring transition

An optional exit animation may be used when dismissal benefits from visual continuity, but it must be implemented at an `AnimatePresence` usage boundary rather than by making every badge animate by default.

### Implementation

| Scenario                     | Implementation                                                                       | Token                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Default badge render         | No animation                                                                         | None                                                                                            |
| Dismiss-button hover         | CSS transition                                                                       | `--uk-transition` / `--uk-duration-base`                                                        |
| Dismiss-button press         | CSS `:active` transform using `scale(var(--uk-scale-press))`                         | `--uk-duration-fast`                                                                            |
| Dismiss-button focus ring    | CSS `:focus-visible` with `box-shadow`                                               | `--uk-duration-fast`                                                                            |
| Optional badge exit          | `AnimatePresence` with opacity only; no large translation                            | `--uk-duration-fast` or `--uk-duration-exit`, kept short and consistent with the Inline Pattern |
| Reduced-motion optional exit | `useReducedMotion()` plus `REDUCED_MOTION_TRANSITION`; opacity only, no displacement | `REDUCED_MOTION_TRANSITION`                                                                     |

Do not add spring animation, layout animation, scaling entrances, or continuous status animation. A status badge must not pulse or flash by default.

## 9. Test Plan

### Rendering and API

1. Renders a `<span>` with the supplied children.
2. Defaults to `variant="default"`.
3. Applies the correct variant class or `data-variant` for all five variants.
4. Merges consumer `className` using `cx` without dropping internal classes.
5. Forwards root HTML attributes, including `id`, `style`, `title`, and `data-*`.
6. Forwards the root ref if ref forwarding is part of the final implementation.
7. Does not render a dismiss button by default.
8. Renders a dismiss button when `onDismiss` is provided.
9. Renders a dismiss button when `dismissible={true}` and a valid handler is provided.
10. Does not render a dismiss button when `dismissible={false}`, even if `onDismiss` is provided.
11. Applies `dismissButtonClassName` only to the dismiss button.
12. Uses `type="button"` so dismissal does not submit a surrounding form.

### Dismissal

13. Calls `onDismiss` exactly once for a pointer click.
14. Calls `onDismiss` on native `Enter` activation.
15. Calls `onDismiss` on native `Space` activation.
16. Does not remove the badge automatically unless the consumer changes its rendering state.
17. Does not call `onDismiss` when `dismissDisabled={true}`.
18. Sets the native `disabled` attribute when `dismissDisabled={true}`.
19. Does not submit a parent form when the dismiss button is activated.
20. Supports consumer-controlled removal after `onDismiss`.

### Accessibility

21. The root has no implicit live-region role by default.
22. Badge text remains accessible to assistive technology.
23. The dismiss icon is hidden from the accessibility tree.
24. The dismiss button has an accessible name from `dismissLabel`.
25. Multiple badges can have distinct dismiss-button names.
26. The dismiss button displays a visible `:focus-visible` ring using the focus token.
27. The disabled dismiss button is excluded from normal keyboard focus navigation according to native browser behavior.
28. Consumer-supplied root ARIA attributes, such as `role="status"`, are forwarded without being overwritten.
29. Automated accessibility checks report no violations for default, semantic, dismissible, and disabled-dismiss examples.
30. Variant examples meet contrast requirements in light and dark schemes, including dismiss-button icon and focus states.

### Keyboard

31. The badge root is not in the tab order.
32. An enabled dismiss button is reachable with `Tab`.
33. `Escape` and arrow keys have no custom side effects.
34. No custom keyboard handler causes double activation for `Enter` or `Space`.

### Failure and development behavior

35. Development mode warns when dismissal is explicitly enabled without a handler.
36. The preferred no-handler behavior suppresses the nonfunctional dismiss button.
37. Development mode warns when the dismiss button lacks `dismissLabel`.
38. The fallback accessible name still leaves the button with an accessible name if fallback behavior is implemented.
39. Development mode warns for empty badge content.
40. Errors thrown by `onDismiss` are not swallowed.
41. Rapid repeated clicks do not produce internal state corruption; behavior remains consumer-controlled.

### Styling and motion

42. All variants render correctly in light and dark color schemes.
43. Long content does not cause unexpected root truncation or obscure the dismiss button.
44. The default badge has no entrance animation.
45. Press feedback uses `--uk-scale-press` and completes within the fast duration.
46. Reduced-motion mode removes positional movement from any optional presence animation.
47. Dismiss-button interactions remain usable when CSS transitions are disabled.

### Visual regression coverage

Capture stories or screenshots for:

- Every variant without dismissal
- Every variant with dismissal
- Focus-visible dismiss button
- Disabled dismiss button
- Long label
- Multiple adjacent dismissible badges
- Light and dark schemes
- Reduced-motion example if an animated dismissal story is included

## 10. Open Questions

1. **Solid versus soft variant styling:** The requirement names color variants but does not specify whether they should be solid, outlined, or soft surface badges. The preferred default is a soft surface treatment using semantic foreground colors and existing surface/border tokens, because the token set does not define success or warning contrast colors. Confirm the intended visual style before implementation.
2. **Dismiss configuration errors:** The preferred behavior for `dismissible={true}` without `onDismiss` is a development warning plus suppression of the button. Confirm whether the library instead expects a development-time exception.
3. **Accessible dismiss label:** Should `dismissLabel` be TypeScript-required through a dismissible/non-dismissible discriminated union, or optional with a development warning and generic fallback? The interface above keeps the API simple but relies on runtime guidance.
4. **Focus after removal:** Should documentation include a standard focus-management example for dismissible badge lists, or should focus placement remain entirely application-specific?
5. **Optional presence animation:** The Inline Pattern mentions `AnimatePresence` for badge appearance/disappearance, but this spec keeps the base component animation-free. Confirm that animation belongs in consumer wrappers or stories rather than in `Badge` itself.
