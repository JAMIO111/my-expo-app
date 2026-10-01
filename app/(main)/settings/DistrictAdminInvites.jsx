import { Text, View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Toast from 'react-native-toast-message';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import CTAButton from '@components/CTAButton';
import LoadingScreen from '@components/LoadingScreen';
import { useUser } from '@contexts/UserProvider';
import { supabase } from '@/lib/supabase';
import { useMyAdminInvites } from '@hooks/useDistrictAdminInvites';
import { handleFixtureError } from '@lib/fixtureActionErrors';

// Invitations from a league's admins to become an admin too.
const DistrictAdminInvites = () => {
  const queryClient = useQueryClient();
  const { refetch } = useUser();
  const { data: invites, isLoading, refetch: refetchInvites } = useMyAdminInvites();
  const [busyId, setBusyId] = useState(null);

  const respond = async (invite, accept) => {
    setBusyId(invite.id);
    try {
      const { error } = await supabase.rpc(
        accept ? 'accept_district_admin_invite' : 'decline_district_admin_invite',
        { p_invite_id: invite.id }
      );
      if (error) throw error;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['MyAdminInvites'] }),
        accept ? refetch() : Promise.resolve(),
      ]);
      Toast.show({
        type: 'success',
        text1: accept ? 'You are now an admin' : 'Invitation declined',
        text2: accept
          ? `Switch to your admin role to manage ${invite.district.name}.`
          : `You declined the invitation to ${invite.district.name}.`,
      });
    } catch (error) {
      console.error('Error answering admin invite:', error);
      await handleFixtureError(error, {
        fallbackTitle: 'Something went wrong',
        fallbackMessage: 'Please try again.',
      });
      await refetchInvites();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="League Admin Invites" />
            </SafeViewWrapper>
          ),
        }}
      />
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <ScrollView className="mt-16 flex-1 bg-bg-grouped-1 p-5" contentContainerStyle={{ gap: 12 }}>
          {!invites || invites.length === 0 ? (
            <Text className="mt-10 text-center font-saira text-lg text-text-2">
              You have no pending invitations.
            </Text>
          ) : (
            invites.map((invite) => (
              <View
                key={invite.id}
                className="gap-3 rounded-2xl border border-theme-gray-4 bg-bg-3 p-4">
                <Text className="font-saira-semibold text-xl text-text-1">
                  {invite.district.name}
                </Text>
                <Text className="font-saira text-base text-text-2">
                  {`${invite.invited_by ?? 'A league admin'} invited you to be an admin of this league.`}
                </Text>
                <CTAButton
                  text="Accept"
                  type="success"
                  loading={busyId === invite.id}
                  disabled={!!busyId}
                  callbackFn={() => respond(invite, true)}
                />
                <CTAButton
                  text="Decline"
                  type="error"
                  disabled={!!busyId}
                  callbackFn={() => respond(invite, false)}
                />
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeViewWrapper>
  );
};

export default DistrictAdminInvites;
