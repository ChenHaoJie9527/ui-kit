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
import {
  Form,
  useFieldState,
  useWatch,
  type FormErrors,
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

function RequiredInputField({
  label = "邮箱",
  labelWrap,
}: {
  label?: string;
  labelWrap?: boolean;
}) {
  return (
    <Form.Field
      name="email"
      defaultValue=""
      rules={[{ required: true, message: "请输入邮箱" }]}
    >
      <Form.Label labelWrap={labelWrap}>{label}</Form.Label>
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
    fireEvent.focus(input);
    fireEvent.pointerLeave(input.closest(".uk-form__field") as HTMLElement);
    expect(screen.queryByText("请输入邮箱")).toBeNull();

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

    const form = document.querySelector("form") as HTMLFormElement;
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

  it("runs field and form validation on focus without validating prematurely", async () => {
    const validate = vi.fn<
      (values: Record<string, unknown>) => FormErrors<Record<string, unknown>>
    >((values) => (values.email ? {} : { email: "表单邮箱必填" }));

    render(
      <Form.Root validateOn="focus" validate={validate}>
        <RequiredInputField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    expect(validate).not.toHaveBeenCalled();
    expect(screen.queryByText("请输入邮箱")).toBeNull();

    fireEvent.focus(input);

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(screen.getByText("表单邮箱必填")).not.toBeNull();
    expect(validate).toHaveBeenCalledWith({ email: "" });
  });

  it("validates the latest transformed value on change and preserves child callbacks", async () => {
    const validate = vi.fn<
      (values: Record<string, unknown>) => FormErrors<Record<string, unknown>>
    >((values) =>
      values.email === "invalid" ? { email: "表单邮箱不可用" } : {},
    );
    const onChange = vi.fn<(value: string) => void>();

    render(
      <Form.Root validateOn="change" validate={validate}>
        <Form.Field
          name="email"
          defaultValue=""
          transform={(value: string) => value.trim()}
          rules={[
            {
              validator: (value: string) =>
                value === "invalid" ? "字段邮箱不可用" : undefined,
            },
          ]}
        >
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input onChange={(event) => onChange(event.target.value)} />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.change(input, { target: { value: " invalid " } });

    expect(onChange).toHaveBeenCalledWith(" invalid ");
    expect(await screen.findByText("字段邮箱不可用")).not.toBeNull();
    expect(screen.getByText("表单邮箱不可用")).not.toBeNull();
    expect(validate).toHaveBeenLastCalledWith({ email: "invalid" });

    fireEvent.change(input, { target: { value: " team@example.com " } });
    await waitFor(() => {
      expect(screen.queryByText("字段邮箱不可用")).toBeNull();
      expect(screen.queryByText("表单邮箱不可用")).toBeNull();
    });
    expect(validate).toHaveBeenLastCalledWith({ email: "team@example.com" });
  });

  it("runs form-level validation on the default blur trigger", async () => {
    const validate = vi.fn<
      (values: Record<string, unknown>) => FormErrors<Record<string, unknown>>
    >(() => ({ email: "表单级错误" }));

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

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.focus(input);
    expect(validate).not.toHaveBeenCalled();

    fireEvent.blur(input);
    expect(await screen.findByText("表单级错误")).not.toBeNull();
    expect(validate).toHaveBeenCalledTimes(1);
  });

  it("validates field rules and form rules when the pointer leaves the field", async () => {
    const validate = vi.fn<
      (values: Record<string, unknown>) => FormErrors<Record<string, unknown>>
    >(() => ({ email: "指针离开表单错误" }));

    render(
      <Form.Root validateOn="pointerleave" validate={validate}>
        <RequiredInputField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    const field = input.closest(".uk-form__field") as HTMLElement;
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(validate).not.toHaveBeenCalled();

    fireEvent.pointerLeave(field);

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(screen.getByText("指针离开表单错误")).not.toBeNull();
    expect(validate).toHaveBeenCalledTimes(1);
  });

  it("only validates interactions on submit when validateOn is submit", async () => {
    const validate = vi.fn<
      (values: Record<string, unknown>) => FormErrors<Record<string, unknown>>
    >((values) => (values.email ? {} : { email: "提交表单错误" }));
    const onSubmit = vi.fn<(values: Record<string, unknown>) => void>();

    render(
      <Form.Root validateOn="submit" validate={validate} onSubmit={onSubmit}>
        <RequiredInputField />
        <button type="submit">提交</button>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    fireEvent.pointerLeave(input.closest(".uk-form__field") as HTMLElement);
    expect(validate).not.toHaveBeenCalled();
    expect(screen.queryByText("请输入邮箱")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "提交" }));

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(screen.getByText("提交表单错误")).not.toBeNull();
    expect(validate).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("supports every non-submit revalidation trigger for existing errors", async () => {
    const triggers: Array<Exclude<FormValidationTrigger, "submit">> = [
      "focus",
      "change",
      "blur",
      "pointerleave",
    ];

    for (const revalidateOn of triggers) {
      const { unmount } = render(
        <Form.Root validateOn="submit" revalidateOn={revalidateOn}>
          <RequiredInputField />
          <button type="submit">提交</button>
        </Form.Root>,
      );

      const input = screen.getByRole("textbox", { name: "邮箱" });
      const field = input.closest(".uk-form__field") as HTMLElement;
      fireEvent.click(screen.getByRole("button", { name: "提交" }));
      expect(await screen.findByText("请输入邮箱")).not.toBeNull();

      fireEvent.change(input, { target: { value: "team@example.com" } });
      if (revalidateOn === "focus") {
        fireEvent.focus(input);
      } else if (revalidateOn === "blur") {
        fireEvent.blur(input);
      } else if (revalidateOn === "pointerleave") {
        fireEvent.pointerLeave(field);
      }

      await waitFor(() => {
        expect(screen.queryByText("请输入邮箱")).toBeNull();
      });
      unmount();
    }
  });

  it("keeps controlled values consistent with interaction validation", async () => {
    const validate = vi.fn<
      (values: Record<string, unknown>) => FormErrors<Record<string, unknown>>
    >((values) =>
      values.email === "team@example.com" ? {} : { email: "受控邮箱错误" },
    );

    render(
      <Form.Root values={{ email: "" }} validateOn="change" validate={validate}>
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
    fireEvent.change(input, { target: { value: "team@example.com" } });

    await waitFor(() => {
      expect(validate).toHaveBeenCalledWith({ email: "team@example.com" });
    });
    expect(screen.queryByText("受控邮箱错误")).toBeNull();
  });

  it("debounces async change validation and ignores stale results", async () => {
    vi.useFakeTimers();
    let resolveFirst: ((value: string | undefined) => void) | undefined;
    const validator = vi.fn((value: string) => {
      if (value === "first") {
        return new Promise<string | undefined>((resolve) => {
          resolveFirst = resolve;
        });
      }

      return Promise.resolve(value === "second" ? undefined : "邮箱无效");
    });

    try {
      render(
        <Form.Root validateOn="change" validateDebounce={100}>
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
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      fireEvent.change(input, { target: { value: "second" } });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      await act(async () => {
        resolveFirst?.("过期错误");
        await Promise.resolve();
      });

      expect(screen.queryByText("过期错误")).toBeNull();
      expect(screen.queryByText("邮箱无效")).toBeNull();
      expect(validator).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders one hidden required marker from rules and preserves aria-required", async () => {
    render(
      <Form.Root>
        <RequiredInputField />
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    await waitFor(() => {
      const markers = document.querySelectorAll(".uk-form__required");
      expect(markers.length).toBe(1);
      expect(markers[0]?.getAttribute("aria-hidden")).toBe("true");
      expect(input.getAttribute("aria-required")).toBe("true");
    });
  });

  it("does not duplicate the marker when Label required is also set", async () => {
    render(
      <Form.Root>
        <Form.Field
          name="email"
          defaultValue=""
          rules={[{ required: true, message: "请输入邮箱" }]}
        >
          <Form.Label required>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    await waitFor(() => {
      expect(document.querySelectorAll(".uk-form__required").length).toBe(1);
    });
    expect(
      screen
        .getByRole("textbox", { name: "邮箱" })
        .getAttribute("aria-required"),
    ).toBe("true");
  });

  it("defaults labelWrap to false and only exposes wrapping when enabled", () => {
    const longLabel = "用于接收重要账户通知和安全提醒的完整电子邮箱地址";
    const { rerender } = render(
      <Form.Root>
        <RequiredInputField label={longLabel} />
      </Form.Root>,
    );

    const label = document.querySelector(".uk-form__label") as HTMLLabelElement;
    expect(label.getAttribute("data-wrap")).toBe("false");
    expect(screen.getByRole("textbox", { name: longLabel })).not.toBeNull();

    rerender(
      <Form.Root>
        <RequiredInputField label={longLabel} labelWrap />
      </Form.Root>,
    );
    expect(label.getAttribute("data-wrap")).toBe("true");
    expect(screen.getByRole("textbox", { name: longLabel })).not.toBeNull();
  });

  it("keeps long descriptions and errors associated with wrapped labels", async () => {
    const longLabel = "用于接收重要账户通知和安全提醒的完整电子邮箱地址";
    const longDescription = "该地址只用于账户通知，不会公开展示给其他成员。";

    render(
      <Form.Root>
        <Form.Field
          name="email"
          defaultValue=""
          rules={[
            { required: true, message: "请输入完整且有效的电子邮箱地址" },
          ]}
        >
          <Form.Label labelWrap>{longLabel}</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.Description>{longDescription}</Form.Description>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: longLabel });
    const description = screen.getByText(longDescription);
    fireEvent.blur(input);
    const error = await screen.findByText("请输入完整且有效的电子邮箱地址");
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    expect(describedBy).toContain(description.id);
    expect(describedBy).toContain(error.id);
  });

  it("retains server error and form error imperative flows", async () => {
    const ref = createRef<FormRef>();

    render(
      <Form.Root ref={ref}>
        <EmailField />
      </Form.Root>,
    );

    act(() => {
      ref.current?.setError("email", "服务器拒绝该邮箱");
      ref.current?.setFormError("提交失败，请稍后重试");
    });
    expect(await screen.findByText("服务器拒绝该邮箱")).not.toBeNull();
    expect(screen.getByRole("alert").textContent).toContain(
      "提交失败，请稍后重试",
    );

    act(() => ref.current?.clearErrors());
    await waitFor(() => {
      expect(screen.queryByText("服务器拒绝该邮箱")).toBeNull();
    });
  });
});
