/**
 * `scale` 模式的纯几何计算。
 *
 * 这里不读 DOM，只回答三个问题：
 * 1. 每个 slide 应该缩放多少；
 * 2. 缩放后的内容中心应该离视口中心多远；
 * 3. 为了让可见行填满视口，slide 的基础尺寸是多少。
 *
 * 视图层只负责把结果写进 CSS 变量。
 */

export interface CarouselScaleInput {
  /** 视口长度：横向为宽度，纵向为高度。 */
  length: number;
  /** slide 之间的 computed gap（px）。 */
  gap: number;
  /** 可见 slide 数；内部会四舍五入到整数。 */
  visible: number;
  /** 邻居缩放比例；1 表示关闭。 */
  scale: number;
}

export interface CarouselScaleGeometry extends CarouselScaleInput {
  /** 可见数量四舍五入后的值。 */
  resolvedVisible: number;
  /** floor(resolvedVisible / 2)。 */
  side: number;
  /** 单个 slide 的基础内容尺寸（不含 gap）。 */
  base: number;
}

/** 把外部 scale 规整到 0.1–1；1 或非法值返回 undefined（关闭）。 */
export function resolveCarouselScale(
  scale: number | undefined,
): number | undefined {
  if (typeof scale !== "number" || !Number.isFinite(scale)) {
    return undefined;
  }

  const clamped = Math.min(Math.max(scale, 0.1), 1);

  return clamped < 1 ? clamped : undefined;
}

/** 可见数量至少为 1；小数四舍五入，便于几何计算。 */
export function resolveCarouselVisible(visible: number): number {
  if (!Number.isFinite(visible)) {
    return 1;
  }

  return Math.max(1, Math.round(visible));
}

function behindScale(scale: number, side: number): number {
  if (side <= 0) {
    return scale;
  }

  const outer = scale ** side;
  const inner = side >= 1 ? scale ** (side - 1) : 1;

  return outer - 0.6 * (inner - outer);
}

/**
 * 距离中心 distance 个 slide 时的缩放。
 *
 * 可见窗口内按 scale^distance 递减；窗口外平滑过渡到一个更小的
 * “等待在后面”的尺寸，避免远处 slide 继续指数缩小到看不见。
 */
export function getCarouselScaleAt(
  distance: number,
  scale: number,
  side: number,
): number {
  const away = Math.abs(distance);

  if (side <= 0 || away <= 0) {
    return 1;
  }

  if (away <= side) {
    return scale ** away;
  }

  const outer = scale ** side;
  const behind = behindScale(scale, side);

  if (away >= side + 1) {
    return behind;
  }

  const progress = away - side;

  return outer + (behind - outer) * progress;
}

/**
 * 内容中心离中心 slide 内容中心的距离（px）。
 *
 * 对小数 distance 采用相邻整数中心之间的线性插值；这对拖拽中的
 * 连续插值足够稳定，也避免在每帧做复杂积分。
 */
export function getCarouselCenterOffset(
  distance: number,
  base: number,
  gap: number,
  scale: number,
  side: number,
): number {
  const away = Math.abs(distance);
  const whole = Math.floor(away);
  const part = away - whole;
  let offset = 0;

  for (let step = 0; step < whole; step += 1) {
    const current = getCarouselScaleAt(step, scale, side);
    const next = getCarouselScaleAt(step + 1, scale, side);

    offset += (base * current) / 2 + gap + (base * next) / 2;
  }

  if (part > 0) {
    const current = getCarouselScaleAt(whole, scale, side);
    const next = getCarouselScaleAt(whole + 1, scale, side);

    offset += part * ((base * current) / 2 + gap + (base * next) / 2);
  }

  return Math.sign(distance) * offset;
}

/**
 * 计算让可见行填满视口的 slide 基础尺寸。
 *
 * 奇数 visible 时，最外侧 slide 完整可见；偶数时，两侧各露出半张，
 * 因此 edge 只取到最外侧 slide 的中心。
 */
export function getCarouselBaseSize(input: CarouselScaleInput): number {
  const resolvedVisible = resolveCarouselVisible(input.visible);
  const side = Math.floor(resolvedVisible / 2);

  if (side <= 0) {
    return Math.max(0, input.length);
  }

  const center = getCarouselCenterOffset(side, 1, 0, input.scale, side);
  const edge =
    center +
    (resolvedVisible % 2 === 1
      ? getCarouselScaleAt(side, input.scale, side) / 2
      : 0);

  if (!Number.isFinite(edge) || edge <= 0) {
    return 0;
  }

  const base = (input.length / 2 - input.gap * side) / edge;

  return Math.max(0, base);
}

export function getCarouselScaleGeometry(
  input: CarouselScaleInput,
): CarouselScaleGeometry {
  const resolvedVisible = resolveCarouselVisible(input.visible);
  const side = Math.floor(resolvedVisible / 2);
  const base = getCarouselBaseSize({ ...input, visible: resolvedVisible });

  return {
    ...input,
    resolvedVisible,
    side,
    base,
  };
}
