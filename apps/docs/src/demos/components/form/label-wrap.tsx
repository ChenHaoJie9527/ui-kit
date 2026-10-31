import { useState, type ReactElement } from "react";
import { Button, Form, Input } from "seam-react";

interface ProfileValues extends Record<string, unknown> {
  displayName: string;
  notificationEmail: string;
}

/**
 * Long labels can wrap without changing their native label association or
 * accessible name. The required marker comes from the field rule and remains
 * hidden from assistive technology.
 */
export default function LabelWrapDemo(): ReactElement {
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  return (
    <div className="demo-stack" style={{ maxWidth: "42rem" }}>
      <Form.Root<ProfileValues>
        layout="vertical"
        defaultValues={{
          displayName: "",
          notificationEmail: "",
        }}
        onSubmit={(values) => {
          setSubmittedName(values.displayName);
        }}
      >
        <Form.Field
          name="displayName"
          rules={{
            required: true,
            minLength: {
              value: 2,
              message:
                "Enter at least two characters so other members can recognize your profile.",
            },
          }}
        >
          <Form.Label labelWrap>
            Public display name shown to every member of your organization
          </Form.Label>
          <Form.Control>
            <Input placeholder="Your public name" autoComplete="nickname" />
          </Form.Control>
          <Form.Description>
            This intentionally long label wraps together with its required
            marker. It remains the accessible name of the input.
          </Form.Description>
          <Form.ErrorMessage />
        </Form.Field>

        <Form.Field
          name="notificationEmail"
          rules={{
            required: true,
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message:
                "Enter a complete email address, including the domain, so notifications can be delivered.",
            },
          }}
        >
          <Form.Label labelWrap required>
            Email address used for security alerts and important account
            notifications
          </Form.Label>
          <Form.Control>
            <Input
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
            />
          </Form.Control>
          <Form.Description>
            Explicit and rule-based required markers use the same visual
            treatment. Descriptions and errors stay associated with the control
            when their text wraps.
          </Form.Description>
          <Form.ErrorMessage />
        </Form.Field>

        <Form.Actions>
          <Button type="submit">Save profile</Button>
        </Form.Actions>
      </Form.Root>

      <p className="demo-description" aria-live="polite">
        {submittedName
          ? `Saved profile for ${submittedName}.`
          : "Submit the empty form to inspect wrapped required labels and error feedback."}
      </p>
    </div>
  );
}
