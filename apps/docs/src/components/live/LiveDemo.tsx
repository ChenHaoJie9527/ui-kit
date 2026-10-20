import {
  Component,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import Editor from "react-simple-code-editor";
import { useCopyToClipboard } from "seam-hooks";
import { createDemoComponent } from "./runtime";
import { CodeHighlight } from "./highlight";

export interface LiveDemoProps {
  /** 默认源码，也是「重置」后的内容。 */
  source: string;
  /** 首屏使用的真实组件，和 source 是同一份实现。 */
  Component: ComponentType;
  /** 代码面板标题。 */
  filename?: string;
  /** 预览区最小高度。 */
  minHeight?: number;
}

interface CompileState {
  Preview: ComponentType;
  error: Error | null;
  /** 每次成功执行递增，用作错误边界的 key。 */
  version: number;
}

const TOOL_BUTTON =
  "cursor-pointer rounded-md border border-white/[0.14] bg-transparent px-[9px] py-[3px] font-mono text-[11px] text-code-ink transition-colors hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";

/** 浅色预览栏上的按钮。 */
const LIGHT_BUTTON =
  "cursor-pointer rounded-md border border-line bg-surface px-[9px] py-[3px] font-mono text-[11px] text-muted transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";

/**
 * 只读代码块。padding 与编辑态的 padding 同一组数值，切换时不跳动；
 * 折行规则也要和编辑器一致，否则切换编辑时折行位置会变。
 */
const CODE_AREA =
  "m-0 px-[18px] py-4 font-mono text-[12.5px] leading-[1.75] break-words whitespace-pre-wrap text-code-ink [tab-size:2]";

/** 叠层编辑器里的两层共用这套排版，字号/行高/字体任何一项不同都会让光标偏移。 */
const EDITOR_CLASS =
  "demo-editor font-mono text-[12.5px] leading-[1.75] [tab-size:2]";

const EDITOR_STYLE = {
  minHeight: 240,
  background: "transparent",
  color: "var(--demo-code-ink)",
} as const;

/** 编辑器要求传函数，提到模块级避免每次渲染新建组件。 */
function highlightCode(code: string) {
  return <CodeHighlight code={code} />;
}

/**
 * 「预览 + 可编辑代码」的示例卡片。
 *
 * 默认渲染真实组件（构建期已经过类型检查）；改动代码后在事件处理里立即
 * 重新编译，失败时保留上一次成功的结果并显示错误。
 */
export function LiveDemo({
  source,
  Component: Demo,
  filename = "Demo.tsx",
  minHeight = 220,
}: LiveDemoProps) {
  const [draft, setDraft] = useState(source);
  const [editing, setEditing] = useState(false);
  const [compiled, setCompiled] = useState<CompileState>({
    Preview: Demo,
    error: null,
    version: 0,
  });
  const [copyState, copy] = useCopyToClipboard();
  const editorRef = useRef<HTMLDivElement>(null);
  const editorId = useId();

  const pristine = draft === source;
  const copied = copyState.copied && copyState.value === draft;

  useEffect(() => {
    if (!editing) {
      return;
    }

    const textarea = editorRef.current?.querySelector("textarea");

    if (!textarea) {
      return;
    }

    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, [editing]);

  /**
   * 编译放在事件处理里而不是 effect / render 里：
   * 失败时直接沿用上一次的组件，不需要在渲染阶段读写 ref。
   */
  const update = (next: string) => {
    setDraft(next);

    if (next === source) {
      setCompiled((previous) => ({
        Preview: Demo,
        error: null,
        version: previous.version + 1,
      }));
      return;
    }

    try {
      const Preview = createDemoComponent(next);

      setCompiled((previous) => ({
        Preview,
        error: null,
        version: previous.version + 1,
      }));
    } catch (caught) {
      setCompiled((previous) => ({
        ...previous,
        error: caught instanceof Error ? caught : new Error(String(caught)),
      }));
    }
  };

  const reset = () => {
    update(source);
    setEditing(false);
  };

  const Preview = compiled.Preview;

  return (
    <div
      className="overflow-hidden rounded-[14px] border border-line bg-surface"
      data-live-demo=""
    >
      <div className="flex h-11 items-center justify-between gap-3 border-b border-line bg-surface-2 px-4">
        <span className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
          <span
            aria-hidden="true"
            className="size-[7px] rounded-full bg-accent"
          />
          实时预览
        </span>
        {pristine ? null : (
          <button type="button" className={LIGHT_BUTTON} onClick={reset}>
            重置
          </button>
        )}
      </div>

      <div className="demo-grid p-[26px] phone:p-[18px]" style={{ minHeight }}>
        <PreviewBoundary key={compiled.version}>
          <Preview />
        </PreviewBoundary>
      </div>

      {compiled.error ? (
        <div
          role="alert"
          className="flex items-start gap-2 border-t border-danger/30 bg-[color-mix(in_srgb,var(--doc-danger)_8%,var(--doc-surface))] px-4 py-2.5 text-[12.5px] leading-relaxed text-danger"
        >
          <span aria-hidden="true" className="mt-px font-mono">
            !
          </span>
          <p className="m-0">
            {compiled.error.message}
            <span className="mt-1 block text-[11.5px] text-danger/80">
              编辑区按 JSX 编译；TypeScript 类型标注需要先移除。
            </span>
          </p>
        </div>
      ) : null}

      <div className="border-t border-line bg-code">
        <div className="flex h-[38px] items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.025] pr-3 pl-4">
          <span className="flex items-baseline gap-2">
            <span className="font-mono text-[10.5px] tracking-[0.04em] text-code-muted">
              {filename}
            </span>
            <span className="font-mono text-[10.5px] text-code-muted/80">
              {editing ? "编辑中 · 自动运行" : "可编辑"}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <button
              type="button"
              className={TOOL_BUTTON}
              onClick={() => {
                void copy(draft);
              }}
            >
              {copied ? "已复制" : "复制"}
            </button>
            <button
              type="button"
              className={TOOL_BUTTON}
              aria-pressed={editing}
              onClick={() => setEditing((value) => !value)}
            >
              {editing ? "完成" : "编辑"}
            </button>
          </span>
        </div>

        {editing ? (
          <div ref={editorRef} className="max-h-[420px] overflow-auto">
            <label className="sr-only" htmlFor={editorId}>
              编辑示例代码
            </label>
            <Editor
              value={draft}
              onValueChange={update}
              highlight={highlightCode}
              padding={{ top: 16, right: 18, bottom: 16, left: 18 }}
              tabSize={2}
              insertSpaces
              textareaId={editorId}
              className={EDITOR_CLASS}
              style={EDITOR_STYLE}
            />
          </div>
        ) : (
          <div className="max-h-[360px] overflow-auto">
            <pre className={CODE_AREA}>
              <CodeHighlight code={draft} />
            </pre>
          </div>
        )}

        <span className="sr-only" aria-live="polite">
          {copied ? "代码已复制到剪贴板" : ""}
        </span>
      </div>
    </div>
  );
}

interface PreviewBoundaryState {
  message: string | null;
}

/** 预览区里的运行时错误不应该把整页打挂；重新编译时通过 key 重置。 */
class PreviewBoundary extends Component<
  { children: ReactNode },
  PreviewBoundaryState
> {
  state: PreviewBoundaryState = { message: null };

  static getDerivedStateFromError(error: unknown): PreviewBoundaryState {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  render() {
    if (this.state.message !== null) {
      return (
        <p role="alert" className="m-0 text-[13px] leading-relaxed text-danger">
          运行时错误：{this.state.message}
        </p>
      );
    }

    return this.props.children;
  }
}
