import { Stack } from 'expo-router';

// Note: settings lives under app/(main)/settings, not app/(main)/profile --
// there used to be a `<Stack.Screen name="settings" />` here, but with no
// matching file under this folder it was inert (couldn't be navigated to,
// registered no real route). Cross-section navigation into /settings is now
// handled by the shared outer Stack in app/(main)/_layout.jsx.
const _layout = () => {
  return <Stack />;
};

export default _layout;
