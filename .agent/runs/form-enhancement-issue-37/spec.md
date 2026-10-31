# Form Enhancement Spec

## 1. Purpose

This iteration extends the existing `Form` component in place. It does not create a second form runtime, a parallel validation state model, or a generic layout system.

Goals:

1. Make `Form.Field.rules` and `Form.Root.validate` (including `valibotResolver(schema)`) share the same interaction-level validation timing.
2. Keep the existing required marker API complete and documented: `Form.Label required` plus `{ required: true }` rules.
3. Add `Form.Root layout` with `vertical`, `horizontal`, and `inline`, defaulting to `horizontal`.
4. Add `Form.Label labelWrap` for long labels without changing accessible names.

Startup precondition: this issue requires workflow enhancement PR #36 to be merged before `ai-develop` can be added; otherwise the current pipeline will misclassify this iteration as a new component.

## 2. Pattern Selection

Primary pattern: **Form Control Pattern**.

- `Form.Control` must continue to preserve native control semantics and bind existing controls through their current public contracts.
- Controlled/uncontrolled values continue to use `useControllableState`; stable callbacks continue to use `useEventCallback`.
- Field IDs and label/description/error associations continue to use the existing `useId`-based context.

Secondary pattern: **Inline Pattern** for layout and visual feedback only.

- Layout, label wrapping, and error presentation use CSS and existing `--uk-*` tokens.
- No new Motion-driven form runtime is introduced.

`valibotResolver` remains the existing optional sub-entry. Its output continues to be `FormErrors<T>`; no new resolver protocol or error type is added.

## 3. States

### Validation timing

`FormValidationTrigger` supports `submit`, `focus`, `change`, `blur`, and `pointerleave`.

Defaults remain:

- `validateOn="blur"`
- `revalidateOn="change"`

Behavior:

- `focus`: validate when the field gains focus.
- `change`: validate when the field value changes.
- `blur`: validate after the field loses focus.
- `pointerleave`: validate when the pointer leaves the field region.
- `submit`: validate all registered fields and form-level rules on submit.
- `focus` and `pointerleave` are opt-in and never replace the default `blur` behavior implicitly.
- Revalidation applies to fields that already have an error, at the configured `revalidateOn` timing.
- The same timing applies to field `rules` and `Form.Root.validate`, including Valibot schemas.
- `change` with asynchronous validation continues to honor `validateDebounce`; stale results must not overwrite newer values or errors.
- Keyboard and touch users must retain equivalent error feedback when `pointerleave` is configured; pointerleave is an additional trigger, not the sole accessible validation path.

### Required marker

- `Form.Label required` explicitly renders `*`.
- A field rule `{ required: true }` automatically renders `*` through the existing label logic.
- Controls retain `aria-required="true"`.
- The marker remains `aria-hidden="true"`.
- No `Form.Field required` prop or second marker API is added.

### Layout

`Form.Root layout` supports:

- `vertical`: label, control, description, and error stack vertically.
- `horizontal`: label and control share a row with a stable label column; description and error align with the control column.
- `inline`: compact filter/single-action layout; long content and small screens must remain readable.

Default is `horizontal`. Narrow screens must fall back to a readable stacked arrangement rather than compressing controls or labels.

### Label wrapping

`Form.Label labelWrap` defaults to `false`.

- `false` preserves current non-wrapping intent.
- `true` allows label text and the required marker to wrap without truncation, hiding, or overlap.
- Wrapping must work with long descriptions, errors, `horizontal`, and `inline`.
- Wrapping must not change the control's accessible name.

### Existing states preserved

Dirty, touched, focused, validating, invalid, valid, disabled, readOnly, hidden, submitting, submitted, submitSucceeded, submitFailed, formError, controlled/uncontrolled values, async validation, server errors, reset/clear, and focus-first-error behavior remain on the current state model.

## 4. Public API

```ts
export type FormValidationTrigger =
  | "submit"
  | "focus"
  | "change"
  | "blur"
  | "pointerleave";

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

export interface FormLabelProps
  extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  labelWrap?: boolean;
  children: ReactNode;
}
```

All other existing exports remain unchanged:

