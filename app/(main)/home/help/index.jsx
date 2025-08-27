import { StyleSheet, Text, View, Image } from 'react-native';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { ScrollView } from 'react-native-gesture-handler';

const index = () => {
  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
      <CustomHeader title="Help Centre" />
      <ScrollView
        contentContainerStyle={{ justifyContent: 'flex-start', alignItems: 'center' }}
        className="flex-1 bg-bg-grouped-1 p-5">
        <View className="mb-6 w-full items-start justify-start rounded-2xl bg-bg-grouped-2 p-4">
          <Text className="mb-3 text-left font-saira-bold text-2xl text-text-1">
            Submitting Results
          </Text>
          <Text className="mb-1 text-left font-saira text-xl text-text-2">
            When the scheduled match time arrives, the match will go live. From the fixture page,
            the home team captain will have the ability to submit the results frame by frame.
          </Text>
          <Text className="mb-1 text-left font-saira text-xl text-text-2">
            It is encouraged to submit scores promptly as they become available to enhance the live
            scoring experience for all participants. Frames must be submitted in the exact order
            they were played to ensure accurate tracking of statistics such as win streaks.
          </Text>
          <Text className="mb-1 text-left font-saira text-xl text-text-2">
            After the home captain finalizes the submission, the away team captain will receive a
            notification on their home screen, allowing them to review, approve, or dispute the
            results. Upon approval, the results will be finalized and made public. If a dispute is
            raised, the match will be placed in a pending state, requiring intervention from the
            league administrators to resolve the issue.
          </Text>
        </View>
        <View className="mb-6 w-full items-start justify-start rounded-2xl bg-bg-grouped-2 p-4">
          <Text className="mb-3 text-left font-saira-bold text-2xl text-text-1">
            Progression System
          </Text>
          <Text className="mb-1 text-left font-saira text-xl text-text-2">
            The progression system is designed to reward players for their participation and
            performance in matches. Players earn experience points (XP) for each match played, with
            additional bonuses for wins and win streaks.
          </Text>
          <View className="w-full items-center justify-center">
            <Image
              resizeMode="contain"
              style={{ width: '90%', height: 250 }}
              source={require('@assets/progression-teaser.png')}
            />
          </View>
          <Text className="mb-1 text-left font-saira text-xl text-text-2">
            Players can also unlock tiered badges for reaching certain milestones or completing
            specific challenges. These badges come in 7 tiers and can be viewed from your profile
            page.
          </Text>
        </View>
        <View>
          <Text className="mb-10 text-center font-saira text-text-3">
            Have a request for a new feature? Let us know! We're always looking to improve the app.
          </Text>
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({});
