import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import LeagueTableWrapper from '@components/LeagueTableWrapper';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { ClipboardCheck } from 'lucide-react-native';

const index = () => {
  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="League Tables" rightIcon={ClipboardCheck} />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1">
        <LeagueTableWrapper context="home/league" />
      </View>
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({});
