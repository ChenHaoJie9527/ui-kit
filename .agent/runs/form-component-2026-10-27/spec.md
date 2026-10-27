# Form Component Specification

## 1. Purpose

### 1.1 Component positioning

`Form` is a form orchestration component built on native `<form>` semantics. It provides:

- Field registration, value management, and state tracking
- Declarative validation (sync, async, cross-field, form-level)
- Submission lifecycle management
- Accessible label/description/error association
- Consistent visual feedback across all seam-ui form controls

`Form` does **not** handle:

- Data fetching, API requests, or page navigation (business layer responsibility)
- Complex multi-step wizard flows (compose multiple `Form` instances or manage externally)
- Rich text editing, file upload progress, or drag-and-drop (use dedicated components inside `Field.Control`)
- Schema-based form generation from JSON (future extension, not in scope)

### 1.2 Composition structure

```tsx
<Form.Root onSubmit={handleSubmit}>
  <Form.Field name="email">
    <Form.Label>邮箱</Form.Label>
    <Form.Control>
      <Input type="email" />
    </Form.Control>
    <Form.Description>用于接收通知</Form.Description>
    <Form.ErrorMessage />
  </Form.Field>

  <Form.Actions>
    <Button type="submit">提交</Button>
  </Form.Actions>
</Form.Root>
```

### 1.3 Relationship to existing components

`Form` wraps and enhances existing form controls (`Input`, `Select`, `CheckBox`, `RadioGroup`, `Switch`) without replacing them. Controls remain usable standalone; `Form.Field` injects `id`, `aria-*`, validation state, and value binding via context.

---

## 2. Pattern Selection

**Primary pattern**: `form-control`

**Rationale**: Form's core interaction is user data input with validation. It extends the form-control pattern's principles:

- Native element semantics preserved (`<form>`, native submission, Enter key)
- `useControllableState` for controlled/uncontrolled form values
- Focus management follows existing patterns

**Secondary pattern**: `inline` (for `Form.Actions` layout and submit button states)

**Deviations requiring pattern extension**: None. Form is a composition layer, not a new primitive. All behaviors map to existing patterns.

---

## 3. States

### 3.1 Field-level states

| State          | Type      | Description                           |
| -------------- | --------- | ------------------------------------- |
| `value`        | `unknown` | Current field value                   |
| `initialValue` | `unknown` | Value at mount or last `reset()`      |
| `dirty`        | `boolean` | `value !== initialValue` (deep equal) |
| `touched`      | `boolean` | Field has been blurred at least once  |
| `focused`      | `boolean` | Field currently has focus             |
| `validating`   | `boolean` | Async validation in progress          |
| `invalid`      | `boolean` | Has validation error(s)               |
| `valid`        | `boolean` | Touched and no errors                 |
| `disabled`     | `boolean` | Field is disabled                     |
| `readOnly`     | `boolean` | Field is read-only                    |
| `hidden`       | `boolean` | Field is conditionally hidden         |

### 3.2 Form-level states

| State             | Type                     | Description                                     |
| ----------------- | ------------------------ | ----------------------------------------------- |
| `submitting`      | `boolean`                | `onSubmit` handler is executing                 |
| `submitted`       | `boolean`                | At least one submit attempt completed           |
| `submitSucceeded` | `boolean`                | Last submit succeeded                           |
| `submitFailed`    | `boolean`                | Last submit failed (validation or server error) |
| `dirty`           | `boolean`                | Any field is dirty                              |
| `validating`      | `boolean`                | Any field is validating                         |
| `errors`          | `Record<string, string>` | Field name → error message                      |
| `formError`       | `string \| null`         | Global form error (not field-specific)          |

### 3.3 State priority (visual)

When multiple states apply, visual priority is:

1. `disabled` — opacity 0.5, pointer-events none
2. `readOnly` — muted background, no pointer-events restriction
3. `invalid` — danger border + error message
4. `validating` — subtle indicator, field remains editable
5. `focused` — focus ring
6. `dirty` — no visual change by default

### 3.4 State consistency rules

- **Rapid input**: Validation debounced (default 300ms for async); sync validation runs immediately on blur
- **Repeated submit**: Blocked while `submitting === true`; submit button shows loading state
- **Reset during async validation**: Cancel pending validations, clear errors, restore `initialValue`
- **Async result after unmount**: Discard result, no state update, no memory leak
- **External value set**: Marks field as not dirty, clears touched, optionally triggers validation

