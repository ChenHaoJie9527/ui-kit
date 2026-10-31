# Form Enhancement Spec

## 1. Purpose

This iteration enhances the existing `Form` component in place. It does not introduce a parallel form runtime, a second validation state model, a new resolver protocol, or a generic layout system.

The enhancement has four goals:

1. Make `Form.Field.rules` and `Form.Root.validate`, including `valibotResolver(schema)`, run at the same configurable interaction times.
2. Complete the existing required-marker behavior without adding another required prop.
3. Add `vertical`, `horizontal`, and `inline` layouts to `Form.Root`, with `horizontal` as the new default.
4. Add `Form.Label labelWrap` for long labels without changing accessible names or obscuring controls.

The existing composition remains the only public structure:

- `Form.Root`
- `Form.Field`
- `Form.Label`
- `Form.Control`
- `Form.Description`
- `Form.ErrorMessage`
- `Form.Actions`
- Existing `valibotResolver` sub-entry

### Delivery prerequisite

This issue depends on workflow enhancement PR #36 being merged before `ai-develop` is added. Otherwise the current pipeline can misclassify this iteration as a new component. This is a workflow prerequisite only and does not add workflow files to the implementation plan.

## 2. Pattern selection

Primary pattern: **Form Control Pattern**.

`Form` coordinates native controls and existing seam-ui controls, preserves native form semantics, and uses the existing `useControllableState` and `useEventCallback` primitives. The enhancement must retain those primitives and the current context/ref architecture.

Secondary references:

- **Overlay Pattern** only for the existing Dialog demo integration. No overlay behavior or Dialog API changes are part of this work.
- **Inline Pattern** only as a styling reference for CSS-first state feedback. It does not justify a separate layout engine or new component family.

No new pattern is required. The added validation triggers and layout options are extensions of the existing Form implementation, not new component patterns.

## 3. States

### Existing states to preserve

The current field and form states remain authoritative:

- Field: `value`, `initialValue`, `dirty`, `touched`, `focused`, `validating`, `invalid`, `valid`, `required`, `disabled`, `readOnly`, `hidden`, `error`.
- Form: `submitting`, `submitted`, `submitSucceeded`, `submitFailed`, `dirty`, `validating`, `errors`, `formError`.
- Existing controlled/uncontrolled values, nested paths, reset/clear, dependencies, async validation, server errors, and `preserveOnUnmount` behavior remain supported.

No new public validation state machine or error type is added.

### Validation interaction states

| Trigger        | Required behavior                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `focus`        | Run the applicable field rules and form-level validation when the field receives focus.                            |
| `change`       | Run after the transformed value is written. Async validation continues to use `validateDebounce`.                  |
| `blur`         | Preserve current touched/blur behavior and run validation after focus leaves the control.                          |
| `pointerleave` | Run when the pointer leaves the field region. This supplements, rather than replaces, keyboard and touch feedback. |
| `submit`       | Validate all registered fields and form-level rules before calling `onSubmit`.                                     |

`revalidateOn` controls when an already-invalid field is checked again. It cannot be `"submit"`.

The same trigger decision must govern both sources of validation:

- Field-level `Form.Field.rules`.
- Form-level `Form.Root.validate`, including the existing Valibot resolver.

A form-level validation run must update the existing error map without duplicating field-rule errors or leaving stale resolver errors behind.

### Layout states

| Layout       | Desktop behavior                                                                             | Narrow-screen behavior                                                                              |
| ------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `vertical`   | Label, control, description, and error stack vertically.                                     | Same readable stacking.                                                                             |
| `horizontal` | Label occupies a stable column; control and its feedback occupy the adjacent column.         | Collapse to the vertical reading order at the Form stylesheet’s documented small-screen breakpoint. |
| `inline`     | Fields and actions flow in a compact single-line/filter-bar arrangement where space permits. | Items wrap rather than shrink into unreadable controls; long content remains readable.              |

Disabled, read-only, hidden, validating, invalid, and submitting states must remain visually and programmatically available in every layout.

### Required and wrapping states

- Explicit `Form.Label required` displays the existing marker.
- A field rule containing `{ required: true }` displays the same marker automatically.
- `aria-required="true"` remains on the control.
- The visual `*` remains `aria-hidden="true"`.
- `labelWrap={false}` retains the current non-wrapping intent.
- `labelWrap={true}` allows label text and the marker to wrap without clipping, overlap, or changing the accessible name.

## 4. Public API

### Validation types and Root props

