import { Platform, type ViewStyle } from 'react-native';

export const theme = {
  bg: '#F4F7F6',
  frame: '#D5E3DE',
  card: '#FFFFFF',
  text: '#12211E',
  muted: '#5E736E',
  line: '#E3ECE9',
  primary: '#0F766E',
  primaryDark: '#115E59',
  primarySoft: '#E6F4F1',
  white: '#FFFFFF',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  ok: '#047857',
  okSoft: '#D1FAE5',
  project: '#4338CA',
  projectSoft: '#EEF2FF',
  radius: 18,
};

export const shadow: ViewStyle = Platform.select({
  web: { boxShadow: '0 8px 24px rgba(19, 78, 74, 0.08)' } as ViewStyle,
  default: {
    shadowColor: '#134E4A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
}) ?? {};

export const inputReset = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : undefined;