---

## 4. Public API

### 4.1 Form.Root

```tsx
interface FormRootProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Controlled form values */
  values?: T;
  /** Default values for uncontrolled mode */
  defaultValues?: Partial<T>;
  /** Called when values change */
  onValuesChange?: (values: T, changedField: keyof T) => void;

  /** Submit handler — return Promise for async submission */
  onSubmit?: (values: T) => void | Promise<void>;
  /** Called when submit fails due to validation */
  onSubmitFailed?: (errors: FormErrors<T>) => void;

  /** Validation timing */
  validateOn?: "submit" | "blur" | "change";
  /** Re-validate on change only if field has error */
  revalidateOn?: "change" | "blur";

  /** Async validation debounce (ms) */
  validateDebounce?: number;

  /** Disable native HTML validation */
  noValidate?: boolean;

  /** Form-level validation function */
  validate?: (values: T) => FormErrors<T> | Promise<FormErrors<T>>;

  children: React.ReactNode;
  className?: string;
}
```

### 4.2 Form.Field

```tsx
interface FormFieldProps<T = unknown> {
  /** Field name — supports dot notation for nested: "user.email" */
  name: string;

  /** Default value for this field */
  defaultValue?: T;

  /** Validation rules */
  rules?: FieldRule<T>[];

  /** Transform input before storing */
  transform?: (value: T) => T;

  /** Disable this field */
  disabled?: boolean;
  /** Read-only mode */
  readOnly?: boolean;
  /** Conditionally hide (unmounts control, preserves value by default) */
  hidden?: boolean;

  /** Preserve value/errors when field unmounts */
  preserveOnUnmount?: boolean;

  /** Fields this field depends on — triggers revalidation when they change */
  dependencies?: string[];

  children: React.ReactNode;
}

type FieldRule<T> =
  | { required: boolean; message?: string }
  | { minLength: number; message?: string }
  | { maxLength: number; message?: string }
  | { pattern: RegExp; message?: string }
  | { min: number; message?: string }
  | { max: number; message?: string }
  | { enum: T[]; message?: string }
  | {
      validator: (
        value: T,
        values: Record<string, unknown>,
      ) => string | null | Promise<string | null>;
    };
```

### 4.3 Form.Label, Form.Control, Form.Description, Form.ErrorMessage

```tsx
interface FormLabelProps {
  children: React.ReactNode;
  /** Show required indicator */
  required?: boolean;
  className?: string;
}

interface FormControlProps {
  children: React.ReactElement; // Single control — receives injected props
}

interface FormDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface FormErrorMessageProps {
  /** Override displayed error (useful for custom rendering) */
  children?: (error: string) => React.ReactNode;
  className?: string;
}
```

### 4.4 Form.Actions

```tsx
interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
}
```

### 4.5 Imperative handle (via ref)

```tsx
interface FormRef<T = Record<string, unknown>> {
  /** Get current values */
  getValues: () => T;
  /** Get single field value */
  getValue: (name: string) => unknown;
  /** Set field value programmatically */
  setValue: (
    name: string,
    value: unknown,
    options?: { validate?: boolean; touch?: boolean },
  ) => void;
  /** Set multiple values */
  setValues: (values: Partial<T>, options?: { validate?: boolean }) => void;
  /** Reset to initial values */
  reset: (values?: Partial<T>) => void;
  /** Clear all values */
  clear: () => void;
  /** Manually trigger validation */
  validate: (fields?: string[]) => Promise<boolean>;
  /** Set field error externally (e.g., from server) */
  setError: (name: string, error: string) => void;
  /** Set form-level error */
  setFormError: (error: string | null) => void;
  /** Clear errors */
  clearErrors: (fields?: string[]) => void;
  /** Focus first field with error */
  focusFirstError: () => void;
}
```

### 4.6 Hooks

```tsx
/** Access form state from nested components */
function useFormContext<T>(): FormContextValue<T>;

/** Access single field state */
function useFieldState(name: string): FieldState;

/** Watch field value(s) */
function useWatch<T>(name: string | string[]): T;
```

---

## 5. Keyboard Behavior

