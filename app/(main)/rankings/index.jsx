import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Leaderboard from '@components/Leaderboard';
import NavBar from '@components/NavBar';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { StatusBar } from 'expo-status-bar';
import CustomHeader from '@components/CustomHeader';
import { Stack } from 'expo-router';

const index = () => {
  return (
    <SafeViewWrapper topColor="bg-brand" bottomColor="bg-brand">
      <StatusBar style="light" backgroundColor="#000" />
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader showBack={false} title="Stat Room" />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="flex-1">
        <ScrollView className="mt-16 flex-1 bg-brand-dark p-5">
          <Text className="mb-5 text-3xl font-semibold text-white">All-time Player Stats</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 16,
              alignItems: 'flex-start',
            }}
            className="mb-5 flex-row space-x-5">
            <Leaderboard title="Matches Won" />
            <Leaderboard title="Frames Won" />
          </ScrollView>
          <Text className="mb-5 text-3xl font-semibold text-white">All-time Team Stats</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 16,
              alignItems: 'flex-start',
            }}
            className="mb-5 flex-row space-x-5">
            <Leaderboard title="Matches Won" />
            <Leaderboard title="Frames Won" />
          </ScrollView>
        </ScrollView>
      </View>
      <NavBar />
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({});
