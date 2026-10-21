import type { Transition } from "motion/react";

export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

export const UI_SPRING: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.3,
};

export const OVERLAY_SPRING: Transition = {
  type: "spring",
  bounce: 0.04,
  duration: 0.38,
};

export const INDICATOR_SPRING: Transition = {
  type: "spring",
  bounce: 0.08,
  duration: 0.34,
};

export const REDUCED_MOTION_TRANSITION: Transition = {
  duration: 0.12,
  ease: EASE_OUT,
};
