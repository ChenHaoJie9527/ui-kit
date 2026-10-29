# Form Valibot Resolver Spec

## 1. Purpose

`createValibotResolver` connects a Valibot schema to the existing `Form` component. It parses form values, returns field errors in the shape expected by `Form`, and preserves the native form-control behavior already provided by `Input`, `CheckBox`, `Switch`, `RadioGroup`, and `Select`.

This is a non-visual integration utility, not a new DOM component. It must not introduce a parallel form state model, render errors itself, or change how existing controls submit and validate.

Reasonable defaults:

- Validate the complete form value on submit.
- Support field-level revalidation through the same resolver when `Form` requests it.
- Map the first issue for each field to that field's error message.
- Support nested object paths and array indices.
- Return unknown issues at the form level rather than silently discarding them.
- Leave values unchanged on success unless the schema explicitly transforms them.

## 2. Pattern Selection

Primary pattern: **Form Control Pattern**.

The resolver is an adapter for existing form controls. It uses the existing `Form` context, field state, and error rendering rather than creating a new interaction pattern.

Relevant existing primitives:

- `Form`, `useFieldState`, `useFormContext`, and `useWatch` from `FormComponent`
- `FieldRule`, `FieldState`, `FormErrors`, and `FormRootProps` from `FormComponent`
- Native control semantics from `Input`, `CheckBox`, `Switch`, `RadioGroup`, and `Select`

No overlay, navigation, or inline visual pattern applies. No new shared hook or CSS component pattern is required.

If the current `FormRootProps` API cannot accept an external resolver, extend `FormComponent` with a resolver prop using the existing form validation flow. Do not implement validation inside individual controls.

## 3. States

The resolver has no independent visual states. It participates in the existing `Form` states:

| State | Resolver behavior | Existing UI behavior |
| --- | --- | --- |
| idle | No validation has run | Fields render normally |
| validating | Asynchronous schema validation is pending, if supported by `Form` | Existing pending/submitting state is used |
| valid | Returns parsed data and an empty error object | Errors are cleared; submit may continue |
| invalid | Returns field and/or form errors | `Form.ErrorMessage` renders messages and fields expose invalid state |
| schema failure | A malformed schema or unexpected resolver exception occurs | Submission is blocked; error is surfaced according to the configured error policy |
| disabled | Resolver does not alter control disabled state | Existing control behavior remains unchanged |

Validation must be deterministic for the same schema and values. A failed validation must not partially update form values.

## 4. Public API

```ts
import type {
  FormErrors,
  FormRootProps,
} from "./FormComponent";

export interface ValibotIssueLike {
  message: string;
  path?: ReadonlyArray<ValibotPathItemLike> | undefined;
}

export interface ValibotPathItemLike {
  key: PropertyKey;
}

export interface ValibotSchemaLike<TInput = unknown, TOutput = TInput> {
  // Structural typing should be compatible with Valibot's BaseSchema types.
  // The public declaration may import and use Valibot's actual types instead.
  readonly __valibotSchema?: true;
  readonly __input?: TInput;
  readonly __output?: TOutput;
}

export interface ValibotResolverOptions {
  /**
   * Validation language/configuration forwarded to Valibot when supported.
   */
  config?: unknown;

  /**
   * Controls whether all field issues or only the first issue per field are
   * retained. Default: "first".
   */
  errorMode?: "first" | "all";

  /**
   * Converts a Valibot issue into the displayed message.
   * Default: issue.message.
   */
  formatError?: (issue: ValibotIssueLike) => string;

  /**
   * Key used for issues that cannot be assigned to a field.
   * Default: "root".
   */
  rootErrorKey?: string;
}

export interface ValibotResolverResult<TOutput> {
  values: TOutput;
  errors: FormErrors;
}

export interface ValibotResolver<TInput, TOutput> {
  (
    values: TInput,
    context?: unknown,
  ): Promise<ValibotResolverResult<TOutput>>;
}

export function createValibotResolver<TInput, TOutput = TInput>(
  schema: ValibotSchemaLike<TInput, TOutput>,
  options?: ValibotResolverOptions,
): ValibotResolver<TInput, TOutput>;
```

The final declaration should prefer Valibot's exported schema, issue, configuration, and inferred input/output types over the structural placeholders above. Valibot should be an optional peer dependency; importing `Form` or other components must not require Valibot to be installed.

Proposed usage:

```tsx
const resolver = createValibotResolver(schema);

<Form.Root resolver={resolver} onSubmit={handleValidSubmit}>
  {/* Existing Form fields */}
</Form.Root>
```

Proposed exports:

```ts
export { createValibotResolver } from "./FormValibotResolver";
export type {
  ValibotResolver,
  ValibotResolverOptions,
  ValibotResolverResult,
} from "./FormValibotResolver";
```

Path mapping rules:

- Object keys are joined with dots: `profile.email`.
- Array indices use bracket notation: `items[0].name`.
- Empty or missing paths map to `rootErrorKey`.
- Existing `FormErrors` conventions take precedence if they already define a different path syntax.
- Multiple issues targeting the same field follow `errorMode`; the default exposes only the first message.
- Issues for fields not currently mounted remain in the returned error object so `Form` can decide whether to display or retain them.

The resolver must integrate with the existing `FieldRule` validation model. If both a resolver and local field rules produce an error for the same field, local field rules are evaluated first and schema errors supplement them without being silently lost.

## 5. Keyboard Behavior

No new keyboard behavior.

