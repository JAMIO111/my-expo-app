import { View, Text } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import colors from './colors';

const renderToast = (type, { text1, text2, props }) => {
  const colorMode = props?.colorScheme || 'light';
  const theme = colors[colorMode];

  const config = {
    success: {
      icon: 'checkmark-circle',
      color: theme.success.primary,
      bg: theme.success.transparent,
      bar: theme.success.primary,
    },
    error: {
      icon: 'alert-circle-outline',
      color: theme.error.primary,
      bg: theme.error.transparent,
      bar: theme.error.primary,
    },
    info: {
      icon: 'information-circle',
      color: theme.info.primary,
      bg: theme.info.transparent,
      bar: theme.info.primary,
    },
  }[type];

  return (
    <View
      style={{
        backgroundColor: theme.background,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 16,
        width: '90%',
        overflow: 'hidden',
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 16 }}>
        <View
          style={{
            backgroundColor: config.bg,
            padding: 8,
            borderRadius: 50,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <IonIcon name={config.icon} size={26} color={config.color} />
        </View>

        <View style={{ flex: 1 }}>
          {text1 && (
            <Text
              className="pb-1 font-saira-semibold"
              style={{ color: theme.primaryText, fontSize: 18 }}>
              {text1}
            </Text>
          )}
          {text2 && (
            <Text
              className="font-saira-regular"
              style={{ color: theme.secondaryText, fontSize: 16, lineHeight: 22 }}>
              {text2}
            </Text>
          )}
        </View>
      </View>

      <View
        style={{
          backgroundColor: config.bar,
          height: 6,
          width: '100%',
        }}
      />
    </View>
  );
};

const toastConfig = {
  success: (props) => renderToast('success', props),
  error: (props) => renderToast('error', props),
  info: (props) => renderToast('info', props),
};

export default toastConfig;
