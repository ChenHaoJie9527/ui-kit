import { useState } from "react";
import { Switch } from "@chenhaojie9527/ui-kit";
import {
  BulletList,
  Demo,
  Page,
  PropsTable,
  Readout,
  Section,
  CodeBlock,
} from "../components/docs";

function BasicDemo() {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="flex max-w-[420px] flex-col gap-4">
      <Switch checked={enabled} onCheckedChange={setEnabled}>
        启用实验特性
      </Switch>
      <Readout label="当前状态" value={enabled ? "开启" : "关闭"} />
    </div>
  );
}

function GroupDemo() {
  const [settings, setSettings] = useState({
    replies: true,
    deploy: true,
    invoice: false,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ul className="m-0 flex list-none flex-col gap-4 [&>li]:flex [&>li]:flex-col [&>li]:gap-[3px] [&>li>p]:m-0 [&>li>p]:ml-[52px] [&>li>p]:text-[12.5px] [&>li>p]:text-muted">
      <li>
        <Switch
          checked={settings.replies}
          onCheckedChange={() => toggle("replies")}
        >
          有人回复时通知我
        </Switch>
        <p>来自你参与过的讨论。</p>
      </li>
      <li>
        <Switch
          checked={settings.deploy}
          onCheckedChange={() => toggle("deploy")}
        >
          部署失败时立即通知
        </Switch>
        <p>包括周末，始终发送。</p>
      </li>
      <li>
        <Switch
          checked={settings.invoice}
          onCheckedChange={() => toggle("invoice")}
        >
          每月账单就绪提醒
        </Switch>
        <p>每月 1 日发送。</p>
      </li>
    </ul>
  );
}

function StatesDemo() {
  return (
    <div className="flex max-w-[420px] flex-col gap-4">
      <Switch defaultChecked>未受控，默认开启</Switch>
      <Switch defaultChecked disabled>
        已禁用
      </Switch>
    </div>
  );
}

export function SwitchPage() {
  return (
    <Page
      kind="组件"
      title="Switch"
      description="开关。底层是原生 checkbox 并加上 role=switch，因此表单提交、键盘操作和屏幕阅读器语义都是免费的。"
      tags={["原生 checkbox", "受控 / 非受控", "role=switch"]}
    >
      <Section title="引入">
        <CodeBlock code={'import { Switch } from "@chenhaojie9527/ui-kit";'} />
      </Section>

      <Section
        title="受控用法"
        description="传入 checked 即为受控；状态变化通过 onCheckedChange 通知，而不是原生 onChange。"
      >
        <Demo
          code={`const [enabled, setEnabled] = useState(true);

<Switch checked={enabled} onCheckedChange={setEnabled}>
  启用实验特性
</Switch>`}
        >
          <BasicDemo />
        </Demo>
      </Section>

      <Section
        title="非受控用法"
        description="只给 defaultChecked 时组件自己维护状态，适合不需要读取值的场景。"
      >
        <Demo
          code={`<Switch defaultChecked>默认开启</Switch>
<Switch defaultChecked disabled>已禁用</Switch>`}
        >
          <StatesDemo />
        </Demo>
      </Section>

      <Section
        title="设置列表"
        description="真实表单里通常需要标题 + 说明的组合；Switch 的 children 就是标签，说明文字放在外面即可。"
      >
        <Demo
          code={`<Switch
  checked={settings.replies}
  onCheckedChange={() => toggle("replies")}
>
  有人回复时通知我
</Switch>`}
        >
          <GroupDemo />
        </Demo>
      </Section>

      <Section title="API">
        <PropsTable
          rows={[
            {
              name: "checked",
              type: "boolean",
              description: "受控状态。传入即进入受控模式。",
            },
            {
              name: "defaultChecked",
              type: "boolean",
              defaultValue: "false",
              description: "非受控模式的初始状态。",
            },
            {
              name: "onCheckedChange",
              type: "(checked: boolean) => void",
              description: "状态变化回调，受控与非受控都会触发。",
            },
            {
              name: "disabled",
              type: "boolean",
              defaultValue: "false",
              description: "禁用开关。",
            },
            {
              name: "children",
              type: "ReactNode",
              description: "显示在开关右侧的标签文本。",
            },
            {
              name: "...rest",
              type: 'Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "checked" | "onChange">',
              description: "其余原生属性透传到内部 input。",
            },
          ]}
        />
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            "原生 checkbox 自带 Space 切换与表单集成，role=switch 让读屏播报为开关。",
            "aria-checked 与 checked 同步，焦点环绘制在视觉轨道上。",
            "禁用时整个 label 降低透明度并阻止点击。",
          ]}
        />
      </Section>
    </Page>
  );
}
