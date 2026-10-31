import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import * as v from "valibot";
import { CheckBox } from "../CheckBox";
import {
  Form,
  useFieldState,
  useFormContext,
  useWatch,
  type FormErrors,
  type FormRef,
  type FormValidationTrigger,
} from "../FormComponent";
import { RadioGroup, RadioGroupItem } from "../RadioGroup";
import { Select } from "../Select";
import { Switch } from "../Switch";
import { valibotResolver } from "../valibot";

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
        errors: state.errors,
        formError: state.formError,
        submitFailed: state.submitFailed,
        submitSucceeded: state.submitSucceeded,
        submitting: state.submitting,
      })}
    </output>
  );
}

function InteractionField({
  validateOn,
  revalidateOn,
  validate,
  defaultValue = "",
  onChange,
}: {
  validateOn?: FormValidationTrigger;
  revalidateOn?: Exclude<FormValidationTrigger, "submit">;
  validate?: (values: Record<string, unknown>) => Record<string, string>;
  defaultValue?: string;
  onChange?: () => void;
}) {
  return (
    <Form.Root
      defaultValues={{ email: defaultValue }}
      validateOn={validateOn}
      revalidateOn={revalidateOn}
      validate={validate}
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

const ResolverSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("Schema 邮箱必填"),
    v.email("Schema 邮箱格式无效"),
  ),
  nickname: v.pipe(v.string(), v.minLength(2, "Schema 昵称至少 2 个字符")),
});

type ResolverValues = v.InferInput<typeof ResolverSchema>;

