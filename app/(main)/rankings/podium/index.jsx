import { StyleSheet, Text, View, Image, ScrollView } from 'react-native';
import Podium3D from '@components/Podium';
import { Stack } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';

const index = () => {
  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand-dark">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader backgroundColor="bg-brand-dark" title={'Frames Won'} />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1 items-center justify-center bg-brand-dark pt-8">
        <Podium3D />
        <View className="w-full flex-1 rounded-t-3xl border border-theme-gray-6 bg-bg-grouped-1 px-5 pt-5">
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
            className="w-full flex-1 bg-bg-grouped-1">
            {Array.from({ length: 12 }, (_, index) => (
              <View
                key={index}
                className="mb-2 w-full flex-row items-center justify-between gap-5 rounded-xl border border-theme-gray-5 bg-bg-grouped-2 p-3 shadow shadow-theme-gray-6">
                <Text className="h-10 w-10 rounded bg-bg-grouped-3 p-2 text-center font-saira text-2xl text-text-1">
                  {index + 1}
                </Text>
                <Image source={require('@assets/avatar.jpg')} className="h-14 w-14 rounded" />
                <View className="flex-1 items-center justify-start">
                  <Text className="w-full text-left font-saira-semibold text-2xl text-text-1">
                    Jamie Dryden
                  </Text>
                  <Text className="w-full text-left font-saira-semibold text-xl text-text-2">
                    Shankhouse B
                  </Text>
                </View>
                <Text
                  style={{ lineHeight: 50 }}
                  className="text-center font-saira-bold text-4xl text-text-1">
                  54
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({
  trapazoid1: {
    width: 80,
    height: 50,
    backgroundColor: 'blue',
    transform: [{ skewY: '20deg' }],
  },
});
