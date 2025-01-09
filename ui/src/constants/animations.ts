export const ANIMATION_DURATIONS = {
  transitionDuration: 500,
  sectionTransitionDuration: 200, // Note that this value should always be less than transitionDuration to avoid flickering data as it loads in.
  imageLoad: 400,
} as const;
