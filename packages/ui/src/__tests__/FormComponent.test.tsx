import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { CheckBox } from "../CheckBox";
import {
  Form,
  useFieldState,
  useWatch,
  type FormErrors,
  type FormRef,
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

function RequiredField({
  name = "email",
  label = "邮箱",
  message = "请输入邮箱",
}: {
  name?: string;
  label?: string;
  message?: string;
}) {
  return (
    <Form.Field
      name={name}
      defaultValue=""
      rules={[{ required: true, message }]}
    >
      <Form.Label>{label}</Form.Label>
      <Form.Control>
        <input />
      </Form.Control>
      <Form.ErrorMessage />
    </Form.Field>
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
    render(
      <Form.Root validateOn="focus">
        <RequiredField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    expect(screen.queryByText("请输入邮箱")).toBeNull();

    fireEvent.focus(input);

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
  });

  it("validates on change with the latest transformed value", async () => {
    render(
      <Form.Root validateOn="change">
        <Form.Field
          name="code"
          defaultValue=""
          transform={(value) => String(value).trim()}
          rules={[{ minLength: 3, message: "至少三个字符" }]}
        >
          <Form.Label>代码</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "代码" });
    fireEvent.change(input, { target: { value: "  ab  " } });

    expect(await screen.findByText("至少三个字符")).not.toBeNull();

    fireEvent.change(input, { target: { value: "  abc  " } });
    await waitFor(() => {
      expect(screen.queryByText("至少三个字符")).toBeNull();
    });
    expect((input as HTMLInputElement).value).toBe("abc");
  });

  it("validates on pointerleave when the pointer leaves the field region", async () => {
    render(
      <Form.Root validateOn="pointerleave">
        <RequiredField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    const field = input.closest(".uk-form__field");
    expect(field).not.toBeNull();

    fireEvent.pointerLeave(field as Element);

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
  });

  it("skips interaction validation with submit but validates on submission", async () => {
    const onSubmit = vi.fn<(values: Record<string, unknown>) => void>();

    render(
      <Form.Root validateOn="submit" onSubmit={onSubmit}>
        <RequiredField />
        <button type="submit">提交</button>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    const field = input.closest(".uk-form__field") as Element;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    fireEvent.pointerLeave(field);
    expect(screen.queryByText("请输入邮箱")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "提交" }));

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("revalidates an invalid field on focus when configured", async () => {
    render(
      <Form.Root revalidateOn="focus">
        <RequiredField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.blur(input);
    expect(await screen.findByText("请输入邮箱")).not.toBeNull();

    fireEvent.change(input, { target: { value: "team@example.com" } });
    expect(screen.getByText("请输入邮箱")).not.toBeNull();

    fireEvent.focus(input);
    await waitFor(() => {
      expect(screen.queryByText("请输入邮箱")).toBeNull();
    });
  });

  it("revalidates an invalid field on blur when configured", async () => {
    render(
      <Form.Root validateOn="change" revalidateOn="blur">
        <RequiredField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.change(input, { target: { value: "" } });
    expect(await screen.findByText("请输入邮箱")).not.toBeNull();

    fireEvent.change(input, { target: { value: "team@example.com" } });
    expect(screen.getByText("请输入邮箱")).not.toBeNull();

    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.queryByText("请输入邮箱")).toBeNull();
    });
  });

  it("revalidates an invalid field on pointerleave when configured", async () => {
    render(
      <Form.Root revalidateOn="pointerleave">
        <RequiredField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.blur(input);
    expect(await screen.findByText("请输入邮箱")).not.toBeNull();

    fireEvent.change(input, { target: { value: "team@example.com" } });
    expect(screen.getByText("请输入邮箱")).not.toBeNull();

    fireEvent.pointerLeave(input.closest(".uk-form__field") as Element);
    await waitFor(() => {
      expect(screen.queryByText("请输入邮箱")).toBeNull();
    });
  });

  it("runs form-level validation at the same change trigger as field rules", async () => {
    const validate = vi.fn<(values: Record<string, unknown>) => FormErrors>(
      (values) =>
        values.email === "taken@example.com" ? { email: "邮箱已注册" } : {},
    );

    render(
      <Form.Root validateOn="change" validate={validate}>
        <Form.Field name="email" defaultValue="">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    expect(validate).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "taken@example.com" } });
    expect(await screen.findByText("邮箱已注册")).not.toBeNull();
    expect(validate).toHaveBeenLastCalledWith({ email: "taken@example.com" });

    fireEvent.change(input, { target: { value: "team@example.com" } });
    await waitFor(() => {
      expect(screen.queryByText("邮箱已注册")).toBeNull();
    });
  });

  it("runs form-level validation on focus and blur", async () => {
    const validate = vi.fn<(values: Record<string, unknown>) => FormErrors>(
      (values) => (values.email ? {} : { email: "表单要求邮箱" }),
    );
    const { unmount } = render(
      <Form.Root validateOn="focus" validate={validate}>
        <Form.Field name="email" defaultValue="">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    fireEvent.focus(screen.getByRole("textbox", { name: "邮箱" }));
    expect(await screen.findByText("表单要求邮箱")).not.toBeNull();
    unmount();

    render(
      <Form.Root validate={validate}>
        <Form.Field name="email" defaultValue="">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    fireEvent.blur(screen.getByRole("textbox", { name: "邮箱" }));
    expect(await screen.findByText("表单要求邮箱")).not.toBeNull();
  });

  it("runs form-level validation on pointerleave", async () => {
    render(
      <Form.Root
        validateOn="pointerleave"
        validate={(values) => (values.email ? {} : { email: "表单要求邮箱" })}
      >
        <Form.Field name="email" defaultValue="">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.pointerLeave(input.closest(".uk-form__field") as Element);

    expect(await screen.findByText("表单要求邮箱")).not.toBeNull();
  });

  it("validates controlled values on change and preserves original callbacks", async () => {
    const onChange = vi.fn<(event: unknown) => void>();
    const onValuesChange =
      vi.fn<(values: Record<string, unknown>, changedField?: string) => void>();

    function ControlledForm() {
      return (
        <Form.Root
          values={{ email: "" }}
          validateOn="change"
          onValuesChange={onValuesChange}
        >
          <Form.Field
            name="email"
            rules={[{ required: true, message: "请输入邮箱" }]}
          >
            <Form.Label>邮箱</Form.Label>
            <Form.Control>
              <input onChange={onChange} />
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Field>
        </Form.Root>
      );
    }

    render(<ControlledForm />);

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.change(input, { target: { value: "" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onValuesChange).toHaveBeenCalled();
    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
  });

  it("preserves boolean and composite control change callbacks", async () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();
    const onValueChange = vi.fn<(value: string | string[]) => void>();

    render(
      <Form.Root>
        <Form.Field name="enabled" defaultValue={false}>
          <Form.Label>启用</Form.Label>
          <Form.Control>
            <CheckBox onCheckedChange={onCheckedChange} />
          </Form.Control>
        </Form.Field>
        <Form.Field name="plan" defaultValue="free">
          <Form.Label>套餐</Form.Label>
          <Form.Control>
            <RadioGroup onValueChange={onValueChange}>
              <RadioGroupItem value="free" label="免费" />
              <RadioGroupItem value="pro" label="专业" />
            </RadioGroup>
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "启用" }));
    fireEvent.click(screen.getByRole("radio", { name: "专业" }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(onValueChange).toHaveBeenCalledWith("pro");
  });

  it("debounces async change validation and ignores stale results", async () => {
    vi.useFakeTimers();
    let resolveFirst: ((value: string | null) => void) | undefined;
    const validator = vi
      .fn<
        (
          value: unknown,
          values: Record<string, unknown>,
        ) => Promise<string | null>
      >()
      .mockImplementationOnce(
        () =>
          new Promise<string | null>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(null);

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
      fireEvent.change(input, { target: { value: "first@example.com" } });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      expect(validator).toHaveBeenCalledTimes(1);

      fireEvent.change(input, { target: { value: "second@example.com" } });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      expect(validator).toHaveBeenCalledTimes(2);

      await act(async () => {
        resolveFirst?.("旧校验错误");
        await Promise.resolve();
      });
      expect(screen.queryByText("旧校验错误")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps server-set errors until explicitly cleared", async () => {
    const ref = createRef<FormRef>();

    render(
      <Form.Root ref={ref}>
        <Form.Field name="email" defaultValue="team@example.com">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    act(() => ref.current?.setError("email", "服务器拒绝该邮箱"));
    expect(await screen.findByText("服务器拒绝该邮箱")).not.toBeNull();

    act(() => ref.current?.clearErrors(["email"]));
    await waitFor(() => {
      expect(screen.queryByText("服务器拒绝该邮箱")).toBeNull();
    });
  });

  it("retains entered values and announces thrown submission errors", async () => {
    const onSubmit = vi.fn<() => Promise<void>>(() =>
      Promise.reject(new Error("服务暂不可用")),
    );

    render(
      <Form.Root onSubmit={onSubmit}>
        <Form.Field name="email" defaultValue="team@example.com">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
        <button type="submit">提交</button>
      </Form.Root>,
    );

    fireEvent.click(screen.getByRole("button", { name: "提交" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("服务暂不可用");
    expect(alert.getAttribute("aria-live")).toBe("assertive");
    expect(
      (screen.getByRole("textbox", { name: "邮箱" }) as HTMLInputElement).value,
    ).toBe("team@example.com");
  });

  it("renders one hidden required marker from an explicit label prop", () => {
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

    const label = screen.getByText("邮箱").closest("label") as HTMLLabelElement;
    const markers = within(label).getAllByText("*");
    expect(markers).toHaveLength(1);
    expect(markers[0]?.getAttribute("aria-hidden")).toBe("true");
    expect(markers[0]?.classList.contains("uk-form__required")).toBe(true);
  });

  it("renders the required marker from a required rule and keeps aria-required", async () => {
    render(
      <Form.Root>
        <RequiredField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    await waitFor(() => {
      expect(input.getAttribute("aria-required")).toBe("true");
    });
    const label = document.querySelector(
      `label[for="${input.id}"]`,
    ) as HTMLLabelElement;
    const marker = within(label).getByText("*");
    expect(marker.getAttribute("aria-hidden")).toBe("true");
  });

  it("exposes label wrapping only when enabled without changing the accessible name", () => {
    const { unmount } = render(
      <Form.Root>
        <Form.Field name="email" defaultValue="">
          <Form.Label>用于接收重要账户通知的完整邮箱地址</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.Description>我们不会公开此地址</Form.Description>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", {
      name: "用于接收重要账户通知的完整邮箱地址",
    });
    const label = document.querySelector(
      `label[for="${input.id}"]`,
    ) as HTMLLabelElement;
    expect(label.getAttribute("data-label-wrap")).toBeNull();
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByText("我们不会公开此地址").id,
    );
    unmount();

    render(
      <Form.Root>
        <Form.Field name="email" defaultValue="">
          <Form.Label labelWrap>用于接收重要账户通知的完整邮箱地址</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.Description>我们不会公开此地址</Form.Description>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const wrappedInput = screen.getByRole("textbox", {
      name: "用于接收重要账户通知的完整邮箱地址",
    });
    const wrappedLabel = document.querySelector(
      `label[for="${wrappedInput.id}"]`,
    ) as HTMLLabelElement;
    expect(wrappedLabel.getAttribute("data-label-wrap")).toBe("true");
    expect(wrappedInput.getAttribute("aria-describedby")).toContain(
      screen.getByText("我们不会公开此地址").id,
    );
  });

  it("uses horizontal layout by default and supports vertical and inline layouts", () => {
    const { container, unmount } = render(
      <Form.Root>
        <Form.Field name="email" defaultValue="">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );
    expect(container.querySelector("form")?.getAttribute("data-layout")).toBe(
      "horizontal",
    );
    unmount();

    const vertical = render(
      <Form.Root layout="vertical">
        <Form.Field name="email" defaultValue="">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );
    expect(
      vertical.container.querySelector("form")?.getAttribute("data-layout"),
    ).toBe("vertical");
    vertical.unmount();

    const inline = render(
      <Form.Root layout="inline">
        <Form.Field name="email" defaultValue="">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
        <Form.Actions>
          <button type="submit">筛选</button>
        </Form.Actions>
      </Form.Root>,
    );
    expect(
      inline.container.querySelector("form")?.getAttribute("data-layout"),
    ).toBe("inline");
    expect(inline.container.querySelector(".uk-form__actions")).not.toBeNull();
  });

  it("keeps long descriptions and visible errors associated with the control", async () => {
    render(
      <Form.Root>
        <Form.Field
          name="email"
          defaultValue=""
          rules={[{ required: true, message: "请输入用于接收账户通知的邮箱" }]}
        >
          <Form.Label labelWrap>用于接收重要账户通知的完整邮箱地址</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.Description>
            该地址仅用于安全通知和必要的账户恢复流程
          </Form.Description>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", {
      name: "用于接收重要账户通知的完整邮箱地址",
    });
    fireEvent.blur(input);
    const error = await screen.findByText("请输入用于接收账户通知的邮箱");
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    expect(describedBy).toContain(
      screen.getByText("该地址仅用于安全通知和必要的账户恢复流程").id,
    );
    expect(describedBy).toContain(error.id);
    expect(error.getAttribute("role")).toBe("alert");
  });
});
