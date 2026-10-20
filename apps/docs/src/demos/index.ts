import type { ComponentType } from "react";

export interface DemoEntry {
  /** 构建期编译好的真实组件。 */
  Component: ComponentType;
  /** 与组件同源的源码，供编辑器展示与重新编译。 */
  source: string;
}

/**
 * 示例注册表。
 *
 * 约定的目录结构是 `demos/<hook>/<example>.tsx`，id 为去掉扩展名的相对路径，
 * 例如 `use-debounced-value/search`。内容表只保存 id，页面通过 getDemo 取用。
 */
const modules = import.meta.glob<{ Demo?: ComponentType }>("./**/*.tsx", {
  eager: true,
});

const sources = import.meta.glob<string>("./**/*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});

const entries = new Map<string, DemoEntry>();

for (const [file, module] of Object.entries(modules)) {
  const source = sources[file];

  if (!module.Demo || !source) {
    continue;
  }

  entries.set(file.replace(/^\.\//, "").replace(/\.tsx$/, ""), {
    Component: module.Demo,
    source,
  });
}

export function getDemo(id: string): DemoEntry {
  const entry = entries.get(id);

  if (!entry) {
    throw new Error(`未找到示例「${id}」，请检查内容表里的 demo id。`);
  }

  return entry;
}
