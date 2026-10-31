import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { CheckBox } from "../CheckBox";
import { Form, useFieldState, useWatch, type FormRef } from "../FormComponent";
import { RadioGroup, RadioGroupItem } from "../RadioGroup";
import { Select } from "../Select";
import { Switch } from "../Switch";

function EmailField() {
  return (
    <Form.Field
      name="email"
      defaultValue=""
      rules={[{ required: true, message: "请输入邮箱" }]}
    >
      <Form.Label>邮箱</Form.Label>
      <Form.Control>
        <input type="email" />
      </Form.Control>
      <Form.Description>用于接收通知</Form.Description>
      <Form.ErrorMessage />
    </Form.Field>
  );
}

function FieldProbe({ name }: { name: string }) {
  const state = useFieldState(name);

  return (
    <output data-testid={`${name}-state`}>
      {JSON.stringify({ value: state.value, dirty: state.dirty })}
    </output>
  );
}

function WatchProbe({ name }: { name: string }) {
  const value = useWatch<string>(name);

  return <output data-testid={`${name}-watch`}>{value}</output>;
}

function ErrorProbe({ name }: { name: string }) {
  const state = useFieldState(name);

  return <output data-testid={`${name}-error`}>{state.error ?? ""}</output>;
}

describe("Form", () => {
  it("associates labels, descriptions, values, and change handlers", () => {
    const onValuesChange =
      vi.fn<(values: Record<string, unknown>, changedField?: string) => void>();

    render(
      <Form.Root onValuesChange={onValuesChange}>
        <EmailField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByText("用于接收通知").id,
    );
    expect(input.getAttribute("aria-required")).toBe("true");

    fireEvent.change(input, { target: { value: "team@example.com" } });

    expect((input as HTMLInputElement).value).toBe("team@example.com");
    expect(onValuesChange).toHaveBeenLastCalledWith(
      { email: "team@example.com" },
      "email",
    );
  });

  it("validates on blur and revalidates an invalid field on change", async () => {
    render(
      <Form.Root>
        <EmailField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.blur(input);

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(input.getAttribute("aria-invalid")).toBe("true");

    fireEvent.change(input, { target: { value: "team@example.com" } });

    await waitFor(() => {
      expect(screen.queryByText("请输入邮箱")).toBeNull();
    });
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  it("submits valid values and focuses the first invalid field", async () => {
    const onSubmit = vi.fn<(values: Record<string, unknown>) => void>();

    render(
      <Form.Root onSubmit={onSubmit}>
        <EmailField />
        <button type="submit">提交</button>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.click(screen.getByRole("button", { name: "提交" }));

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
    await waitFor(() => expect(document.activeElement).toBe(input));

    fireEvent.change(input, { target: { value: "team@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "提交" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ email: "team@example.com" });
    });
  });

  it("supports checkbox values and disabled fields", () => {
    render(
      <Form.Root>
        <Form.Field name="enabled" defaultValue={false}>
          <Form.Label>启用通知</Form.Label>
          <Form.Control>
            <input type="checkbox" />
          </Form.Control>
        </Form.Field>
        <Form.Field name="locked" disabled>
          <Form.Label>锁定字段</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "启用通知",
    }) as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    expect(
      (screen.getByRole("textbox", { name: "锁定字段" }) as HTMLInputElement)
        .disabled,
    ).toBe(true);
  });

  it("resets values and exposes the imperative API", async () => {
    const ref = createRef<FormRef>();

    render(
      <Form.Root ref={ref} defaultValues={{ email: "before@example.com" }}>
        <EmailField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", {
      name: "邮箱",
    }) as HTMLInputElement;
    expect(input.value).toBe("before@example.com");

    act(() => ref.current?.setValue("email", "after@example.com"));
    expect(input.value).toBe("after@example.com");

    await act(async () => {
      await ref.current?.validate();
    });
    act(() => ref.current?.reset());
    expect(input.value).toBe("before@example.com");
  });

  it("treats a field default as its initial value and restores it on reset", async () => {
    const ref = createRef<FormRef>();

    render(
      <Form.Root ref={ref} defaultValues={{}}>
        <Form.Field name="nickname" defaultValue="seam">
          <Form.Label>昵称</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
        <FieldProbe name="nickname" />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "昵称" });
    await waitFor(() => expect((input as HTMLInputElement).value).toBe("seam"));
    await waitFor(() =>
      expect(screen.getByTestId("nickname-state").textContent).toContain(
        '"dirty":false',
      ),
    );

    fireEvent.change(input, { target: { value: "edited" } });
    await waitFor(() =>
      expect(screen.getByTestId("nickname-state").textContent).toContain(
        '"dirty":true',
      ),
    );

    act(() => ref.current?.reset());
    await waitFor(() => expect((input as HTMLInputElement).value).toBe("seam"));
    await waitFor(() =>
      expect(screen.getByTestId("nickname-state").textContent).toContain(
        '"dirty":false',
      ),
    );
  });

  it("watches nested field values", () => {
    render(
      <Form.Root defaultValues={{ account: { email: "team@example.com" } }}>
        <Form.Field name="account.email">
          <Form.Label>账号邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
        <WatchProbe name="account.email" />
      </Form.Root>,
    );

    expect(screen.getByTestId("account.email-watch").textContent).toBe(
      "team@example.com",
    );
  });

  it("clears form-level validation errors after values become valid", async () => {
    const ref = createRef<FormRef>();

    render(
      <Form.Root
        ref={ref}
        defaultValues={{ email: "invalid" }}
        validate={(values) =>
          values.email === "invalid" ? { email: "邮箱不可用" } : {}
        }
      >
        <Form.Field name="email">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
        <ErrorProbe name="email" />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    await act(async () => {
      expect(await ref.current?.validate()).toBe(false);
    });
    expect(screen.getByTestId("email-error").textContent).toBe("邮箱不可用");

    fireEvent.change(input, { target: { value: "team@example.com" } });
    await act(async () => {
      expect(await ref.current?.validate()).toBe(true);
    });
    expect(screen.getByTestId("email-error").textContent).toBe("");
  });

  it("applies disabled and required field config before any value change", async () => {
    render(
      <Form.Root>
        <Form.Field
          name="email"
          disabled
          rules={[{ required: true, message: "请输入邮箱" }]}
        >
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    await waitFor(() => {
      expect((input as HTMLInputElement).disabled).toBe(true);
      expect(input.getAttribute("aria-required")).toBe("true");
    });
  });

  it("binds CheckBox and Switch through their boolean change APIs", async () => {
    const ref = createRef<FormRef>();

    render(
      <Form.Root ref={ref}>
        <Form.Field name="notifications" defaultValue={false}>
          <Form.Label>通知</Form.Label>
          <Form.Control>
            <CheckBox />
          </Form.Control>
        </Form.Field>
        <Form.Field name="marketing" defaultValue={false}>
          <Form.Label>营销消息</Form.Label>
          <Form.Control>
            <Switch />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "通知" }));
    fireEvent.click(screen.getByRole("switch", { name: "营销消息" }));

    await waitFor(() => {
      expect(ref.current?.getValue("notifications")).toBe(true);
      expect(ref.current?.getValue("marketing")).toBe(true);
    });
  });

  it("binds Select and RadioGroup through their value change APIs", async () => {
    const ref = createRef<FormRef>();

    render(
      <Form.Root ref={ref}>
        <Form.Field name="framework" defaultValue="react">
          <Form.Label>框架</Form.Label>
          <Form.Control>
            <Select
              options={[
                { value: "react", label: "React" },
                { value: "vue", label: "Vue" },
              ]}
            />
          </Form.Control>
        </Form.Field>
        <Form.Field name="plan" defaultValue="free">
          <Form.Label>套餐</Form.Label>
          <Form.Control>
            <RadioGroup>
              <RadioGroupItem value="free" label="免费" />
              <RadioGroupItem value="pro" label="专业" />
            </RadioGroup>
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    const trigger = screen.getByRole("combobox", { name: "框架" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.click(screen.getByRole("radio", { name: "专业" }));

    await waitFor(() => {
      expect(ref.current?.getValue("framework")).toBe("vue");
      expect(ref.current?.getValue("plan")).toBe("pro");
    });
  });

  /* ------------------------------------------------------------------ */
  /* Enhancement: validation triggers                                    */
  /* ------------------------------------------------------------------ */

  it("runs field rules on focus when validateOn is focus", async () => {
    const validate = vi.fn<
      (values: Record<string, unknown>) => Record<string, string>
    >(() => ({}));

    render(
      <Form.Root validateOn="focus" validate={validate}>
        <EmailField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    expect(screen.queryByText("请输入邮箱")).toBeNull();
    expect(validate).not.toHaveBeenCalled();

    fireEvent.focus(input);

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(validate).toHaveBeenCalled();
  });

  it("runs field rules and form validate on change when validateOn is change", async () => {
    const validate = vi.fn<
      (values: Record<string, unknown>) => Record<string, string>
    >(() => ({}));

    render(
      <Form.Root validateOn="change" validate={validate}>
        <EmailField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.change(input, { target: { value: "" } });

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(validate).toHaveBeenCalled();
  });

  it("runs form-level validate on blur by default", async () => {
    const validate = vi.fn<
      (values: Record<string, unknown>) => Record<string, string>
    >(() => ({}));

    render(
      <Form.Root validate={validate}>
        <EmailField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    expect(validate).not.toHaveBeenCalled();

    fireEvent.blur(input);

    await waitFor(() => expect(validate).toHaveBeenCalled());
  });

  it("runs validation on pointerleave when validateOn is pointerleave", async () => {
    const validate = vi.fn<
      (values: Record<string, unknown>) => Record<string, string>
    >(() => ({}));

    render(
      <Form.Root validateOn="pointerleave" validate={validate}>
        <EmailField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    expect(screen.queryByText("请输入邮箱")).toBeNull();

    const field = input.closest(".uk-form__field") as HTMLElement;
    fireEvent.pointerLeave(field);

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(validate).toHaveBeenCalled();
  });

  it("skips interaction validation when validateOn is submit but still validates on submit", async () => {
    const validate = vi.fn<
      (values: Record<string, unknown>) => Record<string, string>
    >(() => ({}));
    const onSubmit = vi.fn<(values: Record<string, unknown>) => void>();

    render(
      <Form.Root validateOn="submit" validate={validate} onSubmit={onSubmit}>
        <EmailField />
        <button type="submit">提交</button>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.focus(input);
    fireEvent.blur(input);
    fireEvent.change(input, { target: { value: "x" } });
    expect(validate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "提交" }));
    await waitFor(() => expect(validate).toHaveBeenCalled());
  });

  it("revalidates an already-invalid field on the configured revalidateOn trigger", async () => {
    render(
      <Form.Root validateOn="blur" revalidateOn="focus">
        <EmailField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.blur(input);
    expect(await screen.findByText("请输入邮箱")).not.toBeNull();

    fireEvent.change(input, { target: { value: "team@example.com" } });
    expect(screen.queryByText("请输入邮箱")).not.toBeNull();

    fireEvent.focus(input);
    await waitFor(() => {
      expect(screen.queryByText("请输入邮箱")).toBeNull();
    });
  });

  it("preserves original control onChange callbacks", () => {
    const onChange =
      vi.fn<(event: React.ChangeEvent<HTMLInputElement>) => void>();

    render(
      <Form.Root>
        <Form.Field name="email" defaultValue="">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input onChange={onChange} />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "邮箱" }), {
      target: { value: "a@b.com" },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  /* ------------------------------------------------------------------ */
  /* Enhancement: required marker                                        */
  /* ------------------------------------------------------------------ */

  it("renders a required marker from Form.Label required", () => {
    render(
      <Form.Root>
        <Form.Field name="email" defaultValue="">
          <Form.Label required>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    const label = screen.getByText("邮箱").closest("label") as HTMLElement;
    const marker = label.querySelector(".uk-form__required");
    expect(marker).not.toBeNull();
    expect(marker?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders a required marker automatically from a required field rule", () => {
    render(
      <Form.Root>
        <Form.Field
          name="email"
          defaultValue=""
          rules={[{ required: true, message: "必填" }]}
        >
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    const label = screen.getByText("邮箱").closest("label") as HTMLElement;
    const marker = label.querySelector(".uk-form__required");
    expect(marker).not.toBeNull();
    expect(marker?.getAttribute("aria-hidden")).toBe("true");
    expect(
      screen
        .getByRole("textbox", { name: "邮箱" })
        .getAttribute("aria-required"),
    ).toBe("true");
  });

  /* ------------------------------------------------------------------ */
  /* Enhancement: labelWrap                                              */
  /* ------------------------------------------------------------------ */

  it("exposes labelWrap styling state only when true", () => {
    render(
      <Form.Root>
        <Form.Field name="a" defaultValue="">
          <Form.Label>短标签</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
        <Form.Field name="b" defaultValue="">
          <Form.Label labelWrap>长标签长标签长标签</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    const plainLabel = screen
      .getByText("短标签")
      .closest("label") as HTMLElement;
    const wrapLabel = screen
      .getByText("长标签长标签长标签")
      .closest("label") as HTMLElement;

    expect(plainLabel.getAttribute("data-wrap")).not.toBe("true");
    expect(wrapLabel.getAttribute("data-wrap")).toBe("true");
  });

  it("labelWrap does not change the control accessible name", () => {
    render(
      <Form.Root>
        <Form.Field name="email" defaultValue="">
          <Form.Label labelWrap>电子邮箱地址</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    expect(
      screen.getByRole("textbox", { name: "电子邮箱地址" }),
    ).not.toBeNull();
  });

  /* ------------------------------------------------------------------ */
  /* Enhancement: layout                                                 */
  /* ------------------------------------------------------------------ */

  it("defaults to horizontal layout and exposes layout via data attribute", () => {
    const { container } = render(
      <Form.Root>
        <EmailField />
      </Form.Root>,
    );

    const form = container.querySelector("form") as HTMLElement;
    expect(form.getAttribute("data-layout")).toBe("horizontal");
  });

  it("exposes vertical and inline layouts via data attribute", () => {
    const { container: vertical } = render(
      <Form.Root layout="vertical">
        <EmailField />
      </Form.Root>,
    );
    const { container: inline } = render(
      <Form.Root layout="inline">
        <EmailField />
      </Form.Root>,
    );

    expect(
      (vertical.querySelector("form") as HTMLElement).getAttribute(
        "data-layout",
      ),
    ).toBe("vertical");
    expect(
      (inline.querySelector("form") as HTMLElement).getAttribute("data-layout"),
    ).toBe("inline");
  });

  /* ------------------------------------------------------------------ */
  /* Enhancement: form-level validate shares interaction triggers        */
  /* ------------------------------------------------------------------ */

  it("runs form-level validate on focus trigger and surfaces schema errors in field UI", async () => {
    render(
      <Form.Root
        validateOn="focus"
        defaultValues={{ email: "" }}
        validate={(values) => (values.email ? {} : { email: "邮箱不能为空" })}
      >
        <Form.Field name="email">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.focus(input);

    expect(await screen.findByText("邮箱不能为空")).not.toBeNull();

    fireEvent.change(input, { target: { value: "team@example.com" } });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.queryByText("邮箱不能为空")).toBeNull();
    });
  });

  it("runs form-level validate on change trigger", async () => {
    const validate = vi.fn<
      (values: Record<string, unknown>) => Record<string, string>
    >((values) => (values.email ? {} : { email: "必填" }));

    render(
      <Form.Root
        validateOn="change"
        defaultValues={{ email: "" }}
        validate={validate}
      >
        <Form.Field name="email">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.change(input, { target: { value: "" } });

    expect(await screen.findByText("必填")).not.toBeNull();
    expect(validate).toHaveBeenCalled();
  });

  it("keeps description and error associations with long wrapped content", async () => {
    render(
      <Form.Root>
        <Form.Field
          name="email"
          defaultValue=""
          rules={[
            {
              required: true,
              message: "这是一个很长的错误消息用于验证换行行为",
            },
          ]}
        >
          <Form.Label labelWrap>
            这是一个很长的标签文本用于验证换行行为
          </Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.Description>
            这是一段很长的描述文本用于验证换行行为
          </Form.Description>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", {
      name: "这是一个很长的标签文本用于验证换行行为",
    });
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    const description = screen.getByText(
      "这是一段很长的描述文本用于验证换行行为",
    );
    expect(describedBy).toContain(description.id);

    fireEvent.blur(input);
    const error = await screen.findByText(
      "这是一个很长的错误消息用于验证换行行为",
    );
    expect(input.getAttribute("aria-describedby")).toContain(error.id);
  });
});
