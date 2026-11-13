import type { Transition } from "motion/react";

import { EASE_DRAWER, EASE_OUT } from "../motion";

/**
 * 图片切换：分页需要确定的到达，过阻尼的弹簧在最后几像素还会蠕动，
 * 因此切换用 tween 而不是弹簧。
 */
export const IMAGE_VIEWER_SLIDE_TRANSITION: Transition = {
  type: "tween",
  duration: 0.28,
  ease: EASE_DRAWER,
};

/** 缩略图 → 灯箱形变与缩放状态切换的共享布局弹簧；出现第二次使用时折回 motion.ts。 */
export const IMAGE_VIEWER_LAYOUT_SPRING: Transition = {
  type: "spring",
  bounce: 0.1,
  duration: 0.36,
};

/**
 * 关闭缩小：tween 保证终点尺寸精确落在占位图尺寸上（弹簧会回弹越界），
 * ease-out 让接近终点时放缓，与面板的延迟淡出同步收尾。
 */
export const IMAGE_VIEWER_CLOSE_SHRINK: Transition = {
  type: "tween",
  duration: 0.32,
  ease: EASE_OUT,
};
