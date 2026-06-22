import { ScrollView, View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';

// 👇 Add new sections here — no JSX needed
const helpSections = [
  {
    id: 'submitting-results',
    title: 'Submitting Results',
    icon: 'checkmark-done-circle-outline',
    blocks: [
      {
        type: 'paragraph',
        text: 'When the scheduled match time arrives, the match will go live. From the fixture page, the home team captain will have the ability to submit the results frame by frame.',
      },
      {
        type: 'paragraph',
        text: 'It is encouraged to submit scores promptly as they become available to enhance the live scoring experience for all participants. Frames must be submitted in the exact order they were played to ensure accurate tracking of statistics such as win streaks.',
      },
      {
        type: 'paragraph',
        text: 'After the home captain finalizes the submission, the away team captain will receive a notification on their home screen, allowing them to review, approve, or dispute the results. Upon approval, the results will be finalized and made public. If a dispute is raised, the match will be placed in a pending state, requiring intervention from the league administrators to resolve the issue.',
      },
    ],
  },
  {
    id: 'progression-system',
    title: 'Progression System',
    icon: 'trophy-outline',
    blocks: [
      {
        type: 'paragraph',
        text: 'The progression system is designed to reward players for their participation and performance in matches. Players earn experience points (XP) for each match played, with additional bonuses for wins and win streaks.',
      },
      { type: 'image', source: require('@assets/progression-teaser.png') },
      {
        type: 'paragraph',
        text: 'Players can also unlock tiered badges for reaching certain milestones or completing specific challenges. These badges come in 7 tiers and can be viewed from your profile page.',
      },
    ],
  },
];

const HelpSection = ({ section }) => (
  <View className="mb-5 w-full rounded-2xl bg-bg-grouped-2 p-4">
    <View className="mb-3 flex-row items-center">
      <Ionicons name={section.icon} size={24} color="#D4AF37" />
      <Text className="ml-2 mt-1 font-saira-bold text-2xl text-text-1">{section.title}</Text>
    </View>

    {section.blocks.map((block, idx) =>
      block.type === 'paragraph' ? (
        <Text key={idx} className="mb-2 font-saira text-base leading-6 text-text-2">
          {block.text}
        </Text>
      ) : (
        <View key={idx} className="my-2 w-full items-center justify-center">
          <Image
            resizeMode="contain"
            style={{ width: '90%', height: block.height ?? 250 }}
            source={block.source}
          />
        </View>
      )
    )}
  </View>
);

const index = () => {
  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
      <CustomHeader title="Help Centre" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        className="flex-1 bg-bg-grouped-1 px-4 pt-4">
        {helpSections.map((section) => (
          <HelpSection key={section.id} section={section} />
        ))}

        <Text className="mb-10 mt-2 text-center font-saira text-text-3">
          Have a request for a new feature? Let us know! We're always looking to improve the app.
        </Text>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default index;
