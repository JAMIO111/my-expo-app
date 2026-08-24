import SafeViewWrapper from '@components/SafeViewWrapper';
import ProGate from '@components/ProGate';
import CustomHeader from '@components/CustomHeader';
import { Stack } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import usePlayerBadges from '@hooks/usePlayerBadges';
import BadgeList from '@components/BadgeList';
import { View, ScrollView } from 'react-native';

const BadgesPage = () => {
  const { player } = useUser();
  const { badges } = usePlayerBadges(player?.id);
  console.log('Player Badges:', badges);
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
                        <CustomHeader title="My Badges" showBack={true} />
                      </SafeViewWrapper>
                    ),
                  }}
                />
              </SafeViewWrapper>
            ),
          }}
        />

        <ScrollView style={{ flex: 1, marginTop: 56 }}>
          <ProGate justifyContent="start" intensity={35}>
            <BadgeList badges={badges} />
          </ProGate>
        </ScrollView>
      </SafeViewWrapper>
    </>
  );
};

export default BadgesPage;
