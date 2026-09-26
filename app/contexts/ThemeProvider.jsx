import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme as nativewindColorScheme, useColorScheme, vars } from 'nativewind';
import {
  DEFAULT_ACCENTS,
  DEFAULT_MODE,
  THEME_ACCENTS,
  THEME_MODES,
  getAccentVars,
  getThemeColors,
} from '@lib/theme';

const MODE_KEY = '@breakroom/theme-mode';
const ACCENT_KEYS = {
  light: '@breakroom/theme-accent-light',
  dark: '@breakroom/theme-accent-dark',
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const { colorScheme } = useColorScheme();
  const [mode, setModeState] = useState(DEFAULT_MODE);
  const [accents, setAccents] = useState(DEFAULT_ACCENTS);
  const [loaded, setLoaded] = useState(false);

  // Load the saved preferences once, before rendering, to avoid a flash of the wrong theme.
  useEffect(() => {
    (async () => {
      try {
        const [[, savedMode], [, savedLight], [, savedDark]] = await AsyncStorage.multiGet([
          MODE_KEY,
          ACCENT_KEYS.light,
          ACCENT_KEYS.dark,
        ]);
        const nextMode = THEME_MODES.includes(savedMode) ? savedMode : DEFAULT_MODE;
        nativewindColorScheme.set(nextMode);
        setModeState(nextMode);
        setAccents({
          light: THEME_ACCENTS.includes(savedLight) ? savedLight : DEFAULT_ACCENTS.light,
          dark: THEME_ACCENTS.includes(savedDark) ? savedDark : DEFAULT_ACCENTS.dark,
        });
      } catch (error) {
        console.error('Failed to load theme preferences:', error);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const setMode = useCallback((nextMode) => {
    if (!THEME_MODES.includes(nextMode)) return;
    // Also updates React Native's Appearance, so useColorScheme() everywhere follows it.
    nativewindColorScheme.set(nextMode);
    setModeState(nextMode);
    AsyncStorage.setItem(MODE_KEY, nextMode).catch((error) =>
      console.error('Failed to save theme mode:', error)
    );
  }, []);

  // Sets the accent used while the app is in the given scheme ('light' | 'dark').
  const setAccent = useCallback((forScheme, nextAccent) => {
    if (!ACCENT_KEYS[forScheme] || !THEME_ACCENTS.includes(nextAccent)) return;
    setAccents((prev) => ({ ...prev, [forScheme]: nextAccent }));
    AsyncStorage.setItem(ACCENT_KEYS[forScheme], nextAccent).catch((error) =>
      console.error('Failed to save theme accent:', error)
    );
  }, []);

  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const accent = accents[scheme];

  const value = useMemo(
    () => ({
      mode,
      scheme,
      isDark: scheme === 'dark',
      accent,
      accents,
      colors: getThemeColors(scheme, accent),
      setMode,
      setAccent,
    }),
    [mode, scheme, accent, accents, setMode, setAccent]
  );

  const accentVars = useMemo(() => vars(getAccentVars(scheme, accent)), [scheme, accent]);

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={value}>
      <View className="flex-1" style={accentVars}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