- `Form.Root`
- `Form.Field`
- `Form.Label`
- `Form.Control`
- `Form.Description`
- `Form.ErrorMessage`
- `Form.Actions`
- `useFormContext`, `useFieldState`, `useWatch`
- `FormRef`, `FormErrors`, `FieldRule`, `FieldState`, `FormState`
- existing `valibotResolver` sub-entry

Implementation must extend the current context and validation functions rather than adding a parallel context, store, or error channel.

## 5. Keyboard Behavior

No new keyboard interaction model is introduced beyond the Form Control Pattern.

- Native inputs, textarea, select, CheckBox, Switch, Select, and RadioGroup keep their existing keyboard behavior.
- `focus` validation fires from the existing focus path and must not move focus.
- `blur` validation fires after the existing blur path and must not prevent tab navigation.
- `change` validation must not steal focus or reset selection.
- `pointerleave` must not be required for keyboard users; focus, blur, change, and submit paths remain available according to configuration.
- Failed submit continues to focus the first invalid field through the existing `focusFirstError` flow.
- Layout changes must preserve DOM and tab order; visual columns must not reorder controls.

Differences from the pattern are limited to additional validation triggers and layout presentation. No new roving tabindex, focus trap, or keyboard shortcut is added.

## 6. Accessibility

- The root remains a native `<form>` with existing submit handling and `noValidate` behavior.
- `Form.Label` remains a native `<label>` associated through `htmlFor` and the existing field ID.
- `Form.Description` and `Form.ErrorMessage` remain associated through `aria-describedby`.
- Composite controls continue to receive `aria-labelledby` where the current control contract requires it.
- Required controls expose `aria-required="true"`; the visual `*` stays `aria-hidden="true"`.
- Invalid controls expose `aria-invalid`; async validation continues to expose `aria-busy`.
- Error messages retain existing `role="alert"`/live behavior when visible.
- Form-level errors retain the existing `role="alert"` and `aria-live="assertive"` summary.
- `labelWrap` changes visual wrapping only; it must not alter label text, IDs, or accessible names.
- `horizontal` and `inline` layouts must not rely on visual position alone to convey label/control relationships.
- Responsive fallback must preserve readable label text, error text, and focus order at mobile widths.
- Reduced motion continues to disable nonessential transitions and spinner animation as in the current stylesheet.

## 7. Failure States

- Field rule failures and schema failures continue to populate the same `FormErrors<T>` and field `error` state.
- Schema errors continue to map to existing field names, including nested paths and the existing root-level `_form` convention from `valibotResolver`.
- Server-side field errors continue through `setError`; non-field server errors continue through `setFormError`.
- Failed validation on submit continues to call `onSubmitFailed`, set `submitFailed`, and focus the first error.
- Failed async submit continues to set `formError`, preserve entered values, and restore submitting state.
- Interaction-level schema validation must clear stale errors when values become valid and update errors when they become invalid.
- Debounced or aborted async validation must not clear a newer error, overwrite newer values, or flip `validating` incorrectly.
- `pointerleave` must not produce pointer-only dead ends: touch and keyboard users still receive feedback through the other configured triggers and submit.
- Long labels, descriptions, and errors must wrap or fall back responsively without covering controls or hiding feedback.

## 8. Motion Gate

Frequency: high-frequency form interaction; layout and validation are primarily CSS/state concerns.

Purpose: preserve existing error visibility and validating feedback only. No new entrance, layout spring, or validation animation is required.

Implementation:

- Use the existing Form stylesheet and `--uk-*` tokens.
- Layout changes are CSS-only through root layout attributes/classes and responsive rules.
- Error opacity continues to use `--uk-duration-fast` and `--uk-ease-out`.
- Validating spinner continues to use the existing Form spinner styles.
- No new Motion component, spring, or layout animation is introduced.

Token usage must remain within existing tokens such as `--uk-space-*`, `--uk-text-*`, `--uk-border`, `--uk-surface`, `--uk-danger`, `--uk-focus-ring`, and `--uk-duration-fast`. Reduced motion keeps nonessential animation disabled.

## 9. Test Plan

### Unit tests

Extend `packages/ui/src/__tests__/FormComponent.test.tsx` to cover:

