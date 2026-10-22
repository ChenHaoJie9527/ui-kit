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

interface FeaturedHook extends Omit<
  HookDoc,
  "path" | "example" | "whenToUse" | "usage" | "api"
> {
  whenToUse: string[];
  usage: HookUsage[];
  api: HookApi;
  example?: string;
}

/** 新式文章统一派生路由与示例占位，避免每个条目重复 path。 */
function complete(doc: FeaturedHook): HookDoc {
  const { example, ...rest } = doc;

  return {
    ...rest,
    path: `hooks/${toKebab(doc.name)}`,
    example: example ?? "",
  };
}

function param(
  name: string,
  type: string,
  description: string,
  options: { defaultValue?: string; required?: boolean } = {},
): HookApiRow {
  return { name, type, description, ...options };
}

function ret(name: string, type: string, description: string): HookApiRow {
  return { name, type, description };
}

function api(
  signature: string,
  parameters: HookApiRow[],
  returns: HookApiRow[],
): HookApi {
  return { signature, parameters, returns };
}

export const hookGroups: HookGroup[] = [
  {
    title: "状态",
    items: [
      complete({
        name: "useControllableState",
        signature: "useControllableState<T>(options): [T, setValue]",
        description:
          "统一受控与非受控状态：受控时以外部 value 为准，非受控时自己维护，两条路径都触发 onChange。",
        whenToUse: [
          "封装 Switch、Tabs、Select 这类输入组件，让 props 同时支持 value 与 defaultValue。",
          "组件既可能被父级完全控制，也可能自己管理状态，希望两种写法共享同一套变更逻辑。",
          "需要把受控值原样透传，同时只在用户操作时调用 onChange。",
        ],
        notFor: [
          "只在一个组件内部使用的临时 UI 状态——直接用 useState 更直观。",
          "需要深层对象合并的状态——用 useSetState 或 useReducer。",
        ],
        notes: [
          {
            tone: "info",
            title: "value === undefined 即非受控",
            text: "只要传入 value，内部状态就不再作为数据源；传 undefined 会切回非受控模式，所以不要用 undefined 表示「空值已选中」。",
          },
          {
            tone: "warning",
            title: "受控模式需要父级回写",
            text: "hook 只负责通知 onChange，不会替你更新外部 value。如果父级不处理 onChange，开关会点不动。",
          },
          "defaultValue 只在首次渲染读取，支持惰性初始化；之后修改传参不会重置状态。",
          "新值与当前值通过 Object.is 比较，相同值时不会调用 onChange，也能正确处理 NaN 与正负零。",
          "setValue 接受值或 updater，并返回解析后的新值，方便在一次事件里继续使用。",
        ],
        usage: [
          {
            title: "受控与非受控并排",
            description:
              "两个开关使用同一个 hook：左侧由外部 state 决定，右侧自己保存；两边都会写入同一份 onChange 记录。",
            demo: "use-controllable-state/controlled-toggle",
          },
        ],
        api: api(
          "useControllableState<T>(options: UseControllableStateOptions<T>): readonly [T, (next: T | ((prev: T) => T)) => T]",
          [
            param("value", "T", "受控值；传入后进入受控模式。"),
            param(
              "defaultValue",
              "T | (() => T)",
              "非受控模式的初始值，支持惰性初始化。",
              { required: true },
            ),
            param("onChange", "(value: T) => void", "值真正变化时触发。"),
          ],
          [
            ret(
              "value",
              "T",
              "当前值：受控时为 options.value，否则是内部状态。",
            ),
            ret(
              "setValue",
              "(next: T | ((prev: T) => T)) => T",
              "解析并提交新值；受控模式只触发 onChange。",
            ),
          ],
        ),
      }),
      complete({
        name: "useCounter",
        signature: "useCounter(options?): readonly [number, CounterActions]",
        description:
          "管理带步长和上下界约束的数值计数器，支持受控与非受控模式；set、increment、decrement、reset 均基于最新有效值计算。",
        whenToUse: [
          "数量选择器、分页器、步进输入或投票计数等需要增减与重置的数值状态。",
          "希望 min / max / step 作为一组具名配置，并把边界处理交给 hook。",
          "需要同时兼容父级受控和组件内部管理，且在受控模式仍能快速连续操作。",
        ],
        notFor: [
          "只有一个普通数值、没有增减语义——useState 更直接。",
          "需要按固定列表循环——考虑 useCycleList 一类列表状态。",
          "需要小数精度格式化或金额计算——先明确精度策略，不要让计数器替你处理金额舍入。",
        ],
        notes: [
          {
            tone: "info",
            title: "所有入口统一裁剪边界",
            text: "初次值、set、increment、decrement 与 reset 都会经过当前 min / max 裁剪。边界变化时，当前值也会立即收紧；之后放宽边界不会恢复旧值。",
          },
          {
            tone: "warning",
            title: "受控模式需要父级回写",
            text: "传入 value 后，hook 只调用 onChange 报告裁剪后的目标值，不会替你更新外部值。父级没有回写时，界面仍显示外部 value。",
          },
          "defaultValue 只在首次渲染读取，支持惰性初始化。同名普通字段不会因为 options 对象重新创建而重置状态。",
          "min、max、step 每次操作都会读取最新配置。min 必须小于等于 max，step 必须大于 0，所有数值都必须是有限数。",
          "set 和增减操作接受非法数值时会抛出 RangeError，且不会写入计数器，避免 NaN 或 Infinity 悄悄污染状态。",
          "actions 对象与其中的函数引用保持稳定；受控模式下同一事件中的连续操作会基于最新目标值继续计算。",
          "onChange 只在有效值真正变化时调用，不会因为边界配置变化或写入相同的裁剪结果而重复触发。",
        ],
        usage: [
          {
            title: "商品数量步进器",
            description:
              "购物车、库存选择等常见数量输入：默认值为 2，限制在 1 到 5。快捷按钮直接传入越界值，hook 会裁剪到合法范围再更新。",
            demo: "use-counter/quantity-stepper",
          },
          {
            title: "分页器：总页数动态变化",
            description:
              "当前页的上限来自筛选结果。先跳到第 10 页，再模拟结果只剩 5 页，当前页会自动收紧到 5；恢复 12 页时也不会重新暴露旧页。",
            demo: "use-counter/pagination",
          },
          {
            title: "接口重试：控制次数上限",
            description:
              "订单同步失败后的重试流程：业务组件持有尝试次数，通过 value + onChange 接入受控模式；达到 3 次后按钮自动禁用。",
            demo: "use-counter/retry-limit",
          },
        ],
        api: api(
          "useCounter(options?: UseCounterOptions): readonly [number, CounterActions]",
          [
            param("value", "number", "受控值；传入后进入受控模式。"),
            param(
              "defaultValue",
              "number | (() => number)",
              "非受控模式的初始值，支持惰性初始化。",
              { defaultValue: "0" },
            ),
            param("min", "number", "包含在内的下界。"),
            param("max", "number", "包含在内的上界。"),
            param("step", "number", "增减操作的默认步长。", {
              defaultValue: "1",
            }),
            param("onChange", "(value: number) => void", "有效值变化时触发。"),
          ],
          [
            ret("value", "number", "当前有效值，始终位于 min / max 范围内。"),
            ret(
              "actions.set",
              "(next: number | ((current: number) => number)) => number",
              "设置计数器并返回裁剪后的目标值。",
            ),
            ret(
              "actions.increment",
              "(delta?: number) => number",
              "增加指定增量或默认步长，并返回裁剪后的目标值。",
            ),
            ret(
              "actions.decrement",
              "(delta?: number) => number",
              "减少指定减量或默认步长，并返回裁剪后的目标值。",
            ),
            ret(
              "actions.reset",
              "() => number",
              "恢复初始快照并按当前边界裁剪，返回最终目标值。",
            ),
          ],
        ),
      }),
      complete({
        name: "useMap",
        signature: "useMap<K, V>(initial?): [Map<K, V>, actions]",
        description:
          "用 Map 管理键值状态，所有写操作都创建新 Map，并复制传入的初始 Map，适合按 key 增删改的表单错误、配置项等场景。",
        whenToUse: [
          "状态天然是键值对：字段错误、环境变量、id 到实体的索引。",
          "频繁按 key 读写，但整体条目数量不大，希望直接渲染 Map。",
          "需要 clear / reset，同时保持 React 能感知的不可变更新。",
        ],
        notFor: [
          "只有一个标量值——useState 更轻。",
          "需要复杂事务、派生查询或跨组件共享的大量数据——考虑状态库或 useReducer。",
        ],
        notes: [
          "初始 Map 会被复制一份；之后修改传给 hook 的原 Map 不会影响内部状态。",
          "删除不存在的 key 会直接返回旧 Map，不产生无意义的重渲染。",
          "reset 会恢复到首次挂载时的初始快照，而不是外部 Map 的最新内容。",
          "get 会随 Map 引用更新而重建，因此整个 actions 对象也会更新；单个 set / remove 等函数保持稳定。",
        ],
        usage: [
          {
            title: "环境变量编辑器",
            description:
              "写入、删除、清空与恢复初始值都通过 actions 完成；界面直接遍历 Map 的 entries。",
            demo: "use-map/environment",
          },
        ],
        api: api(
          "useMap<K, V>(initial?: Map<K, V> | (() => Map<K, V>)): [Map<K, V>, MapActions<K, V>]",
          [
            param(
              "initial",
              "Map<K, V> | (() => Map<K, V>)",
              "初始 Map 或返回 Map 的工厂函数；内部会复制。",
            ),
          ],
          [
            ret("map", "Map<K, V>", "当前 Map，每次写操作后都是新引用。"),
            ret(
              "actions.get",
              "(key: K) => V | undefined",
              "读取当前 Map 中的值。",
            ),
            ret("actions.set", "(key: K, value: V) => void", "写入单个键值。"),
            ret(
              "actions.setAll",
              "(entries: Iterable<readonly [K, V]>) => void",
              "批量写入，后写入的条目覆盖先写入的。",
            ),
            ret("actions.remove", "(key: K) => void", "删除单个键。"),
            ret("actions.clear", "() => void", "清空所有条目。"),
            ret("actions.reset", "() => void", "恢复到首次挂载时的初始 Map。"),
          ],
        ),
      }),
      complete({
        name: "useList",
        signature: "useList<T>(initial?): [T[], actions]",
        description:
          "数组状态管理，提供 push、set、update、remove、filter、sort、clear 与 reset，所有变更都基于新数组。",
        whenToUse: [
          "列表需要按位置增删改，且更新逻辑比较固定。",
          "希望排序、筛选直接落到状态里，而不是维护另一份派生数组。",
          "需要一键恢复初始列表。",
        ],
        notFor: [
          "需要复杂的撤销、重做或跨字段事务——useReducer 更合适。",
          "只需要派生筛选结果时——保留原数组，在渲染时 filter 或 useMemo。",
        ],
        notes: [
          "传入的初始数组会被复制，外部后续 push / sort 不会污染内部状态。",
          "越界、非整数下标会被忽略，并返回原数组引用。",
          "filter 与 sort 都在当前数组的副本上执行；sort 不会原地修改 state。",
          "reset 恢复首次挂载时的初始快照，之后修改外部数组不会改变它。",
        ],
        usage: [
          {
            title: "任务列表",
            description:
              "添加、勾选、删除、按名称排序、筛选未完成和重置都使用同一组 actions。",
            demo: "use-list/todo-list",
          },
        ],
        api: api(
          "useList<T>(initial?: T[] | (() => T[])): [T[], ListActions<T>]",
          [
            param(
              "initial",
              "T[] | (() => T[])",
              "初始数组或返回数组的工厂函数；内部会复制。",
            ),
          ],
          [
            ret("list", "T[]", "当前数组。"),
            ret(
              "actions.set",
              "(index: number, value: T | ((prev: T) => T)) => void",
              "设置指定下标，支持函数式更新。",
            ),
            ret(
              "actions.push",
              "(...items: T[]) => void",
              "在末尾追加一项或多项。",
            ),
            ret(
              "actions.update",
              "(index: number, updater: (value: T) => T) => void",
              "用 updater 更新指定下标。",
            ),
            ret("actions.remove", "(index: number) => void", "删除指定下标。"),
            ret("actions.clear", "() => void", "清空数组。"),
            ret("actions.reset", "() => void", "恢复到首次挂载时的初始数组。"),
            ret(
              "actions.filter",
              "(predicate: (value: T, index: number) => boolean) => void",
              "用筛选结果替换当前数组。",
            ),
            ret(
              "actions.sort",
              "(compare?: (a: T, b: T) => number) => void",
              "排序当前数组的副本。",
            ),
          ],
        ),
      }),
      complete({
        name: "useObservable",
        signature: "useObservable<T>(observable, initialValue?): T | undefined",
        description:
          "订阅符合最小接口的 Observable，返回最新值；observable 引用变化时自动重订阅，不绑定 RxJS。",
        whenToUse: [
          "已有事件流、WebSocket 消息流或 RxJS Observable，需要把最新值交给 React 渲染。",
          "希望用一个很小的适配层消费第三方流，而不是引入完整状态库。",
          "订阅对象需要随参数变化切换，并自动清理旧订阅。",
        ],
        notFor: [
          "一次性请求——useAsync 已经处理 loading、error 与竞态。",
          "需要订阅 complete / error 回调——当前 hook 只消费 next。",
          "仅用 setState 就能表达的数据，没必要额外包成 Observable。",
        ],
        notes: [
          {
            tone: "warning",
            title: "observable 必须是稳定引用",
            text: "每次渲染都新建 observable 会导致卸载重订阅。用 useMemo 或模块级常量固定它，把变化的参数放进依赖。",
          },
          "subscribe 可以返回 { unsubscribe }、清理函数或 undefined；卸载时都会正确清理。",
          "只处理 observer.next；错误与完成事件不会写入 state。",
          "initialValue 只用于首次 state，后续 observable 变化不会重置它。",
        ],
        usage: [
          {
            title: "实时价格流",
            description:
              "切换刷新间隔会创建新的 observable，hook 自动取消旧订阅并订阅新流。",
            demo: "use-observable/price-stream",
          },
        ],
        api: api(
          "useObservable<T>(observable: ObservableLike<T>, initialValue?: T): T | undefined",
          [
            param(
              "observable",
              "ObservableLike<T>",
              "提供 subscribe(observer) 的对象。",
              { required: true },
            ),
            param("initialValue", "T", "首次渲染使用、订阅前返回的值。"),
          ],
          [
            ret(
              "value",
              "T | undefined",
              "最近一次 next 推送的值；尚未收到时为 initialValue。",
            ),
          ],
        ),
      }),
      complete({
        name: "useGetSet",
        signature: "useGetSet<T>(initial): [() => T, set]",
        description:
          "返回状态 getter，而不是值：get() 读取最新 ref 且不触发渲染，set 仍会更新状态并重渲染。",
        whenToUse: [
          "定时器、事件订阅或异步回调需要读取最新值，但不希望因此重建订阅。",
          "想把「读取」和「渲染」解耦，让某些逻辑拿到 ref 级别的实时值。",
          "需要兼容函数式更新语义的稳定 getter。",
        ],
        notFor: [
          "渲染结果依赖这个值——直接用 useState，读 get() 不会自动更新 UI。",
          "需要多个字段一起更新——useSetState 或 useReducer 更清晰。",
        ],
        notes: [
          "getter 引用恒定，内部始终返回最新 ref，不会因为读取而重渲染。",
          "set 支持值或 updater；即使写入相同值也会触发一次渲染。",
          "初始值支持惰性函数，只解析一次。",
          "不要用 get() 替换 render 阶段需要的 state，否则界面不会随值变化刷新。",
        ],
        usage: [
          {
            title: "定时器读取最新计数",
            description:
              "界面上的计数通过 set 更新；每 500ms 的采样器用 get() 读取最新值，不需要重建 interval。",
            demo: "use-get-set/live-counter",
          },
        ],
        api: api(
          "useGetSet<T>(initialValue: T | (() => T)): [() => T, Dispatch<SetStateAction<T>>]",
          [
            param("initialValue", "T | (() => T)", "初始值或惰性初始值工厂。", {
              required: true,
            }),
          ],
          [
            ret("get", "() => T", "读取最新值，不触发渲染。"),
            ret(
              "set",
              "Dispatch<SetStateAction<T>>",
              "写入新值并触发渲染，支持函数式更新。",
            ),
          ],
        ),
      }),
      complete({
        name: "useSetState",
        signature: "useSetState<T extends object>(initial): [T, patch]",
        description:
          "类似 class 组件的 this.setState：每次只传需要变化的字段，与当前状态做浅合并。",
        whenToUse: [
          "表单包含多个平铺字段，更新时只想改其中一两个。",
          "希望 patch 写法比 setState(prev => ({ ...prev, ... })) 更短。",
          "连续调用多个 patch 时，每次都能基于最新状态合并。",
        ],
        notFor: [
          "需要深层合并嵌套对象——浅合并会把整个子对象替换掉。",
          "状态切换规则复杂、需要多个 action——useReducer 更容易测试和追踪。",
        ],
        notes: [
          "合并只发生在第一层；嵌套对象需要自己展开。",
          "patch 中可以写 undefined，它会覆盖旧字段而不是删除字段。",
          "函数式 patch 能读取最新 state，连续调用不会丢更新。",
          "不提供 setState 那样的回调参数；需要响应更新请用 useEffect。",
        ],
        usage: [
          {
            title: "平铺表单",
            description:
              "每个输入只 patch 自己的字段，其余字段保持不变；下方同时展示合并后的完整对象。",
            demo: "use-set-state/profile-form",
          },
        ],
        api: api(
          "useSetState<T extends object>(initialState: T | (() => T)): [T, (patch: SetStatePatch<T>) => void]",
          [
            param(
              "initialState",
              "T | (() => T)",
              "初始对象或惰性初始化函数。",
              { required: true },
            ),
          ],
          [
            ret("state", "T", "当前合并后的完整对象。"),
            ret(
              "patch",
              "Partial<T> | ((prev: T) => Partial<T>)",
              "浅合并补丁，函数形式可读取最新状态。",
            ),
          ],
        ),
      }),
    ],
  },
  {
    title: "异步",
    items: [
      complete({
        name: "useAsync",
        signature:
          "useAsync<T>(fn, deps?, options?): { value, error, loading }",
        description:
          "在依赖变化时自动执行 async 函数并跟踪 loading / error / value；只允许最后一次执行写入结果。",
        whenToUse: [
          "组件进入或查询参数变化时自动拉取数据。",
          "需要开箱即用的竞态保护，避免旧请求覆盖新结果。",
          "请求依赖尚未就绪时，可以通过 enabled: false 暂停。",
        ],
        notFor: [
          "由点击、提交等事件触发的命令式请求——用 useAsyncFn。",
          "需要真正取消网络请求——hook 只忽略结果，不会 abort fetch。",
          "需要缓存、重试策略或全局数据共享——交给专业数据请求库。",
        ],
        notes: [
          {
            tone: "warning",
            title: "依赖数组相当于 effect 依赖",
            text: "deps 变化就会重新执行；不传 deps 时只在首次挂载执行。函数本身通过事件回调封装，始终读取最新闭包。",
          },
          "每次新执行都会重新进入 loading，并清空上一次 error；失败时 value 会变成 undefined。",
          "只有最新一次执行的 Promise 可以更新状态；卸载后旧 Promise 也不会再写 state。",
          "enabled 变为 false 会让飞行中的结果失效，但不会取消底层请求；返回的 loading 固定为 false。",
        ],
        usage: [
          {
            title: "参数驱动的请求",
            description:
              "切换用户会重新请求。快速连点时，先返回的旧请求不会覆盖后选中的用户。",
            demo: "use-async/request-users",
          },
        ],
        api: api(
          "useAsync<T>(asyncFunction: () => Promise<T>, deps?: DependencyList, options?: UseAsyncOptions<T>): AsyncState<T>",
          [
            param(
              "asyncFunction",
              "() => Promise<T>",
              "要执行的异步函数，内部总是调用最新版本。",
              { required: true },
            ),
            param("deps", "DependencyList", "重新执行的依赖。", {
              defaultValue: "[]",
            }),
            param("options.initialValue", "T", "首次渲染时的 value。"),
            param("options.enabled", "boolean", "为 false 时暂停执行。", {
              defaultValue: "true",
            }),
          ],
          [
            ret("value", "T | undefined", "最近一次成功执行的结果。"),
            ret("error", "Error | undefined", "最近一次失败的原因。"),
            ret("loading", "boolean", "当前是否有有效执行在进行。"),
          ],
        ),
      }),
      complete({
        name: "useAsyncFn",
        signature: "useAsyncFn<T, Args>(fn, deps?): [state, run]",
        description:
          "把任意 async 函数包装成带状态的命令式回调；调用时才执行，错误写入 state 并继续向调用方抛出。",
        whenToUse: [
          "点击保存、提交表单、手动搜索等由用户事件触发的异步操作。",
          "需要自己决定何时调用，而不是依赖变化自动执行。",
          "调用方希望用 try / catch 处理失败，同时在界面上展示 loading 与 error。",
        ],
        notFor: [
          "组件挂载后自动加载——useAsync 更省代码。",
          "需要取消请求或并行执行多份独立状态——当前 hook 只保留最后一次调用。",
        ],
        notes: [
          "run 会立即进入 loading；成功时返回结果，失败时先记录 error，再重新抛出原错误。",
          "连续调用时只有最后一次调用的结果能写入 state，较早的调用仍会向各自调用方返回。",
          "deps 只影响 run 的引用；函数体本身通过 useEventCallback 读取最新闭包。",
          "不会自动执行，首次 state 是 value: undefined、error: undefined、loading: false。",
        ],
        usage: [
          {
            title: "手动保存",
            description:
              "点击按钮才调用保存函数；输入为空会失败，错误同时显示在界面上，并被 submit 里的 catch 消费。",
            demo: "use-async-fn/save-profile",
          },
        ],
        api: api(
          "useAsyncFn<T, Args extends unknown[]>(asyncFunction: (...args: Args) => Promise<T>, deps?: DependencyList): [AsyncFnState<T>, AsyncFn<Args, T>]",
          [
            param(
              "asyncFunction",
              "(...args: Args) => Promise<T>",
              "要包装的异步函数。",
              { required: true },
            ),
            param("deps", "DependencyList", "控制 run 引用是否重建。", {
              defaultValue: "[]",
            }),
          ],
          [
            ret(
              "state",
              "{ value; error; loading }",
              "最近一次有效调用的状态。",
            ),
            ret(
              "run",
              "(...args: Args) => Promise<T>",
              "执行异步函数；成功返回结果，失败重新抛出。",
            ),
          ],
        ),
      }),
      complete({
        name: "useAsyncRetry",
        signature:
          "useAsyncRetry<T>(fn, deps?): { value, error, loading, retry }",
        description:
          "useAsync 加一个 retry()：保留自动执行与竞态保护，失败后可以由用户手动重试。",
        whenToUse: [
          "自动加载的数据可能临时失败，需要在错误提示旁放一个「重试」。",
          "希望 retry 也遵守最后一次请求获胜的规则。",
          "不需要自定义重试次数或指数退避，只要一个明确的手动入口。",
        ],
        notFor: [
          "需要自动重试、退避或熔断——在数据请求库或业务层实现。",
          "需要 enabled / initialValue 这类高级选项——直接用 useAsync 自行管理 attempt。",
        ],
        notes: [
          "retry 通过递增内部 attempt 触发 useAsync 重新执行，引用保持稳定。",
          "deps 变化仍会自动请求；重试与依赖变化共用同一套竞态保护。",
          "reset 不存在，retry 只重新执行，不会清空已有 value 或 error。",
          "多次点击 retry 会依次发起请求，只有最后一次结果会落盘。",
        ],
        usage: [
          {
            title: "失败后手动重试",
            description:
              "前两次请求会被模拟为失败，点击「重试」后第三次成功；加载期间按钮会禁用。",
            demo: "use-async-retry/flaky-request",
          },
        ],
        api: api(
          "useAsyncRetry<T>(asyncFunction: () => Promise<T>, deps?: DependencyList): AsyncState<T> & { retry: () => void }",
          [
            param("asyncFunction", "() => Promise<T>", "要执行的异步函数。", {
              required: true,
            }),
            param("deps", "DependencyList", "重新执行依赖。", {
              defaultValue: "[]",
            }),
          ],
          [
            ret("value", "T | undefined", "最近一次成功结果。"),
            ret("error", "Error | undefined", "最近一次错误。"),
            ret("loading", "boolean", "当前请求是否进行中。"),
            ret("retry", "() => void", "重新执行一次 async 函数。"),
          ],
        ),
      }),
    ],
  },
  {
    title: "浏览器与环境",
    items: [
      complete({
        name: "useMedia",
        signature: "useMedia(query: string): boolean",
        description:
          "订阅一条 CSS 媒体查询，返回当前是否命中；首屏直接读取浏览器状态，SSR 时固定为 false。",
        whenToUse: [
          "React 渲染逻辑需要知道断点命中情况，例如选择桌面或移动端布局。",
          "需要响应 prefers-reduced-motion、prefers-color-scheme 等系统偏好。",
          "希望首屏就拿到真实值，避免先渲染错误布局再被 effect 纠正。",
        ],
        notFor: [
          "纯样式切换——优先写 CSS 媒体查询，不需要经过 React。",
          "监听某个元素的尺寸——useMedia 只认媒体查询，元素尺寸用 ResizeObserver。",
          "窗口每次 resize 的精确像素值——useWindowSize 更直接。",
        ],
        notes: [
          "基于 useSyncExternalStore 订阅 matchMedia，query 变化时会自动换订阅。",
          "服务端快照固定为 false；客户端 hydration 后会立刻校正。",
          "查询语法非法或 matchMedia 不可用时返回 false。",
          "只监听命中状态变化，不会在每次 resize 时触发重渲染。",
        ],
        usage: [
          {
            title: "断点与系统偏好",
            description:
              "调整浏览器宽度，卡片布局与命中结果会一起更新；开启「减少动态效果」也能看到变化。",
            demo: "use-media/breakpoints",
          },
        ],
        api: api(
          "useMedia(query: string): boolean",
          [
            param("query", "string", "任意合法的 CSS 媒体查询。", {
              required: true,
            }),
          ],
          [ret("matches", "boolean", "当前查询是否命中。")],
        ),
      }),
      complete({
        name: "useWindowSize",
        signature: "useWindowSize(): { width, height }",
        description:
          "跟踪窗口可视区域尺寸，resize 时更新；尺寸不变时保持快照引用稳定。",
        whenToUse: [
          "需要窗口宽高的具体数值，而不是某个断点是否命中。",
          "根据视口尺寸计算列数、图表宽高或虚拟列表高度。",
          "需要 SSR 安全，客户端首帧直接拿到真实尺寸。",
        ],
        notFor: [
          "容器或元素自身尺寸——窗口尺寸与元素尺寸不是一回事，用 ResizeObserver。",
          "只需要响应式样式——CSS 媒体查询更便宜。",
          "移动端键盘弹出导致的 visualViewport 变化——当前实现只监听 window resize。",
        ],
        notes: [
          "服务端返回 0×0，客户端首次渲染会同步读取真实 innerWidth / innerHeight。",
          "只有宽或高变化时才创建新对象，避免 useSyncExternalStore 的无谓更新。",
          "只监听 window resize；缩放、旋转通常也会触发，但 visualViewport 的独立变化不一定。",
        ],
        usage: [
          {
            title: "视口尺寸",
            description:
              "拖动浏览器窗口大小，像素值与下方的视口比例条会同步变化。",
            demo: "use-window-size/viewport",
          },
        ],
        api: api(
          "useWindowSize(): WindowSize",
          [],
          [
            ret("width", "number", "window.innerWidth。"),
            ret("height", "number", "window.innerHeight。"),
          ],
        ),
      }),
      complete({
        name: "useLocation",
        signature: "useLocation(): { href, origin, pathname, search, hash }",
        description:
          "跟踪当前地址，同时监听 popstate、hashchange 以及 pushState / replaceState，因此编程式导航也能被感知。",
        whenToUse: [
          "需要在非路由组件里读取当前 pathname、query 或 hash。",
          "页面内有代码通过 history.pushState / replaceState 更新地址，希望 UI 同步。",
          "需要订阅 href 变化来同步埋点、面包屑或页面标题。",
        ],
        notFor: [
          "需要使用路由参数、嵌套路由或导航守卫——用路由库自带的 location / params。",
          "需要监听 history.state 对象——当前 hook 只返回 URL 的字符串部分。",
        ],
        notes: [
          {
            tone: "info",
            title: "会包装 history 方法",
            text: "存在订阅者时会替换 history.pushState / replaceState 并在调用后派发事件；最后一个订阅者卸载时恢复原方法。",
          },
          "pathname 不含 query 与 hash；search 保留开头的 ?，hash 保留开头的 #。",
          "地址不变时返回对象引用稳定，可以直接作为 effect 或 memo 依赖。",
          "服务端渲染返回所有字段为空字符串。",
        ],
        usage: [
          {
            title: "响应编程式导航",
            description:
              "按钮通过 history.replaceState 写入 query 参数；hook 立即返回新的 search，而不会刷新页面。",
            demo: "use-location/query-param",
          },
        ],
        api: api(
          "useLocation(): LocationState",
          [],
          [
            ret("href", "string", "完整 URL。"),
            ret("origin", "string", "协议 + 主机 + 端口。"),
            ret("pathname", "string", "URL 路径，不含 query 与 hash。"),
            ret("search", "string", "查询字符串，包含开头的 ?。"),
            ret("hash", "string", "片段标识，包含开头的 #。"),
          ],
        ),
      }),
      complete({
        name: "useFullscreen",
        signature:
          "useFullscreen(ref, options?): { isFullscreen, supported, enter, exit, toggle }",
        description:
          "让指定元素进入或退出全屏，兼容标准 API 与 Safari 的 webkit 前缀，并跟踪当前是否全屏。",
        whenToUse: [
          "图片、视频、编辑器或演示面板需要沉浸式查看。",
          "需要自己渲染全屏按钮，而不是依赖 video controls。",
          "需要知道当前环境是否支持全屏，并优雅禁用入口。",
        ],
        notFor: [
          "希望自动进入全屏——浏览器要求用户手势，通常必须由点击触发。",
          "只需视频原生全屏按钮——直接使用 controls 即可。",
        ],
        notes: [
          {
            tone: "warning",
            title: "enter / exit 可能 reject",
            text: "全屏请求依赖用户手势，也可能被 iframe 权限或浏览器策略拒绝；调用方应该 catch 并给出提示。",
          },
          "supported 只表示 API 是否存在，不能保证当前 iframe 或浏览器设置一定允许进入。",
          "toggle 检查文档级全屏元素：只要页面有任意元素全屏，它会先退出，而不是只针对 ref。",
          "onEnter / onExit 由全屏状态变化事件触发，可通过 options 接入埋点。",
        ],
        usage: [
          {
            title: "全屏预览",
            description:
              "点击进入全屏，再次点击退出；嵌入环境拒绝请求时会显示可读的错误提示。",
            demo: "use-fullscreen/preview-panel",
          },
        ],
        api: api(
          "useFullscreen<T extends HTMLElement>(ref: RefObject<T | null>, options?: UseFullscreenOptions): UseFullscreenResult",
          [
            param("ref", "RefObject<T | null>", "要全屏的元素引用。", {
              required: true,
            }),
            param("options.onEnter", "() => void", "进入全屏后的回调。"),
            param("options.onExit", "() => void", "退出全屏后的回调。"),
          ],
          [
            ret("isFullscreen", "boolean", "当前 ref 元素是否处于全屏。"),
            ret("supported", "boolean", "当前环境是否暴露全屏 API。"),
            ret("enter", "() => Promise<void>", "请求进入全屏。"),
            ret("exit", "() => Promise<void>", "退出全屏。"),
            ret("toggle", "() => Promise<void>", "在进入与退出之间切换。"),
          ],
        ),
      }),
      complete({
        name: "useVideo",
        signature: "useVideo(ref): UseVideoResult",
        description:
          "跟踪 video 元素的状态，并提供播放、暂停、seek、音量、静音与倍速控制，方便完全自定义播放器 UI。",
        whenToUse: [
          "需要自定义播放器工具栏，而不是使用原生 controls。",
          "需要把播放进度、音量、倍速或缓冲状态同步到 React 界面。",
          "需要在业务操作中调用 play、pause 或 seek。",
        ],
        notFor: [
          "只需要最简单的视频播放——原生 controls 更省事，可访问性也由浏览器负责。",
          "需要 HLS / DASH 解码、字幕轨或画中画增强——在原生能力外再封装。",
        ],
        notes: [
          "必须先把 ref 挂到 video 元素上；hook 在 effect 中读取 ref.current 并订阅媒体事件。",
          "play() 可能因为自动播放策略或网络问题 reject，调用方应 catch。",
          "seek 与 setVolume 会自动夹到合法范围内，避免负数和越界。",
          "buffered 是浏览器提供的 TimeRanges 实时对象，playbackRate、readyState 等字段直接来自 video 元素。",
        ],
        usage: [
          {
            title: "自定义播放器",
            description:
              "播放状态、进度、音量与倍速都由 hook 同步；拖动进度条或切换倍速会直接操作 video 元素。",
            demo: "use-video/custom-controls",
          },
        ],
        api: api(
          "useVideo(ref: RefObject<HTMLVideoElement | null>): UseVideoResult",
          [
            param(
              "ref",
              "RefObject<HTMLVideoElement | null>",
              "已经挂到 video 元素上的引用。",
              { required: true },
            ),
          ],
          [
            ret("playing", "boolean", "是否正在播放。"),
            ret("currentTime", "number", "当前播放时间（秒）。"),
            ret("duration", "number", "总时长（秒）；未知时为 0。"),
            ret("volume", "number", "音量，0 到 1。"),
            ret("muted", "boolean", "是否静音。"),
            ret("playbackRate", "number", "播放倍速。"),
            ret("ended", "boolean", "是否已播放结束。"),
            ret("readyState", "number", "原生媒体 readyState。"),
            ret("buffered", "TimeRanges | null", "原生缓冲区间。"),
            ret("error", "MediaError | null", "原生媒体错误。"),
            ret("play", "() => Promise<void>", "播放视频。"),
            ret("pause", "() => void", "暂停视频。"),
            ret("toggle", "() => Promise<void>", "在播放与暂停之间切换。"),
            ret("seek", "(time: number) => void", "跳转到指定秒数。"),
            ret(
              "setVolume",
              "(volume: number) => void",
              "设置音量并夹到 0–1。",
            ),
            ret("setMuted", "(muted: boolean) => void", "设置静音状态。"),
            ret("setPlaybackRate", "(rate: number) => void", "设置播放倍速。"),
          ],
        ),
      }),
    ],
  },
  {
    title: "交互与可访问性",
    items: [
      complete({
        name: "useClickAway",
        signature: "useClickAway(ref, handler, events?): void",
        description:
          "点击目标区域外时触发回调；默认监听 pointerdown，同时覆盖鼠标、触控笔与触摸。",
        whenToUse: [
          "下拉菜单、Popover、筛选面板需要在点击外部时关闭。",
          "需要监听一组自定义事件，而不是只处理 click。",
          "希望在文档级统一收口，不必给页面加透明遮罩。",
        ],
        notFor: [
          "模态对话框的焦点管理——交给 useFocusTrap 或原生 dialog。",
          "需要区分拖拽起始与普通点击——直接监听具体指针事件更可控。",
        ],
        notes: [
          "ref 尚未挂载或为 null 时不会触发；返回的 handler 始终读取最新闭包，无需担心依赖变化。",
          "目标元素内部的点击不会触发；但点击另一个浮层会同时被两个 useClickAway 视为外部。",
          "events 数组变化会重新绑定监听，尽量传模块级常量。",
          '默认使用 pointerdown，因此触摸设备也能工作；如业务依赖 click，可显式传入 ["click"]。',
        ],
        usage: [
          {
            title: "点击外部关闭菜单",
            description:
              "打开菜单后点击按钮以外任何位置都会关闭，并累计外部关闭次数；菜单内部操作不会误触。",
            demo: "use-click-away/dropdown",
          },
        ],
        api: api(
          "useClickAway<T extends Element>(ref: RefObject<T | null>, handler: (event: ClickAwayEvent) => void, events?: readonly string[]): void",
          [
            param("ref", "RefObject<T | null>", "目标区域的引用。", {
              required: true,
            }),
            param(
              "handler",
              "(event: ClickAwayEvent) => void",
              "点击区域外时触发。",
              { required: true },
            ),
            param("events", "readonly string[]", "要监听的事件名。", {
              defaultValue: '["pointerdown"]',
            }),
          ],
          [ret("void", "void", "该 hook 没有返回值。")],
        ),
      }),
      complete({
        name: "useFocusTrap",
        signature: "useFocusTrap(options): void",
        description:
          "把键盘焦点限制在容器内：双向 Tab 循环、外部聚焦回收、初始焦点与关闭后恢复，嵌套陷阱按栈处理。",
        whenToUse: [
          "自定义模态框、抽屉或命令面板需要严格的键盘焦点约束。",
          "原生 dialog 之外仍需处理 Shift+Tab 与程序化 focus() 逃逸。",
          "需要在打开时聚焦第一个输入框，关闭后把焦点还给触发按钮。",
        ],
        notFor: [
          "普通页面区块或非模态浮层——强制囚禁焦点会让用户无法离开。",
          "只需要关闭后恢复焦点——可以自己保存 activeElement，不必启用完整陷阱。",
        ],
        notes: [
          {
            tone: "info",
            title: "初始焦点优先级",
            text: "initialFocusRef > 容器内带 autofocus 的元素 > 第一个可聚焦元素；如果焦点已经在容器内，则不会强制移动。",
          },
          "焦点恢复只认 returnFocusRef；不传时不会自动猜测打开前的元素。",
          "多个陷阱同时 active 时，后挂载的最上层接管键盘与 focusin，适合对话框里再开确认框。",
          "容器没有可聚焦元素时会临时设置 tabindex=-1，并在停用时移除。",
          "hook 不负责打开或关闭界面，也不处理 Esc；active 由调用方控制。",
        ],
        usage: [
          {
            title: "受限对话框",
            description:
              "打开后焦点进入输入框，Tab 与 Shift+Tab 只在容器内循环；按 Esc 或保存关闭后，焦点回到触发按钮。",
            demo: "use-focus-trap/focus-dialog",
          },
        ],
        api: api(
          "useFocusTrap(options: UseFocusTrapOptions): void",
          [
            param("active", "boolean", "是否启用陷阱。", { required: true }),
            param(
              "containerRef",
              "RefObject<HTMLElement | null>",
              "陷阱边界，通常为对话框根元素。",
              { required: true },
            ),
            param(
              "initialFocusRef",
              "RefObject<HTMLElement | null>",
              "启用后优先聚焦的元素。",
            ),
            param(
              "returnFocusRef",
              "RefObject<HTMLElement | null>",
              "停用后恢复焦点的元素。",
            ),
            param("restoreFocus", "boolean", "停用时是否恢复焦点。", {
              defaultValue: "true",
            }),
          ],
          [ret("void", "void", "该 hook 没有返回值。")],
        ),
      }),
      complete({
        name: "useDropArea",
        signature: "useDropArea(options): { over, bind }",
        description:
          "把任意元素变成拖放区域，维护悬停状态，并把 drop 内容拆成文件、链接和纯文本交给调用方。",
        whenToUse: [
          "上传面板、资源收集器或编辑器需要接收文件和链接。",
          "需要分别处理文件、URI 列表与纯文本，而不是只拿到一个笼统事件。",
          "需要稳定的 over 状态来高亮放置区域，且不希望子元素导致闪烁。",
        ],
        notFor: [
          "只想保存最近一次 drop 的完整内容——useDrop 更省代码。",
          "复杂的拖拽排序或跨列表搬运——需要专门的拖拽库与数据模型。",
        ],
        notes: [
          "必须把 bind 展开到目标元素上；内部已经调用 preventDefault 并设置 dropEffect: copy。",
          "使用 dragenter / dragleave 深度计数，经过子元素时不会误判为离开。",
          "URI 会按行解析并过滤空行与以 # 开头的注释；text/plain 单独读取。",
          "一次 drop 会先按类型触发 onFiles / onUri / onText，再统一触发 onDrop；hook 不做文件校验或上传。",
          "回调通过 useEventCallback 读取最新值，bind 引用在正常使用下保持稳定。",
        ],
        usage: [
          {
            title: "分类接收拖放内容",
            description:
              "把文件、链接或文本拖进区域，四类回调的结果会按类型显示；悬停时边框和底色同步变化。",
            demo: "use-drop-area/drop-zone",
          },
        ],
        api: api(
          "useDropArea<T extends HTMLElement>(options?: UseDropAreaOptions): UseDropAreaResult<T>",
          [
            param(
              "options.onFiles",
              "(files: File[]) => void",
              "收到文件时触发。",
            ),
            param(
              "options.onUri",
              "(uri: string) => void",
              "每个链接触发一次。",
            ),
            param(
              "options.onText",
              "(text: string) => void",
              "收到纯文本时触发。",
            ),
            param(
              "options.onDrop",
              "(payload: DropPayload) => void",
              "一次 drop 完成后的完整结果。",
            ),
          ],
          [
            ret("over", "boolean", "当前是否有内容悬停在区域上方。"),
            ret(
              "bind",
              "DropAreaBindings<T>",
              "需要展开到目标元素上的 drag 事件处理器。",
            ),
          ],
        ),
      }),
      complete({
        name: "useDrop",
        signature: "useDrop<T>(): { over, files, uris, text, bind }",
        description:
          "useDropArea 的便捷版本：自动保存最近一次 drop 的文件、链接与文本，拖离区域时清空结果。",
        whenToUse: [
          "快速做一个文件或文本收集框，不需要自定义每个回调。",
          "需要在界面中直接展示最近一次拖入内容。",
          "希望拖离后自动重置结果。",
        ],
        notFor: [
          "需要按类型执行上传、解析等副作用——useDropArea 的回调更直接。",
          "需要校验文件类型、大小或处理多个 drop 历史——在业务层自行管理。",
        ],
        notes: [
          "只保存最近一次 drop 的内容；新的 drop 会整体替换旧结果。",
          "拖离区域时会重置为空的 files / uris / text，这是它相对 useDropArea 额外做的事。",
          "没有暴露手动 reset，也没有回调参数；需要更多控制时改用 useDropArea。",
          "bind 可直接展开到任意 HTMLElement，over 可用于高亮。",
        ],
        usage: [
          {
            title: "快速接收内容",
            description:
              "选中提示文字拖入区域可看到 text；也可以从桌面拖入文件或从浏览器拖入链接。",
            demo: "use-drop/quick-drop",
          },
        ],
        api: api(
          "useDrop<T extends HTMLElement = HTMLElement>(): UseDropResult<T>",
          [],
          [
            ret("over", "boolean", "是否有内容悬停。"),
            ret("files", "File[]", "最近一次 drop 的文件。"),
            ret("uris", "string[]", "最近一次 drop 的链接列表。"),
            ret("text", "string", "最近一次 drop 的纯文本。"),
            ret(
              "bind",
              "DropAreaBindings<T>",
              "展开到目标元素上的事件处理器。",
            ),
          ],
        ),
      }),
      complete({
        name: "useStartTyping",
        signature: "useStartTyping(): boolean",
        description:
          "检测用户是否开始在页面空白处输入；输入框、文本域、下拉框、contentEditable 与快捷键都会被忽略。",
        whenToUse: [
          "按任意字符聚焦搜索框，类似 GitHub 或站内文档的快捷搜索。",
          "空白处开始输入时打开命令面板。",
          "需要一个只触发一次的「用户开始输入」信号。",
        ],
        notFor: [
          "监听特定快捷键组合——实现一个 keydown 处理器更明确。",
          "需要区分输入过程与输入结束——当前 hook 没有配套状态。",
        ],
        notes: [
          "一旦检测到有效输入就保持 true，直到组件重新挂载；hook 不提供重置方法。",
          "带 Meta、Ctrl 或 Alt 的快捷键会被忽略；Shift 单独不忽略。",
          "button、checkbox、radio 等非文本 input 以及任意可编辑控件都不会触发。",
          "监听挂在 document 上，组件卸载时自动移除。",
        ],
        usage: [
          {
            title: "空白处开始输入",
            description:
              "先点击演示区空白处，再按任意字母键；在输入框内打字不会触发。点「重新开始」可重置状态。",
            demo: "use-start-typing/typing-probe",
          },
        ],
        api: api(
          "useStartTyping(): boolean",
          [],
          [ret("isTyping", "boolean", "是否已经检测到有效输入。")],
        ),
      }),
      complete({
        name: "usePageLeave",
        signature: "usePageLeave(onLeave?): boolean",
        description:
          "鼠标离开页面边界时触发回调并返回 true；重新进入页面后自动重置，适合离开意图提示或埋点。",
        whenToUse: [
          "需要在用户把鼠标移出页面时记录一次离开事件。",
          "想在离开时展示挽留提示、保存草稿或暂停自动刷新。",
          "需要页内离开状态的布尔值用于视觉反馈。",
        ],
        notFor: [
          "检测标签页切换或浏览器最小化——用 visibilitychange / blur。",
          "检测移动端返回手势——mouseout 不覆盖触摸场景。",
          "可靠的卸载前保存——使用 beforeunload 或页面生命周期 API。",
        ],
        notes: [
          "通过 mouseout 的 relatedTarget === null 判断鼠标移出整个文档，而不是在页面内换元素。",
          "每次离开都会调用 onLeave；快速移出再移回会依次触发离开与重置。",
          "只监听鼠标事件，触摸设备上通常不会触发。",
          "onLeave 始终读取最新闭包，无需把它加入依赖。",
        ],
        usage: [
          {
            title: "离开页面计数",
            description:
              "把鼠标移出浏览器窗口再移回来，状态会先变为「已离开」，随后恢复并累加次数。",
            demo: "use-page-leave/leave-counter",
          },
        ],
        api: api(
          "usePageLeave(onLeave?: () => void): boolean",
          [param("onLeave", "() => void", "每次离开页面时触发。")],
          [ret("isLeft", "boolean", "鼠标当前是否已经离开页面。")],
        ),
      }),
    ],
  },
  {
    title: "性能与工具",
    items: [
      complete({
        name: "useVirtualList",
        signature:
          "useVirtualList(options): { start, end, totalHeight, offsetTop }",
        description:
          "固定行高虚拟滚动的区间计算：根据总条数、行高、视口高度和 scrollTop 算出当前该渲染哪一段。",
        whenToUse: [
          "长列表、日志流、表格只希望渲染可视区与少量 overscan 行。",
          "需要可单测的纯位置计算，而不是一个绑定 DOM 的完整虚拟列表组件。",
          "行高固定，希望区间计算保持 O(1)。",
        ],
        notFor: [
          "动态高度内容——固定行高公式不适用，需要测量与缓存。",
          "默认就只渲染几十行——直接 map 更简单。",
          "需要内置滚动容器与交互——这个 hook 只算区间，滚动与渲染由你负责。",
        ],
        notes: [
          "消费方需要自己维护 scrollTop、设置容器高度，并用 totalHeight / offsetTop 撑开与偏移内容。",
          "end 是开区间，适合直接用于 slice(start, end)；start 会被夹到合法范围。",
          "overscan 默认 4，会在可视区上下各多渲染 4 行，过快滚动时可通过它减少白屏。",
          "itemHeight 最小按 1 处理，count 最小按 0 处理，避免除零与负高度。",
        ],
        usage: [
          {
            title: "一万行列表",
            description:
              "滚动容器里有 10,000 行数据，但实际只渲染可视区加 overscan；右上角会显示当前区间。",
            demo: "use-virtual-list/large-list",
          },
        ],
        api: api(
          "useVirtualList(options: UseVirtualListOptions): VirtualListRange",
          [
            param("count", "number", "列表总条数。", { required: true }),
            param("itemHeight", "number", "每行固定高度。", {
              required: true,
            }),
            param("viewportHeight", "number", "可视区域高度。", {
              required: true,
            }),
            param("scrollTop", "number", "当前滚动距离。", { required: true }),
            param("overscan", "number", "视口外额外渲染的行数。", {
              defaultValue: "4",
            }),
          ],
          [
            ret("start", "number", "起始下标（含）。"),
            ret("end", "number", "结束下标（不含）。"),
            ret("totalHeight", "number", "撑开滚动条的总高度。"),
            ret("offsetTop", "number", "渲染内容需要偏移的距离。"),
          ],
        ),
      }),
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
      complete({
        name: "useDebounce",
        signature: "useDebounce(fn, delay?): DebouncedFunction",
        description:
          "对函数做尾部防抖：连续触发时只在最后一次调用后 delay 毫秒执行一次，并提供 cancel、flush 与 pending。",
        whenToUse: [
          "搜索输入停止后提交、自动保存草稿。",
          "需要在事件层取消等待中的调用，或立即把最后一批参数执行掉。",
          "希望回调始终读取最新闭包，但函数引用保持稳定。",
        ],
        notFor: [
          "只需要延迟一个值——useDebouncedValue 更直接，不需要手动调用。",
          "需要固定频率执行（滚动进度、拖拽坐标）——useThrottle 更合适。",
          "需要 leading 首次立即执行——当前 useDebounce 只支持尾部执行。",
        ],
        notes: [
          "只保留最后一次调用的参数；flush 会立即执行这次待处理调用。",
          "cancel 清空待处理参数与定时器；pending() 返回是否还有等待中的调用。",
          "返回函数在 delay 不变时引用稳定，内部总是调用最新的 fn。",
          "组件卸载时自动 cancel，不会在卸载后执行。",
        ],
        usage: [
          {
            title: "可取消的搜索",
            description:
              "输入停止 600ms 后才提交查询；等待期间可以 cancel，或 flush 立即执行最后一次输入。",
            demo: "use-debounce/live-search",
          },
        ],
        api: api(
          "useDebounce<Args extends unknown[]>(fn: (...args: Args) => void, delay?: number): DebouncedFunction<Args>",
          [
            param(
              "fn",
              "(...args: Args) => void",
              "要防抖的函数，始终使用最新版本。",
              { required: true },
            ),
            param("delay", "number", "停止触发后的等待毫秒数。", {
              defaultValue: "300",
            }),
          ],
          [
            ret("debounced", "(...args: Args) => void", "防抖后的可调用函数。"),
            ret("debounced.cancel", "() => void", "取消尚未执行的调用。"),
            ret("debounced.flush", "() => void", "立即执行尚未执行的调用。"),
            ret("debounced.pending", "() => boolean", "是否有等待中的调用。"),
          ],
        ),
      }),
      complete({
        name: "useThrottle",
        signature: "useThrottle(fn, wait?, options?): ThrottledFunction",
        description:
          "函数节流：wait 毫秒内最多执行一次，默认首次立即执行、窗口结束时补一次，并提供 cancel / flush。",
        whenToUse: [
          "滚动、鼠标移动、拖拽等高频事件只需要固定频率响应。",
          "需要限制埋点或网络上报频率，同时保留最后一次输入。",
          "希望首帧立即响应，再以稳定频率更新。",
        ],
        notFor: [
          "输入停止后才执行——用 useDebounce。",
          "需要严格每帧对齐——requestAnimationFrame 更合适。",
          "需要执行结果并合并返回——当前函数只负责触发，不返回回调结果。",
        ],
        notes: [
          "leading 默认 true，trailing 默认 true；两者都关闭时函数不会执行。",
          "trailing 调用总是使用窗口内最后一次参数。",
          "cancel 只取消尾部调用；flush 会立即执行等待中的尾部参数。",
          "函数引用在 wait / leading / trailing 配置不变时保持稳定，内部始终调用最新 fn。",
        ],
        usage: [
          {
            title: "节流鼠标采样",
            description:
              "快速移动鼠标会累积大量原始事件，但坐标更新最多每 250ms 执行一次；可试 flush 与 cancel。",
            demo: "use-throttle/pointer-sample",
          },
        ],
        api: api(
          "useThrottle<Args extends unknown[]>(fn: (...args: Args) => void, wait?: number, options?: ThrottleOptions): ThrottledFunction<Args>",
          [
            param("fn", "(...args: Args) => void", "要节流的函数。", {
              required: true,
            }),
            param("wait", "number", "节流窗口毫秒数。", {
              defaultValue: "300",
            }),
            param("options.leading", "boolean", "窗口开始时是否立即执行。", {
              defaultValue: "true",
            }),
            param("options.trailing", "boolean", "窗口结束时是否补一次调用。", {
              defaultValue: "true",
            }),
          ],
          [
            ret("throttled", "(...args: Args) => void", "节流后的可调用函数。"),
            ret("throttled.cancel", "() => void", "取消等待中的尾部调用。"),
            ret("throttled.flush", "() => void", "立即执行等待中的尾部调用。"),
          ],
        ),
      }),
      complete({
        name: "useEventCallback",
        signature: "useEventCallback<Args, Result>(fn): (...args) => Result",
        description:
          "返回引用恒定的回调，但内部总是执行最新的函数；适合事件监听、定时器与订阅。",
        whenToUse: [
          "把回调传给 setInterval、事件监听或第三方订阅，不希望因闭包变化反复解绑。",
          "需要在稳定回调里读取最新的 props / state。",
          "希望避免 useEffect 依赖里加入一个每次都新建的函数。",
        ],
        notFor: [
          "需要缓存昂贵计算结果——用 useMemo / useCallback。",
          "需要延迟执行或限制频率——用 useDebounce / useThrottle。",
          "需要把最新回调暴露给父组件并期望父组件感知变化——稳定引用本身不会触发子组件更新。",
        ],
        notes: [
          "函数引用在组件生命周期内保持不变；实现用 ref + useLayoutEffect 保存最新 fn。",
          "它只解决回调读取最新值的问题，不会让消费该回调的组件跳过渲染。",
          "可以把参数原样传给内部函数，并把返回值返回给调用方。",
          "不要在 render 期间制造依赖执行时机的副作用；事件与 effect 才是它的主场。",
        ],
        usage: [
          {
            title: "定时器读取最新值",
            description:
              "interval 只创建一次，但每秒回调都能读到当前 value；点击按钮改变值不会重置计时器。",
            demo: "use-event-callback/latest-interval",
          },
        ],
        api: api(
          "useEventCallback<Args extends unknown[], Result>(fn: (...args: Args) => Result): (...args: Args) => Result",
          [
            param("fn", "(...args: Args) => Result", "要包装的最新函数。", {
              required: true,
            }),
          ],
          [
            ret(
              "callback",
              "(...args: Args) => Result",
              "引用稳定的回调，调用时执行最新 fn。",
            ),
          ],
        ),
      }),
      complete({
        name: "useCopyToClipboard",
        signature: "useCopyToClipboard(): [state, copy]",
        description:
          "复制文本到剪贴板，优先使用 Clipboard API，不可用时退回 textarea + execCommand，并返回成功状态。",
        whenToUse: [
          "代码块、分享链接、安装命令旁边需要复制按钮。",
          "需要知道最近一次复制是否成功，并向屏幕阅读器播报。",
          "需要在非安全上下文或旧浏览器里仍尽量可用。",
        ],
        notFor: [
          "富文本、图片或文件复制——当前只处理字符串。",
          "需要权限申请流程或剪贴板读取——hook 只提供写入。",
        ],
        notes: [
          "copy 不会抛出错误：成功返回 true，失败返回 false，同时把原因写入 state.error。",
          "Clipboard API 只在安全上下文可用；否则自动走隐藏 textarea 的降级路径。",
          "state.copied 不会自动过期，界面如需短暂提示请自行加定时器重置。",
          "多个 copy 并发时没有请求序号保护，以最后完成的操作为准。",
        ],
        usage: [
          {
            title: "复制安装命令",
            description:
              "编辑文本后点击复制，按钮与状态区会显示最近一次成功写入的内容。",
            demo: "use-copy-to-clipboard/copy-snippet",
          },
        ],
        api: api(
          "useCopyToClipboard(): [CopyToClipboardState, CopyToClipboard]",
          [],
          [
            ret(
              "state.value",
              "string | undefined",
              "最近一次成功复制的文本。",
            ),
            ret("state.error", "Error | undefined", "最近一次失败的原因。"),
            ret("state.copied", "boolean", "最近一次操作是否成功。"),
            ret(
              "copy",
              "(text: string) => Promise<boolean>",
              "复制文本；成功为 true，失败为 false。",
            ),
          ],
        ),
      }),
      complete({
        name: "useLocalStorage",
        signature:
          "useLocalStorage<T>(key, initial, options?): [T, set, remove]",
        description:
          "把状态持久化到 localStorage：首次渲染同步读取，set 同步写回，并监听其他标签页的 storage 修改。",
        whenToUse: [
          "主题、语言、侧栏宽度、上次访问的筛选条件等轻量偏好。",
          "希望刷新后保留，但不需要服务端同步的数据。",
          "需要自定义 JSON 之外的序列化格式。",
        ],
        notFor: [
          "敏感令牌或隐私数据——localStorage 可被同源脚本读取。",
          "大文件或大量结构化数据——容量小且同步 API 会阻塞主线程。",
          "需要同一页面多个组件实时共享——storage 事件只跨标签页触发。",
        ],
        notes: [
          "首次渲染会同步读取，避免先展示默认值再闪一下；读取或解析失败会回退到 initial。",
          "set 支持函数式更新，并立即写入存储；配额或权限错误被吞掉，内存状态仍然更新。",
          "remove 会删除 key，并把状态恢复为首次挂载时解析出的 initial。",
          "storage 事件只在其他标签页修改时触发；同一标签页内的多个 hook 实例不会自动同步。",
          "key 变化不会重新读取已有值；需要切换命名空间时，让调用组件重新挂载。",
        ],
        usage: [
          {
            title: "持久化笔记",
            description:
              "输入内容会立刻写入 localStorage，刷新页面仍会保留；在另一个标签页修改也能看到同步。",
            demo: "use-local-storage/persisted-note",
          },
        ],
        api: api(
          "useLocalStorage<T>(key: string, initialValue: T | (() => T), options?: UseLocalStorageOptions<T>): [T, Dispatch<SetStateAction<T>>, () => void]",
          [
            param("key", "string", "localStorage 键名。", { required: true }),
            param(
              "initialValue",
              "T | (() => T)",
              "没有存储值时的初始值，支持惰性初始化。",
              { required: true },
            ),
            param(
              "options.serializer",
              "(value: T) => string",
              "自定义序列化，默认 JSON.stringify。",
            ),
            param(
              "options.deserializer",
              "(raw: string) => T",
              "自定义反序列化，默认 JSON.parse。",
            ),
          ],
          [
            ret("value", "T", "当前持久化状态。"),
            ret(
              "setValue",
              "Dispatch<SetStateAction<T>>",
              "更新状态并同步写入存储。",
            ),
            ret("remove", "() => void", "删除存储项并恢复初始值。"),
          ],
        ),
      }),
      complete({
        name: "useLockBodyScroll",
        signature: "useLockBodyScroll(locked = true): void",
        description:
          "锁定 body 滚动，内部使用全局引用计数支持多个弹窗同时锁定，并在首次锁定时补偿滚动条宽度。",
        whenToUse: [
          "模态框、抽屉、全屏导航打开时阻止背景滚动。",
          "多个浮层可能重叠，需要等最后一个关闭后才恢复滚动。",
          "希望避免锁定滚动条时页面内容横向跳动。",
        ],
        notFor: [
          "只锁定某个局部滚动容器——直接控制容器样式更合适。",
          "需要在锁定期间允许背景滚动——这个 hook 的语义就是全局禁止。",
        ],
        notes: [
          "引用计数是模块级的：任意组件卸载都会正确递减，最后一个释放时恢复原始 overflow 与 paddingRight。",
          "只在第一次锁定时保存原始样式并计算滚动条宽度，后续嵌套锁不会重复叠加 padding。",
          "locked 为 false 或服务端环境时不执行任何操作。",
          "hook 只改样式，不负责让抽屉本身可滚动或可关闭。",
        ],
        usage: [
          {
            title: "抽屉锁定背景",
            description:
              "打开抽屉后尝试滚动文档背景；关闭抽屉时原始样式会自动恢复。",
            demo: "use-lock-body-scroll/scroll-drawer",
          },
        ],
        api: api(
          "useLockBodyScroll(locked?: boolean): void",
          [
            param("locked", "boolean", "是否锁定 body 滚动。", {
              defaultValue: "true",
            }),
          ],
          [ret("void", "void", "该 hook 没有返回值。")],
        ),
      }),
      complete({
        name: "useTitle",
        signature: "useTitle(title, options?): void",
        description:
          "设置 document.title；可选择在组件卸载时恢复挂载前的标题，适合路由切换、详情页与弹窗。",
        whenToUse: [
          "页面级组件需要根据当前内容更新浏览器标签页标题。",
          "打开全屏编辑、演示或专注模式时临时改标题。",
          "希望组件卸载后自动恢复进入前的标题。",
        ],
        notFor: [
          "需要动态 OG 标题或服务端 SEO——应在服务端渲染时输出 head。",
          "多个页面同时存在且都调用 useTitle——last writer wins，会互相覆盖。",
        ],
        notes: [
          "title 变化时立即写入 document.title；服务端环境直接跳过。",
          "原始标题只在首次 effect 时记录一次；restoreOnUnmount 默认 false。",
          "恢复逻辑是「谁卸载谁写回自己记下的原标题」，多个订阅者会互相覆盖，非路由页面不要滥用。",
          "空字符串也会被设置为标题，hook 不会自动回退到默认值。",
        ],
        usage: [
          {
            title: "修改标签页标题",
            description:
              "输入新标题后观察浏览器标签页；点「还原」回到演示打开时的标题，组件卸载时也会自动恢复。",
            demo: "use-title/page-title",
          },
        ],
        api: api(
          "useTitle(title: string, options?: UseTitleOptions): void",
          [
            param("title", "string", "要设置的页面标题。", {
              required: true,
            }),
            param(
              "options.restoreOnUnmount",
              "boolean",
              "卸载时是否恢复挂载前的标题。",
              { defaultValue: "false" },
            ),
          ],
          [ret("void", "void", "该 hook 没有返回值。")],
        ),
      }),
    ],
  },
];

export const hookDocs = hookGroups.flatMap((group) => group.items);

export const hookByPath = new Map(hookDocs.map((doc) => [doc.path, doc]));

export function hookGroupOf(doc: HookDoc): string {
  const group = hookGroups.find((item) => item.items.includes(doc));
  return group?.title ?? "Hooks";
}
