export interface HookNote {
  tone?: "info" | "warning";
  title?: string;
  text: string;
}

export interface HookUsage {
  title: string;
  description?: string;
  /** 对应 src/demos 下的示例 id（不含扩展名）。 */
  demo: string;
}

export interface HookApiRow {
  name: string;
  type: string;
  defaultValue?: string;
  required?: boolean;
  description: string;
}

export interface HookApi {
  signature: string;
  parameters: HookApiRow[];
  returns: HookApiRow[];
}

export interface HookDoc {
  name: string;
  path: string;
  signature: string;
  description: string;
  example: string;
  notes: (string | HookNote)[];

  // 补齐这些字段的页面使用「何时使用 / 注意事项 / 用法 / API」结构；
  // 其余页面暂时沿用旧的「引入 / 签名 / 用法 / 说明」。
  whenToUse?: string[];
  notFor?: string[];
  usage?: HookUsage[];
  api?: HookApi;
}

export interface HookGroup {
  title: string;
  items: HookDoc[];
}

function toKebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function hook(
  name: string,
  signature: string,
  description: string,
  example: string,
  notes: string[] = [],
): HookDoc {
  return {
    name,
    path: `hooks/${toKebab(name)}`,
    signature,
    description,
    example,
    notes,
  };
}

export const hookGroups: HookGroup[] = [
  {
    title: "状态",
    items: [
      hook(
        "useControllableState",
        "useControllableState<T>(options): [T, setValue]",
        "统一受控与非受控状态：受控时以外部 value 为准，非受控时自己维护，两条路径都触发 onChange。",
        `const [value, setValue] = useControllableState({
  value: props.value,
  defaultValue: "",
  onChange: props.onChange,
});`,
        ["这是 Switch、Tabs 等组件共享同一套状态语义的基础。"],
      ),
      hook(
        "useMap",
        "useMap<K, V>(initial?): [Map<K, V>, actions]",
        "用 Map 管理键值状态，所有写操作都是不可变更新，并复制传入的初始 Map。",
        `const [errors, { set, remove, reset }] = useMap<string, string>();

set("email", "格式不正确");
remove("email");`,
      ),
      hook(
        "useList",
        "useList<T>(initial?): [T[], actions]",
        "数组状态管理，提供 push / update / remove / filter / sort / reset。",
        `const [items, { push, remove, update }] = useList<string>([]);`,
        ["sort 和 filter 都基于副本，不会修改原数组。"],
      ),
      hook(
        "useObservable",
        "useObservable<T>(observable, initialValue?): T | undefined",
        "订阅符合最小接口的 Observable，返回最新值；observable 变化时自动重订阅。",
        `const price = useObservable(priceStream, lastPrice);`,
        ["只要求 subscribe(observer)，不绑定 RxJS。"],
      ),
      hook(
        "useGetSet",
        "useGetSet<T>(initial): [() => T, set]",
        "返回状态 getter：读取不触发渲染，写入仍然更新状态并重渲染。",
        `const [getCount, setCount] = useGetSet(0);

const latest = getCount();`,
      ),
      hook(
        "useSetState",
        "useSetState<T extends object>(initial): [T, patch]",
        "类似 class 组件的 this.setState：补丁浅合并，而不是整体替换。",
        `const [form, patch] = useSetState({ name: "", age: 0 });

patch({ name: "Ada" });`,
      ),
    ],
  },
  {
    title: "异步",
    items: [
      hook(
        "useAsync",
        "useAsync<T>(fn, deps?, options?): { value, error, loading }",
        "执行 async 函数并跟踪状态；依赖变化会重新执行，只有最后一次结果会写入。",
        `const { value, loading, error } = useAsync(
  () => fetchUser(userId),
  [userId],
);`,
        ["支持 initialValue 与 enabled: false 延迟执行。"],
      ),
      hook(
        "useAsyncFn",
        "useAsyncFn<T, Args>(fn, deps?): [state, run]",
        "把任意 async 函数包装成带状态的回调，错误会写入 state 并继续向上抛出。",
        `const [state, save] = useAsyncFn((body: Payload) => api.save(body));`,
        ["连续调用时只保留最后一次的结果，避免竞态覆盖。"],
      ),
      hook(
        "useAsyncRetry",
        "useAsyncRetry<T>(fn, deps?): { value, error, loading, retry }",
        "useAsync 加一个 retry()，适合失败后手动重试的请求。",
        `const { value, error, loading, retry } = useAsyncRetry(loadOrders, [
  page,
]);`,
      ),
    ],
  },
  {
    title: "浏览器与环境",
    items: [
      hook(
        "useMedia",
        "useMedia(query: string): boolean",
        "订阅一条 CSS 媒体查询，返回当前是否命中。",
        `const isWide = useMedia("(min-width: 960px)");`,
        ["基于 useSyncExternalStore，首屏即读到真实值；SSR 返回 false。"],
      ),
      hook(
        "useWindowSize",
        "useWindowSize(): { width, height }",
        "跟踪窗口可视区域尺寸，resize 时更新；尺寸不变时快照引用保持稳定。",
        `const { width, height } = useWindowSize();`,
      ),
      hook(
        "useLocation",
        "useLocation(): { href, origin, pathname, search, hash }",
        "跟踪当前地址，同时监听 popstate、hashchange 与 pushState / replaceState。",
        `const { pathname, search, hash } = useLocation();`,
        ["最后一个订阅者卸载时会恢复被包装的 history 方法。"],
      ),
      hook(
        "useFullscreen",
        "useFullscreen(ref, options?): { isFullscreen, supported, enter, exit, toggle }",
        "让元素进入 / 退出全屏，兼容 webkit 前缀并跟踪状态。",
        `const ref = useRef<HTMLDivElement>(null);
const { isFullscreen, toggle } = useFullscreen(ref);`,
      ),
      hook(
        "useVideo",
        "useVideo(ref): UseVideoResult",
        "跟踪 video 元素的状态，并提供播放、暂停、seek、音量与倍速控制。",
        `const ref = useRef<HTMLVideoElement>(null);
const video = useVideo(ref);

<video ref={ref} src={src} />;`,
      ),
    ],
  },
  {
    title: "交互与可访问性",
    items: [
      hook(
        "useClickAway",
        "useClickAway(ref, handler, events?): void",
        "点击目标区域外时触发，默认监听 pointerdown，也可传入自定义事件名。",
        `const ref = useRef<HTMLDivElement>(null);
useClickAway(ref, () => setOpen(false));`,
      ),
      hook(
        "useFocusTrap",
        "useFocusTrap(options): void",
        "把焦点限制在容器内：双向 Tab 循环、外部聚焦回收、初始焦点与关闭后恢复。",
        `useFocusTrap({
  active: open,
  containerRef: dialogRef,
  initialFocusRef,
  returnFocusRef: openerRef,
});`,
        [
          "嵌套陷阱按栈处理，只有最上层响应键盘与 focusin。",
          "原生 dialog 只能保证正向 Tab 循环，反向与程序化聚焦仍需要这层兜底。",
        ],
      ),
      hook(
        "useDropArea",
        "useDropArea(options): { over, bind }",
        "把任意元素变成拖放区域，并把 drop 内容拆成文件、链接和文本。",
        `const { over, bind } = useDropArea({
  onFiles: upload,
  onText: setText,
});

return <div {...bind} data-over={over} />;`,
      ),
      hook(
        "useDrop",
        "useDrop<T>(): { over, files, uris, text, bind }",
        "useDropArea 的便捷版本，直接保存最近一次 drop 的内容。",
        `const { over, files, uris, text, bind } = useDrop();`,
      ),
      hook(
        "useStartTyping",
        "useStartTyping(): boolean",
        "检测用户是否开始在页面空白处输入，输入框、文本域与快捷键会被忽略。",
        `const typing = useStartTyping();`,
      ),
      hook(
        "usePageLeave",
        "usePageLeave(onLeave?): boolean",
        "鼠标离开页面边界时触发，重新进入页面会重置状态。",
        `const left = usePageLeave(() => track("page_leave"));`,
      ),
    ],
  },
  {
    title: "性能与工具",
    items: [
      hook(
        "useVirtualList",
        "useVirtualList(options): { start, end, totalHeight, offsetTop }",
        "固定行高虚拟滚动的区间计算，把万级列表的渲染量压到可视区间。",
        `const { start, end, offsetTop, totalHeight } = useVirtualList({
  count: rows.length,
  itemHeight: 36,
  viewportHeight: 288,
  scrollTop,
});`,
      ),
      {
        name: "useDebouncedValue",
        path: "hooks/use-debounced-value",
        signature: "useDebouncedValue<T>(value: T, delay = 300): T",
        description:
          "在值停止变化 delay 毫秒后才返回新值。适合搜索联想、大列表过滤这类「输入很快、处理很慢」的场景。",
        example: `const debounced = useDebouncedValue(query, 300);`,
        whenToUse: [
          "搜索框联想：等用户停止输入再请求，避免每个按键都打一次接口。",
          "大列表过滤或昂贵计算：把防抖值作为 useMemo 的依赖，只在停手后重算。",
          "同步到 URL、localStorage 或埋点：减少 replaceState 与序列化的次数。",
          "远程校验：用户输完一段再校验，而不是每敲一个字就报错。",
        ],
        notFor: [
          "需要逐字反馈的 UI（字数统计、即时高亮）——直接用原值。",
          "输入框自身的 value——受控输入必须实时更新，否则打字会卡。",
          "事件回调的防抖（滚动、resize）——用 useDebounce，它支持 cancel / flush。",
        ],
        notes: [
          {
            tone: "info",
            title: "首次渲染不延迟",
            text: "内部用 useState(value) 作为初值，所以第一次渲染拿到的就是传入值，不会先渲染成空。",
          },
          {
            tone: "warning",
            title: "只延迟值的传播，不阻止重渲染",
            text: "使用它的组件仍会因 value 变化重渲染；它保护的是下游（请求、useMemo、订阅）。要跳过渲染，把消费方拆成 memo 组件。",
          },
          {
            text: "delay <= 0 时同步更新，不创建定时器，便于测试或临时关闭防抖。",
          },
          {
            text: "value 或 delay 每次变化都会重置计时器；组件卸载时自动清理。",
          },
          {
            text: "不提供 cancel / flush。需要在事件层控制时，改用 useDebounce。",
          },
        ],
        usage: [
          {
            title: "搜索过滤",
            description:
              "输入框的值立即更新，过滤和「下游查询」只在你停手 400ms 后执行。把 delay 改成 0 或 1200 试试。",
            demo: "use-debounced-value/search",
          },
        ],
        api: {
          signature: "useDebouncedValue<T>(value: T, delay?: number): T",
          parameters: [
            {
              name: "value",
              type: "T",
              required: true,
              description: "需要延迟传播的值。",
            },
            {
              name: "delay",
              type: "number",
              defaultValue: "300",
              description: "延迟毫秒数；<= 0 时立即同步更新。",
            },
          ],
          returns: [
            {
              name: "value",
              type: "T",
              description:
                "防抖后的值。初始等于首次传入的 value，之后在最后一次变化结束 delay 毫秒后更新。",
            },
          ],
        },
      },
      hook(
        "useDebounce",
        "useDebounce(fn, delay?): DebouncedFunction",
        "函数防抖，返回 cancel / flush / pending 控制方法。",
        `const search = useDebounce((q: string) => query(q), 300);`,
        ["返回的函数引用在 delay 不变时保持稳定，内部总是调用最新的 fn。"],
      ),
      hook(
        "useThrottle",
        "useThrottle(fn, wait?, options?): ThrottledFunction",
        "函数节流，默认 leading + trailing，可分别关闭。",
        `const onScroll = useThrottle(() => setY(window.scrollY), 100);`,
      ),
      hook(
        "useEventCallback",
        "useEventCallback<Args, Result>(fn): (...args) => Result",
        "返回引用恒定的回调，但内部总是执行最新的函数。",
        `const onScroll = useEventCallback(() => {
  report(window.scrollY);
});`,
      ),
      hook(
        "useCopyToClipboard",
        "useCopyToClipboard(): [state, copy]",
        "复制文本到剪贴板，Clipboard API 不可用时退回 execCommand。",
        `const [state, copy] = useCopyToClipboard();

await copy("pnpm add @chenhaojie9527/ui-kit");`,
      ),
      hook(
        "useLocalStorage",
        "useLocalStorage<T>(key, initial, options?): [T, set, remove]",
        "localStorage 持久化，支持函数式更新、自定义序列化与跨标签页同步。",
        `const [theme, setTheme, reset] = useLocalStorage("theme", "system");`,
      ),
      hook(
        "useLockBodyScroll",
        "useLockBodyScroll(locked = true): void",
        "锁定 body 滚动，内部用引用计数支持多个弹窗同时锁定。",
        `useLockBodyScroll(open);`,
      ),
      hook(
        "useTitle",
        "useTitle(title, options?): void",
        "设置 document.title，可选择在卸载时恢复原标题。",
        `useTitle(\`\${project.name} · 仪表盘\`, { restoreOnUnmount: true });`,
      ),
    ],
  },
];

export const hookDocs = hookGroups.flatMap((group) => group.items);

export const hookByPath = new Map(hookDocs.map((doc) => [doc.path, doc]));

export function hookGroupOf(doc: HookDoc): string {
  const group = hookGroups.find((item) => item.items.includes(doc));
  return group?.title ?? "Hooks";
}
