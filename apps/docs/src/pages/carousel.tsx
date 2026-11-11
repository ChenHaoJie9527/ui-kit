/* eslint-disable jsx-a11y/prefer-tag-over-role -- 自定义进度条与缩略图按钮组使用 role 比原生 progress/fieldset 更贴合外观与语义。 */
import { useEffect, useState } from "react";
import { Button, Carousel, useCarousel, type CarouselApi } from "seam-react";
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

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  note: string;
  colors: [string, string];
}

interface Story {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  readingTime: string;
  colors: [string, string];
  featured?: boolean;
}

interface Quote {
  id: string;
  quote: string;
  name: string;
  role: string;
  initials: string;
}

interface Step {
  id: string;
  title: string;
  body: string;
  hint: string;
}

interface AgendaItem {
  id: string;
  time: string;
  title: string;
  place: string;
}

interface GalleryItem {
  id: string;
  title: string;
  location: string;
  colors: [string, string];
}

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  tag: string;
  colors: [string, string];
}

interface SearchResult {
  id: string;
  kind: string;
  title: string;
  snippet: string;
  meta: string;
}

const PRODUCTS: Product[] = [
  {
    id: "linen",
    name: "水洗亚麻抱枕",
    category: "New",
    price: "¥ 320",
    note: "包邮 · 7 天退换",
    colors: ["#e0e7ff", "#c7d2fe"],
  },
  {
    id: "lamp",
    name: "黄铜台灯",
    category: "Best seller",
    price: "¥ 480",
    note: "包邮 · 7 天退换",
    colors: ["#e0f2fe", "#bae6fd"],
  },
  {
    id: "rug",
    name: "手工羊毛地毯",
    category: "Limited",
    price: "¥ 920",
    note: "包邮 · 7 天退换",
    colors: ["#dcfce7", "#bbf7d0"],
  },
  {
    id: "vase",
    name: "手作陶土花瓶",
    category: "New",
    price: "¥ 240",
    note: "包邮 · 7 天退换",
    colors: ["#fce7f3", "#fbcfe8"],
  },
];

const STORIES: Story[] = [
  {
    id: "story-token",
    category: "专题",
    title: "把设计 token 当成产品来维护",
    excerpt:
      "语义变量不是命名游戏；它决定了组件在主题、密度和品牌之间能否稳定迁移。",
    readingTime: "8 分钟阅读",
    colors: ["#c7d2fe", "#a5b4fc"],
    featured: true,
  },
  {
    id: "story-a11y",
    category: "工程",
    title: "一次可访问性回归是怎么发现的",
    excerpt: "从一次 Tab 顺序异常开始，定位到 root 级键盘捕获。",
    readingTime: "5 分钟阅读",
    colors: ["#fbcfe8", "#f9a8d4"],
  },
  {
    id: "story-motion",
    category: "动效",
    title: "为什么我们不再给每个组件加入场",
    excerpt: "高频操作需要即时反馈，而不是等待一段 spring 收尾。",
    readingTime: "6 分钟阅读",
    colors: ["#bbf7d0", "#86efac"],
  },
];

const QUOTES: Quote[] = [
  {
    id: "quote-lin",
    quote: "迁移到新的 token 之后，暗色主题终于不用每个组件单独修。",
    name: "林一",
    role: "设计系统负责人",
    initials: "LY",
  },
  {
    id: "quote-zhou",
    quote: "README 里的键盘说明比组件本身更有价值；团队不再靠猜。",
    name: "周可",
    role: "前端工程师",
    initials: "ZK",
  },
  {
    id: "quote-chen",
    quote: "我们把轮播的拖拽和按钮行为统一后，移动端投诉少了一半。",
    name: "陈默",
    role: "产品经理",
    initials: "CM",
  },
];

const STEPS: Step[] = [
  {
    id: "repo",
    title: "连接仓库",
    body: "选择要部署的 GitHub 仓库，并确认默认分支。",
    hint: "需要仓库管理员权限",
  },
  {
    id: "env",
    title: "配置环境",
    body: "填写构建命令、输出目录和环境变量。",
    hint: "可以稍后在项目设置里修改",
  },
  {
    id: "preview",
    title: "检查预览",
    body: "打开预览链接，确认路由、样式和静态资源。",
    hint: "预览链接 24 小时内有效",
  },
  {
    id: "domain",
    title: "绑定域名",
    body: "添加自定义域名，并按提示配置 DNS。",
    hint: "HTTPS 证书会自动签发",
  },
];

const AGENDA: AgendaItem[] = [
  { id: "agenda-1", time: "09:30", title: "注册与咖啡", place: "一层大厅" },
  {
    id: "agenda-2",
    time: "10:00",
    title: "主题演讲：设计系统的边界",
    place: "A 厅",
  },
  {
    id: "agenda-3",
    time: "11:15",
    title: "工作坊：可访问性回归",
    place: "B 厅",
  },
  {
    id: "agenda-4",
    time: "14:00",
    title: "圆桌：组件库的长期维护",
    place: "A 厅",
  },
  { id: "agenda-5", time: "16:30", title: "自由交流", place: "露台" },
];

