# Form Business Recipes

## 1. Purpose

`FormBusinessRecipes` is a **recipe layer** built on top of the existing `Form`, `Input`, `CheckBox`, `Switch`, `RadioGroup`, `Select`, and `Button` components. It provides pre-wired, domain-specific form compositions (e.g. login, registration, password reset, profile settings, payment) so that product teams do not re-implement the same field wiring, validation orchestration, submit lifecycle, and error surfacing for every business form.

It is **not** a new primitive. It does not introduce new visual language, new focus behavior, or new overlay mechanics. Every rendered control remains the corresponding seam-ui primitive; the recipe only owns:

- Field schema declaration and Valibot-backed validation orchestration.
- Cross-field / async validation sequencing (e.g. "email already taken").
- Submit lifecycle: idle → validating → submitting → success / server-error.
- Mapping server-side errors back onto individual fields and the form-level error region.
- Sensible default composition (labels, descriptions, error messages, actions row) that consumers can override slot-by-slot.

**Blocked by:** #<Valibot Issue 编号>. The validation adapter contract (`FormValidationAdapter`) described below cannot be finalized until the Valibot integration issue lands. Sections marked *(blocked)* are provisional and must be revisited once that issue resolves.

## 2. Pattern Selection

**Primary pattern: `form-control`.** The recipe's core interaction is *user inputs data*, so it follows the Form Control Pattern:

- Retains native element semantics — every field still renders a real `<input>` / `<select>` / `<textarea>` through the existing primitives; the recipe never replaces them with `div`-based controls.
- Uses `useControllableState` from `seam-hooks` for the form's values and for the submit-state machine when used uncontrolled.
- Uses `useEventCallback` for stable validation / submit callbacks so async validators do not capture stale values.
- Uses `useId` for field id / label / description / error association, consistent with the existing `Form` component.

**Secondary pattern: `inline`.** The actions row (submit / reset / cancel) is composed of `Button`, so press feedback, loading state, and disabled semantics follow the Inline Pattern exactly (`--uk-scale-press`, `--uk-duration-fast`, `[data-loading]`). The recipe adds no motion of its own beyond what `Button` and `Form` already provide.

**Explicitly not `overlay` and not `navigation`.** Recipes never open a panel, trap focus, or switch views. If a recipe needs to be shown inside a `Dialog`, that composition is the consumer's responsibility; the recipe must remain overlay-agnostic.

No new pattern is introduced. No new shared hook is proposed beyond the validation adapter, which is part of the blocked Valibot issue.

## 3. States

The recipe has two orthogonal state axes: **per-field state** (delegated to `Form` / primitives) and **form lifecycle state** (owned by the recipe).

### Field states (inherited, not redefined)

| State          | Source of truth                          | Visual (from existing tokens)                          |
| -------------- | ---------------------------------------- | ------------------------------------------------------ |
| default        | pristine, no error                       | `.form-control-track` base                             |
| hover          | pointer over control                     | `border-color: var(--uk-border-strong)`                |
| focus-visible  | keyboard focus                           | `box-shadow: 0 0 0 2px var(--uk-focus-ring)`           |
| filled/dirty   | value differs from `defaultValues`       | no visual change (recipe does not add dirty styling)   |
| invalid        | Valibot issue mapped to field            | `[aria-invalid="true"]`, error text in `--uk-danger`   |
| validating     | async validator in flight for this field | `aria-busy="true"` on the control; no spinner by default |
| disabled       | `disabled` prop or form-level disabled   | `:disabled` opacity, `pointer-events: none`            |

### Form lifecycle states

| State         | Entered when                                   | Submit button            | Fields        | `data-state` on root |
| ------------- | ---------------------------------------------- | ------------------------ | ------------- | -------------------- |
| `idle`        | initial, or after reset                        | enabled                  | editable      | `idle`               |
| `validating`  | submit triggered, sync/async validation running | `data-loading`, disabled | `aria-busy`   | `validating`         |
| `submitting`  | validation passed, `onSubmit` promise pending  | `data-loading`, disabled | read-only*    | `submitting`         |
| `success`     | `onSubmit` resolved                            | enabled                  | editable      | `success`            |
| `server-error`| `onSubmit` rejected or returned field errors   | enabled                  | editable      | `server-error`       |