```ts
export type FormValidationTrigger =
  "submit" | "focus" | "change" | "blur" | "pointerleave";

export interface FormRootProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "onChange"> {
  values?: T;
  defaultValues?: Partial<T>;
  onValuesChange?: (values: T, changedField?: keyof T) => void;
  onSubmit?: (values: T) => void | Promise<void>;
  onSubmitFailed?: (errors: FormErrors<T>) => void;
  validateOn?: FormValidationTrigger;
  revalidateOn?: Exclude<FormValidationTrigger, "submit">;
  validateDebounce?: number;
  noValidate?: boolean;
  validate?: (values: T) => FormErrors<T> | Promise<FormErrors<T>>;
  layout?: "vertical" | "inline" | "horizontal";
  children: ReactNode;
}
```

Defaults:

```ts
validateOn = "blur";
revalidateOn = "change";
layout = "horizontal";
```

`validateOn="submit"` disables interaction-triggered initial validation but does not disable configured revalidation of existing errors. Submission always performs full validation regardless of `validateOn`.

### Label props

```ts
export interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  labelWrap?: boolean;
  children: ReactNode;
}
```

`labelWrap` defaults to `false`.

### APIs that remain unchanged

- `Form.FieldProps` does **not** gain a `required` prop.
- `Form.Control`, `Form.Description`, `Form.ErrorMessage`, and `Form.Actions` keep their current composition and contracts.
- `FormRef`, `FormErrors`, `FieldState`, `FormState`, `useFormContext`, `useFieldState`, and `useWatch` retain their existing roles.
- `valibotResolver(schema)` keeps its current input/output contract and continues returning `FormErrors`-compatible results.
- Existing control change callbacks (`onChange`, `onCheckedChange`, `onValueChange`) continue to run.

### Styling contract

Use the existing `uk-form` class family and `--uk-*` tokens. Layout and wrapping may be exposed through existing-style data attributes or modifier classes, for example a root layout attribute and a label wrapping attribute. No `Form.Grid`, `Form.Section`, CSS layout engine, or new public layout component is introduced.

## 5. Keyboard behavior

The Form Control Pattern’s native keyboard behavior remains unchanged:

- Native inputs, textareas, selects, CheckBox, and Switch retain their built-in keyboard interaction.
- Select and RadioGroup retain their existing navigation and selection behavior.
- Tab order follows DOM order in all layouts. CSS layout must not visually reorder fields away from their keyboard order.
- Enter submits a native form where the browser and control support it.
- Escape and other control-specific keys are not intercepted by Form.

Differences/additions for this enhancement:

- `focus` validation must work for keyboard focus as well as pointer focus.
- `blur` validation must continue to work when users tab away.
- `pointerleave` must never be the only opportunity to receive or clear an error. Keyboard and touch users retain blur/change/submit feedback according to configuration.
- Failed submission continues to focus the first invalid field using the existing `focusFirstError` flow.
- Layout changes must not alter Select, RadioGroup, Dialog, or Input keyboard APIs.

## 6. Accessibility

### Native semantics

- `Form.Root` remains a native `<form>`.
- `Form.Label` remains a native `<label>` associated with the control.
- Existing `Form.Control` cloning continues to preserve the child control’s semantics and public events.
- Horizontal and inline presentation must not replace labels with placeholders or remove description/error associations.

### ARIA and relationships

- Controls retain `aria-required="true"` when required by label/field configuration as supported by the existing contract.
- Invalid controls retain `aria-invalid="true"`.
- Description and visible error IDs remain in `aria-describedby`.
- Composite controls retain their existing `aria-labelledby` behavior.
- Async validation retains `aria-busy` where currently provided.
- The required `*` stays `aria-hidden="true"` so it is not redundantly announced.
- `Form.ErrorMessage` retains its existing alert/live-region behavior.
- Form-level submission errors retain the existing `role="alert"` and assertive announcement.
- `labelWrap` is purely visual and must not alter label text, `htmlFor`, `aria-labelledby`, or `aria-describedby`.

### Responsive and input-modality requirements

- At phone widths, horizontal fields collapse into a readable label-control-feedback order.
- Inline fields wrap without horizontal page overflow, clipped labels, or controls becoming too narrow to operate.
- Pointer, keyboard, and touch users must receive equivalent validation outcomes.
- Focus indicators and existing control focus behavior must remain visible in all layouts.

## 7. Failure states

### Validation failures

