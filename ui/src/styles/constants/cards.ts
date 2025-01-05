export const cardConstants = {
  CARD_WIDTH: 200,
  CARD_GAP: 16,
  BANNER_HEIGHT: 88,
  CARD_ASPECT_RATIO: '63/88',
  STATS_BANNER_HEIGHT: 24,
  STATS_CORNER_HEIGHT: 200,
  INNER_BORDER_WIDTH: 2,  // Width of the solid inner border
  GLOW_SPREAD: 1,        // How far the glow extends
  GLOW_BLUR: 20,         // How blurry/soft the glow is
  get CORNER_RADIUS() {
    return Math.round((this.CARD_WIDTH * 3.5) / 63);
  }
} as const;
