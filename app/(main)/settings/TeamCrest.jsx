import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import CrestEditor from '@components/CrestEditor';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { Stack } from 'expo-router';

const TeamCrest = () => {
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {};
  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Crest Editor" />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <CrestEditor />
      </View>
    </SafeViewWrapper>
  );
};

export default TeamCrest;

const styles = StyleSheet.create({});