\* During `submitting`, fields are **not** disabled (to avoid focus loss and value stripping from native form submission); instead the recipe sets `aria-busy="true"` on the root and ignores further submit attempts. This mirrors the Inline Pattern's `pointer-events: none` loading guard without mutating control semantics.

Rapid re-submission is deduplicated: a submit while in `validating` or `submitting` is a no-op.

## 4. Public API

The recipe is exposed as a single factory plus per-recipe components, so new business recipes do not require new primitives.

```ts
import type { ReactNode } from "react";
import type { FormErrors, FormRef, FormState } from "./FormComponent";

/** (blocked) Final shape depends on the Valibot integration issue. */
export interface FormValidationAdapter<TValues> {
  /** Sync parse. Returns field-keyed issues or null when valid. */
  validate(values: TValues): FormErrors | null;
  /** Optional async / cross-field / server-backed validation. */
  validateAsync?(
    values: TValues,
    signal: AbortSignal,
  ): Promise<FormErrors | null>;
}

export type RecipeStatus =
  | "idle"
  | "validating"
  | "submitting"
  | "success"
  | "server-error";

export interface RecipeSubmitResult {
  /** Field-keyed errors returned by the server. */
  fieldErrors?: FormErrors;
  /** Form-level error message (e.g. "Invalid credentials"). */
  formError?: string;
}

export interface BusinessRecipeProps<TValues> {
  /** Controlled values. Omit for uncontrolled usage. */
  values?: TValues;
  defaultValues: TValues;
  onValuesChange?: (values: TValues) => void;

  /** (blocked) Valibot-backed adapter. */
  schema: FormValidationAdapter<TValues>;

  /** Validate on these triggers. Default: ["submit"] plus "blur" after first submit. */
  validateOn?: Array<"change" | "blur" | "submit">;

  /** Called after validation passes. Reject or return errors to enter server-error. */
  onSubmit: (
    values: TValues,
    signal: AbortSignal,
  ) => Promise<RecipeSubmitResult | void> | RecipeSubmitResult | void;

  onStatusChange?: (status: RecipeStatus) => void;
  onSuccess?: (values: TValues) => void;
  onError?: (errors: FormErrors, formError?: string) => void;

  /** Slot overrides; each defaults to the standard Form composition. */
  renderFields: (ctx: RecipeFieldContext<TValues>) => ReactNode;
  actions?: ReactNode | ((status: RecipeStatus) => ReactNode);
  submitLabel?: ReactNode;      // default "Submit"
  resetLabel?: ReactNode;       // when provided, renders a reset Button
  successMessage?: ReactNode;   // when provided, announced via role="status"
  formErrorMessage?: (message: string) => ReactNode;

  disabled?: boolean;
  className?: string;
  ref?: React.Ref<FormRef>;
}

export interface RecipeFieldContext<TValues> {
  values: TValues;
  errors: FormErrors;
  status: RecipeStatus;
  /** Stable ids for label/description/error wiring, generated via useId. */
  fieldId: (name: keyof TValues & string) => string;
  setValue: <K extends keyof TValues & string>(
    name: K,
    value: TValues[K],
  ) => void;
  fieldState: FormState;
}

/** Concrete recipes are thin presets over the factory. */
export interface LoginFormProps
  extends Omit<BusinessRecipeProps<LoginValues>, "renderFields" | "schema"> {
  /** (blocked) Defaults to the built-in Valibot login schema; overridable. */
  schema?: FormValidationAdapter<LoginValues>;
  showRememberMe?: boolean;
  renderFields?: BusinessRecipeProps<LoginValues>["renderFields"];
}

export interface LoginValues {
  email: string;
  password: string;
  rememberMe: boolean;
}
```

Exports to add to the component index:

```ts
export { createBusinessRecipe, LoginForm } from "./FormBusinessRecipes";
export type {
  BusinessRecipeProps,
  FormValidationAdapter,
  LoginFormProps,
  LoginValues,
  RecipeFieldContext,
  RecipeStatus,
  RecipeSubmitResult,
} from "./FormBusinessRecipes";
```

