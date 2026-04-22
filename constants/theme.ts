/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#B45309'; // Rich Amber
const tintColorDark = '#F59E0B'; // Bright Gold

export const Colors = {
  light: {
    text: '#020617',
    background: '#F8FAFC',
    tint: tintColorLight,
    icon: '#475569',
    tabIconDefault: '#475569',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F8FAFC',
    background: '#020617',
    tint: tintColorDark,
    icon: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorDark,
  },
  premium: {
    primary: '#F59E0B',    // Amber/Gold
    primaryContainer: '#451A03',
    secondary: '#CBD5E1',  // Silver/Slate
    secondaryContainer: '#1E293B',
    tertiary: '#FBBF24',   // Brighter Gold
    tertiaryContainer: '#78350F',
    gradientStart: '#F59E0B',
    gradientEnd: '#B45309',
    glass: 'rgba(30, 41, 59, 0.6)',
    nocturnal: '#020617',
    surface: '#0F172A',
  }
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
