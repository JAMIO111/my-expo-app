import { KeyboardAwareScrollView as ControllerScrollView } from 'react-native-keyboard-controller';

// Scrolls the focused input above the keyboard (plus `bottomOffset` of
// breathing room). Use this instead of a bare ScrollView on any screen or
// sheet that contains a TextInput.
const KeyboardAwareScrollView = ({ bottomOffset = 24, children, ...props }) => (
  <ControllerScrollView
    bottomOffset={bottomOffset}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
    {...props}>
    {children}
  </ControllerScrollView>
);

export default KeyboardAwareScrollView;