Only `LoginForm` is specified as the first concrete recipe; registration / password-reset / profile recipes follow the same factory and are out of scope for this spec.

## 5. Keyboard Behavior

No deviation from the Form Control Pattern. The recipe adds **no** global key handlers beyond what the primitives already implement.

| Key              | Behavior                                                              | Source                |
| ---------------- | --------------------------------------------------------------------- | --------------------- |
| Tab / Shift+Tab  | Native order through fields → actions; no roving tabindex at form level | Native / Form         |
| Enter (in field) | Submits the form via native `<form>` submission (requestSubmit)       | Native                |
| Space            | Toggles CheckBox / Switch; activates Buttons                          | Form Control / Inline |
| Arrow keys       | Only inside `Select`, `RadioGroup`, per their own patterns            | Form Control / Navigation |
| Escape           | **No behavior.** The recipe is not an overlay and must not swallow Escape, so a wrapping `Dialog` still closes normally. | — |

Differences from pattern: **none**. Explicitly, the recipe does not implement "Enter moves to next field" and does not intercept Escape; both would break native semantics and overlay composition.

## 6. Accessibility

The recipe renders a real `<form>` and reuses `Form`'s labelling machinery.

| Element              | Role / element      | ARIA attributes |
| -------------------- | ------------------- | --------------- |
| Root                 | `<form>`            | `aria-busy="true"` while `validating`/`submitting`; `data-state={status}`; `noValidate` (validation is schema-driven, not native) |
| Each control         | native input/select | `id={fieldId(name)}`, `aria-invalid="true"` when errored, `aria-describedby` pointing to description + error ids, `aria-required="true"` when the schema marks required |
| Field label          | `<label>`           | `htmlFor={fieldId(name)}` |
| Field error          | `<p>`               | `id`, `role="alert"` only for the **first** newly-errored field per submit (avoids N simultaneous assertive announcements) |
| Form-level error     | container           | `role="alert"`, `aria-live="assertive"`, rendered above the actions row |
| Success message      | container           | `role="status"`, `aria-live="polite"` |
| Submit button        | `Button`            | `type="submit"`, `data-loading` while busy, `aria-disabled` mirroring disabled |
| Reset button         | `Button`            | `type="button"` (calls `form.reset()` semantics via `FormRef`, **not** `type="reset"`, to keep controlled values in sync) |

Focus management on failed submit: move focus to the **form-level error** if present, otherwise to the first invalid field, using the existing `Form` error-summary behavior. Focus is never trapped and never moved on `success` (the success region is announced via `role="status"`).

## 7. Failure States

| Failure                                   | Behavior |
| ----------------------------------------- | -------- |
| Sync validation fails                     | Enter `idle` with field errors; focus first invalid field; no `onSubmit` call. |
| Async validation rejects / times out      | Treat as form-level error ("Could not validate, try again"), keep values, re-enable submit. Abort in-flight validation on unmount or new submit via `AbortSignal`. |
| `onSubmit` throws / rejects               | Enter `server-error`; show `formError` if provided, else generic message; values preserved; fields remain editable. |
| `onSubmit` returns `fieldErrors`          | Errors mapped onto fields by key; unknown keys surfaced as form-level error rather than dropped. |
| Server error for a field not in schema    | Rendered in the form-level alert with the raw key, and logged in dev. |
| Submit while already busy                 | No-op (deduplicated). |
| Unmount during submit                     | Abort `onSubmit` signal; no state update after unmount; no success/error callbacks fired. |
| Schema throws synchronously (adapter bug) | Caught, surfaced as form-level error, and re-thrown in dev builds to fail fast. |
| `defaultValues` missing a schema key      | (blocked) Dev-time warning; runtime behavior defined by the Valibot adapter's parse result. |

The recipe never clears user values on failure and never silently swallows server field errors.

## 8. Motion Gate

