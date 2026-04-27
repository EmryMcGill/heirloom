// constants/theme.ts

import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

export const colors = {
  yellow: "#EFB04B",
  red: "#B5381D",
  darkRed: "#330D17",
  green: "#9A8A58",
  darkGreen: "#494019",
  beige: "#F1E9DA",
  darkBeige: "#D8D1A3",
  blue: "#ADC6C3",
  black: "#18171C",
  grey: "#F0F1E7",

  text: {
    primary: "#1A1A1A",
    secondary: "#666666",
    tertiary: "#999999",
    inverse: "#FFFFFF",
  },
};

export const typography = {
  fonts: {
    regular: "GentiumPlus_400Regular",
    italic: "GentiumPlus_400Regular_Italic",
    bold: "GentiumPlus_700Bold",
    boldItalic: "GentiumPlus_700Bold_Italic",
  },

  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },

  lineHeights: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 40,
    xxxl: 56,
  },

  fontWeights: {
    light: "300",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

const title = {
  fontFamily: typography.fonts.regular,
  fontSize: typography.sizes.xxl,
  marginBottom: 0,
};

const card = {
  height: 180,
  width: (screenWidth - 36) / 2,
  borderRadius: borderRadius.md,
  borderWidth: 1,
  borderColor: colors.grey,
  overflow: "hidden",
};

const cardTitle = {
  fontSize: typography.sizes.md,
};

const cardSubtitle = {
  fontSize: typography.sizes.xs,
  color: colors.text.secondary,
};

const edgeMargin = {
  marginHorizontal: 12,
};

// Combine everything into one theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  title,
  card,
  cardTitle,
  cardSubtitle,
  edgeMargin,
};

export type Theme = typeof theme;
