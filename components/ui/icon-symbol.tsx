// Dual fallback: MaterialIcons (default) + FontAwesome5 (opsional)
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SymbolWeight } from 'expo-symbols';
import { OpaqueColorValue, StyleProp, TextStyle, Platform } from 'react-native';

type IconMapping = Record<string, string>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons / FontAwesome mappings here.
 * - Material Icons: https://icons.expo.fyi/
 * - FontAwesome5: https://fontawesome.com/icons
 * - SF Symbols: https://developer.apple.com/sf-symbols/
 */
const MAPPING: IconMapping = {
  'house.fill': 'home-work',
  'paperplane.fill': 'flight-takeoff',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'plus.circle.fill': 'my-library-add',
  'usergraduate.fill': 'nature-people', // ← perbaiki di sini
  'list': 'format-list-bulleted',
  'map.fill': 'map',


} as const;


/**
 * An icon component that uses Material Icons on Android/Web
 * and FontAwesome5 on iOS as fallback (for SF Symbol style).
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  useFontAwesome = false,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
  /** Optional prop: force using FontAwesome instead of Material */
  useFontAwesome?: boolean;
}) {
  const isIOS = Platform.OS === 'ios' || useFontAwesome;

  if (isIOS) {
    return (
      <FontAwesome5
        color={color}
        size={size}
        // 👇 Cast supaya TS tidak error
        name={MAPPING[name] as any}
        style={style}
        solid
      />
    );
  }

  return (
    <MaterialIcons
      color={color}
      size={size}
      // 👇 Cast supaya TS tidak error
      name={MAPPING[name] as any}
      style={style}
    />
  );
}