const ARABIC_PRODUCTS: Product[] = [
  {
    id: "ar-linen",
    name: "وسادة كتان",
    category: "جديد",
    price: "٣٢٠ ر.س",
    note: "شحن مجاني · إرجاع خلال ٧ أيام",
    colors: ["#fde68a", "#fbbf24"],
  },
  {
    id: "ar-lamp",
    name: "مصباح طاولة",
    category: "الأكثر مبيعاً",
    price: "٤٨٠ ر.س",
    note: "شحن مجاني · إرجاع خلال ٧ أيام",
    colors: ["#bae6fd", "#7dd3fc"],
  },
  {
    id: "ar-rug",
    name: "سجادة صوف",
    category: "محدود",
    price: "٩٢٠ ر.س",
    note: "شحن مجاني · إرجاع خلال ٧ أيام",
    colors: ["#bbf7d0", "#86efac"],
  },
  {
    id: "ar-vase",
    name: "مزهرية خزفية",
    category: "جديد",
    price: "٢٤٠ ر.س",
    note: "شحن مجاني · إرجاع خلال ٧ أيام",
    colors: ["#fbcfe8", "#f9a8d4"],
  },
];

const GALLERY: GalleryItem[] = [
  {
    id: "coast",
    title: "海岸线",
    location: "里斯本 · 2026",
    colors: ["#0ea5e9", "#0369a1"],
  },
  {
    id: "valley",
    title: "山谷",
    location: "因特拉肯 · 2026",
    colors: ["#22c55e", "#15803d"],
  },
  {
    id: "city",
    title: "城市夜景",
    location: "东京 · 2026",
    colors: ["#6366f1", "#312e81"],
  },
  {
    id: "forest",
    title: "森林",
    location: "箱根 · 2026",
    colors: ["#14b8a6", "#115e59"],
  },
  {
    id: "desert",
    title: "沙漠",
    location: "瓦迪拉姆 · 2026",
    colors: ["#f59e0b", "#b45309"],
  },
  {
    id: "lake",
    title: "湖泊",
    location: "皇后镇 · 2026",
    colors: ["#38bdf8", "#1d4ed8"],
  },
];

const SCALE_COLORS: Array<[string, string]> = [
  ["#38bdf8", "#1d4ed8"],
  ["#22c55e", "#15803d"],
  ["#6366f1", "#312e81"],
  ["#14b8a6", "#115e59"],
  ["#f59e0b", "#b45309"],
  ["#ec4899", "#9d174d"],
  ["#a3e635", "#4d7c0f"],
  ["#c084fc", "#6b21a8"],
];

const SCALE_SLIDES: GalleryItem[] = Array.from({ length: 20 }, (_, index) => ({
  id: `scale-${index + 1}`,
  title: `作品 ${String(index + 1).padStart(2, "0")}`,
  location: `系列 ${Math.floor(index / 4) + 1} · 2026`,
  colors: SCALE_COLORS[index % SCALE_COLORS.length]!,
}));

const TRACKS: Track[] = [
  {
    id: "track-night",
    title: "Night Drive",
    artist: "Lumen",
    duration: "3:42",
    tag: "Synth",
    colors: ["#6366f1", "#312e81"],
  },
  {
    id: "track-paper",
    title: "Paper Planes",
    artist: "Mira",
    duration: "4:08",
    tag: "Indie",
    colors: ["#f59e0b", "#b45309"],
  },
  {
    id: "track-tide",
    title: "Low Tide",
    artist: "Kite",
    duration: "2:56",
    tag: "Ambient",
    colors: ["#14b8a6", "#115e59"],
  },
];

const RESULTS: SearchResult[] = [
  {
    id: "result-migration",
    kind: "文档",
    title: "设计系统迁移指南",
    snippet: "从旧 token 迁移到新的语义变量，先处理颜色、间距和圆角。",
    meta: "8 分钟阅读",
  },
  {
    id: "result-a11y",
    kind: "案例",
    title: "一个表单组件的可访问性改造",
    snippet: "把错误信息、焦点顺序和键盘行为放进同一个验收清单。",
    meta: "12 分钟阅读",
  },
];

function CarouselReadout({
  position = "top",
}: {
  position?: "top" | "bottom";
}) {
  const { index, count } = useCarousel();

  return (
    <span
      className={`pointer-events-none absolute end-3 z-10 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11.5px] text-muted ${
        position === "bottom" ? "bottom-3" : "top-3"
      }`}
      data-testid="carousel-readout"
    >
      <span dir="ltr">{count === 0 ? "0 / 0" : `${index + 1} / ${count}`}</span>
    </span>
  );
}

/**
 * 内容贴边时，把控件放到 viewport 外面，避免覆盖输入框、文字或右侧标签。
 */
function InlineCarouselControls() {
  const { canScrollPrev, canScrollNext, scrollPrev, scrollNext } =
    useCarousel();

  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <Button
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        size="md"
        variant="outline"
      >
        上一张
      </Button>
      <span className="text-[11px] text-muted">拖拽或使用按钮切换</span>
      <Button
        disabled={!canScrollNext}
        onClick={scrollNext}
        size="md"
        variant="outline"
      >
        下一张
      </Button>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <div
        aria-hidden="true"
        className="relative aspect-[16/10]"
        style={{
          background: `linear-gradient(135deg, ${product.colors[0]}, ${product.colors[1]})`,
        }}
      >
        <span className="absolute start-3 top-3 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-slate-700 uppercase">
          {product.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="m-0 text-sm font-semibold text-ink">{product.name}</h3>
        <p className="m-0 text-sm font-semibold text-accent-strong">
          {product.price}
        </p>
        <p className="mt-auto mb-0 text-[11px] text-muted">{product.note}</p>
      </div>
    </article>
  );
}

