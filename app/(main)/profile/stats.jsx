import SafeViewWrapper from '@components/SafeViewWrapper';
import ProGate from '@components/ProGate';
import CustomHeader from '@components/CustomHeader';
import { Stack } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import EntityStats from '@components/EntityStats';
import { View, ScrollView } from 'react-native';

const BadgesPage = () => {
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

        <ScrollView style={{ flex: 1, marginTop: 56 }}>
          <ProGate justifyContent="start" intensity={30}>
            <EntityStats entityId={player?.id} entityType="player" />
          </ProGate>
        </ScrollView>
      </SafeViewWrapper>
    </>
  );
};

export default BadgesPage;
