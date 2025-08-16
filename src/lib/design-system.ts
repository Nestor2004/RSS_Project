/**
 * Design System Configuration
 *
 * This file contains design tokens and utilities for maintaining
 * a consistent design language across the application.
 */

// Color palette
export const colors = {
  // Primary brand colors
  primary: {
    50: "hsl(230, 100%, 97%)",
    100: "hsl(230, 95%, 94%)",
    200: "hsl(230, 90%, 88%)",
    300: "hsl(230, 85%, 80%)",
    400: "hsl(230, 80%, 70%)",
    500: "hsl(230, 75%, 60%)", // Primary brand color
    600: "hsl(230, 75%, 50%)",
    700: "hsl(230, 80%, 40%)",
    800: "hsl(230, 85%, 30%)",
    900: "hsl(230, 90%, 20%)",
    950: "hsl(230, 95%, 15%)",
  },

  // Accent color (for highlights, buttons, etc.)
  accent: {
    50: "hsl(280, 100%, 97%)",
    100: "hsl(280, 95%, 94%)",
    200: "hsl(280, 90%, 88%)",
    300: "hsl(280, 85%, 80%)",
    400: "hsl(280, 80%, 70%)",
    500: "hsl(280, 75%, 60%)", // Main accent
    600: "hsl(280, 75%, 50%)",
    700: "hsl(280, 80%, 40%)",
    800: "hsl(280, 85%, 30%)",
    900: "hsl(280, 90%, 20%)",
    950: "hsl(280, 95%, 15%)",
  },

  // Neutral colors for text, backgrounds, etc.
  neutral: {
    50: "hsl(220, 20%, 98%)",
    100: "hsl(220, 15%, 95%)",
    200: "hsl(220, 15%, 90%)",
    300: "hsl(220, 10%, 85%)",
    400: "hsl(220, 10%, 70%)",
    500: "hsl(220, 10%, 50%)",
    600: "hsl(220, 10%, 40%)",
    700: "hsl(220, 15%, 30%)",
    800: "hsl(220, 15%, 20%)",
    900: "hsl(220, 20%, 10%)",
    950: "hsl(220, 25%, 5%)",
  },

  // Semantic colors
  success: "hsl(160, 80%, 40%)",
  warning: "hsl(40, 90%, 50%)",
  error: "hsl(350, 90%, 50%)",
  info: "hsl(200, 90%, 50%)",
};

// Spacing system (in rem)
export const spacing = {
  px: "1px",
  0: "0",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  3.5: "0.875rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  9: "2.25rem",
  10: "2.5rem",
  11: "2.75rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  28: "7rem",
  32: "8rem",
  36: "9rem",
  40: "10rem",
  44: "11rem",
  48: "12rem",
  52: "13rem",
  56: "14rem",
  60: "15rem",
  64: "16rem",
  72: "18rem",
  80: "20rem",
  96: "24rem",
};

// Typography scale
export const typography = {
  fonts: {
    sans: "var(--font-geist-sans)",
    mono: "var(--font-geist-mono)",
  },
  sizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
    "7xl": "4.5rem",
    "8xl": "6rem",
    "9xl": "8rem",
  },
  weights: {
    thin: "100",
    extralight: "200",
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },
  lineHeights: {
    none: "1",
    tight: "1.25",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2",
  },
};

// Breakpoints for responsive design
export const breakpoints = {
  xs: "480px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// Shadows
export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  none: "none",
};

// Border radius
export const borderRadius = {
  none: "0",
  sm: "0.125rem",
  DEFAULT: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  full: "9999px",
};

// Animation durations
export const animations = {
  durations: {
    fastest: "50ms",
    faster: "100ms",
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    slower: "400ms",
    slowest: "500ms",
  },
  easings: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

// Z-index scale
export const zIndex = {
  0: "0",
  10: "10",
  20: "20",
  30: "30",
  40: "40",
  50: "50",
  auto: "auto",
  dropdown: "1000",
  sticky: "1020",
  fixed: "1030",
  modalBackdrop: "1040",
  modal: "1050",
  popover: "1060",
  tooltip: "1070",
};
