
'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { apiRequest } from '@/lib/api';

function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16), g = parseInt(result[2], 16), b = parseInt(result[3], 16);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return `${h} ${s}% ${l}%`;
}

function getContrastingTextColor(hex: string): string {
  if (!hex) return '0 0% 10%';
  if (hex.startsWith('#')) hex = hex.slice(1);
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '0 0% 10%' : '0 0% 100%';
}

export function ThemeInitializer() {
  const { resolvedTheme } = useTheme();
  const { user } = useUser();

  useEffect(() => {
    if (typeof window === 'undefined' || !resolvedTheme || !user) return;

    const loadAndApplyColors = async () => {
      try {
        const settings = await apiRequest<any>('settings');
        const root = document.documentElement;
        const isDark = resolvedTheme.includes('dark');

        const colorsToApply = isDark ? {
          '--primary': settings.primaryColorDark,
          '--accent': settings.accentColorDark,
          '--background': settings.backgroundColorDark,
          '--card': settings.cardColorDark,
          '--header': settings.headerColorDark,
        } : {
          '--primary': settings.primaryColorLight,
          '--accent': settings.accentColorLight,
          '--background': settings.backgroundColorLight,
          '--card': settings.cardColorLight,
          '--header': settings.headerColorLight,
        };

        Object.entries(colorsToApply).forEach(([property, hexColor]) => {
          if (hexColor) {
            const hslColor = hexToHsl(hexColor);
            if (hslColor) {
              root.style.setProperty(property, hslColor);

              if (property === '--primary') {
                const foregroundHsl = getContrastingTextColor(hexColor);
                root.style.setProperty('--primary-foreground', foregroundHsl);
                root.style.setProperty('--sidebar-foreground', foregroundHsl);
              } else if (property === '--accent') {
                root.style.setProperty('--accent-foreground', getContrastingTextColor(hexColor));
                root.style.setProperty('--chart-1', hslColor);
              } else if (property === '--background') {
                root.style.setProperty('--foreground', getContrastingTextColor(hexColor));
              } else if (property === '--card') {
                root.style.setProperty('--card-foreground', getContrastingTextColor(hexColor));
              } else if (property === '--header') {
                root.style.setProperty('--header-foreground', getContrastingTextColor(hexColor));
              }
            }
          }
        });
      } catch (error) {
        console.error("Failed to load theme settings:", error);
      }
    };

    loadAndApplyColors();
  }, [resolvedTheme, user]);

  return null;
}
