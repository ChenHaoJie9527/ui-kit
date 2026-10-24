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

export const DISCLOSURE_TRANSITION: Transition = {
  duration: 0.2,
  ease: EASE_IN_OUT,
};

/**
 * Select tags are occasional state indicators. A short re-targeting move
 * keeps the selected queue readable without delaying repeated choices.
 */
export const TAG_TRANSITION: Transition = {
  layout: { duration: 0.16, ease: EASE_IN_OUT },
  opacity: { duration: 0.16, ease: EASE_OUT },
  x: { duration: 0.16, ease: EASE_IN_OUT },
};

/** Frequent explanatory surface: near-immediate presence without spring settle. */
export const TOOLTIP_TRANSITION: Transition = {
  duration: 0.12,
  ease: EASE_OUT,
};

/**
 * Grouped tooltips move between nearby triggers. The short layout spring keeps
 * spatial continuity without delaying the content switch.
 */
export const TOOLTIP_GROUP_TRANSITION: Transition = {
  layout: { type: "spring", bounce: 0, duration: 0.22 },
  opacity: { duration: 0.12, ease: EASE_OUT },
  scale: { duration: 0.12, ease: EASE_OUT },
};

export const REDUCED_MOTION_TRANSITION: Transition = {
  duration: 0.12,
  ease: EASE_OUT,
};
