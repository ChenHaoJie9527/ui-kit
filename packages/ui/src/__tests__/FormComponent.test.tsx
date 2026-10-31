import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createRef, useState } from "react";
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

function ControlledForm() {
  const [values, setValues] = useState<Record<string, unknown>>({
    email: "",
  });

  return (
    <Form.Root
      values={values}
      onValuesChange={(next) => setValues(next)}
      validateOn="change"
    >
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

  it("uses horizontal layout by default and supports vertical and inline layouts", () => {
    const { rerender } = render(
      <Form.Root>
        <EmailField />
      </Form.Root>,
    );

    const form = document.querySelector("form");
    expect(form?.getAttribute("data-layout")).toBe("horizontal");

    rerender(
      <Form.Root layout="vertical">
        <EmailField />
      </Form.Root>,
    );
    expect(form?.getAttribute("data-layout")).toBe("vertical");

    rerender(
      <Form.Root layout="inline">
        <EmailField />
      </Form.Root>,
    );
    expect(form?.getAttribute("data-layout")).toBe("inline");
  });

  it("runs field rules and form validation on focus only when configured", async () => {
    const validate = vi.fn<
      (values: Record<string, unknown>) => FormErrors<Record<string, unknown>>
    >((values) => (values.email ? {} : { email: "表单邮箱错误" }));

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
  });

  it("validates transformed change values and preserves the original callback", async () => {
    const onChange =
      vi.fn<(event: React.ChangeEvent<HTMLInputElement>) => void>();
    const validate = vi.fn<
      (values: Record<string, unknown>) => FormErrors<Record<string, unknown>>
    >((values) =>
      values.email === "team@example.com" ? {} : { email: "表单邮箱错误" },
    );

    render(
      <Form.Root validateOn="change" validate={validate}>
        <Form.Field
          name="email"
          defaultValue=""
          rules={[
            {
              validator: (value) =>
                value === "team@example.com" || "请输入团队邮箱",
            },
          ]}
        >
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input onChange={onChange} />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.change(input, { target: { value: "team@example.com" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(validate).toHaveBeenLastCalledWith({ email: "team@example.com" });
    });
    expect(screen.queryByText("请输入团队邮箱")).toBeNull();
    expect(screen.queryByText("表单邮箱错误")).toBeNull();
  });

  it("validates on pointerleave without changing default blur timing", async () => {
    const validate = vi.fn<
      (values: Record<string, unknown>) => FormErrors<Record<string, unknown>>
    >(() => ({}));

    const { rerender } = render(
      <Form.Root validate={validate}>
        <EmailField />
      </Form.Root>,
    );

    const field = document.querySelector(".uk-form__field");
    expect(field).not.toBeNull();
    fireEvent.pointerLeave(field as Element);
    fireEvent.focus(screen.getByRole("textbox", { name: "邮箱" }));
    expect(validate).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByRole("textbox", { name: "邮箱" }));
    await waitFor(() => expect(validate).toHaveBeenCalled());

    validate.mockClear();
    rerender(
      <Form.Root validateOn="pointerleave" validate={validate}>
        <EmailField />
      </Form.Root>,
    );

    fireEvent.pointerLeave(field as Element);
    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(validate).toHaveBeenCalled();
  });

  it("does not validate interactions in submit mode but validates on submission", async () => {
    const onSubmit = vi.fn<(values: Record<string, unknown>) => void>();
    const validate = vi.fn<
      (values: Record<string, unknown>) => FormErrors<Record<string, unknown>>
    >((values) => (values.email ? {} : { email: "表单邮箱错误" }));

    render(
      <Form.Root validateOn="submit" validate={validate} onSubmit={onSubmit}>
        <EmailField />
        <button type="submit">提交</button>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "team@example.com" } });
    fireEvent.blur(input);
    fireEvent.pointerLeave(
      document.querySelector(".uk-form__field") as Element,
    );
    expect(validate).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "提交" }));

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(validate).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("revalidates existing errors at each supported non-submit trigger", async () => {
    const triggers = ["focus", "change", "blur", "pointerleave"] as const;
    const results = triggers.map(async (revalidateOn) => {
      const { unmount } = render(
        <Form.Root validateOn="submit" revalidateOn={revalidateOn}>
          <EmailField />
          <button type="submit">提交</button>
        </Form.Root>,
      );

      const input = screen.getByRole("textbox", { name: "邮箱" });
      fireEvent.click(screen.getByRole("button", { name: "提交" }));
      expect(await screen.findByText("请输入邮箱")).not.toBeNull();

      fireEvent.change(input, { target: { value: "team@example.com" } });
      if (revalidateOn === "focus") {
        fireEvent.focus(input);
      } else if (revalidateOn === "blur") {
        fireEvent.blur(input);
      } else if (revalidateOn === "pointerleave") {
        fireEvent.pointerLeave(
          document.querySelector(".uk-form__field") as Element,
        );
      }

      await waitFor(() => expect(screen.queryByText("请输入邮箱")).toBeNull());
      unmount();
    });

    await Promise.all(results);
  });

  it("keeps controlled form values consistent with interaction validation", async () => {
    render(<ControlledForm />);
    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.change(input, { target: { value: "controlled@example.com" } });

    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe("controlled@example.com");
    });
    expect(screen.queryByText("请输入邮箱")).toBeNull();
  });

  it("renders one hidden required marker from rules and supports explicit labels", async () => {
    render(
      <Form.Root>
        <Form.Field
          name="email"
          rules={[{ required: true, message: "请输入邮箱" }]}
        >
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
        <Form.Field name="name">
          <Form.Label required>姓名</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    await waitFor(() => {
      const emailLabel = screen.getByText("邮箱").closest("label");
      const nameLabel = screen.getByText("姓名").closest("label");
      expect(emailLabel?.querySelectorAll(".uk-form__required").length).toBe(1);
      expect(nameLabel?.querySelectorAll(".uk-form__required").length).toBe(1);
      expect(
        emailLabel
          ?.querySelector(".uk-form__required")
          ?.getAttribute("aria-hidden"),
      ).toBe("true");
    });
    expect(
      screen
        .getByRole("textbox", { name: "邮箱" })
        .getAttribute("aria-required"),
    ).toBe("true");
  });

  it("exposes label wrapping only when enabled without changing associations", () => {
    render(
      <Form.Root>
        <Form.Field name="short">
          <Form.Label>短标签</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.Description>说明</Form.Description>
          <Form.ErrorMessage />
        </Form.Field>
        <Form.Field name="long">
          <Form.Label labelWrap>很长的标签文本</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.Description>长说明</Form.Description>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const shortLabel = screen.getByText("短标签").closest("label");
    const longLabel = screen.getByText("很长的标签文本").closest("label");
    const longInput = screen.getByRole("textbox", { name: "很长的标签文本" });
    expect(shortLabel?.getAttribute("data-wrap")).toBe("false");
    expect(longLabel?.getAttribute("data-wrap")).toBe("true");
    expect(longLabel?.getAttribute("for")).toBe(longInput.id);
    expect(longInput.getAttribute("aria-describedby")).toContain(
      screen.getByText("长说明").id,
    );
  });

  it("debounces async change validation and ignores stale results", async () => {
    vi.useFakeTimers();
    const pending = new Map<string, (result: { email?: string }) => void>();
    const validate = vi.fn<
      (values: Record<string, unknown>) => Promise<{ email?: string }>
    >(
      (values) =>
        new Promise<{ email?: string }>((resolve) => {
          pending.set(String(values.email), resolve);
        }),
    );

    try {
      render(
        <Form.Root
          validateOn="change"
          revalidateOn="change"
          validateDebounce={100}
          validate={validate}
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
      fireEvent.change(input, { target: { value: "old" } });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      fireEvent.change(input, { target: { value: "new" } });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(validate).toHaveBeenCalledTimes(2);
      await act(async () => {
        pending.get("new")?.({});
        await Promise.resolve();
      });
      await act(async () => {
        pending.get("old")?.({ email: "过期错误" });
        await Promise.resolve();
      });

      expect(screen.queryByText("过期错误")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("retains server errors, form errors, and clear flows", async () => {
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
        <ErrorProbe name="email" />
      </Form.Root>,
    );

    act(() => {
      ref.current?.setError("email", "服务器邮箱错误");
      ref.current?.setFormError("服务器提交失败");
    });
    expect(screen.getByTestId("email-error").textContent).toBe(
      "服务器邮箱错误",
    );
    expect(screen.getByRole("alert").textContent).toContain("服务器提交失败");

    act(() => ref.current?.clearErrors());
    await waitFor(() => {
      expect(screen.getByTestId("email-error").textContent).toBe("");
      expect(screen.queryByText("服务器提交失败")).toBeNull();
    });
  });
});
