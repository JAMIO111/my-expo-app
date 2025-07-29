import { View } from 'react-native';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { Stack } from 'expo-router';
import AbbreviationEditor from '@components/AbbreviationEditor';

const Abbreviation = () => {
  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Abbreviation" />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <AbbreviationEditor />
      </View>
    </SafeViewWrapper>
  );
};

export default Abbreviation;
