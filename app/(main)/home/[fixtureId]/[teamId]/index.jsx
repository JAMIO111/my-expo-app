import { StyleSheet, Text, View } from 'react-native';
import TeamProfile from '@components/TeamProfile';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { Stack } from 'expo-router';

const index = () => {
  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Team" rightIcon="clipboard-outline" />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1">
        <TeamProfile context="home/upcoming-fixture" />
      </View>
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({});
