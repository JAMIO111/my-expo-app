import SafeViewWrapper from '@components/SafeViewWrapper';
import ProGate from '@components/ProGate';
import PlayerFrameList from '@components/PlayerFrameList';
import CustomHeader from '@components/CustomHeader';
import { Stack } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import EntityStats from '@components/EntityStats';
import { View, ScrollView } from 'react-native';

const FramesPage = () => {
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
                        <CustomHeader title="My Frames" showBack={true} />
                      </SafeViewWrapper>
                    ),
                  }}
                />
              </SafeViewWrapper>
            ),
          }}
        />

        <View style={{ flex: 1, marginTop: 56 }}>
          <PlayerFrameList playerId={player?.id} />
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default FramesPage;