function ResolverForm({
  validateOn,
  revalidateOn,
  validateDebounce,
  onSubmit,
  onSubmitFailed,
  formRef,
  withFieldRules = false,
}: {
  validateOn?: FormValidationTrigger;
  revalidateOn?: Exclude<FormValidationTrigger, "submit">;
  validateDebounce?: number;
  onSubmit?: (values: ResolverValues) => void | Promise<void>;
  onSubmitFailed?: (errors: FormErrors<ResolverValues>) => void;
  formRef?: React.Ref<FormRef<ResolverValues>>;
  withFieldRules?: boolean;
}) {
  return (
    <Form.Root<ResolverValues>
      ref={formRef}
      defaultValues={{ email: "", nickname: "" }}
      validateOn={validateOn}
      revalidateOn={revalidateOn}
      validateDebounce={validateDebounce}
      validate={valibotResolver(ResolverSchema)}
      onSubmit={onSubmit}
      onSubmitFailed={onSubmitFailed}
    >
      <Form.Field
        name="email"
        rules={
          withFieldRules
            ? [{ required: true, message: "字段规则邮箱必填" }]
            : undefined
        }
      >
        <Form.Label>Schema 邮箱</Form.Label>
        <Form.Control>
          <input type="email" />
        </Form.Control>
        <Form.ErrorMessage />
      </Form.Field>
      <Form.Field name="nickname">
        <Form.Label>Schema 昵称</Form.Label>
        <Form.Control>
          <input />
        </Form.Control>
        <Form.ErrorMessage />
      </Form.Field>
      <button type="submit">Schema 提交</button>
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
    fireEvent.focus(input);
    fireEvent.pointerLeave(input.closest(".uk-form__field") as HTMLElement, {
      pointerType: "mouse",
    });
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

  it("validates field rules and form-level rules on focus", async () => {
    const validate = vi.fn((values: Record<string, unknown>) =>
      values.email ? {} : { email: "表单要求邮箱" },
    );

    render(<InteractionField validateOn="focus" validate={validate} />);

    const input = screen.getByRole("textbox", { name: "邮箱" });
    expect(validate).not.toHaveBeenCalled();
    expect(screen.queryByText("请输入邮箱")).toBeNull();

    fireEvent.focus(input);

    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(validate).toHaveBeenCalledWith({ email: "" });
  });

  it("validates on change using the latest transformed value", async () => {
    const validate = vi.fn((values: Record<string, unknown>) =>
      values.email === "TEAM@EXAMPLE.COM" ? {} : { email: "表单值未转换" },
    );

    render(
      <Form.Root
        defaultValues={{ email: "" }}
        validateOn="change"
        validate={validate}
      >
        <Form.Field
          name="email"
          transform={(value) => String(value).toUpperCase()}
          rules={[
            {
              validator: (value) =>
                value === "TEAM@EXAMPLE.COM" ? null : "字段值未转换",
            },
          ]}
        >
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
      expect(validate).toHaveBeenLastCalledWith({ email: "TEAM@EXAMPLE.COM" });
    });
    expect(screen.queryByText("字段值未转换")).toBeNull();
    expect(screen.queryByText("表单值未转换")).toBeNull();
  });

  it("validates on pointerleave without making it the default trigger", async () => {
    const validate = vi.fn((values: Record<string, unknown>) =>
      values.email ? {} : { email: "表单要求邮箱" },
    );

    render(<InteractionField validateOn="pointerleave" validate={validate} />);

    const input = screen.getByRole("textbox", { name: "邮箱" });
    const field = input.closest(".uk-form__field") as HTMLElement;
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(validate).not.toHaveBeenCalled();
    expect(screen.queryByText("请输入邮箱")).toBeNull();

    fireEvent.pointerLeave(field, { pointerType: "touch" });
    expect(validate).not.toHaveBeenCalled();

    fireEvent.pointerLeave(field, { pointerType: "mouse" });
    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(validate).toHaveBeenCalledWith({ email: "" });
  });

  it("only validates interactions for existing errors when validateOn is submit", async () => {
    const validate = vi.fn((values: Record<string, unknown>) =>
      values.email ? {} : { email: "表单要求邮箱" },
    );
    const onSubmit = vi.fn<(values: Record<string, unknown>) => void>();

    render(
      <Form.Root
        defaultValues={{ email: "" }}
        validateOn="submit"
        validate={validate}
        onSubmit={onSubmit}
      >
        <Form.Field
          name="email"
          rules={[{ required: true, message: "请输入邮箱" }]}
        >
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
        <button type="submit">提交</button>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    fireEvent.pointerLeave(input.closest(".uk-form__field") as HTMLElement, {
      pointerType: "mouse",
    });
    expect(validate).not.toHaveBeenCalled();
    expect(screen.queryByText("请输入邮箱")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "提交" }));
    expect(await screen.findByText("请输入邮箱")).not.toBeNull();
    expect(validate).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "team@example.com" } });
    await waitFor(() => expect(screen.queryByText("请输入邮箱")).toBeNull());
  });

  it("supports focus, blur, and pointerleave revalidation", async () => {
    const triggers = ["focus", "blur", "pointerleave"] as const;

    for (const trigger of triggers) {
      const view = render(
        <InteractionField validateOn="submit" revalidateOn={trigger} />,
      );
      const input = screen.getByRole("textbox", { name: "邮箱" });

      fireEvent.focus(input);
      fireEvent.blur(input);
      expect(await screen.findByText("请输入邮箱")).not.toBeNull();

      fireEvent.change(input, { target: { value: "team@example.com" } });
      expect(screen.queryByText("请输入邮箱")).not.toBeNull();

      if (trigger === "focus") {
        fireEvent.focus(input);
      } else if (trigger === "blur") {
        fireEvent.blur(input);
      } else {
        fireEvent.pointerLeave(
          input.closest(".uk-form__field") as HTMLElement,
          {
            pointerType: "mouse",
          },
        );
      }

      await waitFor(() => expect(screen.queryByText("请输入邮箱")).toBeNull());
      view.unmount();
    }
  });

  it("keeps controlled values and original control callbacks consistent", async () => {
    const onChange = vi.fn<() => void>();
    const validate = vi.fn((values: Record<string, unknown>) =>
      values.email ? {} : { email: "表单要求邮箱" },
    );

    render(
      <Form.Root values={{ email: "" }} validateOn="change" validate={validate}>
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
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.change(input, { target: { value: "team@example.com" });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((input as HTMLInputElement).value).toBe("");
    await waitFor(() => expect(validate).toHaveBeenCalled());
    expect(validate).toHaveBeenLastCalledWith({ email: "team@example.com" });
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

  it("renders required markers from labels and rules without changing names", async () => {
    render(
      <Form.Root>
        <Form.Field name="explicit">
          <Form.Label required>显式必填</Form.Label>
          <Form.Control>
            <input aria-required="true" />
          </Form.Control>
        </Form.Field>
        <Form.Field name="automatic" rules={[{ required: true }]}>
          <Form.Label>规则必填</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    const explicitLabel = screen.getByText("显式必填").closest("label");
    const automaticLabel = screen.getByText("规则必填").closest("label");
    expect(explicitLabel?.querySelectorAll(".uk-form__required").length).toBe(
      1,
    );
    expect(automaticLabel?.querySelectorAll(".uk-form__required").length).toBe(
      1,
    );
    expect(
      explicitLabel
        ?.querySelector(".uk-form__required")
        ?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(
      automaticLabel
        ?.querySelector(".uk-form__required")
        ?.getAttribute("aria-hidden"),
    ).toBe("true");

    const automaticInput = screen.getByRole("textbox", { name: "规则必填" });
    await waitFor(() =>
      expect(automaticInput.getAttribute("aria-required")).toBe("true"),
    );
  });

  it("only exposes label wrapping when requested and preserves associations", async () => {
    render(
      <Form.Root>
        <Form.Field
          name="wrapped"
          rules={[{ required: true, message: "长标签字段必填" }]}
        >
          <Form.Label labelWrap>
            这是一个用于验证长标签换行且不会改变可访问名称的标签
          </Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.Description>长说明仍与控件关联</Form.Description>
          <Form.ErrorMessage />
        </Form.Field>
        <Form.Field name="plain">
          <Form.Label>普通标签</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    const accessibleName =
      "这是一个用于验证长标签换行且不会改变可访问名称的标签";
    const input = screen.getByRole("textbox", { name: accessibleName });
    const label = screen.getByText(accessibleName);
    const plainLabel = screen.getByText("普通标签");

    expect(label.getAttribute("data-wrap")).toBe("true");
    expect(plainLabel.getAttribute("data-wrap")).toBeNull();
    expect(label.getAttribute("for")).toBe(input.id);
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByText("长说明仍与控件关联").id,
    );

    fireEvent.blur(input);
    expect(await screen.findByText("长标签字段必填")).not.toBeNull();
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByText("长标签字段必填").id,
    );
  });

  it("uses horizontal layout by default and supports vertical and inline layouts", () => {
    const view = render(
      <Form.Root>
        <Form.Field name="email">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );

    expect(
      view.container.querySelector("form")?.getAttribute("data-layout"),
    ).toBe("horizontal");

    view.rerender(
      <Form.Root layout="vertical">
        <Form.Field name="email">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );
    expect(
      view.container.querySelector("form")?.getAttribute("data-layout"),
    ).toBe("vertical");

    view.rerender(
      <Form.Root layout="inline">
        <Form.Field name="email">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
        </Form.Field>
      </Form.Root>,
    );
    expect(
      view.container.querySelector("form")?.getAttribute("data-layout"),
    ).toBe("inline");
  });

  it("preserves server errors and form error summaries across reset and clear", async () => {
    const ref = createRef<FormRef>();

    render(
      <Form.Root
        ref={ref}
        defaultValues={{ email: "team@example.com" }}
        onSubmit={async () => {
          throw new Error("服务器暂时不可用");
        }}
      >
        <EmailField />
        <ErrorProbe name="email" />
        <button type="submit">提交</button>
      </Form.Root>,
    );

    act(() => ref.current?.setError("email", "邮箱已被占用"));
    expect(screen.getByTestId("email-error").textContent).toBe("邮箱已被占用");

    fireEvent.click(screen.getByRole("button", { name: "提交" }));
    expect(await screen.findByText("服务器暂时不可用")).not.toBeNull();
    expect(screen.getByText("服务器暂时不可用").getAttribute("role")).toBe(
      "alert",
    );
    expect(
      (screen.getByRole("textbox", { name: "邮箱" }) as HTMLInputElement).value,
    ).toBe("team@example.com");

    act(() => ref.current?.clearErrors());
    expect(screen.getByTestId("email-error").textContent).toBe("");
    expect(screen.queryByText("服务器暂时不可用")).toBeNull();

    act(() => ref.current?.setFormError("服务端表单错误"));
    expect(screen.getByText("服务端表单错误")).not.toBeNull();
    act(() => ref.current?.reset());
    expect(screen.queryByText("服务端表单错误")).toBeNull();
  });

  it("debounces async change validation and ignores stale results", async () => {
    vi.useFakeTimers();
    const pending = new Map<string, (error: string | null) => void>();

    try {
      render(
        <Form.Root
          defaultValues={{ email: "" }}
          validateOn="change"
          validateDebounce={200}
        >
          <Form.Field
            name="email"
            rules={[
              {
                validator: (value) =>
                  new Promise<string | null>((resolve) => {
                    pending.set(String(value), resolve);
                  }),
              },
            ]}
          >
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
      fireEvent.change(input, { target: { value: "new" } });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(199);
      });
      expect(pending.size).toBe(0);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(pending.has("new")).toBe(true);
      expect(pending.has("old")).toBe(false);

      await act(async () => {
        pending.get("new")?.(null);
        await Promise.resolve();
      });
      expect(screen.queryByText("旧错误")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("runs Valibot validation at focus, change, blur, and pointerleave", async () => {
    const cases = [
      {
        trigger: "focus" as const,
        actOn: (input: HTMLElement) => fireEvent.focus(input),
      },
      {
        trigger: "change" as const,
        actOn: (input: HTMLElement) =>
          fireEvent.change(input, { target: { value: "" } }),
      },
      {
        trigger: "blur" as const,
        actOn: (input: HTMLElement) => fireEvent.blur(input),
      },
      {
        trigger: "pointerleave" as const,
        actOn: (input: HTMLElement) =>
          fireEvent.pointerLeave(input.closest(".uk-form__field"), {
            pointerType: "mouse",
          }),
      },
    ];

    for (const testCase of cases) {
      const view = render(<ResolverForm validateOn={testCase.trigger} />);
      const input = screen.getByRole("textbox", { name: "Schema 邮箱" });

      expect(screen.queryByText("Schema 邮箱必填")).toBeNull();
      testCase.actOn(input);

      expect(await screen.findByText("Schema 邮箱必填")).not.toBeNull();
      expect(input.getAttribute("aria-invalid")).toBe("true");
      view.unmount();
    }
  });

  it("updates and clears resolver errors using the latest values", async () => {
    render(<ResolverForm validateOn="change" validateDebounce={0} />);

    const input = screen.getByRole("textbox", { name: "Schema 邮箱" });
    fireEvent.change(input, { target: { value: "invalid" } });
    expect(await screen.findByText("Schema 邮箱格式无效")).not.toBeNull();

    fireEvent.change(input, { target: { value: "person@example.com" } });
    await waitFor(() =>
      expect(screen.queryByText("Schema 邮箱格式无效")).toBeNull(),
    );
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  it("keeps field-rule errors authoritative while sharing resolver timing", async () => {
    render(
      <ResolverForm
        validateOn="blur"
        validateDebounce={0}
        withFieldRules
      />,
    );

    const input = screen.getByRole("textbox", { name: "Schema 邮箱" });
    fireEvent.blur(input);

    expect(await screen.findByText("字段规则邮箱必填")).not.toBeNull();
    expect(screen.queryByText("Schema 邮箱必填")).toBeNull();

    fireEvent.change(input, { target: { value: "person@example.com" } });
    await waitFor(() =>
      expect(screen.queryByText("字段规则邮箱必填")).toBeNull(),
    );
    expect(screen.queryByText("Schema 邮箱必填")).toBeNull();
  });

  it("focuses the first schema-invalid field and reports FormErrors on submit", async () => {
    const onSubmit = vi.fn<(values: ResolverValues) => void>();
    const onSubmitFailed =
      vi.fn<(errors: FormErrors<ResolverValues>) => void>();

    render(
      <ResolverForm
        validateOn="submit"
        onSubmit={onSubmit}
        onSubmitFailed={onSubmitFailed}
      />,
    );

    const email = screen.getByRole("textbox", { name: "Schema 邮箱" });
    fireEvent.focus(email);
    fireEvent.blur(email);
    expect(screen.queryByText("Schema 邮箱必填")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Schema 提交" }));

    expect(await screen.findByText("Schema 邮箱必填")).not.toBeNull();
    expect(screen.getByText("Schema 昵称至少 2 个字符")).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
    await waitFor(() => expect(document.activeElement).toBe(email));
    expect(onSubmitFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "Schema 邮箱必填",
        nickname: "Schema 昵称至少 2 个字符",
      }),
    );
  });

  it("debounces resolver change validation and ignores stale async results", async () => {
    vi.useFakeTimers();
    const pending: Array<{
      values: ResolverValues;
      resolve: (errors: FormErrors<ResolverValues>) => void;
    }> = [];
    const validate = vi.fn(
      (values: ResolverValues) =>
        new Promise<FormErrors<ResolverValues>>((resolve) => {
          pending.push({ values, resolve });
        }),
    );

    try {
      render(
        <Form.Root<ResolverValues>
          defaultValues={{ email: "", nickname: "Seam" }}
          validateOn="change"
          validateDebounce={200}
          validate={validate}
        >
          <Form.Field name="email">
            <Form.Label>异步邮箱</Form.Label>
            <Form.Control>
              <input />
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Field>
          <Form.Field name="nickname">
            <Form.Control>
              <input aria-label="异步昵称" />
            </Form.Control>
          </Form.Field>
        </Form.Root>,
      );

      const input = screen.getByRole("textbox", { name: "异步邮箱" });
      fireEvent.change(input, { target: { value: "old" } });
      fireEvent.change(input, { target: { value: "new" } });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(199);
      });
      expect(validate).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(validate).toHaveBeenCalledTimes(1);
      expect(pending[0]?.values.email).toBe("new");

      await act(async () => {
        pending[0]?.resolve({ email: "新值无效" });
        await Promise.resolve();
      });
      expect(screen.getByText("新值无效")).not.toBeNull();

      fireEvent.change(input, { target: { value: "latest" } });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      expect(pending.length).toBe(2);

      await act(async () => {
        pending[1]?.resolve({});
        await Promise.resolve();
      });
      expect(screen.queryByText("新值无效")).toBeNull();

      await act(async () => {
        pending[0]?.resolve({ email: "过期错误" });
        await Promise.resolve();
      });
      expect(screen.queryByText("过期错误")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps resolver errors compatible with setError, reset, and clear", async () => {
    const ref = createRef<FormRef<ResolverValues>>();

    render(<ResolverForm formRef={ref} validateOn="submit" />);

    fireEvent.click(screen.getByRole("button", { name: "Schema 提交" }));
    expect(await screen.findByText("Schema 邮箱必填")).not.toBeNull();

    act(() => ref.current?.setError("email", "服务端邮箱错误"));
    expect(screen.getByText("服务端邮箱错误")).not.toBeNull();

    act(() => ref.current?.clearErrors(["email"]));
    expect(screen.queryByText("服务端邮箱错误")).toBeNull();

    act(() => ref.current?.setFormError("Resolver 服务端错误"));
    expect(screen.getByText("Resolver 服务端错误")).not.toBeNull();

    act(() => ref.current?.clear());
    expect(screen.queryByText("Schema 昵称至少 2 个字符")).toBeNull();
    expect(screen.queryByText("Resolver 服务端错误")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Schema 提交" }));
    expect(await screen.findByText("Schema 邮箱必填")).not.toBeNull();

    act(() => ref.current?.reset({ email: "person@example.com", nickname: "Seam" }));
    expect(screen.queryByText("Schema 邮箱必填")).toBeNull();
    expect(screen.queryByText("Schema 昵称至少 2 个字符")).toBeNull();
    expect(
      (screen.getByRole("textbox", { name: "Schema 邮箱" }) as HTMLInputElement)
        .value,
    ).toBe("person@example.com");
  });

  it("exposes validating and busy state without adding layout motion", async () => {
    let resolveValidation: ((error: string | null) => void) | undefined;

    render(
      <Form.Root defaultValues={{ email: "" }} validateOn="blur">
        <Form.Field
          name="email"
          rules={[
            {
              validator: () =>
                new Promise<string | null>((resolve) => {
                  resolveValidation = resolve;
                }),
            },
          ]}
        >
          <Form.Label>忙碌邮箱</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "忙碌邮箱" });
    const field = input.closest(".uk-form__field") as HTMLElement;
    fireEvent.blur(input);

    await waitFor(() => {
      expect(field.getAttribute("data-validating")).toBe("true");
      expect(input.getAttribute("aria-busy")).toBe("true");
    });

    await act(async () => {
      resolveValidation?.(null);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(field.getAttribute("data-validating")).toBeNull();
      expect(input.getAttribute("aria-busy")).toBeNull();
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
});
