import { StyleSheet, Text, View } from 'react-native';
import PlayerStats from '@components/PlayerStats';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';

const index = () => {
  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Stats" rightIcon="clipboard-outline" />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="flex-1">
        <PlayerStats />
      </View>
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({});
