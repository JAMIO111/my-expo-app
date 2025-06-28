import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Link } from 'expo-router';

const rows = [
  ['yellow', 'red', 'yellow', 'yellow', 'red'],
  ['red', 'yellow', 'red', 'yellow'],
  ['yellow', 'black', 'red'],
  ['red', 'yellow'],
  ['yellow'],
];

const getBallColor = (color) => {
  switch (color) {
    case 'red':
      return 'bg-red-600';
    case 'yellow':
      return 'bg-yellow-400';
    case 'black':
      return 'bg-black';
    default:
      return 'bg-white';
  }
};

const notFound = () => {
  return (
    <View className="bg-brand relative flex-1 items-center justify-center gap-3">
      <Text className="text-9xl font-bold text-white">404</Text>
      <Text className="text-3xl text-white">Oops! Page not found.</Text>
      <Link
        href="(main)/home"
        className="mt-10 rounded-lg bg-white px-4 py-2 text-2xl font-semibold text-black no-underline">
        Go back to Home
      </Link>
      <View className="absolute -left-4 -top-4 h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute -bottom-4 -right-4 h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute -left-7 top-[50%] h-12 w-12 rounded-full bg-black"></View>
      <View className="absolute -right-7 top-[50%] h-12 w-12 rounded-full bg-black"></View>
      {/* Rack */}
      <View className="absolute top-20 items-center rounded-xl">
        {rows.map((row, i) => (
          <View key={i} className="flex-row justify-center gap-1 space-x-2">
            {row.map((color, j) => (
              <View
                key={j}
                className={`h-8 w-8 rounded-full border border-white ${getBallColor(color)}`}
              />
            ))}
          </View>
        ))}
      </View>
      <View className="absolute bottom-16 mb-10 items-center justify-center">
        <View className="h-8 w-8 rounded-full border border-white bg-white" />
      </View>
    </View>
  );
};

export default notFound;

const styles = StyleSheet.create({});
