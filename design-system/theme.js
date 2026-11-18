// AI Ticket It — theme para React Native (generado desde tokens.json)
// Uso:
//   import { darkTheme, lightTheme, getTheme } from './theme';
//   const theme = getTheme(useColorScheme()); // 'dark' por defecto
//   <Text style={[theme.typography.titleMd, { color: theme.colors.text }]}>...</Text>
//
// Fuentes (Expo): npx expo install @expo-google-fonts/bricolage-grotesque @expo-google-fonts/manrope expo-font
// Los fontFamily de typography son los nombres que exportan esos paquetes (un archivo por peso:
// en RN no uses fontWeight con fuentes custom, usá el fontFamily del peso).

const palette = {
  dark: {
    bg: "#0b0b10",
    surface: "#15151c",
    surfaceRaised: "#1e1e28",
    surfaceOverlay: "#252531",
    border: "#2c2c39",
    borderStrong: "#7a7a8e",
    skeletonHighlight: "#2d2d3b",
    text: "#f5f5f7",
    textMuted: "#b5b5c4",
    textSubtle: "#8e8ea2",
    textOnImage: "#ffffff",
    primary: "#c8ff3d",
    primaryPressed: "#a8de1f",
    onPrimary: "#0f1408",
    primarySoft: "rgba(200, 255, 61, 0.14)",
    primaryText: "#c8ff3d",
    secondary: "#ff4d94",
    secondaryPressed: "#e83a80",
    onSecondary: "#1a0510",
    secondarySoft: "rgba(255, 77, 148, 0.16)",
    secondaryText: "#ff7ab0",
    success: "#3ddbb4",
    successSoft: "rgba(61, 219, 180, 0.15)",
    warning: "#ffbb3d",
    warningSoft: "rgba(255, 187, 61, 0.15)",
    error: "#ff6464",
    errorSoft: "rgba(255, 100, 100, 0.15)",
    onError: "#1c0606",
    info: "#6fb1ff",
    infoSoft: "rgba(111, 177, 255, 0.15)",
    statusPending: "#ffbb3d",
    statusPendingBg: "rgba(255, 187, 61, 0.15)",
    statusConfirmed: "#3ddbb4",
    statusConfirmedBg: "rgba(61, 219, 180, 0.15)",
    statusUsed: "#b0b0c3",
    statusUsedBg: "rgba(176, 176, 195, 0.14)",
    statusCancelled: "#ff6464",
    statusCancelledBg: "rgba(255, 100, 100, 0.15)",
    statusRefunded: "#b598ff",
    statusRefundedBg: "rgba(181, 152, 255, 0.15)",
    rating: "#c8ff3d",
    ratingEmpty: "#4a4a5c",
    focusRing: "#c8ff3d",
    scrimImage: "rgba(8, 8, 12, 0.72)",
    scrimModal: "rgba(0, 0, 0, 0.64)",
    bubbleOwn: "#c8ff3d",
    onBubbleOwn: "#0f1408"
  },
  light: {
    bg: "#f3f3f6",
    surface: "#ffffff",
    surfaceRaised: "#ffffff",
    surfaceOverlay: "#ffffff",
    border: "#e4e4eb",
    borderStrong: "#83839a",
    skeletonHighlight: "#ececf2",
    text: "#121218",
    textMuted: "#4c4c5c",
    textSubtle: "#62627a",
    textOnImage: "#ffffff",
    primary: "#bdf52a",
    primaryPressed: "#a6dc12",
    onPrimary: "#0f1408",
    primarySoft: "#eefcc8",
    primaryText: "#466300",
    secondary: "#d6125f",
    secondaryPressed: "#b80d51",
    onSecondary: "#ffffff",
    secondarySoft: "#ffe4ef",
    secondaryText: "#b80d51",
    success: "#057a5e",
    successSoft: "#dcf6ee",
    warning: "#8a5600",
    warningSoft: "#fff0d4",
    error: "#c42b2b",
    errorSoft: "#ffe5e3",
    onError: "#ffffff",
    info: "#1d5fd0",
    infoSoft: "#e3edff",
    statusPending: "#8a5600",
    statusPendingBg: "#fff0d4",
    statusConfirmed: "#057a5e",
    statusConfirmedBg: "#dcf6ee",
    statusUsed: "#545468",
    statusUsedBg: "#ececf2",
    statusCancelled: "#c42b2b",
    statusCancelledBg: "#ffe5e3",
    statusRefunded: "#6a3ad1",
    statusRefundedBg: "#efe8ff",
    rating: "#466300",
    ratingEmpty: "#c9c9d6",
    focusRing: "#121218",
    scrimImage: "rgba(8, 8, 12, 0.72)",
    scrimModal: "rgba(18, 18, 24, 0.48)",
    bubbleOwn: "#121218",
    onBubbleOwn: "#ffffff"
  },
};

export const spacing = {
  "0": 0,
  "1": 4,
  "2": 8,
  "3": 12,
  "4": 16,
  "5": 20,
  "6": 24,
  "8": 32,
  "10": 40,
  "12": 48,
  "16": 64
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
  notch: 10
};

