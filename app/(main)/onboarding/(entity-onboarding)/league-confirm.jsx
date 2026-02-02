import { StyleSheet, Text, View, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import SafeViewWrapper from '@components/SafeViewWrapper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '@/lib/supabase';
import { ScrollView } from 'react-native-gesture-handler';

const LeagueConfirm = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const league = JSON.parse(params.league || '{}');

  console.log('LeagueConfirm league param:', league);

  useEffect(() => {
    if (!league?.id) return;

    const fetchData = async () => {
      const { data: adminsData, error: adminsError } = await supabase
        .from('DistrictAdmins')
        .select('*, Players(first_name, surname)')
        .eq('district_id', league.id);

      const { data: teamsData, error: teamsError } = await supabase
        .from('Teams')
        .select(
          `
    *,
    divisions!inner (
      id,
      district_id
    )
  `
        )
        .eq('divisions.district_id', league.id);

      if (adminsError || teamsError) {
        console.error({ adminsError, teamsError });
      } else {
        console.log('Fetched adminsData:', adminsData);
        console.log('Fetched teamsData:', teamsData);
      }
    };

    fetchData();
  }, [league?.id]);

  const handleContinue = () => {
    router.push({
      pathname: '/(main)/onboarding/profile-claim',
      params: { team: JSON.stringify(teamProfile) },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 3 of 4',
        }}
      />
      <SafeViewWrapper useTopInset={false} topColor="bg-brand" bottomColor="bg-brand-dark">
        <View className="flex-1 justify-between gap-3 bg-brand">
          <StepPillGroup steps={4} currentStep={3} />
          <ScrollView className="flex-1 gap-3 p-5">
            <Text
              style={{ lineHeight: 50 }}
              className="mb-4 font-delagothic text-5xl font-bold text-text-on-brand">
              Is this your league?
            </Text>
            <View className="flex-row items-center gap-5 rounded-2xl bg-bg-grouped-2 px-5 py-5 ">
              <View>
                <Text className="font-saira-bold text-3xl text-text-1">
                  {league?.name || 'Unnamed League'}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text className="font-saira-medium text-xl text-text-2"></Text>
                </View>
              </View>
            </View>
          </ScrollView>
          <View className="gap-5 rounded-t-3xl bg-brand-dark px-5 pt-6">
            <CTAButton callbackFn={() => router.back()} type="error" text="No - Go Back" />
            <View>
              <CTAButton type="yellow" text="Yes - Continue" callbackFn={handleContinue} />
              <Text className="px-3 text-lg text-text-2"></Text>
            </View>
          </View>
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default LeagueConfirm;

const styles = StyleSheet.create({});
