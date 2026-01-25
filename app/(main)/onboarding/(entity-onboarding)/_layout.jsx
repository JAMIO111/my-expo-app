import { Stack } from 'expo-router';
import CustomHeader from '@components/CustomNativeHeader';

export default function EntityOnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        header: (props) => <CustomHeader {...props} />,
      }}
    />
  );
}