export const sizes = {
  screenWidth: 390,
  touchMin: 44,
  buttonSm: 36,
  buttonMd: 44,
  buttonLg: 52,
  headerHeight: 56,
  bottomNavHeight: 64,
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  avatarSm: 32,
  avatarMd: 40,
  avatarLg: 64,
  eventImageRatio: 1.6
};

export const typography = {
  displayXl: {
    fontFamily: "BricolageGrotesque_800ExtraBold",
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.8
  },
  displayLg: {
    fontFamily: "BricolageGrotesque_800ExtraBold",
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5
  },
  titleLg: {
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3
  },
  titleMd: {
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2
  },
  titleSm: {
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0
  },
  bodyLg: {
    fontFamily: "Manrope_500Medium",
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0
  },
  body: {
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0
  },
  bodyStrong: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0
  },
  bodySm: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0
  },
  label: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.1
  },
  labelSm: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.1
  },
  caption: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1
  },
  overline: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  price: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
    fontVariant: [
      "tabular-nums"
    ]
  },
  priceLg: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.5,
    fontVariant: [
      "tabular-nums"
    ]
  }
};

export const fontAssets = {
  // import { useFonts } from 'expo-font' + los objetos de @expo-google-fonts
  display: [
    "BricolageGrotesque_600SemiBold",
    "BricolageGrotesque_700Bold",
    "BricolageGrotesque_800ExtraBold"
  ],
  text: [
    "Manrope_500Medium",
    "Manrope_600SemiBold",
    "Manrope_700Bold",
    "Manrope_800ExtraBold"
  ],
};

export const opacity = {
  disabled: 0.4,
  pressed: 0.85,
  mutedImage: 0.5,
  skeletonMin: 0.55
};

export const motion = {
  duration: {
    instant: 80,
    fast: 150,
    base: 220,
    slow: 320,
    skeleton: 1200
  },
  // Para Reanimated: Easing.bezier(...motion.easing.standard)
  easing: {
    standard: [
      0.2,
      0,
      0,
      1
    ],
    enter: [
      0,
      0,
      0.2,
      1
    ],
    exit: [
      0.4,
      0,
      1,
      1
    ]
  },
  pressedScale: 0.97,
};

const shadows = {
  dark: {
    shadowSm: {
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 1
      },
      shadowOpacity: 0.5,
      shadowRadius: 1,
      elevation: 1
    },
    shadowMd: {
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 8
      },
      shadowOpacity: 0.55,
      shadowRadius: 12,
      elevation: 6
    },
    shadowLg: {
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 16
      },
      shadowOpacity: 0.6,
      shadowRadius: 24,
      elevation: 12
    },
    glowPrimary: {
      shadowColor: "#c8ff3d",
      shadowOffset: {
        width: 0,
        height: 8
      },
      shadowOpacity: 0.28,
      shadowRadius: 14,
      elevation: 8
    }
  },
  light: {
    shadowSm: {
      shadowColor: "#121218",
      shadowOffset: {
        width: 0,
        height: 1
      },
      shadowOpacity: 0.08,
      shadowRadius: 1,
      elevation: 1
    },
    shadowMd: {
      shadowColor: "#121218",
      shadowOffset: {
        width: 0,
        height: 6
      },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 4
    },
    shadowLg: {
      shadowColor: "#121218",
      shadowOffset: {
        width: 0,
        height: 16
      },
      shadowOpacity: 0.16,
      shadowRadius: 20,
      elevation: 12
    },
    glowPrimary: {
      shadowColor: "#466300",
      shadowOffset: {
        width: 0,
        height: 6
      },
      shadowOpacity: 0.22,
      shadowRadius: 10,
      elevation: 6
    }
  },
};

// Estados de compra: color + ícono (lucide-react-native) + etiqueta. Nunca solo color.
export const purchaseStatus = {
  PENDIENTE:   { label: 'Pendiente de pago', short: 'Pendiente',   icon: 'Hourglass',   fg: 'statusPending',   bg: 'statusPendingBg' },
  CONFIRMADA:  { label: 'Confirmada',        short: 'Confirmada',  icon: 'CircleCheck', fg: 'statusConfirmed', bg: 'statusConfirmedBg' },
  UTILIZADA:   { label: 'Utilizada',         short: 'Utilizada',   icon: 'TicketCheck', fg: 'statusUsed',      bg: 'statusUsedBg' },
  CANCELADA:   { label: 'Cancelada',         short: 'Cancelada',   icon: 'CircleX',     fg: 'statusCancelled', bg: 'statusCancelledBg' },
  REEMBOLSADA: { label: 'Reembolsada',       short: 'Reembolsada', icon: 'Undo2',       fg: 'statusRefunded',  bg: 'statusRefundedBg' },
};

function build(mode) {
  return {
    mode,
    dark: mode === 'dark',
    colors: palette[mode],
    spacing, radius, sizes, typography, opacity, motion,
    shadows: shadows[mode],
    purchaseStatus,
  };
}

export const darkTheme = build('dark');
export const lightTheme = build('light');
export const getTheme = scheme => (scheme === 'light' ? lightTheme : darkTheme);
export default darkTheme;