The resolver does not render focusable elements, intercept keys, or move focus. Existing behavior remains unchanged:

- `Input`, `CheckBox`, and `Switch` retain native keyboard interaction.
- `Select` retains roving tabindex, arrow-key navigation, Enter/Space selection, Escape, Home/End, and character matching.
- `RadioGroup` retains its existing keyboard model.
- Enter submission and validation-triggered focus management, if already provided by `Form`, remain owned by `Form`.

On invalid submission, `Form` may focus the first invalid field only if that is already its established behavior. The resolver must not implement a separate focus routine.

## 6. Accessibility

The resolver itself has no role and renders no ARIA attributes.

Accessibility is provided by the existing form controls and `Form` primitives:

- Invalid controls expose `aria-invalid="true"` or native invalid state as appropriate.
- Error messages are associated with controls through `aria-describedby`.
- Existing labels remain associated with their controls.
- Existing `Form.ErrorMessage` rendering is reused; no duplicate live region is introduced.
- Form-level errors must be available through the existing form error summary or status mechanism, if present.
- Async validation must not repeatedly announce unchanged errors.

No new `role`, keyboard shortcut, or screen-reader-only element is required.

## 7. Failure States

| Failure | Required behavior |
| --- | --- |
| Schema validation fails | Return field errors and prevent valid-submit callback execution |
| Issue has no path | Return it under `rootErrorKey` |
| Issue path cannot be normalized | Preserve it as a form-level error; do not drop it |
| Multiple issues target one field | Use `errorMode`, defaulting to the first issue |
| Schema transforms values | Return transformed values only after successful validation |
| Validation throws unexpectedly | Reject or return a form-level error consistently with existing `Form` async rule handling; never call the valid-submit callback |
| A newer validation starts before an older one finishes | Ignore stale results so old errors cannot overwrite newer state |
| Resolver is used without Valibot installed | Fail at resolver creation/import boundaries with a clear optional-peer-dependency error, not during unrelated component imports |
| Schema is null or invalid | Throw a descriptive developer error at resolver creation |
| Unmounted field has an error | Preserve the error in the result; let `Form` apply its existing retention policy |
| Submit is retried without edits | Revalidate deterministically and avoid duplicating messages |

Resolver errors must not mutate the original Valibot issues or the submitted input object.

## 8. Motion Gate

- **Frequency:** Validation may run on every submit and potentially on field revalidation, but the resolver itself produces no visual feedback.
- **Purpose:** Not applicable; this is a data-validation adapter.
- **Implementation:** No Motion, CSS animation, layout animation, or transition.
- **Token:** None.

Existing controls and error messages retain their current motion behavior. The resolver must not add animation to error appearance, field invalid states, or form submission.

## 9. Test Plan

### Unit tests

- Returns parsed values and no errors for valid input.
- Returns transformed values when the schema performs a successful transformation.
- Maps a top-level field issue to the correct `FormErrors` key.
- Maps nested object paths correctly.
- Maps array indices correctly.
- Maps missing paths to the default `root` error.
- Supports a custom `rootErrorKey`.
- Uses the first issue per field by default.
- Supports all issues per field when `errorMode="all"` and `FormErrors` supports multiple messages.
- Applies a custom `formatError`.
- Forwards supported Valibot configuration.
- Does not mutate input values or schema issues.
- Rejects invalid schema arguments with a useful developer error.
- Handles unexpected parser exceptions according to the existing async validation contract.
- Ignores stale async results when validations resolve out of order.

### Form integration tests

- Invalid submit prevents `onSubmit` and displays errors through existing `Form.ErrorMessage`.
- Valid submit calls the existing valid-submit handler with parsed values.
- Correcting a field and revalidating clears its old error.
- Local `FieldRule` errors and schema errors compose according to the defined precedence.
- Errors for unmounted fields follow existing `Form` retention behavior.
- Existing controlled and uncontrolled controls work without API changes.
- Native form submission remains intact.
- Importing the main component entry point without Valibot installed does not break unrelated exports.

### Accessibility tests

- Invalid fields receive the existing invalid semantics.
- Error text is referenced by `aria-describedby`.
- Labels and descriptions remain associated after validation.
- No additional focusable element or live region is introduced.
- Invalid submission preserves existing focus behavior.
- Keyboard operation of all existing controls is unchanged.

### Type tests

- Input values infer from the schema input type.
- Successful output infers from the schema output type, including transforms.
- Resolver is assignable to the corresponding `Form.Root` resolver prop.
- Valibot remains an optional peer dependency in package metadata.

## 10. Open Questions

1. Does `Form.Root` already expose an external resolver prop? If not, its exact name and whether validation is synchronous, asynchronous, or both must be confirmed against `FormComponent`.
2. What is the exact `FormErrors` representation: one string per field, string arrays, or structured field errors? The resolver's `errorMode="all"` depends on this.
3. What path convention does `Form` already use for nested fields and arrays? Existing conventions must override the proposed dot/bracket default.
4. Should schema validation run only on submit by default, or should `Form` support `onChange`/`onBlur` resolver validation through an existing `validationMode` option?
5. When local field rules and schema validation both fail, should the UI show only the local error, only the first combined error, or all errors?
6. Should unexpected resolver exceptions be exposed as form-level errors or rethrown for an application error boundary? This should match existing async `FieldRule` behavior.
7. Should successful schema transforms update the visible form values, or only the values passed to the valid-submit handler? The default proposal is submit output only, avoiding unexpected control mutation.
