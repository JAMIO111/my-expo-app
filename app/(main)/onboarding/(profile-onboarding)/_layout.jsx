import { Stack } from 'expo-router';
import CustomHeader from '@components/CustomNativeHeader';

export default function ProfileOnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        header: (props) => <CustomHeader {...props} />,
      }}
    />
  );
}
