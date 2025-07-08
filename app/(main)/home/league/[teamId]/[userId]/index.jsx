import { StyleSheet, Text, View } from 'react-native';
import PlayerProfile from '@components/PlayerProfile';
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
              <CustomHeader title="User" rightIcon="clipboard-outline" />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1">
        <PlayerProfile context="home/league" />
      </View>
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({});
