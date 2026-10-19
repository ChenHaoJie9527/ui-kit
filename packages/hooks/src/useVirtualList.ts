export interface UseVirtualListOptions {
  /** 列表总条数。 */
  count: number;
  /** 单行高度，固定高度是虚拟滚动的前提。 */
  itemHeight: number;
  /** 可视区域高度。 */
  viewportHeight: number;
  /** 当前滚动距离。 */
  scrollTop: number;
  /** 视口外额外渲染的行数，减少快速滚动时的白屏。 */
  overscan?: number;
}

export interface VirtualListRange {
  /** 起始索引（含）。 */
  start: number;
  /** 结束索引（不含）。 */
  end: number;
  /** 撑开滚动条的总高度。 */
  totalHeight: number;
  /** 可视区域内容需要偏移的距离。 */
  offsetTop: number;
}

/**
 * 固定行高虚拟滚动的区间计算。
 *
 * 把「算哪一段要渲染」抽成纯函数式的 hook，组件只负责把 start/end
 * 映射成数据并渲染。这样逻辑可以单测，也方便复用到表格、树、日志流。
 */
export function useVirtualList({
  count,
  itemHeight,
  viewportHeight,
  scrollTop,
  overscan = 4,
}: UseVirtualListOptions): VirtualListRange {
  const safeItemHeight = Math.max(1, itemHeight);
  const safeCount = Math.max(0, count);

  const visibleCount = Math.ceil(viewportHeight / safeItemHeight);
  const rawStart = Math.floor(scrollTop / safeItemHeight) - overscan;
  const start = Math.min(Math.max(0, rawStart), Math.max(0, safeCount - 1));
  const end = Math.min(safeCount, start + visibleCount + overscan * 2);

  return {
    start,
    end,
    totalHeight: safeCount * safeItemHeight,
    offsetTop: start * safeItemHeight,
  };
}
