import { useEffect, useState } from "react";
import { Button, Progress } from "seam-react";
import {
  BulletList,
  Callout,
  CodeBlock,
  Demo,
  Page,
  PropsTable,
  Readout,
  Section,
} from "../components/docs";

// 根据进度返回状态文案
function getStatusMessage(progress: number) {
  if (progress < 5) return "正在初始化下载...";
  if (progress < 15) return "正在准备环境...";
  if (progress < 25) return "正在连接服务器...";
  if (progress < 35) return "正在校验权限...";
  if (progress < 50) return "正在下载核心文件...";
  if (progress < 65) return "正在下载资源文件...";
  if (progress < 80) return "正在下载依赖...";
  if (progress < 90) return "正在解压文件...";
  if (progress < 95) return "正在校验完整性...";
  if (progress < 100) return "正在完成安装...";
  return "下载完成！";
}

function DownloadDemo() {
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    // 模拟下载
    const downloadTimer = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          return 0; // 循环演示
        }
        return prev + Math.random() * 3 + 1; // 每次随机增加 1-4
      });
    }, 150);

    return () => {
      clearInterval(downloadTimer);
    };
  }, []);

  return (
    <div className="w-full max-w-xs">
      <Progress value={downloadProgress}>
        <Progress.Label>Workspace Setup</Progress.Label>
        <Progress.Value />
        <Progress.Description>
          {getStatusMessage(downloadProgress)}
        </Progress.Description>
      </Progress>
    </div>
  );
}

function RingDemo() {
  return (
    <div className="flex items-center gap-10">
      <Progress variant="circle" value={72}>
        <Progress.Label>存储占用</Progress.Label>
        <Progress.Value />
      </Progress>
      <Progress variant="circle" value={null}>
        <Progress.Label>正在加载</Progress.Label>
        <Progress.Value />
      </Progress>
    </div>
  );
}

function DialDemo() {
  const [volume, setVolume] = useState(60);

  return (
    <div className="flex items-center gap-10">
      <Progress
        variant="circle"
        interactive
        value={volume}
        onValueChange={setVolume}
      >
        <Progress.Label>音量</Progress.Label>
        <Progress.Value />
      </Progress>
      <Readout label="当前值" value={`${volume}%`} />
    </div>
  );
}

function RingSizeDemo() {
  return (
    <div className="flex items-center gap-10">
      <Progress variant="circle" value={35} size={96}>
        <Progress.Label>小尺寸</Progress.Label>
        <Progress.Value />
      </Progress>
      <Progress variant="circle" value={64} size={200} thickness={16}>
        <Progress.Label>大尺寸</Progress.Label>
        <Progress.Value />
      </Progress>
    </div>
  );
}

function InteractiveDemo() {
  const [progress, setProgress] = useState(45);

  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <Progress interactive value={progress} onValueChange={setProgress}>
        <Progress.Label>视频导出</Progress.Label>
        <Progress.Value />
      </Progress>
      <Readout label="当前值" value={`${progress}%`} />
    </div>
  );
}

function UncontrolledInteractiveDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <Progress interactive defaultValue={60}>
        <Progress.Label>播放进度</Progress.Label>
        <Progress.Value />
      </Progress>
      <p className="m-0 text-xs text-muted-foreground">
        拖动圆点、点击轨道或使用方向键调整；不传 value 时组件自己维护状态。
      </p>
    </div>
  );
}

function StaticDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-5">
      <Progress value={35}>
        <Progress.Label>编译中</Progress.Label>
        <Progress.Value />
      </Progress>
      <Progress value={68}>
        <Progress.Label>上传中</Progress.Label>
        <Progress.Value />
      </Progress>
      <Progress value={100}>
        <Progress.Label>已完成</Progress.Label>
        <Progress.Value />
      </Progress>
    </div>
  );
}

function IndeterminateDemo() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <Progress value={loading ? null : 82}>
        <Progress.Label>正在扫描依赖</Progress.Label>
        <Progress.Value />
        <Progress.Description>
          {loading ? "正在分析项目结构..." : "扫描完成，正在打包产物"}
        </Progress.Description>
      </Progress>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setLoading((prev) => !prev)}
        >
          {loading ? "切到确定进度" : "切到不确定进度"}
        </Button>
        <Readout label="模式" value={loading ? "不确定进度" : "确定进度"} />
      </div>
    </div>
  );
}

function RangeDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-5">
      <Progress value={50} min={25} max={75}>
        <Progress.Label>范围 25–75，当前 50</Progress.Label>
        <Progress.Value />
      </Progress>
      <Progress value={12} min={0} max={20}>
        <Progress.Label>范围 0–20，当前 12</Progress.Label>
        <Progress.Value format={(value, min, max) => `${value} / ${max} 份`} />
      </Progress>
    </div>
  );
}