- **Frequency:** Business forms are low-frequency, high-consequence surfaces (a few submissions per session). However, every control inside is high-frequency (typing, toggling), so the recipe inherits the Inline Pattern's conservative stance.
- **Decision:** **No new animation is introduced by the recipe.** This passes the Motion Gate by omission — there is no recipe-owned visual transition to justify.
- **Purpose of any visible motion:** purely inherited feedback, never decoration:
  - Submit/reset press feedback → CSS `:active` `transform: scale(var(--uk-scale-press))`, `var(--uk-duration-fast)` (Inline Pattern).
  - Submit loading spinner → existing `Button[data-loading]` implementation.
  - Field error appearance → **instant render, no enter animation.** Animating error text would delay the assertive announcement and add layout shift during a corrective task.
  - Success message → opacity only if a transition is desired, `var(--uk-duration-base)` with `var(--uk-ease-out)`; default is instant.
- **Implementation:** CSS transitions only, via existing tokens. No `motion/react` import, no `AnimatePresence`, no layout animation in the recipe.
- **Reduced motion:** automatically respected because all motion is token-driven (`--uk-duration-*` collapse to 100ms under `prefers-reduced-motion`). No `useReducedMotion()` call is needed since no JS animation exists.

## 9. Test Plan

### Rendering & composition
- Renders a native `<form>` with `noValidate`, correct `data-state` for each lifecycle transition.
- `renderFields` receives stable `fieldId`, `values`, `errors`, `status`; default `LoginForm` composition renders email, password, optional remember-me, and actions.
- Slot overrides (`actions`, `submitLabel`, `successMessage`, `formErrorMessage`) replace defaults without losing ARIA wiring.

### Validation (blocked tests land with the Valibot issue)
- Sync schema failure prevents `onSubmit`, maps issues to the correct fields, sets `aria-invalid` and `aria-describedby`.
- `validateOn` matrix: `submit` (default), `change`, `blur`; after first failed submit, blur revalidation activates.
- Async validation: `aria-busy` set during flight; stale async result discarded when values change; `AbortSignal` aborted on resubmit/unmount.

### Submit lifecycle
- `idle → validating → submitting → success` calls `onStatusChange` in order and `onSuccess` once.
- Rejected `onSubmit` enters `server-error`, renders `role="alert"`, preserves values, re-enables submit.
- Returned `fieldErrors` map to fields; unknown keys fall back to form-level alert.
- Double-click / Enter-spam triggers exactly one `onSubmit`.
- Unmount mid-submit: no setState warnings, no late callbacks.

### Keyboard & accessibility
- Enter in a text field submits; Space toggles remember-me; Escape is not handled (bubbles to a wrapping `Dialog`).
- Tab order is DOM order; no positive `tabIndex` introduced.
- axe-core: no violations for default `LoginForm` in idle, invalid, and server-error states.
- On failed submit, focus lands on form-level alert or first invalid field; only one `role="alert"` field error is live per submit.
- Success message announced via `role="status"` without focus theft.

### Integration
- Works controlled (`values` + `onValuesChange`) and uncontrolled (`defaultValues`) via `useControllableState`.
- Reset restores `defaultValues` and clears errors/status in both modes.
- Composes inside `Dialog.Content` without focus-trap or Escape conflicts.
- All styling resolves through tokens; no hard-coded colors, durations, or z-index.

## 10. Open Questions

1. **(Blocked) Valibot adapter contract.** Does the Valibot issue deliver a `FormValidationAdapter` with the exact `validate` / `validateAsync` shape above, or should the recipe accept a raw Valibot schema and construct the adapter internally? Public API section 4 must be finalized against that resolution.
2. **(Blocked) Async field-level validation.** Should `validateAsync` be per-field (enabling per-field `validating` indicators) or form-level only as currently specified? Per-field requires the adapter to expose issue-to-field mapping for in-flight requests.
3. **Server error key convention.** Is there a standard backend error envelope (e.g. `{ field, code, message }`) the recipe should parse, or is `RecipeSubmitResult` the sole translation boundary, leaving envelope parsing to consumers?
4. **Success behavior.** Should `success` be a terminal state, or auto-return to `idle` after a timeout? Current spec: terminal until values change or reset; confirm this matches product expectations for login vs. settings forms.
5. **Recipe catalog scope.** Is `LoginForm` alone sufficient for the first release, with registration/reset/profile added later via `createBusinessRecipe`, or must the initial PR ship a minimum set? No new pattern behavior is required either way, so this is a scoping question, not a pattern extension.