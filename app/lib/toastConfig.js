import { View, Text } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import colors from './colors';

const toastConfig = {
  success: ({ text1, text2, props }) => {
    const colorMode = props?.colorScheme || 'light'; // fallback to light
    const theme = colors[colorMode];

    return (
      <View
        style={{
          backgroundColor: theme.background,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: 16,
          width: '90%',
          flexDirection: 'column', // vertical stack
          overflow: 'hidden', // keep bottom bar rounded
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            gap: 16,
          }}>
          <View
            style={{
              backgroundColor: theme.success.transparent,
              padding: 8,
              borderRadius: 50,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <IonIcon name="checkmark-circle" size={26} color={theme.success.primary} />
          </View>
          <View style={{ flex: 1 }}>
            {text1 && (
              <Text
                style={{
                  color: theme.primaryText,
                  fontSize: 18,
                  fontWeight: '600',
                }}>
                {text1}
              </Text>
            )}
            {text2 && <Text style={{ color: theme.secondaryText, fontSize: 16 }}>{text2}</Text>}
          </View>
        </View>

        {/* Bottom colored bar */}
        <View
          style={{
            backgroundColor: theme.success.primary,
            height: 6,
            width: '100%',
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          }}
        />
      </View>
    );
  },
  error: ({ text1, text2, props }) => {
    const colorMode = props?.colorScheme || 'light'; // fallback to light
    const theme = colors[colorMode];

    return (
      <View
        style={{
          backgroundColor: theme.background,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: 16,
          width: '90%',
          flexDirection: 'column', // vertical stack
          overflow: 'hidden', // keep bottom bar rounded
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            gap: 16,
          }}>
          <View
            style={{
              backgroundColor: theme.error.transparent,
              padding: 8,
              borderRadius: 50,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <IonIcon name="alert-circle-outline" size={26} color={theme.error.primary} />
          </View>
          <View style={{ flex: 1 }}>
            {text1 && (
              <Text style={{ color: theme.primaryText, fontSize: 18, fontWeight: '600' }}>
                {text1}
              </Text>
            )}
            {text2 && <Text style={{ color: theme.secondaryText, fontSize: 16 }}>{text2}</Text>}
          </View>
        </View>

        {/* Bottom colored bar */}
        <View
          style={{
            backgroundColor: theme.error.primary,
            height: 6,
            width: '100%',
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          }}
        />
      </View>
    );
  },
  info: ({ text1, text2, props }) => {
    const colorMode = props?.colorScheme || 'light'; // fallback to light
    const theme = colors[colorMode];

    return (
      <View
        style={{
          backgroundColor: theme.background,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: 16,
          width: '90%',
          flexDirection: 'column', // vertical stack
          overflow: 'hidden', // keep bottom bar rounded
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            gap: 16,
          }}>
          <View
            style={{
              backgroundColor: theme.info.transparent,
              padding: 8,
              borderRadius: 50,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <IonIcon name="information-circle" size={26} color={theme.info.primary} />
          </View>
          <View style={{ flex: 1 }}>
            {text1 && (
              <Text style={{ color: theme.primaryText, fontSize: 18, fontWeight: '600' }}>
                {text1}
              </Text>
            )}
            {text2 && <Text style={{ color: theme.secondaryText, fontSize: 16 }}>{text2}</Text>}
          </View>
        </View>

        {/* Bottom colored bar */}
        <View
          style={{
            backgroundColor: theme.info.primary,
            height: 6,
            width: '100%',
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          }}
        />
      </View>
    );
  },
};

export default toastConfig;