export function ProgressPage() {
  return (
    <Page
      kind="组件"
      title="Progress"
      description="进度条。progressbar 语义根组件 + Progress.Label / Progress.Value / Progress.Description 组合式部件；条形与圆形（圆环 / 旋钮）两种变体，interactive 模式支持点击 / 拖拽 / 键盘调整，填充线性过渡，不确定进度有独立循环动画。"
      tags={[
        "progressbar",
        "slider 交互",
        "条形 / 圆形",
        "受控",
        "组合式 API",
        "不确定进度",
        "动态文案",
      ]}
    >
      <Section title="引入">
        <CodeBlock code={'import { Progress } from "seam-react";'} />
      </Section>

      <Section
        title="受控用法"
        description="value 由外部驱动，每次更新填充条都会线性过渡到新值；Progress.Description 动态显示进行中的状态文案（role=status，变化时读屏自动播报）。"
      >
        <Demo
          code={`// 根据进度返回状态文案
function getStatusMessage(progress: number) {
  if (progress < 5) return "正在初始化下载..."
  if (progress < 15) return "正在准备环境..."
  if (progress < 25) return "正在连接服务器..."
  if (progress < 35) return "正在校验权限..."
  if (progress < 50) return "正在下载核心文件..."
  if (progress < 65) return "正在下载资源文件..."
  if (progress < 80) return "正在下载依赖..."
  if (progress < 90) return "正在解压文件..."
  if (progress < 95) return "正在校验完整性..."
  if (progress < 100) return "正在完成安装..."
  return "下载完成！"
}

function DownloadProgress() {
  const [downloadProgress, setDownloadProgress] = useState(0)

  useEffect(() => {
    // 模拟下载
    const downloadTimer = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          return 0 // 循环演示
        }
        return prev + Math.random() * 3 + 1 // 每次随机增加 1-4
      })
    }, 150)

    return () => {
      clearInterval(downloadTimer)
    }
  }, [])

  return (
    <div className="w-full max-w-xs">
      <Progress value={downloadProgress}>
        <Progress.Label>Workspace Setup</Progress.Label>
        <Progress.Value />
        <Progress.Description>
          {getStatusMessage(downloadProgress)}
        </Progress.Description>
      </Progress>
    </div>
  )
}`}
        >
          <DownloadDemo />
        </Demo>
      </Section>

      <Section
        title="交互用法"
        description="interactive 模式下可以点击轨道跳转、拖拽圆点连续调整，或用键盘微调；填充与圆点跟随 value 线性过渡。交互时语义切换为原生 slider（progressbar 按 ARIA 规定只读），焦点环绘制在轨道上。"
      >
        <Demo
          code={`const [progress, setProgress] = useState(45)

<Progress interactive value={progress} onValueChange={setProgress}>
  <Progress.Label>视频导出</Progress.Label>
  <Progress.Value />
</Progress>`}
        >
          <InteractiveDemo />
        </Demo>
        <Demo
          code={`<Progress interactive defaultValue={60}>
  <Progress.Label>播放进度</Progress.Label>
  <Progress.Value />
</Progress>`}
        >
          <UncontrolledInteractiveDemo />
        </Demo>
      </Section>

      <Section
        title="圆形进度"
        description="variant=circle 渲染 SVG 圆环，从 12 点顺时针填充，数值居中显示在环内；value 为 null 时圆环旋转表示不确定进度。"
      >
        <Demo
          code={`<Progress variant="circle" value={72}>
  <Progress.Label>存储占用</Progress.Label>
  <Progress.Value />
</Progress>

<Progress variant="circle" value={null}>
  <Progress.Label>正在加载</Progress.Label>
  <Progress.Value />
</Progress>`}
        >
          <RingDemo />
        </Demo>
        <Demo
          code={`<Progress
  variant="circle"
  interactive
  value={volume}
  onValueChange={setVolume}
>
  <Progress.Label>音量</Progress.Label>
  <Progress.Value />
</Progress>`}
        >
          <DialDemo />
        </Demo>
        <Demo
          code={`<Progress variant="circle" value={35} size={96}>
  <Progress.Label>小尺寸</Progress.Label>
  <Progress.Value />
</Progress>

<Progress variant="circle" value={64} size={200} thickness={16}>
  <Progress.Label>大尺寸</Progress.Label>
  <Progress.Value />
</Progress>`}
        >
          <RingSizeDemo />
        </Demo>
      </Section>

      <Section
        title="静态进度"
        description="只传固定 value 即可渲染；Label 与 Value 在标签行左右分布，完成时展示 100%。"
      >
        <Demo
          code={`<Progress value={35}>
  <Progress.Label>编译中</Progress.Label>
  <Progress.Value />
</Progress>

<Progress value={68}>
  <Progress.Label>上传中</Progress.Label>
  <Progress.Value />
</Progress>

<Progress value={100}>
  <Progress.Label>已完成</Progress.Label>
  <Progress.Value />
</Progress>`}
        >
          <StaticDemo />
        </Demo>
      </Section>

      <Section
        title="不确定进度"
        description="value 传 null 时渲染不确定进度：填充块循环滑过轨道，表示任务进行中但总量未知；屏幕阅读器不再播报数值。"
      >
        <Demo
          code={`<Progress value={loading ? null : 82}>
  <Progress.Label>正在扫描依赖</Progress.Label>
  <Progress.Value />
  <Progress.Description>
    {loading ? "正在分析项目结构..." : "扫描完成，正在打包产物"}
  </Progress.Description>
</Progress>`}
        >
          <IndeterminateDemo />
        </Demo>
      </Section>

      <Section
        title="范围与自定义显示"
        description="min / max 支持非 0–100 的范围；Progress.Value 的 format 可以完全接管值文本。"
      >
        <Demo
          code={`<Progress value={50} min={25} max={75}>
  <Progress.Label>范围 25–75，当前 50</Progress.Label>
  <Progress.Value />
</Progress>

<Progress value={12} min={0} max={20}>
  <Progress.Label>范围 0–20，当前 12</Progress.Label>
  <Progress.Value
    format={(value, min, max) => \`\${value} / \${max} 份\`}
  />
</Progress>`}
        >
          <RangeDemo />
        </Demo>
      </Section>

      <Section title="API">
        <PropsTable
          rows={[
            {
              name: "variant",
              type: '"line" | "circle"',
              defaultValue: '"line"',
              description: "外观变体：条形轨道或圆形圆环。",
            },
            {
              name: "size",
              type: "number",
              defaultValue: "120",
              description: "圆形变体的直径（px）。",
            },
            {
              name: "thickness",
              type: "number",
              description: "圆形变体的环粗细（px），默认按直径 8% 计算。",
            },
            {
              name: "interactive",
              type: "boolean",
              defaultValue: "false",
              description:
                "开启交互：切换为原生 slider，支持点击、拖拽与键盘调整；圆形变体变为旋钮。",
            },
            {
              name: "value",
              type: "number | null",
              description:
                "受控值。只读模式必填（null 为不确定进度）；交互模式可选。",
            },
            {
              name: "defaultValue",
              type: "number",
              description: "交互模式非受控的初始值。",
            },
            {
              name: "onValueChange",
              type: "(value: number) => void",
              description:
                "交互后的回调（点击 / 拖拽 / 键盘），受控与非受控都会触发。",
            },
            {
              name: "step",
              type: "number",
              defaultValue: "1",
              description: "交互模式下键盘与拖拽的步长。",
            },
            {
              name: "disabled",
              type: "boolean",
              defaultValue: "false",
              description: "交互模式下禁用点击、拖拽与键盘。",
            },
            {
              name: "min",
              type: "number",
              defaultValue: "0",
              description: "范围下限。",
            },
            {
              name: "max",
              type: "number",
              defaultValue: "100",
              description: "范围上限。",
            },
            {
              name: "className",
              type: "string",
              description: "合并到根元素。",
            },
            {
              name: "...rest",
              type: 'Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "onChange">',
              description: "其余原生属性透传到根元素，包括 aria-label 等。",
            },
          ]}
        />
        <PropsTable
          rows={[
            {
              name: "Progress.Label",
              type: "children: ReactNode",
              description: "任务名称，自动通过 aria-labelledby 与进度条关联。",
            },
            {
              name: "Progress.Value",
              type: "format?: (value, min, max) => string",
              description: "值文本；不传时显示占范围的百分比（如 42%）。",
            },
            {
              name: "Progress.Description",
              type: "children: ReactNode",
              description:
                "进行中的动态状态文案，渲染为 role=status 放在轨道下方。",
            },
          ]}
        />
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            "只读模式是 role=progressbar 并暴露 aria-valuemin / aria-valuemax / aria-valuenow 与 aria-valuetext（百分比），条形与圆形一致。",
            "交互模式切换为原生 input type=range（隐式 slider 语义）：键盘方向键、PageUp / PageDown、Home / End 都能调整，焦点环绘制在轨道 / 圆环上。",
            "Progress.Label 通过 aria-labelledby 与进度条 / 滑块关联，读屏播报任务名称。",
            "Progress.Description 是独立的 role=status 区域（原生 <output>），文案变化时播报且不与数值播报冲突。",
            "不确定进度时省略 aria-valuenow，避免播报不存在的数值；交互模式不支持不确定进度。",
            "拖拽圆点 / 旋钮只在可悬停的精指针设备上 hover 显现，触摸设备常驻；disabled 时轨道变暗并阻止所有交互。",
            "填充过渡用线性缓动；prefers-reduced-motion 下圆点与旋钮去掉缩放、不确定进度只保留透明度脉动。",
          ]}
        />
      </Section>

      <Callout>
        平铺导出的 <code>ProgressLabel</code> / <code>ProgressValue</code> /{" "}
        <code>ProgressDescription</code> 与复合写法等价，可以按喜好选用。
      </Callout>
    </Page>
  );
}
