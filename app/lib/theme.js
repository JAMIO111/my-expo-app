import colors from './colors';

// Appearance mode the user can pick. 'system' follows the device setting.
export const THEME_MODES = ['system', 'light', 'dark'];

// Accent (brand) colour the user can pick, independently of the mode.
export const THEME_ACCENTS = ['green', 'blue'];

export const DEFAULT_MODE = 'system';
// Each mode has its own accent, so e.g. light can be green while dark is blue.
export const DEFAULT_ACCENTS = { light: 'green', dark: 'blue' };

// Brand palette for every accent × scheme combination.
// `css` values feed the NativeWind variables (bg-brand, bg-brand-dark, bg-brand-light).
// `js` values feed components that need a raw colour (icons, gradients, CTAButton, …).
export const accents = {
  green: {
    light: {
      css: {
        '--color-brand': 'hsl(126, 80%, 15%)',
        '--color-brand-dark': 'hsl(126, 80%, 10%)',
        '--color-brand-light': 'hsl(126, 80%, 20%)',
      },
      js: {
        brandNormal: 'hsl(126, 80%, 15%)',
        brandDark: 'hsl(126, 80%, 10%)',
        brandLight: 'hsl(126, 80%, 20%)',
        brand: {
          primary: 'hsl(126, 80%, 18%)',
          secondary: 'hsl(126, 80%, 10%)',
          transparent: 'rgba(22, 101, 52, 0.15)',
          text: '#ffffff',
        },
      },
    },
    dark: {
      css: {
        '--color-brand': 'hsl(140, 60%, 14%)',
        '--color-brand-dark': 'hsl(140, 60%, 8%)',
        '--color-brand-light': 'hsl(140, 60%, 22%)',
      },
      js: {
        brandNormal: 'hsl(140, 60%, 14%)',
        brandDark: 'hsl(140, 60%, 8%)',
        brandLight: 'hsl(140, 60%, 22%)',
        brand: {
          primary: 'hsl(140, 60%, 26%)',
          secondary: 'hsl(140, 60%, 36%)',
          transparent: 'rgba(14, 57, 30, 0.15)',
          text: '#ffffff',
        },
      },
    },
  },
  blue: {
    light: {
      css: {
        '--color-brand': 'hsl(210, 80%, 26%)',
        '--color-brand-dark': 'hsl(210, 80%, 18%)',
        '--color-brand-light': 'hsl(210, 80%, 34%)',
      },
      js: {
        brandNormal: 'hsl(210, 80%, 26%)',
        brandDark: 'hsl(210, 80%, 18%)',
        brandLight: 'hsl(210, 80%, 34%)',
        brand: {
          primary: 'hsl(210, 80%, 30%)',
          secondary: 'hsl(210, 80%, 20%)',
          transparent: 'rgba(13, 71, 120, 0.15)',
          text: '#ffffff',
        },
      },
    },
    dark: {
      css: {
        '--color-brand': 'hsl(205, 80%, 20%)',
        '--color-brand-dark': 'hsl(205, 80%, 10%)',
        '--color-brand-light': 'hsl(205, 80%, 30%)',
      },
      js: {
        brandNormal: 'hsl(205, 80%, 20%)',
        brandDark: 'hsl(205, 80%, 10%)',
        brandLight: 'hsl(205, 80%, 30%)',
        brand: {
          primary: 'hsl(205, 80%, 30%)',
          secondary: 'hsl(205, 80%, 40%)',
          transparent: 'rgba(10, 38, 61, 0.15)',
          text: '#ffffff',
        },
      },
    },
  },
};

const resolveScheme = (scheme) => (scheme === 'dark' ? 'dark' : 'light');
const resolveAccent = (accent) => (accents[accent] ? accent : 'green');

// CSS variables to apply at the app root for the chosen accent.
export const getAccentVars = (scheme, accent) =>
  accents[resolveAccent(accent)][resolveScheme(scheme)].css;

// The full JS colour object (same shape as colors.light / colors.dark) with the accent applied.
export const getThemeColors = (scheme, accent) => {
  const s = resolveScheme(scheme);
  return { ...colors[s], ...accents[resolveAccent(accent)][s].js };
};
