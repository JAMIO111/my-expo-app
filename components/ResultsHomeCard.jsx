import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Ioconicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { getSeasonLabel } from 'lib/helperFunctions';

const ResultsHomeCard = () => {
  const results = false; // Placeholder for results data, replace with actual data fetching logic
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/home/results')}
      className="bg-background border-border-color h-28 w-full rounded-xl border">
      <View className="border-border-color w-full flex-row items-center justify-between border-b px-4 py-2">
        <Text className="text-text-primary text-xl font-semibold">Results</Text>
        <Ioconicons name="chevron-forward" size={24} color="#aaa" />
      </View>
      {!results ? (
        <View className="items-left flex-1 justify-center px-5">
          <Text className="text-text-secondary text-left text-lg">{`No results available yet.`}</Text>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          {/* Placeholder for results list, replace with actual results rendering logic */}
          <Text className="text-text-primary text-lg">Results will be displayed here</Text>
        </View>
      )}
    </Pressable>
  );
};

export default ResultsHomeCard;

const styles = StyleSheet.create({});
