import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { Stack } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import EntityStats from '@components/EntityStats';
import { ScrollView } from 'react-native';
import { useTheme } from '@contexts/ThemeProvider';
const StatsPage = () => {
  const { colors: themeColors } = useTheme();
  const { player } = useUser();
  return (
    <>
      <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
        <Stack.Screen
          options={{
            header: () => (
              <SafeViewWrapper useBottomInset={false}>
                <Stack.Screen
                  options={{
                    header: () => (
                      <SafeViewWrapper useBottomInset={false}>
                        <CustomHeader title="My Stats" showBack={true} />
                      </SafeViewWrapper>
                    ),
                  }}
                />
              </SafeViewWrapper>
            ),
          }}
        />

        <ScrollView style={{ flex: 1, marginTop: 56, backgroundColor: themeColors.bg1 }}>
          <EntityStats entityId={player?.id} entityType="player" />
        </ScrollView>
      </SafeViewWrapper>
    </>
  );
};

export default StatsPage;
