/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#a40a0aff';
const tintColorDark = '#610000ff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
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

export type AppThemeStatus = 'light_mode' | 'dark_mode';

export interface AppTheme {
  status: AppThemeStatus;
  primaryBackground: string; // primary background color
  primaryAccent: string; // primary accent (brand) color
  mapStyle: {
    // Mapbox style URL (preferred) and a short google mode hint
    mapboxStyleUrl: string;
    googleMapMode: 'standard' | 'dark';
  };
}

/**
 * Determine app theme based on device local time.
 * - Siang (06:00 - 17:00) => light_mode
 *   - Primary: White & Bright Orange
 *   - Map: Mapbox streets/light
 * - Malam (17:01 - 05:59) => dark_mode
 *   - Primary: Navy Blue (#001f3f) & Black
 *   - Map: Mapbox dark/midnight
 *
 * The function accepts an optional `now` Date for testing.
 */
export function getAppTheme(now?: Date): AppTheme {
  const d = now ?? new Date();
  const minutes = d.getHours() * 60 + d.getMinutes();
  const dayStart = 6 * 60; // 06:00
  const dayEnd = 17 * 60; // 17:00 -> 17:01 is considered night

  const isDay = minutes >= dayStart && minutes <= dayEnd;

  if (isDay) {
    return {
      status: 'light_mode',
      primaryBackground: '#FFFFFF',
      primaryAccent: '#FFA500', // bright orange
      mapStyle: {
        // Mapbox streets / light style
        mapboxStyleUrl: 'mapbox://styles/mapbox/streets-v11',
        googleMapMode: 'standard',
      },
    };
  }

  return {
    status: 'dark_mode',
    primaryBackground: '#001f3f', // navy blue
    primaryAccent: '#000000', // black
    mapStyle: {
      // Mapbox dark style
      mapboxStyleUrl: 'mapbox://styles/mapbox/dark-v10',
      googleMapMode: 'dark',
    },
  };
}

// small convenience: default theme object at module load
export const DefaultAppTheme = getAppTheme();

/**
 * Get dynamic Colors based on AppTheme status.
 * This allows global Colors to adapt to light/dark mode automatically.
 */
export function getColorsByTheme(appTheme: AppTheme) {
  const theme = appTheme.status === 'light_mode' ? Colors.light : Colors.dark;
  // Optionally override tint color based on theme accent
  return {
    ...theme,
    tint: appTheme.primaryAccent,
  };
}
