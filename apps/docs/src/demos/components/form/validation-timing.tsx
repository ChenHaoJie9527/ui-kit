import { useState } from "react";
import { Button, Form, Input, type FormValidationTrigger } from "seam-react";
import { valibotResolver } from "seam-react/valibot";
import * as v from "valibot";

const TimingSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("请输入邮箱"),
    v.email("请输入有效邮箱"),
  ),
  nickname: v.pipe(v.string(), v.minLength(2, "昵称至少 2 个字符")),
});

type TimingValues = v.InferInput<typeof TimingSchema>;

const triggerOptions: Array<{
  value: FormValidationTrigger;
  label: string;
  description: string;
}> = [
  { value: "blur", label: "blur（默认）", description: "离开控件时校验" },
  { value: "change", label: "change", description: "值写入后立即校验" },
  { value: "focus", label: "focus", description: "键盘或指针聚焦时校验" },
  {
    value: "pointerleave",
    label: "pointerleave",
    description: "鼠标离开字段区域时校验",
  },
  { value: "submit", label: "submit", description: "仅提交时进行首次校验" },
];

export function Demo() {
  const [validateOn, setValidateOn] = useState<FormValidationTrigger>("blur");
  const [revalidateOn, setRevalidateOn] =
    useState<Exclude<FormValidationTrigger, "submit">>("change");
  const [status, setStatus] = useState(
    "修改配置后与字段交互，观察 Valibot 错误的出现与清除。",
  );

  const activeTrigger = triggerOptions.find(
    (option) => option.value === validateOn,
  );

  return (
    <div className="flex w-full max-w-[720px] flex-col gap-5">
      <div className="rounded-[18px] border border-line bg-surface p-5 shadow-[0_18px_48px_-32px_rgb(15_23_42/0.45)] phone:p-6">
        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-2 text-[12.5px] font-medium text-ink">
            <span>首次校验 validateOn</span>
            <select
              className="min-h-9 min-w-0 rounded-lg border border-line bg-surface px-3 text-[12.5px] text-ink"
              value={validateOn}
              onChange={(event) => {
                setValidateOn(event.target.value as FormValidationTrigger);
                setStatus("已更新首次校验时机；请重新与字段交互。");
              }}
            >
              {triggerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-0 flex-col gap-2 text-[12.5px] font-medium text-ink">
            <span>错误重检 revalidateOn</span>
            <select
              className="min-h-9 min-w-0 rounded-lg border border-line bg-surface px-3 text-[12.5px] text-ink"
              value={revalidateOn}
              onChange={(event) => {
                setRevalidateOn(
                  event.target.value as Exclude<
                    FormValidationTrigger,
                    "submit"
                  >,
                );
                setStatus("已更新错误重检时机；已有错误会按新配置处理。");
              }}
            >
              {triggerOptions
                .filter((option) => option.value !== "submit")
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <Form.Root<TimingValues>
          key={`${validateOn}-${revalidateOn}`}
          layout="vertical"
          defaultValues={{ email: "", nickname: "" }}
          validateOn={validateOn}
          revalidateOn={revalidateOn}
          validateDebounce={200}
          validate={valibotResolver(TimingSchema)}
          onSubmit={() => setStatus("字段与 Valibot schema 均通过，已提交。")}
          onSubmitFailed={() =>
            setStatus("提交被校验阻止，并已聚焦第一个无效字段。")
          }
        >
          <Form.Field name="email">
            <Form.Label>工作邮箱</Form.Label>
            <Form.Control>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
              />
            </Form.Control>
            <Form.Description>
              留空或输入不完整地址可查看 schema 错误；修正后按 revalidateOn
              清除。
            </Form.Description>
            <Form.ErrorMessage />
          </Form.Field>

          <Form.Field name="nickname">
            <Form.Label>显示昵称</Form.Label>
            <Form.Control>
              <Input autoComplete="nickname" placeholder="至少 2 个字符" />
            </Form.Control>
            <Form.Description>
              字段与 Root.validate 使用同一次交互校验，不维护另一套错误状态。
            </Form.Description>
            <Form.ErrorMessage />
          </Form.Field>

          <Form.Actions>
            <Button type="submit">提交并完整校验</Button>
          </Form.Actions>
        </Form.Root>
      </div>

      <div className="rounded-xl border border-line bg-surface-2/50 px-4 py-3">
        <p className="m-0 text-[12px] leading-[1.65] text-muted">
          当前：{activeTrigger?.description}；已有错误按 {revalidateOn}{" "}
          重检。change 的异步 resolver 使用 200ms 防抖，提交始终执行完整校验。
        </p>
        <output
          className="mt-2 block min-h-5 text-[12.5px] font-medium text-ink"
          aria-live="polite"
        >
          {status}
        </output>
      </div>
    </div>
  );
}