function StoryCard({ story }: { story: Story }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <div
        aria-hidden="true"
        className={story.featured ? "aspect-[21/9]" : "aspect-[16/9]"}
        style={{
          background: `linear-gradient(135deg, ${story.colors[0]}, ${story.colors[1]})`,
        }}
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="m-0 text-[10.5px] font-semibold tracking-[0.08em] text-accent-strong uppercase">
          {story.category}
        </p>
        <h3
          className={
            story.featured
              ? "m-0 text-lg font-semibold text-ink"
              : "m-0 text-sm font-semibold text-ink"
          }
        >
          {story.title}
        </h3>
        <p className="m-0 line-clamp-2 text-xs leading-[1.6] text-muted">
          {story.excerpt}
        </p>
        <span className="mt-auto text-[11px] text-muted">
          {story.readingTime}
        </span>
      </div>
    </article>
  );
}

function QuoteCard({ quote }: { quote: Quote }) {
  return (
    <figure className="m-0 flex h-full flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <span aria-hidden="true" className="text-3xl leading-none text-accent">
        “
      </span>
      <blockquote className="m-0 text-[15px] leading-[1.7] text-ink">
        {quote.quote}
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-strong">
          {quote.initials}
        </span>
        <span className="flex flex-col">
          <span className="text-xs font-medium text-ink">{quote.name}</span>
          <span className="text-[11px] text-muted">{quote.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

function StepCard({ step, index }: { step: Step; index: number }) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-line bg-surface p-5">
      <span className="text-[10.5px] font-semibold tracking-[0.08em] text-accent-strong uppercase">
        Step {index + 1}
      </span>
      <h3 className="m-0 text-lg font-semibold text-ink">{step.title}</h3>
      <p className="m-0 text-sm leading-[1.65] text-muted">{step.body}</p>
      <p className="mt-auto mb-0 text-[11px] text-muted">{step.hint}</p>
    </div>
  );
}

function StepProgress({ index, total }: { index: number; total: number }) {
  return (
    <div
      aria-label="步骤进度"
      aria-valuemax={total}
      aria-valuemin={1}
      aria-valuenow={index + 1}
      className="h-1.5 overflow-hidden rounded-full bg-surface-2"
      role="progressbar"
    >
      <div
        className="h-full origin-left rounded-full bg-accent transition-transform duration-200 motion-reduce:transition-none"
        style={{ transform: `scaleX(${(index + 1) / total})` }}
      />
    </div>
  );
}

function AgendaRow({ item }: { item: AgendaItem }) {
  return (
    <div className="flex h-full items-center gap-4 rounded-xl border border-line bg-surface px-4">
      <span className="w-12 shrink-0 font-mono text-xs text-accent-strong">
        {item.time}
      </span>
      <div className="min-w-0">
        <p className="m-0 truncate text-sm font-medium text-ink">
          {item.title}
        </p>
        <p className="m-0 text-[11px] text-muted">{item.place}</p>
      </div>
    </div>
  );
}

function GallerySlide({ item }: { item: GalleryItem }) {
  return (
    <figure className="m-0 overflow-hidden rounded-xl border border-line bg-surface">
      <div
        className="relative aspect-[16/9]"
        style={{
          background: `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1]})`,
        }}
      >
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <figcaption className="text-sm font-semibold text-white">
            {item.title}
          </figcaption>
          <p className="m-0 text-[11px] text-white/75">{item.location}</p>
        </div>
      </div>
    </figure>
  );
}

function GalleryThumbnails({ items }: { items: GalleryItem[] }) {
  const { index, scrollTo } = useCarousel();

  return (
    <div
      aria-label="选择图片"
      className="mt-3 grid grid-cols-3 gap-2"
      role="group"
    >
      {items.map((item, itemIndex) => {
        const active = itemIndex === index;

        return (
          <button
            key={item.id}
            aria-current={active ? "true" : undefined}
            aria-label={`查看${item.title}`}
            className={`rounded-lg border p-0.5 transition-colors ${
              active
                ? "border-accent ring-1 ring-accent"
                : "border-line hover:border-line-strong"
            }`}
            onClick={() => scrollTo(itemIndex)}
            type="button"
          >
            <span
              className="block h-10 rounded-md"
              style={{
                background: `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1]})`,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

function TrackRow({ track }: { track: Track }) {
  return (
    <div className="flex h-full items-center gap-3 rounded-xl border border-line bg-surface p-3">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-semibold text-white"
        style={{
          background: `linear-gradient(135deg, ${track.colors[0]}, ${track.colors[1]})`,
        }}
      >
        ♪
      </span>
      <div className="min-w-0">
        <p className="m-0 truncate text-sm font-medium text-ink">
          {track.title}
        </p>
        <p className="m-0 text-[11px] text-muted">
          {track.artist} · {track.duration} · {track.tag}
        </p>
      </div>
    </div>
  );
}

function SearchFilterCard() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 rounded-xl border border-line bg-surface p-5">
      <label className="flex flex-col gap-2 text-sm font-medium text-ink">
        搜索项目
        <input
          aria-label="搜索"
          className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
          placeholder="输入关键词，按 ←/→ 移动光标"
          type="search"
        />
      </label>
      <p className="m-0 text-[11px] text-muted">
        提示：方向键只移动光标，不会切换轮播。
      </p>
    </div>
  );
}

function SearchResultCard({
  result,
  action,
}: {
  result: SearchResult;
  action: "save" | "details";
}) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-line bg-surface p-5">
      <p className="m-0 text-[10.5px] font-semibold tracking-[0.08em] text-accent-strong uppercase">
        {result.kind}
      </p>
      <h3 className="m-0 text-base font-semibold text-ink">{result.title}</h3>
      <p className="m-0 text-xs leading-[1.65] text-muted">{result.snippet}</p>
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="text-[11px] text-muted">{result.meta}</span>
        {action === "save" ? (
          <button
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
            type="button"
          >
            加入收藏
          </button>
        ) : (
          <a
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink no-underline hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
            href="#/components/carousel"
          >
            查看详情
          </a>
        )}
      </div>
    </div>
  );
}

function BasicDemo() {
  return (
    <Carousel aria-label="基础轮播" gap="0.75rem" visible={2}>
      <Carousel.Content>
        {PRODUCTS.map((product) => (
          <Carousel.Item key={product.id}>
            <ProductCard product={product} />
          </Carousel.Item>
        ))}
      </Carousel.Content>
      <Carousel.Previous />
      <Carousel.Next />
      <CarouselReadout />
    </Carousel>
  );
}

function StoryDemo() {
  return (
    <Carousel aria-label="变宽 slide 轮播" gap="0.75rem">
      <Carousel.Content>
        {STORIES.map((story) => (
          <Carousel.Item
            key={story.id}
            className={story.featured ? "basis-[72%]" : "basis-[40%]"}
          >
            <StoryCard story={story} />
          </Carousel.Item>
        ))}
      </Carousel.Content>
      <CarouselReadout />
      <InlineCarouselControls />
    </Carousel>
  );
}

function ScaleDemo() {
  return (
    <Carousel
      aria-label="缩放轮播"
      gap="1rem"
      visible={3}
      scale={0.8}
      opts={{ loop: true }}
    >
      <Carousel.Content>
        {SCALE_SLIDES.map((item) => (
          <Carousel.Item key={item.id}>
            <GallerySlide item={item} />
          </Carousel.Item>
        ))}
      </Carousel.Content>
      <CarouselReadout />
      <InlineCarouselControls />
    </Carousel>
  );
}

function ScaleRtlDemo() {
  return (
    <div dir="rtl">
      <Carousel
        aria-label="RTL 缩放轮播"
        gap="1rem"
        visible={3}
        scale={0.8}
        opts={{ direction: "rtl", loop: true }}
      >
        <Carousel.Content>
          {SCALE_SLIDES.map((item) => (
            <Carousel.Item key={item.id}>
              <GallerySlide item={item} />
            </Carousel.Item>
          ))}
        </Carousel.Content>
        <CarouselReadout />
        <InlineCarouselControls />
      </Carousel>
    </div>
  );
}

function ScaleVerticalCard({ item }: { item: GalleryItem }) {
  return (
    <div className="flex h-full items-center gap-3 overflow-hidden rounded-xl border border-line bg-surface p-3">
      <span
        aria-hidden="true"
        className="h-12 w-12 shrink-0 rounded-lg"
        style={{
          background: `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1]})`,
        }}
      />
      <div className="min-w-0">
        <p className="m-0 truncate text-sm font-medium text-ink">
          {item.title}
        </p>
        <p className="m-0 text-[11px] text-muted">{item.location}</p>
      </div>
    </div>
  );
}

function ScaleVerticalDemo() {
  return (
    <Carousel
      aria-label="纵向缩放轮播"
      className="max-w-[480px]"
      gap="0.75rem"
      orientation="vertical"
      visible={3}
      scale={0.85}
      opts={{ loop: true }}
    >
      <Carousel.Content className="h-[320px]">
        {GALLERY.slice(0, 5).map((item) => (
          <Carousel.Item key={item.id}>
            <ScaleVerticalCard item={item} />
          </Carousel.Item>
        ))}
      </Carousel.Content>
      <CarouselReadout />
      <InlineCarouselControls />
    </Carousel>
  );
}

function LoopDemo() {
  return (
    <Carousel aria-label="循环轮播" gap="0.75rem" opts={{ loop: true }}>
      <Carousel.Content>
        {QUOTES.map((quote) => (
          <Carousel.Item key={quote.id}>
            <QuoteCard quote={quote} />
          </Carousel.Item>
        ))}
      </Carousel.Content>
      <CarouselReadout />
      <InlineCarouselControls />
    </Carousel>
  );
}

function ControlledDemo() {
  const [index, setIndex] = useState(0);
  const total = STEPS.length;

  return (
    <div className="flex flex-col gap-4">
      <Carousel
        aria-label="受控轮播"
        gap="0.75rem"
        index={index}
        onIndexChange={setIndex}
      >
        <Carousel.Content>
          {STEPS.map((step, stepIndex) => (
            <Carousel.Item key={step.id}>
              <StepCard step={step} index={stepIndex} />
            </Carousel.Item>
          ))}
        </Carousel.Content>
        <CarouselReadout />
      </Carousel>
      <StepProgress index={index} total={total} />
      <ButtonRow>
        <Button
          disabled={index === 0}
          onClick={() => setIndex((current) => Math.max(0, current - 1))}
          size="md"
          variant="outline"
        >
          上一张
        </Button>
        <Button
          disabled={index === total - 1}
          onClick={() =>
            setIndex((current) => Math.min(total - 1, current + 1))
          }
          size="md"
          variant="outline"
        >
          下一张
        </Button>
        <Readout label="index" value={index} />
      </ButtonRow>
    </div>
  );
}

function VerticalDemo() {
  return (
    <Carousel
      aria-label="纵向轮播"
      className="max-w-[480px]"
      gap="0.75rem"
      orientation="vertical"
      visible={3}
    >
      <Carousel.Content className="h-[264px]">
        {AGENDA.map((item) => (
          <Carousel.Item key={item.id}>
            <AgendaRow item={item} />
          </Carousel.Item>
        ))}
      </Carousel.Content>
      <Carousel.Previous />
      <Carousel.Next />
      <CarouselReadout position="bottom" />
    </Carousel>
  );
}

function RtlDemo() {
  return (
    <div className="max-w-[640px]" dir="rtl">
      <div className="mb-3 flex flex-wrap gap-2" dir="ltr">
        <code className="rounded-md bg-surface-2 px-2 py-1 text-[11px] text-muted">
          dir=&quot;rtl&quot;
        </code>
        <code className="rounded-md bg-surface-2 px-2 py-1 text-[11px] text-muted">
          direction: &quot;rtl&quot;
        </code>
      </div>
      <Carousel
        aria-label="RTL carousel"
        gap="0.75rem"
        opts={{ direction: "rtl" }}
        visible={2}
      >
        <Carousel.Content>
          {ARABIC_PRODUCTS.map((product) => (
            <Carousel.Item key={product.id}>
              <ProductCard product={product} />
            </Carousel.Item>
          ))}
        </Carousel.Content>
        <Carousel.Previous />
        <Carousel.Next />
        <CarouselReadout />
      </Carousel>
    </div>
  );
}

function DotsDemo() {
  return (
    <Carousel aria-label="分页点轮播" gap="0.75rem" visible={2}>
      <Carousel.Content>
        {PRODUCTS.map((product) => (
          <Carousel.Item key={product.id}>
            <ProductCard product={product} />
          </Carousel.Item>
        ))}
      </Carousel.Content>
      <CarouselReadout />
      <Carousel.Dots />
    </Carousel>
  );
}

function CounterDemo() {
  return (
    <Carousel aria-label="计数器轮播" gap="0.75rem">
      <Carousel.Content>
        {QUOTES.map((quote) => (
          <Carousel.Item key={quote.id}>
            <QuoteCard quote={quote} />
          </Carousel.Item>
        ))}
      </Carousel.Content>
      <CarouselReadout />
      <Carousel.Dots />
      <div className="mt-2 flex justify-center">
        <Carousel.Counter />
      </div>
    </Carousel>
  );
}

function GalleryDemo() {
  return (
    <Carousel aria-label="缩略图轮播" gap="0.75rem">
      <Carousel.Content>
        {GALLERY.map((item) => (
          <Carousel.Item key={item.id}>
            <GallerySlide item={item} />
          </Carousel.Item>
        ))}
      </Carousel.Content>
      <CarouselReadout />
      <GalleryThumbnails items={GALLERY} />
    </Carousel>
  );
}

function DynamicDemo() {
  const [tracks, setTracks] = useState<Track[]>(TRACKS);
  const [nextNumber, setNextNumber] = useState(TRACKS.length + 1);
  const [api, setApi] = useState<CarouselApi>();
  const [slideCount, setSlideCount] = useState(TRACKS.length);

  useEffect(() => {
    if (!api) {
      return;
    }

    const sync = () => setSlideCount(api.slideNodes().length);

    sync();
    api.on("reInit", sync);

    return () => {
      api.off("reInit", sync);
    };
  }, [api]);

  const addTrack = () => {
    setTracks((current) => [
      ...current,
      {
        id: `track-${nextNumber}`,
        title: `新曲目 ${nextNumber}`,
        artist: "未命名",
        duration: "0:00",
        tag: "New",
        colors: ["#94a3b8", "#475569"],
      },
    ]);
    setNextNumber((current) => current + 1);
  };

  return (
    <div className="flex flex-col gap-4">
      <Carousel aria-label="动态轮播" gap="0.75rem" setApi={setApi}>
        <Carousel.Content>
          {tracks.map((track) => (
            <Carousel.Item key={track.id}>
              <TrackRow track={track} />
            </Carousel.Item>
          ))}
        </Carousel.Content>
        <CarouselReadout />
        <InlineCarouselControls />
      </Carousel>
      <ButtonRow>
        <Button onClick={addTrack} size="sm" variant="outline">
          添加一张
        </Button>
        <Button
          disabled={tracks.length === 0}
          onClick={() => setTracks((current) => current.slice(0, -1))}
          size="sm"
          variant="outline"
        >
          移除一张
        </Button>
        <Readout label="slides" value={slideCount} />
      </ButtonRow>
    </div>
  );
}

function KeyboardDemo() {
  const firstResult = RESULTS[0]!;
  const secondResult = RESULTS[1]!;

  return (
    <Carousel aria-label="键盘与焦点轮播" gap="0.75rem">
      <Carousel.Content>
        <Carousel.Item>
          <SearchFilterCard />
        </Carousel.Item>
        <Carousel.Item>
          <SearchResultCard action="save" result={firstResult} />
        </Carousel.Item>
        <Carousel.Item>
          <SearchResultCard action="details" result={secondResult} />
        </Carousel.Item>
      </Carousel.Content>
      <CarouselReadout />
      <InlineCarouselControls />
    </Carousel>
  );
}

export function CarouselPage() {
  return (
    <Page
      kind="组件"
      title="Carousel"
      description="基于 Embla 的横向/纵向轮播。支持拖拽、缩放聚焦、Dots、Counter、受控 snap 索引、变宽 slide、RTL、键盘焦点与 reduced-motion 降级。"
      tags={["Embla", "拖拽", "scale", "受控", "RTL", "可访问性"]}
    >
      <Section title="引入">
        <CodeBlock
          code={'import { Carousel, useCarousel } from "seam-react";'}
        />
      </Section>

      <Section
        title="visible"
        description="一次显示两张商品卡片；4 张卡片会产生 3 个 snap 位置，所以左上角读数显示 1 / 3。useCarousel 的 count 也是 snap 数，不是 slide 数。"
      >
        <Demo
          code={`const products = [...];

<Carousel aria-label="基础轮播" gap="0.75rem" visible={2}>
  <Carousel.Content>
    {products.map((product) => (
      <Carousel.Item key={product.id}>
        <ProductCard product={product} />
      </Carousel.Item>
    ))}
  </Carousel.Content>
  <Carousel.Previous />
  <Carousel.Next />
</Carousel>`}
        >
          <BasicDemo />
        </Demo>
        <Callout title="snap 数不等于 slide 数">
          <p>
            visible=2 时，4 张卡片只有 3 个可停靠位置。需要 slide 级位置时， 从
            useCarousel().api 读取 slideNodes 并自行换算。
          </p>
        </Callout>
      </Section>

      <Section
        title="Carousel.Item"
        description="Carousel.Item 可以覆盖 flex-basis，做不同宽度的 slide；Embla 会按真实宽度计算 snap。这里 3 张 slide 因为宽度不同，只有 2 个停靠位置。"
      >
        <Demo
          code={`<Carousel aria-label="变宽 slide 轮播" gap="0.75rem">
  <Carousel.Content>
    <Carousel.Item className="basis-[72%]">
      <FeaturedStory />
    </Carousel.Item>
    <Carousel.Item className="basis-[40%]">
      <SmallStory />
    </Carousel.Item>
    <Carousel.Item className="basis-[40%]">
      <SmallStory />
    </Carousel.Item>
  </Carousel.Content>
  {/* 文字贴边时用外部控件，见“自定义控件”示例 */}
</Carousel>`}
        >
          <StoryDemo />
        </Demo>
        <Callout title="控件位置">
          <p>
            默认 Previous/Next 是覆盖在 viewport 边缘的浮层按钮。变宽
            slide、quote 文本、表单或右侧有内容的卡片，建议用 useCarousel
            把控件放到内容外，避免遮挡。
          </p>
        </Callout>
      </Section>

      <Section
        title="scale"
        description="scale 开启邻居缩放：中心 slide 最大，两侧按距离递减，远处滑到后面。它默认把 align 设为 center、containScroll 设为 false；下面用 20 张图片验证连续缩放与 loop，RTL 和纵向使用同一套几何。"
      >
        <Demo
          code={`<Carousel
  aria-label="缩放轮播"
  visible={3}
  scale={0.8}
  opts={{ loop: true }}
>
  <Carousel.Content>
    {images.map((image) => (
      <Carousel.Item key={image.id}>
        <GallerySlide image={image} />
      </Carousel.Item>
    ))}
  </Carousel.Content>
  {/* 内容贴边时用外部控件 */}
</Carousel>`}
        >
          <ScaleDemo />
        </Demo>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="m-0 mb-3 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
            RTL scale
          </p>
          <ScaleRtlDemo />
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="m-0 mb-3 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
            Vertical scale
          </p>
          <ScaleVerticalDemo />
        </div>
        <Callout tone="warning" title="opt-in 与性能">
          <p>
            scale 默认关闭；开启后会逐帧写入 CSS 变量。slide
            数量较多时先验证性能；reduced motion 下保持原始尺寸。RTL 版本只需加
            dir=&quot;rtl&quot; 和 opts.direction=&quot;rtl&quot;。scale 需要
            slidesToScroll=1；分组滚动时效果会跳过，不要覆盖
            align/containScroll，除非明确知道布局影响。
          </p>
        </Callout>
      </Section>

      <Section
        title="loop"
        description="loop 交给 Embla；推荐语首尾衔接。slide 数量不足时 Embla 会自动回退为非 loop。"
      >
        <Demo
          code={`<Carousel
  aria-label="循环轮播"
  gap="0.75rem"
  opts={{ loop: true }}
>
  <Carousel.Content>
    {quotes.map((quote) => (
      <Carousel.Item key={quote.id}>
        <QuoteCard quote={quote} />
      </Carousel.Item>
    ))}
  </Carousel.Content>
  {/* 文字贴边时用外部控件，见“自定义控件”示例 */}
</Carousel>`}
        >
          <LoopDemo />
        </Demo>
      </Section>

      <Section
        title="index"
        description="index 是 snap 索引。外部按钮和进度条与拖拽共享同一状态；这是引导步骤、分页表单的常见模式。"
      >
        <Demo
          code={`const [index, setIndex] = useState(0);
const total = steps.length;

<Carousel
  aria-label="受控轮播"
  index={index}
  onIndexChange={setIndex}
>
  <Carousel.Content>
    {steps.map((step, stepIndex) => (
      <Carousel.Item key={step.id}>
        <StepCard step={step} index={stepIndex} />
      </Carousel.Item>
    ))}
  </Carousel.Content>
</Carousel>

<StepProgress index={index} total={total} />

<Button
  disabled={index === 0}
  onClick={() => setIndex((current) => current - 1)}
>
  上一张
</Button>`}
        >
          <ControlledDemo />
        </Demo>
        <Callout tone="warning" title="index 的语义">
          <p>
            分组滚动（slidesToScroll）时，一个 snap 可能包含多张 slide；此时
            index 仍然表示 snap。需要 slide 级索引时，用 useCarousel 读取 api
            并自行换算。
          </p>
        </Callout>
      </Section>

      <Section
        title="orientation"
        description="orientation=vertical + visible=3：一次显示 3 行议程，按钮上下切换。这里 5 行、visible=3，所以有 3 个 snap。Content 必须有明确高度。"
      >
        <Demo
          code={`<Carousel
  aria-label="纵向轮播"
  orientation="vertical"
  visible={3}
  gap="0.75rem"
>
  <Carousel.Content className="h-[264px]">
    {agenda.map((item) => (
      <Carousel.Item key={item.id}>
        <AgendaRow item={item} />
      </Carousel.Item>
    ))}
  </Carousel.Content>
  <Carousel.Previous />
  <Carousel.Next />
</Carousel>`}
        >
          <VerticalDemo />
        </Demo>
      </Section>

      <Section
        title="direction"
        description="RTL 界面里第一张 slide 应从右侧开始。只设置 dir 只改变布局方向；Embla 仍需要 opts.direction: 'rtl' 才能按 RTL 计算滚动、snap 和 loop。示例是 4 张商品、visible=2，所以读数是 1 / 3。"
      >
        <Demo
          code={`<div dir="rtl">
  <Carousel
    aria-label="RTL carousel"
    opts={{ direction: "rtl" }}
  >
    <Carousel.Content>
      {products.map((product) => (
        <Carousel.Item key={product.id}>
          <ProductCard product={product} />
        </Carousel.Item>
      ))}
    </Carousel.Content>
    <Carousel.Previous />
    <Carousel.Next />
  </Carousel>
</div>`}
        >
          <RtlDemo />
        </Demo>
        <Callout tone="warning" title="只设置 dir 不够">
          <p>
            dir=&quot;rtl&quot; 负责文本、flex 和 logical inset；direction:
            &quot;rtl&quot; 负责 Embla 的滚动数学。两者都要设置。
          </p>
          <p>
            不要手动反转 slides 数组或交换 Previous/Next；组件会用 logical
            properties 处理控件位置和图标。在这个示例里，视觉左侧的 ←
            是“下一张”， 右侧的 → 是“上一张”；点击左侧按钮后读数为 2 / 3。
          </p>
        </Callout>
      </Section>

      <Section
        title="useCarousel"
        description="用 useCarousel 读取 index 并调用 scrollTo，做一个缩略图导航。没有默认 Previous/Next；缩略图就是控件。"
      >
        <Demo
          code={`function Thumbnails({ items }) {
  const { index, scrollTo } = useCarousel();

  return items.map((item, itemIndex) => (
    <button
      key={item.id}
      aria-current={itemIndex === index ? "true" : undefined}
      onClick={() => scrollTo(itemIndex)}
    >
      {item.title}
    </button>
  ));
}

<Carousel aria-label="缩略图轮播">
  <Carousel.Content>...</Carousel.Content>
  <Thumbnails items={images} />
</Carousel>`}
        >
          <GalleryDemo />
        </Demo>
      </Section>

      <Section
        title="Carousel.Dots"
        description="按 snap 渲染分页点；当前项用共享 pill 标记，点击调用 scrollTo。分组滚动时 dot 表示 page，而不是 slide。"
      >
        <Demo
          code={`<Carousel aria-label="分页点轮播" visible={2}>
  <Carousel.Content>
    {products.map((product) => (
      <Carousel.Item key={product.id}>
        <ProductCard product={product} />
      </Carousel.Item>
    ))}
  </Carousel.Content>
  <Carousel.Dots />
</Carousel>`}
        >
          <DotsDemo />
        </Demo>
        <Callout title="snap / page 语义">
          <p>
            Dots 的数量来自 scrollSnapList，不是 slide 数。分组滚动时默认文案会
            使用 Go to page N；需要自定义时传 label。
          </p>
        </Callout>
      </Section>

      <Section
        title="Carousel.Counter"
        description="显示当前 snap 文本。默认只让数字滑动，aria-hidden 由 slide 的 x of y 标签负责位置播报；可以用 format 完全自定义。"
      >
        <Demo
          code={`<Carousel aria-label="计数器轮播">
  <Carousel.Content>...</Carousel.Content>
  <Carousel.Dots />
  <Carousel.Counter />
</Carousel>`}
        >
          <CounterDemo />
        </Demo>
        <Callout title="不要重复播报">
          <p>
            默认 aria-hidden=true，因为每个 slide 已经有 x of y 标签。若要让
            Counter 被读屏读取，传 aria-hidden=false 并提供有意义的 format。
          </p>
        </Callout>
      </Section>

      <Section
        title="setApi"
        description="setApi 暴露原始 Embla API。增删 slide 会触发 reInit；这里用 api.slideNodes() 读取实际 slide 数，和 carousel 的 snap 数区分开。0 张时不崩溃，控件保持禁用。"
      >
        <Demo
          code={`const [api, setApi] = useState<CarouselApi>();
const [slideCount, setSlideCount] = useState(initialTracks.length);

useEffect(() => {
  if (!api) return;
  const sync = () => setSlideCount(api.slideNodes().length);
  sync();
  api.on("reInit", sync);
  return () => api.off("reInit", sync);
}, [api]);

<Carousel aria-label="动态轮播" setApi={setApi}>
  <Carousel.Content>
    {tracks.map((track) => (
      <Carousel.Item key={track.id}>
        <TrackRow track={track} />
      </Carousel.Item>
    ))}
  </Carousel.Content>
  {/* 内容贴边时用外部控件 */}
</Carousel>

<button onClick={() => setTracks((current) => [...current, newTrack])}>
  添加一张
</button>`}
        >
          <DynamicDemo />
        </Demo>
      </Section>

      <Section
        title="watchFocus"
        description="watchFocus 默认开启：Tab 到屏幕外 slide 内容时，Embla 会把该 slide 滚入视口。组件同时不在根节点捕获方向键，所以输入框内的 ←/→ 不会被劫持。"
      >
        <Demo
          code={`<Carousel aria-label="键盘与焦点轮播">
  <Carousel.Content>
    <Carousel.Item>
      <input aria-label="搜索" />
    </Carousel.Item>
    <Carousel.Item>...</Carousel.Item>
    <Carousel.Item>
      <a href="#/components/carousel">查看详情</a>
    </Carousel.Item>
  </Carousel.Content>
  {/* 控件放在内容外，避免遮挡输入框 */}
</Carousel>`}
        >
          <KeyboardDemo />
        </Demo>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-[13.5px] text-muted">
          <li>点击第 1 张里的搜索框，按 ←/→：光标移动，轮播不切换。</li>
          <li>连续按 Tab 到第 3 张的“查看详情”：轮播把该 slide 滚入视口。</li>
        </ol>
        <Callout tone="warning" title="不要这样做">
          <p>很多 Carousel 会在根节点捕获方向键：</p>
          <CodeBlock
            code={`<div
  onKeyDownCapture={(event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollNext();
    }
  }}
>
  {slides}
</div>`}
            label="tsx"
          />
          <p>
            这会让 slide 内的输入框、下拉框失去原生方向键。本组件默认不捕获
            方向键，依靠按钮、Tab 顺序和 Embla 的 watchFocus。
          </p>
        </Callout>
      </Section>

      <Section title="API">
        <PropsTable
          rows={[
            {
              name: "orientation",
              type: '"horizontal" | "vertical"',
              defaultValue: '"horizontal"',
              description: "滚动轴；会覆盖 opts.axis。",
            },
            {
              name: "opts",
              type: "EmblaOptionsType",
              description:
                "Embla 选项，例如 loop、align、containScroll、slidesToScroll。默认 align 为 start。",
            },
            {
              name: "plugins",
              type: "EmblaPluginType[]",
              description:
                "Embla 插件数组。组件不内置 autoplay；自行传入时需负责可访问性。",
            },
            {
              name: "index",
              type: "number",
              description: "受控 snap 索引（0-based）。",
            },
            {
              name: "defaultIndex",
              type: "number",
              defaultValue: "opts.startIndex ?? 0",
              description: "非受控初始 snap 索引。",
            },
            {
              name: "onIndexChange",
              type: "(index: number) => void",
              description:
                "用户拖拽、按钮或 API 导致 snap 变化时触发；初次挂载不触发。",
            },
            {
              name: "setApi",
              type: "(api: EmblaCarouselType | undefined) => void",
              description: "获取原始 Embla API；卸载时收到 undefined。",
            },
            {
              name: "gap",
              type: "string",
              defaultValue: '"0px"',
              description:
                "slide 间距。用 padding + negative margin 实现，支持任意 CSS 长度。",
            },
            {
              name: "visible",
              type: "number",
              defaultValue: "1",
              description:
                "可见 slide 数，可传小数露出半张。4 张卡片 + visible=2 通常产生 3 个 snap。",
            },
            {
              name: "scale",
              type: "number",
              description:
                "0–1，opt-in。开启后默认 align=center、containScroll=false；逐帧写 CSS 变量，reduced motion 下保持原始尺寸。",
            },
            {
              name: "aria-label / aria-labelledby",
              type: "string",
              required: true,
              description: "区域可访问名称，二者必须提供其一。",
            },
            {
              name: "Carousel.Content.className",
              type: "string",
              description: "作用于 viewport，用于宽高、圆角与裁切。",
            },
            {
              name: "Carousel.Content.trackClassName",
              type: "string",
              description: "作用于 track，用于高级 flex 布局。",
            },
            {
              name: "Carousel.Item.className",
              type: "string",
              description:
                "可用于覆盖 flex-basis，实现变宽 slide；Embla 会按真实宽度计算 snap。",
            },
            {
              name: "Carousel.Item.aria-label / aria-labelledby",
              type: "string",
              description: "覆盖自动生成的 x of y 位置标签。",
            },
            {
              name: "Carousel.Dots",
              type: "CarouselDotsProps",
              description:
                "按 snap 渲染分页点；aria-current 标记当前项；label 自定义无障碍名称；count <= 1 不渲染。",
            },
            {
              name: "Carousel.Counter",
              type: "CarouselCounterProps",
              description:
                "默认 Slide N of M；format 自定义；默认 aria-hidden=true；count <= 1 不渲染。",
            },
            {
              name: "Carousel.Previous / Next",
              type: "ButtonProps",
              description:
                "复用 Button。默认 variant=outline、size=md，aria-label 为 Previous slide / Next slide；onClick 调用 preventDefault 可阻止滚动。",
            },
          ]}
        />
        <Callout title="M2 范围">
          <p>
            Dots、Counter 与 scale 已提供；autoplay、暂停按钮和 aria-live
            轮播播报仍不在组件内。
          </p>
        </Callout>
      </Section>

      <Section title="可访问性">
        <BulletList
          items={[
            '根节点是有名称的 section（region），并设置 aria-roledescription="carousel"。',
            '每个 slide 使用 role=group、aria-roledescription="slide"，挂载后自动生成 x of y 标签；可用 aria-label / aria-labelledby 覆盖。',
            "上一张/下一张是原生 button，默认提供 Previous slide / Next slide 名称与可见 focus-visible 环。",
            "不在根节点捕获方向键；输入框、文本域和下拉框的键盘行为保持原生。示例里可以直接在搜索框里按 ←/→ 验证。",
            "Embla 的 watchFocus 会在 Tab 到屏幕外 slide 内容时把该 slide 滚入视口。",
            "屏幕外 slide 默认不设置 inert / aria-hidden，读屏与键盘用户可以按 DOM 顺序访问全部内容。",
            "reduced motion 下程序化切换直接跳转，不播放空间位移动画；拖拽仍保留，因为它是用户直接控制的滚动。",
            "RTL 时同时设置 dir 和 opts.direction；控件位置由 logical properties 处理，水平箭头翻转，纵向控件保持在物理水平中心。",
            "缩略图等自定义控件也使用原生 button 和 aria-current，命中区域至少 24×24。",
          ]}
        />
      </Section>
    </Page>
  );
}
