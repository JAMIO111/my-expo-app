import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

const _layout = () => {
  return (
    <Stack
      screenOptions={{
        animation: 'fade', // 👈 forces bottom-to-top slide
      }}></Stack>
  );
};

export default _layout;

const styles = StyleSheet.create({});
