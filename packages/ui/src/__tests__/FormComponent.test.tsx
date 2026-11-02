import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CheckBox } from "../CheckBox";
import {
  Form,
  useFieldState,
  useFormContext,
  useWatch,
  type FormRef,
  type FormValidationTrigger,
} from "../FormComponent";
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

function FormStateProbe() {
  const { state } = useFormContext();

  return (
    <output data-testid="form-state">
      {JSON.stringify({
        submitting: state.submitting,
        submitted: state.submitted,
        submitSucceeded: state.submitSucceeded,
        submitFailed: state.submitFailed,
        formError: state.formError,
      })}
    </output>
  );
}

function ControlledForm() {
  const [values, setValues] = useState<Record<string, unknown>>({
    email: "",
  });

  return (
    <Form.Root values={values} onValuesChange={setValues} validateOn="change">
      <EmailField />
    </Form.Root>
  );
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

  it("validates on focus only after the field receives focus", async () => {
    const validate = vi.fn<() => Record<string, string>>(() => ({}));

    render(
      <Form.Root validateOn="focus" validate={validate}>
        <EmailField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    expect(validate).not.toHaveBeenCalled();
    expect(screen.queryByText("请输入邮箱")).toBeNull();

    fireEvent.focus(input);

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(validate).toHaveBeenCalled();
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("validates on change with the latest transformed value", async () => {
    const validate = vi.fn<
      (values: Record<string, unknown>) => Record<string, string>
    >((values) => (values.code === "AB" ? {} : { code: "编码必须为大写 AB" }));

    render(
      <Form.Root validateOn="change" validate={validate}>
        <Form.Field
          name="code"
          defaultValue=""
          transform={(value) => String(value).toUpperCase()}
          rules={[
            {
              validator: (value) =>
                value === "AB" ? null : "字段编码必须为大写 AB",
            },
          ]}
        >
          <Form.Label>编码</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "编码" });
    fireEvent.change(input, { target: { value: "ab" } });

    await waitFor(() => {
      expect(validate).toHaveBeenLastCalledWith({ code: "AB" });
    });
    expect((input as HTMLInputElement).value).toBe("AB");
    await waitFor(() => {
      expect(screen.queryByText("编码必须为大写 AB")).toBeNull();
      expect(screen.queryByText("字段编码必须为大写 AB")).toBeNull();
    });
  });

  it("validates when the pointer leaves the field region", async () => {
    render(
      <Form.Root validateOn="pointerleave">
        <EmailField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(screen.queryByText("请输入邮箱")).toBeNull();

    const field = input.closest(".uk-form__field");
    expect(field).not.toBeNull();
    fireEvent.pointerLeave(field as Element);

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
  });

  it("skips interaction validation in submit mode but validates everything on submit", async () => {
    const onSubmit = vi.fn<(values: Record<string, unknown>) => void>();
    const onSubmitFailed = vi.fn<(errors: Record<string, string>) => void>();
    const validate = vi.fn<
      (values: Record<string, unknown>) => Record<string, string>
    >((values) => (values.email ? {} : { email: "表单邮箱必填" }));

    render(
      <Form.Root
        validateOn="submit"
        validate={validate}
        onSubmit={onSubmit}
        onSubmitFailed={onSubmitFailed}
      >
        <EmailField />
        <button type="submit">提交</button>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    const field = input.closest(".uk-form__field") as Element;
    fireEvent.pointerLeave(field);
    expect(validate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "提交" }));

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(onSubmitFailed).toHaveBeenCalledWith({ email: "请输入邮箱" });
    });
    expect(validate).toHaveBeenCalled();
  });

  it("revalidates an existing error on focus when configured", async () => {
    render(
      <Form.Root validateOn="submit" revalidateOn="focus">
        <EmailField />
        <button type="submit">提交</button>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.click(screen.getByRole("button", { name: "提交" }));
    expect(await screen.findByText("请输入邮箱")).not.toBeNull();

    fireEvent.focus(input);
    await waitFor(() => {
      expect(screen.queryByText("请输入邮箱")).toBeNull();
    });
  });

  it("revalidates an existing error on blur when configured", async () => {
    render(
      <Form.Root validateOn="submit" revalidateOn="blur">
        <EmailField />
        <button type="submit">提交</button>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.click(screen.getByRole("button", { name: "提交" }));
    expect(await screen.findByText("请输入邮箱")).not.toBeNull();

    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.queryByText("请输入邮箱")).toBeNull();
    });
  });

  it("revalidates an existing error on pointerleave when configured", async () => {
    render(
      <Form.Root validateOn="submit" revalidateOn="pointerleave">
        <EmailField />
        <button type="submit">提交</button>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.click(screen.getByRole("button", { name: "提交" }));
    expect(await screen.findByText("请输入邮箱")).not.toBeNull();

    const field = input.closest(".uk-form__field") as Element;
    fireEvent.pointerLeave(field);
    await waitFor(() => {
      expect(screen.queryByText("请输入邮箱")).toBeNull();
    });
  });

  it("keeps blur validation opt-in behavior separate from focus and pointerleave", async () => {
    render(
      <Form.Root>
        <EmailField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.focus(input);
    fireEvent.pointerLeave(input.closest(".uk-form__field") as Element);
    expect(screen.queryByText("请输入邮箱")).toBeNull();

    fireEvent.blur(input);
    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
  });

  it("runs field rules and form validation at the same non-submit trigger", async () => {
    const validate = vi.fn<
      (values: Record<string, unknown>) => Record<string, string>
    >((values) => (values.email ? {} : { email: "表单级错误" }));

    render(
      <Form.Root validateOn="focus" validate={validate}>
        <EmailField />
      </Form.Root>,
    );

    fireEvent.focus(screen.getByRole("textbox", { name: "邮箱" }));

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(validate).toHaveBeenCalledWith({ email: "" });
  });

  it("uses the same validation timing for controlled and uncontrolled forms", async () => {
    const uncontrolled = render(
      <Form.Root validateOn="change">
        <EmailField />
      </Form.Root>,
    );
    const uncontrolledInput = within(uncontrolled.container).getByRole(
      "textbox",
      { name: "邮箱" },
    );
    fireEvent.change(uncontrolledInput, {
      target: { value: "team@example.com" },
    });
    await waitFor(() => {
      expect(
        within(uncontrolled.container).queryByText("请输入邮箱"),
      ).toBeNull();
    });
    uncontrolled.unmount();

    render(<ControlledForm />);
    const controlledInput = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.change(controlledInput, {
      target: { value: "team@example.com" },
    });
    await waitFor(() => {
      expect(screen.queryByText("请输入邮箱")).toBeNull();
    });
    expect((controlledInput as HTMLInputElement).value).toBe(
      "team@example.com",
    );
  });

  it("preserves original control callbacks while binding values", () => {
    const onChange = vi.fn<() => void>();
    const onFocus = vi.fn<() => void>();
    const onBlur = vi.fn<() => void>();
    const onCheckedChange = vi.fn<(checked: boolean) => void>();
    const onValueChange = vi.fn<(value: string | string[]) => void>();

    render(
      <Form.Root>
        <Form.Field name="email" defaultValue="">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input onChange={onChange} onFocus={onFocus} onBlur={onBlur} />
          </Form.Control>
        </Form.Field>
        <Form.Field name="enabled" defaultValue={false}>
          <Form.Label>启用</Form.Label>
          <Form.Control>
            <CheckBox onCheckedChange={onCheckedChange} />
          </Form.Control>
        </Form.Field>
        <Form.Field name="framework" defaultValue="react">
          <Form.Label>框架</Form.Label>
          <Form.Control>
            <Select
              options={[
                { value: "react", label: "React" },
                { value: "vue", label: "Vue" },
              ]}
              onValueChange={onValueChange}
            />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "team@example.com" } });
    fireEvent.blur(input);
    fireEvent.click(screen.getByRole("checkbox", { name: "启用" }));
    const trigger = screen.getByRole("combobox", { name: "框架" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });

    expect(onChange).toHaveBeenCalled();
    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(onValueChange).toHaveBeenCalledWith("vue");
  });

  it("exposes horizontal layout by default and supports vertical and inline layouts", () => {
    const { container, rerender } = render(
      <Form.Root>
        <EmailField />
      </Form.Root>,
    );
    const form = container.querySelector("form") as HTMLFormElement;
    expect(form.getAttribute("data-layout")).toBe("horizontal");

    rerender(
      <Form.Root layout="vertical">
        <EmailField />
      </Form.Root>,
    );
    expect(form.getAttribute("data-layout")).toBe("vertical");

    rerender(
      <Form.Root layout="inline">
        <EmailField />
      </Form.Root>,
    );
    expect(form.getAttribute("data-layout")).toBe("inline");
  });

  it("renders one hidden required marker from an explicit label prop", async () => {
    render(
      <Form.Root>
        <Form.Field name="email" defaultValue="">
          <Form.Label required>邮箱</Form.Label>
          <Form.Control>
            <input aria-required="true" />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱*" });
    const label = input.labels?.[0] as HTMLLabelElement;
    await waitFor(() => {
      expect(label.querySelectorAll(".uk-form__required")).toHaveLength(1);
    });
    const marker = label.querySelector(".uk-form__required") as HTMLElement;
    expect(marker.getAttribute("aria-hidden")).toBe("true");
    expect(marker.textContent).toBe("*");
    expect(input.getAttribute("aria-required")).toBe("true");
  });

  it("renders the required marker from a required field rule", async () => {
    render(
      <Form.Root>
        <EmailField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱*" });
    const label = input.labels?.[0] as HTMLLabelElement;
    await waitFor(() => {
      expect(label.querySelectorAll(".uk-form__required")).toHaveLength(1);
    });
    expect(
      label.querySelector(".uk-form__required")?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(input.getAttribute("aria-required")).toBe("true");
  });

  it("only exposes label wrapping styling when labelWrap is true", () => {
    const { rerender } = render(
      <Form.Root>
        <Form.Field name="email" defaultValue="">
          <Form.Label>用于接收重要通知的电子邮箱地址</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.Description>长说明仍与控件关联</Form.Description>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", {
      name: "用于接收重要通知的电子邮箱地址",
    });
    const label = input.labels?.[0] as HTMLLabelElement;
    expect(label.getAttribute("data-wrap")).toBeNull();
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByText("长说明仍与控件关联").id,
    );

    rerender(
      <Form.Root>
        <Form.Field name="email" defaultValue="">
          <Form.Label labelWrap>用于接收重要通知的电子邮箱地址</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.Description>长说明仍与控件关联</Form.Description>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    expect(label.getAttribute("data-wrap")).toBe("true");
    expect(
      screen.getByRole("textbox", {
        name: "用于接收重要通知的电子邮箱地址",
      }),
    ).toBe(input);
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByText("长说明仍与控件关联").id,
    );
  });

  it("keeps long descriptions and errors associated with the control", async () => {
    render(
      <Form.Root>
        <Form.Field
          name="email"
          defaultValue=""
          rules={[{ required: true, message: "请输入用于接收通知的邮箱地址" }]}
        >
          <Form.Label labelWrap>用于接收重要通知的电子邮箱地址</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.Description>我们会向这个地址发送账号安全通知</Form.Description>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", {
      name: "用于接收重要通知的电子邮箱地址*",
    });
    fireEvent.blur(input);
    const error = await screen.findByText("请输入用于接收通知的邮箱地址");
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    expect(describedBy).toContain(
      screen.getByText("我们会向这个地址发送账号安全通知").id,
    );
    expect(describedBy).toContain(error.id);
  });

  it("debounces async change validation and ignores stale results", async () => {
    vi.useFakeTimers();
    let resolveFirst: ((value: string | null) => void) | undefined;
    const validator = vi.fn<(value: unknown) => Promise<string | null>>(
      (value) => {
        if (value === "first") {
          return new Promise<string | null>((resolve) => {
            resolveFirst = resolve;
          });
        }
        return Promise.resolve(value === "second" ? null : "异步校验失败");
      },
    );

    try {
      render(
        <Form.Root validateOn="change" validateDebounce={200}>
          <Form.Field name="email" defaultValue="" rules={[{ validator }]}>
            <Form.Label>邮箱</Form.Label>
            <Form.Control>
              <input />
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Field>
        </Form.Root>,
      );

      const input = screen.getByRole("textbox", { name: "邮箱" });
      fireEvent.change(input, { target: { value: "first" } });
      expect(validator).not.toHaveBeenCalled();
      await act(async () => {
        vi.advanceTimersByTime(199);
      });
      expect(validator).not.toHaveBeenCalled();

      fireEvent.change(input, { target: { value: "second" } });
      await act(async () => {
        vi.advanceTimersByTime(200);
        await Promise.resolve();
      });
      expect(validator).toHaveBeenCalledTimes(1);
      expect(validator).toHaveBeenCalledWith(
        "second",
        expect.objectContaining({ email: "second" }),
      );
      expect(resolveFirst).toBeUndefined();
      expect(screen.queryByText("异步校验失败")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps server errors and clears them through the imperative API", async () => {
    const ref = createRef<FormRef>();

    render(
      <Form.Root ref={ref} defaultValues={{ email: "team@example.com" }}>
        <EmailField />
        <FormStateProbe />
      </Form.Root>,
    );

    act(() => {
      ref.current?.setError("email", "服务器拒绝该邮箱");
      ref.current?.setFormError("服务器暂时不可用");
    });

    expect(await screen.findByText("服务器拒绝该邮箱")).not.toBeNull();
    expect(screen.getByRole("alert").textContent).toBe("服务器暂时不可用");
    expect(screen.getByTestId("form-state").textContent).toContain(
      '"formError":"服务器暂时不可用"',
    );

    act(() => ref.current?.clearErrors());
    await waitFor(() => {
      expect(screen.queryByText("服务器拒绝该邮箱")).toBeNull();
      expect(screen.queryByText("服务器暂时不可用")).toBeNull();
    });
  });

  it("retains entered values and announces thrown submission errors", async () => {
    const onSubmit = vi.fn<(values: Record<string, unknown>) => Promise<void>>(
      async () => {
        throw new Error("提交失败，请稍后重试");
      },
    );

    render(
      <Form.Root onSubmit={onSubmit}>
        <EmailField />
        <FormStateProbe />
        <button type="submit">提交</button>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", {
      name: "邮箱*",
    }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "team@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "提交" }));

    expect(await screen.findByText("提交失败，请稍后重试")).not.toBeNull();
    expect(input.value).toBe("team@example.com");
    expect(screen.getByTestId("form-state").textContent).toContain(
      '"submitFailed":true',
    );
    expect(onSubmit).toHaveBeenCalledWith({ email: "team@example.com" });
  });

  it("resets and clears values and errors through existing flows", async () => {
    const ref = createRef<FormRef>();

    render(
      <Form.Root ref={ref} defaultValues={{ email: "before@example.com" }}>
        <EmailField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", {
      name: "邮箱*",
    }) as HTMLInputElement;
    fireEvent.blur(input);
    expect(await screen.findByText("请输入邮箱")).not.toBeNull();

    act(() => ref.current?.reset());
    await waitFor(() => {
      expect(screen.queryByText("请输入邮箱")).toBeNull();
    });
    expect(input.value).toBe("before@example.com");

    act(() => ref.current?.clear());
    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("supports every public validation trigger type at runtime", async () => {
    const triggers: FormValidationTrigger[] = [
      "submit",
      "focus",
      "change",
      "blur",
      "pointerleave",
    ];

    const cases = triggers.map((trigger) => async () => {
      const { unmount } = render(
        <Form.Root validateOn={trigger}>
          <EmailField />
        </Form.Root>,
      );
      const input = screen.getByRole("textbox", { name: "邮箱*" });
      const field = input.closest(".uk-form__field") as Element;

      if (trigger === "focus") fireEvent.focus(input);
      if (trigger === "change") {
        fireEvent.change(input, { target: { value: "changed" } });
        fireEvent.change(input, { target: { value: "" } });
      }
      if (trigger === "blur") fireEvent.blur(input);
      if (trigger === "pointerleave") fireEvent.pointerLeave(field);
      if (trigger === "submit") fireEvent.submit(input.form as HTMLFormElement);

      expect(await screen.findByText("请输入邮箱")).not.toBeNull();
      unmount();
    });

    for (const runCase of cases) {
      await runCase();
    }
  });
});