- Field-rule and schema errors continue to populate the existing `FormState.errors` map.
- Resolver errors continue to map nested paths to dot-separated field names and root issues to `_form` according to current resolver behavior.
- `onSubmitFailed` receives the latest existing `FormErrors<T>`.
- Invalid submission does not call `onSubmit` and focuses the first error field.
- Correcting a value clears or updates errors at the configured revalidation trigger.
- Form-level validation must not erase a newer server-set or field-rule error through stale result merging.

### Async and race failures

- `change` validation continues to honor `validateDebounce` for async rules.
- A newer validation run supersedes an older run for the same interaction/field; stale async results must not overwrite newer values or errors.
- Reset, clear, unmount, and submission cancellation continue to clean up pending timers and abortable work.
- Form-level resolver execution must participate in the same stale-result protection rather than creating an independent error lifecycle.

### Submission and server failures

- Existing `submitting`, `submitFailed`, `submitSucceeded`, and `formError` behavior remains unchanged.
- Thrown submission errors retain entered values and display the existing form-level error summary.
- `setError`, `setFormError`, `clearErrors`, and `focusFirstError` remain the integration points for server failures.

### Layout/content failures

- Long labels, descriptions, and error messages must wrap or reflow without covering controls.
- `labelWrap={false}` may preserve existing sizing behavior but must not introduce new clipping in responsive layouts.
- Missing labels, hidden fields, disabled fields, and controls outside a valid Field context retain current error handling.

## 8. Motion Gate

**Frequency:** High. Validation can run on focus, every change, blur, or pointer movement; layout is static and must not animate during ordinary typing.

**Purpose:** Motion is limited to existing error visibility and validating indicators. Layout selection and label wrapping require no animation.

**Implementation:**

- Keep the enhancement CSS-first.
- Do not add Motion animations for layout changes, label wrapping, focus validation, or pointerleave validation.
- Preserve the existing error opacity transition and validating spinner only where already present.
- Do not introduce spatial movement when errors appear; existing reserved error space should continue to prevent avoidable layout shift.

**Tokens:**

- Error feedback: `--uk-duration-fast` with `--uk-ease-out`.
- Validating indicator: existing Form spinner treatment.
- Reduced motion: retain the stylesheet’s `prefers-reduced-motion` handling and token overrides; no nonessential animation is added.

## 9. Test plan

### Unit tests

Extend `packages/ui/src/__tests__/FormComponent.test.tsx` rather than creating a parallel suite.

#### Trigger coverage

Test each `validateOn` value with spies and visible errors:

1. `focus`: no premature validation before focus; validation runs on focus.
2. `change`: validation runs after value changes and uses the latest transformed value.
3. `blur`: default behavior remains blur-triggered.
4. `pointerleave`: pointer leaving the field region triggers validation.
5. `submit`: no initial interaction validation; submission validates all fields and form-level rules.

Also verify:

- Defaults remain `validateOn="blur"` and `revalidateOn="change"`.
- Every supported `revalidateOn` option revalidates an already-invalid field at the configured time.
- `focus` and `pointerleave` are opt-in and do not replace default blur behavior.
- Field rules and `Form.Root.validate` observe the same trigger.
- Controlled and uncontrolled forms behave consistently.
- Existing original control callbacks still execute.

#### Valibot integration

Using the existing resolver entry:

- Schema validation runs at non-submit triggers, including at least `change`, `blur`, and `focus`; pointerleave coverage should exercise the same shared path.
- Schema errors appear in existing field error UI and `FormErrors`.
- Errors update and clear correctly after values change.
- Failed submission still focuses the first schema-invalid field.
- Async change validation respects debounce and ignores stale results.
- Existing `setError`, `setFormError`, reset, and clear flows continue to work.

#### Required marker and wrapping

- `Form.Label required` renders one visual marker.
- `{ required: true }` renders the marker without `Form.Label required`.
- The marker is hidden from assistive technology.
- Controls retain `aria-required="true"`.
- `labelWrap` defaults to false and exposes the expected styling state only when true.
- Wrapping does not change the control’s accessible name.
- Long label, description, and error combinations remain associated with the control.

#### Regression coverage

Retain all current tests for nested values, reset/default values, disabled fields, boolean controls, Select/RadioGroup binding, form-level error clearing, and imperative APIs. Add reduced-motion and server-error checks where they are not already covered by the relevant test environment.

### Browser/E2E tests

Add a focused Form enhancement E2E suite covering:

- `vertical`, `horizontal`, and `inline` at desktop and phone widths.
- No unintended horizontal page overflow; labels, controls, descriptions, and errors remain readable.
- Horizontal layout collapses appropriately on narrow screens.
- Inline layout wraps long content without breaking focus order.
- Keyboard tab order follows DOM order in all layouts.
- Focus, blur, change, and submit validation remain usable by keyboard.
- Pointerleave does not remove keyboard/touch error feedback.
- Long wrapped labels and errors do not overlap controls.
- Existing Dialog-embedded form submission and error focus remain functional.

### Documentation and verification

- Add runnable demos for all three layouts, long-label wrapping, validation timing with Valibot, and required-marker sources.
- Update API tables and accessibility/migration guidance.
- Run `pnpm check`, documentation build, relevant unit tests, and related E2E.
- Add a Changeset through the repository’s normal release workflow; the implementation file plan intentionally excludes release/configuration files per the required path restrictions.

## 10. Compatibility and migration impact

### Validation timing

`validateOn` and `revalidateOn` defaults remain `"blur"` and `"change"`, preserving current interaction timing. The important behavioral change is that `Form.Root.validate`/Valibot now participates in interaction-level validation instead of being effectively submit-only. Applications with expensive or side-effectful form-level validators should make them pure and suitable for repeated execution, or explicitly use `validateOn="submit"` with the desired revalidation policy.

The accepted `validateOn` union expands to include `"focus"` and `"pointerleave"`. Existing `"submit"`, `"blur"`, and `"change"` values remain valid. `revalidateOn` expands to the non-submit triggers.

### Required marker

No breaking API change. Existing `Form.Label required` and required rules remain the only marker sources. No `Form.Field required` prop is added.

### Layout default: breaking visual change

Changing `layout`’s default to `"horizontal"` changes the current visual default from vertical stacking to a two-column field presentation. This can affect:

- Existing forms that relied on the current full-width vertical arrangement.
- Dialog forms, login/register forms, organization forms, snapshots, visual tests, and application-specific CSS targeting Form structure.
- Dense forms whose labels were not designed for a stable label column.

Migration for consumers that want the previous presentation:

```tsx
<Form.Root layout="vertical">{/* existing fields */}</Form.Root>
```

No DOM composition migration is required. Existing Field/Label/Control markup remains in place. Inline layout is opt-in:

```tsx
<Form.Root layout="inline">{/* filter fields and actions */}</Form.Root>
```

The docs’ existing business demos must be reviewed and, where their current visual design depends on vertical stacking, explicitly set `layout="vertical"` rather than silently changing their intended presentation.

**Changeset level:** `minor` for the added public APIs, but the default layout change is a breaking visual/behavioral compatibility change and therefore requires a **`major` Changeset** for `seam-react` under semantic versioning. The Changeset must call out the new default and the one-prop `layout="vertical"` migration. If the repository maintainers explicitly classify visual defaults as non-breaking, that policy decision must be recorded before implementation; absent such a decision, use `major`.

## 11. Open questions

1. **Responsive breakpoint:** The implementation should use one documented small-screen breakpoint in `form-component.css`. Confirm whether the repository already has a canonical container/media breakpoint to reuse; do not add a design token solely for this enhancement without approval.
2. **Horizontal label column sizing:** Confirm the intended fixed/token-based label width and whether it should be a root-level CSS custom property override. The public API should remain only `layout`; no additional layout props are proposed.
3. **Form-level validation frequency:** Running the entire `Form.Root.validate` on each field interaction is required for consistent schema timing, but may be expensive for large forms. Confirm whether whole-form execution on every configured trigger is acceptable, with stale-result protection, or whether a field-targeted resolver optimization is desired without changing the resolver protocol.
4. **Changeset classification:** This spec defaults to `major` because of the default layout change. Confirm if the project has an explicit visual-change versioning policy that requires a different level.

## 12. Implementation File Plan

Modify the existing Form implementation, tests, styles, exports, and documentation. Add focused demos and browser coverage only where needed; do not create a parallel component or validation runtime.

<!-- agent-files
packages/ui/src/FormComponent.tsx
packages/ui/src/form-component.css
packages/ui/src/index.ts
packages/ui/src/__tests__/FormComponent.test.tsx
apps/docs/src/pages/form.tsx
apps/docs/src/demos/components/form/dialog.tsx
apps/docs/src/demos/components/form/login.tsx
apps/docs/src/demos/components/form/organization.tsx
apps/docs/src/demos/components/form/register.tsx
apps/docs/src/demos/components/form/layouts.tsx
apps/docs/src/demos/components/form/validation-timing.tsx
apps/docs/src/demos/components/form/label-wrap.tsx
e2e/tests/form.spec.ts
-->
