import { useState } from "react";
import { Button, ImageViewer, type ImageViewerImage } from "seam-react";
import {
  BulletList,
  ButtonRow,
  Callout,
  CodeBlock,
  Demo,
  Page,
  PropsTable,
  Readout,
  Section,
} from "../components/docs";

interface Photo {
  id: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
}

const PHOTOS: Photo[] = [
  {
    id: "sculpture",
    alt: "雕塑般的建筑",
    caption: "01 / 光与形态",
    width: 1200,
    height: 1500,
  },
  {
    id: "landscape",
    alt: "开阔的风景",
    caption: "02 / 一点呼吸的空间",
    width: 1500,
    height: 1000,
  },
  {
    id: "workspace",
    alt: "洒满阳光的工作间",
    caption: "03 / 创作的地方",
    width: 1500,
    height: 1200,
  },
  {
    id: "night",
    alt: "城市夜景",
    width: 1200,
    height: 900,
  },
  {
    id: "lake",
    alt: "山谷湖泊",
    width: 1500,
    height: 1000,
  },
  {
    id: "desert",
    alt: "沙漠星空",
    width: 1200,
    height: 1500,
  },
];

/** 天空渐变（垂直）：offset 与颜色对。 */
function skyGradient(stops: Array<[number, string]>): string {
  const xml = stops
    .map(
      ([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`,
    )
    .join("");

  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${xml}</linearGradient></defs>`;
}

/** 太阳 / 月亮：本体 + 柔和光晕。 */
function orb(cx: number, cy: number, r: number, color: string): string {
  return (
    `<defs><radialGradient id="orbGlow"><stop offset="0" stop-color="${color}" ` +
    `stop-opacity="0.85"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>` +
    `</radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${r * 3.2}" fill="url(#orbGlow)"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`
  );
}

/** 夜空星星。 */
function stars(items: Array<[number, number, number]>): string {
  return items
    .map(
      ([x, y, r]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="0.7"/>`,
    )
    .join("");
}

/** 按场景生成照片感的 SVG 插画：离线可用，文档站与 e2e 不依赖外网。 */
function svgPhoto(photo: Photo): string {
  const w = photo.width;
  const h = photo.height;
  const rect = `<rect width="${w}" height="${h}" fill="url(#sky)"/>`;
  let body = "";

  switch (photo.id) {
    case "sculpture": {
      // 晨光下的几何建筑
      body =
        skyGradient([
          [0, "#1e1b4b"],
          [0.55, "#4338ca"],
          [1, "#f59e0b"],
        ]) +
        rect +
        orb(600, 1150, 95, "#fbbf24") +
        `<path d="M150 ${h} L150 760 L320 690 L320 ${h} Z" fill="#1e1b4b"/>` +
        `<rect x="430" y="620" width="340" height="${h - 620}" fill="#17123a"/>` +
        `<path d="M870 ${h} L870 780 L990 860 L990 ${h} Z" fill="#1e1b4b"/>` +
        `<rect x="660" y="640" width="24" height="86" fill="#fbbf24" opacity="0.85"/>` +
        `<rect x="700" y="640" width="24" height="54" fill="#fbbf24" opacity="0.85"/>`;
      break;
    }

    case "landscape": {
      // 日落山峦
      body =
        skyGradient([
          [0, "#f97316"],
          [0.6, "#fbbf24"],
          [1, "#fde68a"],
        ]) +
        rect +
        orb(750, 620, 72, "#fff7ed") +
        `<path d="M0 620 L250 520 L480 640 L750 500 L1050 650 L1300 530 L1500 620 L1500 ${h} L0 ${h} Z" fill="#9a3412"/>` +
        `<path d="M0 700 L300 610 L600 720 L900 580 L1250 700 L1500 620 L1500 ${h} L0 ${h} Z" fill="#7c2d12"/>` +
        `<path d="M0 780 L350 700 L700 810 L1100 680 L1500 790 L1500 ${h} L0 ${h} Z" fill="#431407"/>`;
      break;
    }

    case "workspace": {
      // 暖色工作间：大窗 + 台灯光晕
      body =
        skyGradient([
          [0, "#fbbf24"],
          [0.5, "#f59e0b"],
          [1, "#b45309"],
        ]) +
        rect +
        `<defs><radialGradient id="windowGlow"><stop offset="0" stop-color="#fef3c7" ` +
        `stop-opacity="0.95"/><stop offset="1" stop-color="#fef3c7" stop-opacity="0"/></radialGradient></defs>` +
        `<circle cx="760" cy="430" r="300" fill="url(#windowGlow)"/>` +
        `<rect x="560" y="260" width="400" height="330" fill="#78350f"/>` +
        `<rect x="560" y="260" width="400" height="330" fill="url(#windowGlow)" opacity="0.9"/>` +
        `<rect x="620" y="260" width="280" height="16" fill="#78350f"/>` +
        `<rect x="560" y="430" width="400" height="16" fill="#78350f"/>` +
        `<rect x="760" y="260" width="16" height="330" fill="#78350f"/>` +
        orb(980, 780, 130, "#fde68a") +
        `<rect x="960" y="880" width="40" height="14" fill="#431407"/>` +
        `<rect x="980" y="894" width="180" height="12" fill="#431407"/>` +
        `<rect x="0" y="${h - 90}" width="${w}" height="90" fill="#451a03"/>`;
      break;
    }

    case "night": {
      // 城市夜景
      body =
        skyGradient([
          [0, "#0b1026"],
          [0.6, "#1e1b4b"],
          [1, "#312e81"],
        ]) +
        rect +
        stars([
          [140, 120, 2],
          [260, 300, 1.6],
          [420, 90, 2.4],
          [610, 180, 1.4],
          [680, 340, 2],
          [980, 90, 1.6],
          [1050, 250, 2.2],
          [1160, 420, 1.4],
        ]) +
        orb(880, 220, 46, "#fef3c7") +
        `<rect x="0" y="540" width="150" height="${h - 540}" fill="#0f1226"/>` +
        `<rect x="150" y="480" width="180" height="${h - 480}" fill="#131740"/>` +
        `<rect x="330" y="580" width="140" height="${h - 580}" fill="#0f1226"/>` +
        `<rect x="470" y="500" width="210" height="${h - 500}" fill="#131740"/>` +
        `<rect x="680" y="560" width="160" height="${h - 560}" fill="#0f1226"/>` +
        `<rect x="840" y="520" width="180" height="${h - 520}" fill="#131740"/>` +
        `<rect x="1020" y="580" width="180" height="${h - 580}" fill="#0f1226"/>` +
        `<rect x="200" y="620" width="12" height="18" fill="#fbbf24" opacity="0.9"/>` +
        `<rect x="240" y="560" width="12" height="18" fill="#fbbf24" opacity="0.9"/>` +
        `<rect x="520" y="620" width="12" height="18" fill="#fbbf24" opacity="0.9"/>` +
        `<rect x="560" y="560" width="12" height="18" fill="#fbbf24" opacity="0.9"/>` +
        `<rect x="900" y="620" width="12" height="18" fill="#fbbf24" opacity="0.9"/>` +
        `<rect x="940" y="560" width="12" height="18" fill="#fbbf24" opacity="0.9"/>` +
        `<rect x="1080" y="620" width="12" height="18" fill="#fbbf24" opacity="0.9"/>`;
      break;
    }

    case "lake": {
      // 山谷湖泊倒影
      const horizon = 470;
      body =
        skyGradient([
          [0, "#0d9488"],
          [0.7, "#2dd4bf"],
          [1, "#f0fdfa"],
        ]) +
        rect +
        orb(750, 350, 58, "#ffffff") +
        `<path d="M0 ${horizon} L240 ${horizon - 130} L470 ${horizon - 20} L760 ${horizon - 160} L1080 ${horizon} L1320 ${horizon - 90} L1500 ${horizon} Z" fill="#115e59"/>` +
        `<rect x="0" y="${horizon}" width="${w}" height="${h - horizon}" fill="#0f766e"/>` +
        `<path d="M0 ${horizon + 90} L240 ${horizon + 220} L470 ${horizon + 110} L760 ${horizon + 250} L1080 ${horizon + 90} L1320 ${horizon + 180} L1500 ${horizon + 90} Z" fill="#134e4a"/>` +
        `<rect x="120" y="${horizon + 40}" width="340" height="4" fill="#ccfbf1" opacity="0.5"/>` +
        `<rect x="620" y="${horizon + 90}" width="300" height="4" fill="#ccfbf1" opacity="0.4"/>` +
        `<rect x="1020" y="${horizon + 50}" width="360" height="4" fill="#ccfbf1" opacity="0.5"/>`;
      break;
    }

    case "desert": {
      // 沙漠日落与沙丘
      body =
        skyGradient([
          [0, "#dc2626"],
          [0.55, "#f97316"],
          [1, "#fbbf24"],
        ]) +
        rect +
        orb(600, 980, 90, "#fff7ed") +
        `<path d="M0 ${h} L0 900 C300 840 480 980 760 920 C1040 860 1260 940 1500 880 L1500 ${h} Z" fill="#92400e"/>` +
        `<path d="M0 ${h} L0 1040 C360 980 620 1120 940 1060 C1200 1010 1350 1080 1500 1040 L1500 ${h} Z" fill="#78350f"/>`;
      break;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const IMAGES: ImageViewerImage[] = PHOTOS.map((photo) => ({
  id: photo.id,
  src: svgPhoto(photo),
  alt: photo.alt,
  width: photo.width,
  height: photo.height,
  caption: photo.caption,
}));

function BasicDemo() {
  return (
    <div className="w-full max-w-xl">
      <ImageViewer images={IMAGES} label="收集的照片">
        <ImageViewer.Gallery className="grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          {IMAGES.map((image) => (
            <ImageViewer.Thumbnail key={image.id} imageId={image.id} />
          ))}
        </ImageViewer.Gallery>
        <ImageViewer.Content />
      </ImageViewer>
      <p className="mt-4 text-xs text-muted">
        点开一张照片，用方向键或滑动浏览，点击空白处关闭。
      </p>
    </div>
  );
}

function CustomFooterDemo() {
  return (
    <ImageViewer images={IMAGES} label="自定义说明">
      <ImageViewer.Gallery className="grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {IMAGES.map((image) => (
          <ImageViewer.Thumbnail key={image.id} imageId={image.id} />
        ))}
      </ImageViewer.Gallery>
      <ImageViewer.Content
        header={
          <>
            <ImageViewer.Counter />
            <ImageViewer.Close />
          </>
        }
      >
        <>
          <ImageViewer.Previous />
          <span className="text-sm text-white">按说明浏览</span>
          <ImageViewer.Next />
        </>
      </ImageViewer.Content>
    </ImageViewer>
  );
}

function ControlledDemo() {
  const [value, setValue] = useState<string | null>(null);

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <ImageViewer
        images={IMAGES}
        value={value}
        onValueChange={setValue}
        label="受控画廊"
      >
        <ImageViewer.Gallery className="grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          {IMAGES.map((image) => (
            <ImageViewer.Thumbnail key={image.id} imageId={image.id} />
          ))}
        </ImageViewer.Gallery>
        <ImageViewer.Content />
      </ImageViewer>
      <ButtonRow>
        <Button variant="outline" size="sm" onClick={() => setValue(null)}>
          关闭
        </Button>
        <Readout label="value" value={value === null ? "null" : value} />
      </ButtonRow>
    </div>
  );
}

export function ImageViewerPage() {
  return (
    <Page
      kind="组件"
      title="Image Viewer"
      description="图片画廊与形态变换灯箱。缩略图点击后从所在位置形变为全屏查看器，支持方向键 / 触控滑动切换、计数与说明、2x 缩放与平移；模态语义由原生 dialog 承载。"
      tags={["画廊", "灯箱", "共享布局", "受控", "缩放"]}
    >
      <Section title="引入">
        <CodeBlock
          code={'import { ImageViewer, useImageViewer } from "seam-react";'}
        />
      </Section>

      <Section
        title="基础用法"
        description="默认布局自动渲染画廊与灯箱：`Gallery` 里的每个 `Thumbnail` 打开灯箱，`Content` 承载查看器。"
      >
        <Demo
          label="基础用法"
          code={`const IMAGES = [
  { id: "one", src: "photo-1.jpg", alt: "第一张", width: 1200, height: 1500 },
  { id: "two", src: "photo-2.jpg", alt: "第二张", width: 1500, height: 1000 },
];

<ImageViewer images={IMAGES} label="收集的照片">
  <ImageViewer.Gallery className="grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
    {IMAGES.map((image) => (
      <ImageViewer.Thumbnail key={image.id} imageId={image.id} />
    ))}
  </ImageViewer.Gallery>
  <ImageViewer.Content />
</ImageViewer>`}
        >
          <BasicDemo />
        </Demo>
      </Section>

      <Section
        title="组合式布局"
        description="`Content` 的 `header` 与 `children` 分别覆盖顶部栏（默认计数 + 关闭）和底部栏（默认导航 + 说明）。"
      >
        <Demo
          label="组合式布局"
          code={`<ImageViewer images={IMAGES} label="自定义说明">
  <ImageViewer.Gallery className="grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
    {IMAGES.map((image) => (
      <ImageViewer.Thumbnail key={image.id} imageId={image.id} />
    ))}
  </ImageViewer.Gallery>
  <ImageViewer.Content
    header={
      <>
        <ImageViewer.Counter />
        <ImageViewer.Close />
      </>
    }
  >
    <>
      <ImageViewer.Previous />
      <span className="text-sm text-white">按说明浏览</span>
      <ImageViewer.Next />
    </>
  </ImageViewer.Content>
</ImageViewer>`}
        >
          <CustomFooterDemo />
        </Demo>
      </Section>

      <Section
        title="受控"
        description="`value` / `onValueChange` 把选中状态交给外部；`useImageViewer()` 在自定义控件里读取同一份状态。"
      >
        <Demo
          label="受控"
          code={`const [value, setValue] = useState<string | null>(null);

<ImageViewer images={IMAGES} value={value} onValueChange={setValue}>
  <ImageViewer.Gallery className="grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
    {IMAGES.map((image) => (
      <ImageViewer.Thumbnail key={image.id} imageId={image.id} />
    ))}
  </ImageViewer.Gallery>
  <ImageViewer.Content />
</ImageViewer>`}
        >
          <ControlledDemo />
        </Demo>
      </Section>

      <Section
        title="API"
        description="`ImageViewer` 是 Root，语义部件挂在命名空间下；不使用子组件时省略 children 即渲染默认画廊与灯箱。"
      >
        <PropsTable
          rows={[
            {
              name: "images",
              type: "ImageViewerImage[]",
              required: true,
              description:
                "图片数据；id 唯一，width / height 为正数（形变依赖宽高比）。",
            },
            {
              name: "value",
              type: "string | null",
              description: "受控选中图片 id；null 表示关闭。",
            },
            {
              name: "defaultValue",
              type: "string | null",
              defaultValue: "null",
              description: "非受控模式下的初始选中 id。",
            },
            {
              name: "onValueChange",
              type: "(id: string | null) => void",
              description: "选中变化回调，受控与非受控都会触发。",
            },
            {
              name: "label",
              type: "string",
              description: "画廊与灯箱的可访问名称。",
            },
            {
              name: "className",
              type: "string",
              description: "默认画廊布局的容器类名。",
            },
            {
              name: "thumbnailClassName",
              type: "string",
              description: "默认画廊里所有缩略图的类名。",
            },
            {
              name: "renderCaption",
              type: "(image) => ReactNode",
              description: "自定义灯箱说明文字。",
            },
            {
              name: "children",
              type: "ReactNode",
              description: "自定义画廊与灯箱组合；省略时使用默认布局。",
            },
            {
              name: "labels",
              type: "Partial<ImageViewerLabels>",
              description: "覆盖内置中文文案。",
            },
          ]}
        />
      </Section>

      <Section title="子部件">
        <PropsTable
          firstColumnLabel="部件"
          rows={[
            {
              name: "ImageViewer.Gallery",
              type: "section",
              description: "网格容器，带画廊的可访问名称。",
            },
            {
              name: "ImageViewer.Thumbnail",
              type: "button",
              description: "打开灯箱的缩略图；接受 imageId / imageClassName。",
            },
            {
              name: "ImageViewer.Content",
              type: "dialog",
              description:
                "灯箱模态层；接受 header（顶部栏）与 children（底部栏）。",
            },
            {
              name: "ImageViewer.Counter",
              type: "span",
              description: "aria-live 计数，如「2 / 6」。",
            },
            {
              name: "ImageViewer.Caption",
              type: "div",
              description: "图片说明；缺 caption 时回退 alt。",
            },
            {
              name: "ImageViewer.Close",
              type: "button",
              description: "关闭灯箱。",
            },
            {
              name: "ImageViewer.Previous / Next",
              type: "button",
              description: "切换图片；到达边界自动禁用。",
            },
          ]}
        />
      </Section>

      <Section
        title="键盘与无障碍"
        description="灯箱是模态 dialog：打开时焦点落入控件，Tab 在内部循环，Esc 关闭并恢复到打开前的缩略图。"
      >
        <BulletList
          items={[
            <>方向键 ← / → 切换图片；Esc 关闭。</>,
            <>放大按钮聚焦后，方向键以 40px 步进平移；放大时也可拖拽图片。</>,
            <>
              计数器与说明为 aria-live 区域，加载失败用 output 状态元素播报。
            </>,
            <>reduced-motion 下关闭形变与滑动，切换改为透明度交叉淡化。</>,
            <>点击灯箱空白处关闭；图片与说明文字不受影响。</>,
          ]}
        />
      </Section>

      <Section title="注意事项">
        <Callout tone="info" title="图片尺寸">
          `width` / `height`
          必填且为正数：形变期间缩略图与灯箱共用同一宽高比，缺尺寸时无法稳定
          morph。
        </Callout>
      </Section>
    </Page>
  );
}
