import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createRef } from "react";
import * as v from "valibot";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { Form, type FormErrors, type FormRef } from "../FormComponent";
import { valibotResolver } from "../valibot";

const LoginSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("请输入邮箱"),
    v.email("请输入有效邮箱"),
  ),
  password: v.pipe(v.string(), v.minLength(8, "密码至少 8 位")),
});

const PasswordSchema = v.object({
  password: v.pipe(
    v.string(),
    v.minLength(8, "密码至少 8 位"),
    v.regex(/[0-9]/, "密码必须包含数字"),
  ),
});

describe("valibotResolver", () => {
  it("rejects values that cannot be schemas at creation time", () => {
    expect(() => valibotResolver(null as never)).toThrow(TypeError);
    expect(() => valibotResolver("schema" as never)).toThrow(TypeError);
  });

  it("types input using the schema input rather than its output", () => {
    const TransformedSchema = v.object({
      age: v.pipe(v.string(), v.transform(Number)),
    });
    const validate = valibotResolver(TransformedSchema);

    expectTypeOf(validate).parameter(0).toEqualTypeOf<{ age: string }>();
    expectTypeOf(validate).returns.resolves.toEqualTypeOf<
      FormErrors<{ age: string }>
    >();

    const acceptsOutput = () => {
      // @ts-expect-error Schema output must not be accepted as form input.
      void validate({ age: 42 });
    };
    expectTypeOf(acceptsOutput).toBeFunction();
  });

  it("returns no errors for valid values", async () => {
    const validate = valibotResolver(LoginSchema);

    await expect(
      validate({ email: "team@example.com", password: "password8" }),
    ).resolves.toEqual({});
  });

  it("maps field and nested issues to Form paths", async () => {
    const accountSchema = v.object({
      account: v.object({
        email: v.pipe(v.string(), v.email("邮箱格式错误")),
      }),
    });
    const validate = valibotResolver(accountSchema);

    await expect(validate({ account: { email: "invalid" } })).resolves.toEqual({
      "account.email": "邮箱格式错误",
    });
  });

  it("keeps the first issue for each field", async () => {
    const validate = valibotResolver(PasswordSchema);

    const errors = await validate({ password: "short" });

    expect(errors.password).toBe("密码至少 8 位");
    expect(Object.keys(errors)).toEqual(["password"]);
  });

  it("maps root issues to the reserved form key", async () => {
    const RootSchema = v.pipe(
      v.object({ email: v.string() }),
      v.check(() => false, "表单级错误"),
    );
    const validate = valibotResolver(RootSchema);

    await expect(validate({ email: "team@example.com" })).resolves.toEqual({
      _form: "表单级错误",
    });
  });

  it("supports async schemas", async () => {
    const AvailableUsernameSchema = v.objectAsync({
      username: v.pipeAsync(
        v.string(),
        v.checkAsync(async (value) => value !== "taken", "用户名已被占用"),
      ),
    });
    const validate = valibotResolver(AvailableUsernameSchema);

    await expect(validate({ username: "taken" })).resolves.toEqual({
      username: "用户名已被占用",
    });
    await expect(validate({ username: "available" })).resolves.toEqual({});
  });

  it("does not mutate input values or apply schema transformations", async () => {
    const TrimmedSchema = v.object({
      email: v.pipe(v.string(), v.trim()),
    });
    const validate = valibotResolver(TrimmedSchema);
    const values = { email: " team@example.com " };

    await expect(validate(values)).resolves.toEqual({});
    expect(values.email).toBe(" team@example.com ");
  });

  it("integrates with Form submission and focuses the first invalid field", async () => {
    const onSubmit = vi.fn<(values: Record<string, unknown>) => void>();

    render(
      <Form.Root
        defaultValues={{ email: "invalid", password: "password8" }}
        validate={valibotResolver(LoginSchema)}
        onSubmit={onSubmit}
      >
        <Form.Field name="email">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input type="email" />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
        <Form.Field name="password">
          <Form.Label>密码</Form.Label>
          <Form.Control>
            <input type="password" />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
        <button type="submit">登录</button>
      </Form.Root>,
    );

    const emailInput = screen.getByRole("textbox", { name: "邮箱" });
    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    expect(await screen.findByText("请输入有效邮箱")).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
    await waitFor(() => expect(document.activeElement).toBe(emailInput));

    fireEvent.change(emailInput, { target: { value: "team@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: "team@example.com",
        password: "password8",
      });
    });
  });

  it("blocks submit and reports reserved form errors through onSubmitFailed", async () => {
    const onSubmit = vi.fn<(values: Record<string, unknown>) => void>();
    const onSubmitFailed =
      vi.fn<(errors: Record<string, string | undefined>) => void>();
    const RootSchema = v.pipe(
      v.object({ email: v.string() }),
      v.check(() => false, "表单级错误"),
    );

    render(
      <Form.Root
        defaultValues={{ email: "team@example.com" }}
        validate={valibotResolver(RootSchema)}
        onSubmit={onSubmit}
        onSubmitFailed={onSubmitFailed}
      >
        <Form.Field name="email">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input type="email" />
          </Form.Control>
        </Form.Field>
        <button type="submit">登录</button>
      </Form.Root>,
    );

    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    await waitFor(() => {
      expect(onSubmitFailed).toHaveBeenCalledWith({
        _form: "表单级错误",
      });
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears resolver errors after values become valid", async () => {
    const ref = createRef<FormRef>();

    render(
      <Form.Root
        ref={ref}
        defaultValues={{ email: "invalid", password: "password8" }}
        validate={valibotResolver(LoginSchema)}
      >
        <Form.Field name="email">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input type="email" />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
      </Form.Root>,
    );

    const input = screen.getByRole("textbox", { name: "邮箱" });
    await act(async () => {
      expect(await ref.current?.validate()).toBe(false);
    });
    expect(screen.queryByText("请输入有效邮箱")).not.toBeNull();

    fireEvent.change(input, { target: { value: "team@example.com" } });
    await act(async () => {
      expect(await ref.current?.validate()).toBe(true);
    });

    expect(screen.queryByText("请输入有效邮箱")).toBeNull();
  });

  it("preserves field rules alongside resolver validation", async () => {
    const emailRule = vi.fn<
      (value: unknown, values: Record<string, unknown>) => string | null
    >(() => "字段规则错误");
    const onSubmitFailed =
      vi.fn<(errors: Record<string, string | undefined>) => void>();
    const MixedSchema = v.object({
      email: v.pipe(v.string(), v.nonEmpty("Schema 邮箱必填")),
      inviteCode: v.pipe(v.string(), v.nonEmpty("Schema 邀请码必填")),
    });

    render(
      <Form.Root
        defaultValues={{ email: "", inviteCode: "" }}
        validate={valibotResolver(MixedSchema)}
        onSubmitFailed={onSubmitFailed}
      >
        <Form.Field name="email" rules={[{ validator: emailRule }]}>
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input type="email" />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
        <Form.Field name="inviteCode">
          <Form.Label>邀请码</Form.Label>
          <Form.Control>
            <input />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
        <button type="submit">提交</button>
      </Form.Root>,
    );

    fireEvent.click(screen.getByRole("button", { name: "提交" }));

    await waitFor(() => {
      expect(onSubmitFailed).toHaveBeenCalledWith({
        email: "Schema 邮箱必填",
        inviteCode: "Schema 邀请码必填",
      });
    });
    expect(emailRule).toHaveBeenCalledOnce();
    expect(screen.queryByText("Schema 邮箱必填")).not.toBeNull();
    expect(screen.queryByText("Schema 邀请码必填")).not.toBeNull();
  });

  it("keeps resolver errors alongside server field and form errors", async () => {
    const ref = createRef<FormRef>();
    const onSubmitFailed =
      vi.fn<(errors: Record<string, string | undefined>) => void>();
    const ServerErrorSchema = v.object({
      email: v.string(),
      password: v.pipe(v.string(), v.nonEmpty("Schema 密码必填")),
    });

    render(
      <Form.Root
        ref={ref}
        defaultValues={{ email: "", password: "" }}
        validate={valibotResolver(ServerErrorSchema)}
        onSubmitFailed={onSubmitFailed}
      >
        <Form.Field name="email">
          <Form.Label>邮箱</Form.Label>
          <Form.Control>
            <input type="email" />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
        <Form.Field name="password">
          <Form.Label>密码</Form.Label>
          <Form.Control>
            <input type="password" />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Field>
        <button type="submit">提交</button>
      </Form.Root>,
    );

    await act(async () => {
      expect(await ref.current?.validate()).toBe(false);
    });
    act(() => {
      ref.current?.setError("email", "服务端：邮箱已被占用");
      ref.current?.setFormError("服务端：请求失败");
    });

    expect(await screen.findByText("Schema 密码必填")).not.toBeNull();
    expect(screen.queryByText("服务端：邮箱已被占用")).not.toBeNull();
    expect(screen.queryByText("服务端：请求失败")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "提交" }));

    await waitFor(() => {
      expect(onSubmitFailed).toHaveBeenCalledWith({
        email: "服务端：邮箱已被占用",
        password: "Schema 密码必填",
      });
    });
  });
});
