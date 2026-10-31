import { useMemo, useState, type ReactElement } from "react";
import * as v from "valibot";
import { Button, Form, Input } from "seam-react";
import { valibotResolver } from "seam-react/valibot";
import type { FormErrors, FormValidationTrigger } from "seam-react";

interface AccountValues extends Record<string, unknown> {
  username: string;
  email: string;
}

const initialValues: AccountValues = {
  username: "",
  email: "",
};

const accountSchema = v.object({
  username: v.pipe(
    v.string(),
    v.minLength(3, "Username must contain at least 3 characters."),
  ),
  email: v.pipe(v.string(), v.email("Enter a valid email address.")),
});

const triggerOptions: Array<{
  value: FormValidationTrigger;
  label: string;
}> = [
  { value: "blur", label: "Blur (default)" },
  { value: "change", label: "Change" },
  { value: "focus", label: "Focus" },
  { value: "pointerleave", label: "Pointer leave" },
  { value: "submit", label: "Submit" },
];

function validateAccount(values: AccountValues): FormErrors<AccountValues> {
  const errors: FormErrors<AccountValues> = {};

  if (values.username.trim().length > 0 && values.username.trim().length < 3) {
    errors.username = "Username must contain at least 3 characters.";
  }

  if (values.email.trim().length > 0 && !values.email.includes("@")) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
}

/**
 * Demonstrates that field rules and form-level/schema validation share the
 * configured interaction trigger. The default remains blur + change
 * revalidation; submit always performs a complete validation pass.
 */
export default function ValidationTimingDemo(): ReactElement {
  const [validateOn, setValidateOn] = useState<FormValidationTrigger>("blur");
  const [values, setValues] = useState<AccountValues>(initialValues);
  const [submittedValues, setSubmittedValues] = useState<AccountValues | null>(
    null,
  );
  const [lastFailure, setLastFailure] = useState<string | null>(null);

  const validate = useMemo(
    () =>
      valibotResolver(accountSchema) as (
        values: AccountValues,
      ) => FormErrors<AccountValues>,
    [],
  );

  return (
    <div className="demo-stack">
      <div className="demo-row">
        <label htmlFor="form-validation-trigger">Validate on</label>
        <select
          id="form-validation-trigger"
          value={validateOn}
          onChange={(event) => {
            setValidateOn(event.target.value as FormValidationTrigger);
            setSubmittedValues(null);
            setLastFailure(null);
          }}
        >
          {triggerOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <p className="demo-description">
        Revalidate existing errors on change. Submission always validates every
        registered field and the Valibot schema.
      </p>

      <Form.Root<AccountValues>
        key={validateOn}
        layout="vertical"
        defaultValues={initialValues}
        validateOn={validateOn}
        revalidateOn="change"
        validateDebounce={200}
        validate={(currentValues) => {
          const resolverErrors = validate(currentValues);
          const ruleErrors = validateAccount(currentValues);

          return { ...resolverErrors, ...ruleErrors };
        }}
        onValuesChange={(nextValues) => {
          setValues(nextValues);
        }}
        onSubmit={(nextValues) => {
          setSubmittedValues(nextValues);
          setLastFailure(null);
        }}
        onSubmitFailed={(errors) => {
          setSubmittedValues(null);
          setLastFailure(Object.keys(errors).join(", ") || "Unknown field");
        }}
      >
        <Form.Field
          name="username"
          rules={{
            required: true,
            minLength: {
              value: 3,
              message: "Use at least 3 characters for your username.",
            },
          }}
        >
          <Form.Label required>Username</Form.Label>
          <Form.Control>
            <Input
              placeholder="At least 3 characters"
              autoComplete="username"
            />
          </Form.Control>
          <Form.Description>
            Field rules and the schema run at the same configured time.
          </Form.Description>
          <Form.ErrorMessage />
        </Form.Field>

        <Form.Field name="email" rules={{ required: true }}>
          <Form.Label>Email address</Form.Label>
          <Form.Control>
            <Input
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
            />
          </Form.Control>
          <Form.Description>
            Change the trigger above, then focus, edit, blur, or leave the
            field.
          </Form.Description>
          <Form.ErrorMessage />
        </Form.Field>

        <Form.Actions>
          <Button type="submit">Validate account</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSubmittedValues(null);
              setLastFailure(null);
            }}
          >
            Clear result
          </Button>
        </Form.Actions>
      </Form.Root>

      <output className="demo-description" aria-live="polite">
        Current values: {values.username || "—"} / {values.email || "—"}
        {submittedValues
          ? ` · Submitted ${submittedValues.username}`
          : lastFailure
            ? ` · Invalid fields: ${lastFailure}`
            : ""}
      </output>
    </div>
  );
}
