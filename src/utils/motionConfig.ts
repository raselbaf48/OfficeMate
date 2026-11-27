import type { Transition } from 'motion/react';

export const SMOOTH_EASE = [0.22, 1, 0.36, 1] as const;

export const PAGE_TRANSITION: Transition = {
  duration: 0.46,
  ease: SMOOTH_EASE,
};

export const PAGE_EXIT_TRANSITION: Transition = {
  duration: 0.22,
  ease: [0.4, 0, 1, 1],
};

export const PANEL_TRANSITION: Transition = {
  duration: 0.38,
  ease: SMOOTH_EASE,
};

export const ACCORDION_TRANSITION: Transition = {
  duration: 0.34,
  ease: SMOOTH_EASE,
};

export const MODAL_TRANSITION: Transition = {
  duration: 0.38,
  ease: SMOOTH_EASE,
};

export const BACKDROP_TRANSITION: Transition = {
  duration: 0.32,
  ease: SMOOTH_EASE,
};

export const pageVariants = {
  initial: { opacity: 0, y: 14, scale: 0.992 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: PAGE_TRANSITION,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.994,
    transition: PAGE_EXIT_TRANSITION,
  },
};

export const drawerVariants = {
  initial: { opacity: 0, y: -8, scale: 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: PANEL_TRANSITION,
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.985,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const },
  },
};

export const modalPanelVariants = {
  initial: { opacity: 0, y: 18, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: MODAL_TRANSITION,
  },
  exit: {
    opacity: 0,
    y: 12,
    scale: 0.97,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as const },
  },
};
