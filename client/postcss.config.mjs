// PostCSS configuration
// Note: During tests (vitest), this file may be loaded but plugins should be
// properly resolved. If you see "Invalid PostCSS Plugin" errors, ensure
// @tailwindcss/postcss is properly installed.

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