### 5.1 Differences from form-control pattern

Form adds form-level keyboard handling:

| Key      | Context                         | Behavior                                                |
| -------- | ------------------------------- | ------------------------------------------------------- |
| `Enter`  | Single-line input               | Submit form (native behavior)                           |
| `Enter`  | `<textarea>`                    | Insert newline (no submit)                              |
| `Enter`  | Select dropdown open            | Select option, close dropdown (no submit)               |
| `Enter`  | Dialog/Popover open inside form | Handled by overlay, no form submit                      |
| `Escape` | Any field                       | No form-level action (overlays handle their own Escape) |

### 5.2 Error navigation

When validation fails on submit:

1. Focus moves to first invalid field
2. Error summary (if present) receives `aria-live="assertive"` announcement
3. `Tab` continues from focused error field

### 5.3 Dynamic field focus

When a focused field is removed (conditional hide, array item delete):

- Focus moves to next logical field, or
- Focus moves to the add/remove trigger that caused removal, or
- Focus moves to form container if no other field exists

---

## 6. Accessibility

### 6.1 Roles and structure

| Element             | Role                 | Notes                                   |
| ------------------- | -------------------- | --------------------------------------- |
| `Form.Root`         | `<form>`             | Native element, `noValidate` by default |
| `Form.Field`        | `<div>`              | Container, no role                      |
| `Form.Label`        | `<label>`            | Associated via `htmlFor`                |
| `Form.Control`      | Injected             | Receives `id`, `aria-*` props           |
| `Form.Description`  | `<p>`                | `id` for `aria-describedby`             |
| `Form.ErrorMessage` | `<p>`                | `role="alert"` or `aria-live="polite"`  |
| Error summary       | `<div role="alert">` | Contains links to error fields          |

### 6.2 ARIA attributes on controls

| Attribute              | Condition                                   |
| ---------------------- | ------------------------------------------- |
| `aria-required="true"` | Field has `required` rule                   |
| `aria-invalid="true"`  | Field has error                             |
| `aria-describedby`     | Links to description + error IDs            |
| `aria-disabled="true"` | Field disabled (native `disabled` also set) |
| `aria-readonly="true"` | Field read-only                             |
| `aria-busy="true"`     | Field validating                            |

### 6.3 Live regions

| Region             | `aria-live` | Content                       |
| ------------------ | ----------- | ----------------------------- |
| Field error        | `polite`    | Error message appears/changes |
| Form error summary | `assertive` | Submit failed, lists errors   |
| Submit success     | `polite`    | Success message (if provided) |

### 6.4 Focus management

- Visible focus ring: `box-shadow: 0 0 0 2px var(--uk-focus-ring)`
- Error focus: First invalid field receives focus on submit failure
- Focus not trapped (unlike Dialog)

---

## 7. Failure States

### 7.1 Validation failures

| Scenario                     | Behavior                                     |
| ---------------------------- | -------------------------------------------- |
| Required field empty         | Show error, `aria-invalid`, block submit     |
| Async validation fails       | Show error after debounce, allow editing     |
| Cross-field validation fails | Show error on dependent field                |
| Server returns field errors  | Map to fields via `setError`, display inline |
| Server returns global error  | Display in form error summary                |

### 7.2 Submission failures

| Scenario                | Behavior                                    |
| ----------------------- | ------------------------------------------- |
| Network error           | Keep values, show global error, allow retry |
| Timeout                 | Same as network error                       |
| Permission denied (403) | Show global error, may disable submit       |
| Server validation (400) | Map field errors, focus first error         |
| Unknown error           | Generic message, log to console in dev      |

### 7.3 Edge cases

| Scenario                  | Behavior                                  |
| ------------------------- | ----------------------------------------- |
| Submit while validating   | Wait for validation, then submit if valid |
| Reset while submitting    | Cancel submit, reset form                 |
| Unmount while submitting  | Cancel submit, no state update            |
| Field unmounts with error | Clear error unless `preserveOnUnmount`    |
| Duplicate field names     | Warn in dev, last registration wins       |

---

## 8. Motion Gate

### 8.1 Frequency assessment

Form interactions are **high-frequency** (typing, tabbing between fields). Per inline pattern guidance: default to no animation.

### 8.2 Approved animations