- `focus`, `change`, `blur`, `pointerleave`, and `submit` triggers for field rules.
- The same triggers executing `Form.Root.validate` with `valibotResolver`, not only on submit.
- Default `validateOn="blur"` and `revalidateOn="change"` compatibility.
- Revalidation of already-invalid fields at the configured timing.
- Schema error mapping, updating, clearing, failed-submit focus, and coexistence with `setError`/`setFormError`.
- Async `change` validation with `validateDebounce`, including stale-result protection and no duplicate/racing updates.
- Keyboard/touch-relevant paths so `pointerleave` is not the only feedback mechanism.
- Required marker from `Form.Label required` and from `{ required: true }`, plus `aria-required` and hidden marker semantics.
- `labelWrap` false/default and true behavior, including accessible name stability.
- Controlled and uncontrolled values, async validation, server errors, and existing reset/clear behavior.

Add resolver-specific interaction tests in the existing Valibot test location if present; otherwise include them in the Form test file using the existing sub-entry.

### Browser/E2E tests

Add `e2e/tests/form.spec.ts` to verify:

- `vertical`, `horizontal`, and `inline` at desktop and mobile widths.
- Responsive fallback without clipped labels, compressed controls, or hidden errors.
- Stable focus order and keyboard operation across layouts.
- Long labels with `labelWrap`, long descriptions, and error text.
- Interaction-level Valibot validation and failed-submit focus in a real browser.
- Reduced motion behavior for existing feedback.

### Documentation and checks

Update the Form page and demos to include:

- All three layouts.
- Long-label `labelWrap`.
- `validateOn`/`revalidateOn` combinations, explicitly showing Valibot schema timing.
- Required marker sources without a duplicate prop.
- Default `horizontal` compatibility impact and migration.

Run `pnpm check`, docs build, and related E2E. Add a Changeset for the new public API and visual/default behavior change.

## 10. Compatibility and Migration Impact

### Validation timing

Defaults remain `validateOn="blur"` and `revalidateOn="change"`, so existing validation timing remains compatible. The change is that form-level/schema validation now participates in those same interaction timings instead of being submit-only. Apps relying on schema validation running only at submit must explicitly audit the new behavior; no second resolver mode is introduced.

### Required marker

No API migration. Existing `Form.Label required` and required rules remain the only marker sources. Any implementation gap is fixed in place.

### Layout default

Changing the default from the current vertical presentation to `layout="horizontal"` is a visual and layout compatibility change.

Impact:

- Existing `Form.Root` usages without `layout` will render horizontally where space allows.
- Label column width, description/error alignment, and inline responsive behavior may change page composition.
- Control public APIs and DOM label associations do not change.

Migration:

- To preserve the previous stacked appearance, set `layout="vertical"` explicitly on existing roots.
- Use `layout="inline"` only for compact filter/single-action forms and verify small-screen fallback.
- Use `labelWrap` for long labels instead of truncating text or adding custom layout wrappers.

Changeset level: **minor** for the added public APIs and behavior, with an explicit migration note for the default layout change. If repository release policy treats default visual layout changes as breaking, escalate to **major** during review; the spec's required minimum is a documented minor Changeset rather than a silent patch.

## 11. Open Questions

- Confirm during implementation review whether the stable horizontal label column should use a fixed token-based width or a CSS `minmax` track; either must remain within the existing Form CSS system and must not become a general layout engine.
- Confirm the exact mobile breakpoint used by the docs/app CSS conventions; the responsive fallback requirement is not optional.
- Confirm the final Changeset level if maintainers classify the default `horizontal` switch as breaking rather than minor.

No new pattern behavior is proposed beyond the existing Form Control and Inline patterns; these questions do not authorize a parallel runtime or new component family.

<!-- agent-files
packages/ui/src/FormComponent.tsx
packages/ui/src/form-component.css
packages/ui/src/index.ts
packages/ui/src/__tests__/FormComponent.test.tsx
apps/docs/src/pages/form.tsx
apps/docs/src/demos/components/form/login.tsx
apps/docs/src/demos/components/form/organization.tsx
apps/docs/src/demos/components/form/register.tsx
apps/docs/src/demos/components/form/dialog.tsx
apps/docs/src/demos/components/form/layouts.tsx
apps/docs/src/demos/components/form/validation-timing.tsx
apps/docs/src/demos/components/form/label-wrap.tsx
e2e/tests/form.spec.ts
-->