| Element              | Animation             | Token                        | Purpose                          |
| -------------------- | --------------------- | ---------------------------- | -------------------------------- |
| Error message appear | opacity 0→1           | `--uk-duration-fast` (120ms) | Subtle feedback, not distracting |
| Focus ring           | box-shadow transition | `--uk-duration-fast`         | Standard focus feedback          |
| Border color change  | CSS transition        | `--uk-transition` (160ms)    | State change feedback            |

### 8.3 Prohibited animations

- No layout shifts (reserve space for error messages)
- No scale/bounce on validation
- No slide-in error messages
- No animated submit button spinner replacement (use static spinner)

### 8.4 Reduced motion

All animations respect `prefers-reduced-motion`. Error messages appear instantly; focus ring has no transition.

---

## 9. Test Plan

### 9.1 Unit tests

| Area             | Tests                                                           |
| ---------------- | --------------------------------------------------------------- |
| Value management | Controlled/uncontrolled, defaultValues, setValue, nested paths  |
| State tracking   | dirty, touched, focused transitions                             |
| Validation       | Each rule type, sync/async, cross-field, debounce               |
| Submission       | Success, validation failure, server error, duplicate prevention |
| Reset/clear      | Restore initial, clear errors, cancel pending                   |
| Transform        | Trim, type coercion, custom transforms                          |
| Dependencies     | Revalidate on dependency change                                 |
| Unmount          | preserveOnUnmount true/false                                    |

### 9.2 Integration tests

| Scenario           | Verification                                           |
| ------------------ | ------------------------------------------------------ |
| Login form         | Email + password validation, submit, error display     |
| Registration       | Cross-field (password confirm), async (username check) |
| Dynamic fields     | Add/remove array items, validation per item            |
| Server errors      | Map 400 response to field errors                       |
| Conditional fields | Show/hide based on other field value                   |

### 9.3 Interaction tests

| Scenario               | Verification                        |
| ---------------------- | ----------------------------------- |
| Rapid typing           | Debounce works, no stale validation |
| Double submit          | Second submit blocked               |
| Reset during async     | Pending validation cancelled        |
| Tab order              | Logical order, error focus works    |
| Enter in textarea      | No submit                           |
| Enter with Select open | No submit                           |

### 9.4 Accessibility tests

| Check               | Method                            |
| ------------------- | --------------------------------- |
| Label association   | `getByLabelText` finds control    |
| Error announcement  | Screen reader announces on appear |
| Required indication | `aria-required` present           |
| Invalid indication  | `aria-invalid` present            |
| Focus visible       | Focus ring visible in screenshots |
| Keyboard only       | Complete form without mouse       |

### 9.5 Visual tests

| State      | Screenshot             |
| ---------- | ---------------------- |
| Default    | Light + dark           |
| Focused    | Focus ring visible     |
| Error      | Border + message       |
| Disabled   | Reduced opacity        |
| Validating | Indicator visible      |
| Long error | Wraps without overflow |
| 200% zoom  | Layout intact          |

---

## 10. Open Questions

### 10.1 Schema validation integration

Should Form provide first-class integration with schema libraries (Zod, Yup, Valibot)?

**Options**:

- A: Built-in `schema` prop that converts to rules
- B: Separate `@seam-ui/form-zod` adapter package
- C: Document pattern for manual integration only

**Recommendation**: Start with C, add B if demand exists.

### 10.2 Field array API

Should dynamic field arrays have dedicated API (`Form.FieldArray`, `useFieldArray`) or compose from existing primitives?

**Options**:

- A: Dedicated `useFieldArray` hook with `append`, `remove`, `move`
- B: Document pattern using `useWatch` + manual value manipulation

**Recommendation**: A — field arrays are common enough to warrant dedicated API.

### 10.3 Form wizard / multi-step

Should multi-step forms be in scope?

**Recommendation**: No — compose multiple Form instances or manage step state externally. Document pattern.

### 10.4 Persist to storage

Should Form support automatic persistence to localStorage/sessionStorage?

**Recommendation**: No — business layer concern. Document pattern using `onValuesChange`.

### 10.5 Changeset

- [ ] Add changeset: `feat(form): add Form component with validation and submission management`
- [ ] Update component exports in `index.ts`
- [ ] Add Form to pattern guide coverage table under `form-control`
