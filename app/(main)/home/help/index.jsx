import { ScrollView, View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';

// 👇 Add new sections here — no JSX needed
const helpSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'rocket-outline',
    blocks: [
      {
        type: 'paragraph',
        text: 'Break Room connects you with pool and snooker leagues in your area. Once you create your player profile, you can join an existing team, request to join a league directly, or create your own team and invite others.',
      },
      {
        type: 'paragraph',
        text: 'Your profile keeps track of your match history, rank, XP, and badges as you play, so it is worth filling out your details fully — including your date of birth and gender, which are used for age and gender-restricted competitions.',
      },
    ],
  },
  {
    id: 'joining-a-team',
    title: 'Joining a Team',
    icon: 'people-outline',
    blocks: [
      {
        type: 'paragraph',
        text: 'You can join a team in two ways: by requesting to join an existing team directly, or by accepting an invite sent to you by a team captain. Requests must be approved by the team captain or vice-captain before you become an active member.',
      },
      {
        type: 'paragraph',
        text: 'Once you are part of a team, you will automatically be entered into that team\u2019s fixtures for the competitions they are registered in. If you leave a team, the rest of your squad will be notified and you may not be able to join back until the end of the season, depending on league rules.',
      },
    ],
  },
  {
    id: 'team-roles',
    title: 'Team Roles & Captaincy',
    icon: 'ribbon-outline',
    blocks: [
      {
        type: 'paragraph',
        text: 'Every team has a captain, who is responsible for submitting match results, managing the squad, and scheduling fixtures. Captains can also appoint a vice-captain, who shares most of these responsibilities and can step in if the captain is unavailable.',
      },
      {
        type: 'paragraph',
        text: 'Captaincy can be transferred to any active team member at any time in case of absenteeism or unavailability. The outgoing captain is automatically demoted to vice-captain or player, depending on the situation, and the whole team is notified of the change.',
      },
    ],
  },
  {
    id: 'competitions-and-eligibility',
    title: 'Competitions & Eligibility',
    icon: 'medal-outline',
    blocks: [
      {
        type: 'paragraph',
        text: 'Competitions are organised by district and division, and some may have specific eligibility rules \u2014 such as age restrictions, gender categories, or a minimum number of matches played. You can view a competition\u2019s eligibility requirements before joining.',
      },
      {
        type: 'paragraph',
        text: 'If your team does not meet a competition\u2019s requirements, you will see a clear explanation of why when you try to join, along with any steps needed to become eligible.',
      },
    ],
  },
  {
    id: 'fixtures-and-scheduling',
    title: 'Fixtures & Scheduling',
    icon: 'calendar-outline',
    blocks: [
      {
        type: 'paragraph',
        text: 'Fixtures are generated automatically for each competition, balancing home and away matches across the season. You can view your upcoming fixtures from the My Home tab.',
      },
      {
        type: 'paragraph',
        text: 'Team captains can propose a match time and venue for each fixture. The opposing captain will need to confirm the proposed slot, or suggest an alternative, before the fixture is locked in.',
      },
      {
        type: 'paragraph',
        text: 'If a team cannot fulfil a fixture, a captain can forfeit the match. Forfeited fixtures are recorded with an admin flag and scored according to your league\u2019s forfeit rules.',
      },
    ],
  },
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
    id: 'rankings-and-leaderboards',
    title: 'Rankings & Leaderboards',
    icon: 'stats-chart-outline',
    blocks: [
      {
        type: 'paragraph',
        text: 'Every player has a global rank based on their XP, alongside separate leaderboards for their district and division. Leaderboards update automatically as results are approved.',
      },
      {
        type: 'paragraph',
        text: 'Additional statistics for players and teams are available for Core and Pro subscribers from the Rankings tab, including win streaks, frames won, and frame win percentage. These can be viewed from your profile page or the Rankings tab.',
      },
    ],
  },
  {
    id: 'trophy-cabinet',
    title: 'Trophy Cabinet',
    icon: 'medal-outline',
    blocks: [
      {
        type: 'paragraph',
        text: "Your trophy cabinet showcases the competitions and awards you have won throughout your Break Room career, from league titles to individual season awards like MVP or Players' Player.",
      },
      {
        type: 'paragraph',
        text: 'Trophies are awarded automatically once a competition concludes and its final standings are confirmed by league administrators.',
      },
    ],
  },
  {
    id: 'badges-and-achievements',
    title: 'Badges & Achievements',
    icon: 'ribbon-outline',
    blocks: [
      {
        type: 'paragraph',
        text: 'Badges and achievements are awarded for reaching milestones and completing specific challenges within the app. They can be viewed from your profile page.',
      },
      {
        type: 'paragraph',
        text: 'Badges come in 7 tiers, with higher tiers requiring more difficult challenges to unlock. Achievements are one-time awards for completing specific tasks or reaching certain milestones.',
      },
      {
        type: 'paragraph',
        text: 'Increasing amounts of XP are awarded for each badge tier, with the highest tiers providing significant XP boosts to help you climb the global rankings faster.',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: 'notifications-outline',
    blocks: [
      {
        type: 'paragraph',
        text: 'You will receive notifications for important events such as fixture reminders, result submissions awaiting your approval, team invites, and changes to your team\u2019s captaincy.',
      },
      {
        type: 'paragraph',
        text: 'You can view all your notifications at any time from the bell icon on your home screen, and manage which types of notifications you receive from your account settings.',
      },
    ],
  },
  {
    id: 'membership-and-subscriptions',
    title: 'Membership & Subscriptions',
    icon: 'card-outline',
    blocks: [
      {
        type: 'paragraph',
        text: 'Break Room offers Core and Pro membership tiers alongside the free tier, unlocking additional features such as advanced statistics, extended profile customisation, and priority support.',
      },
      {
        type: 'paragraph',
        text: 'Subscriptions can be managed at any time through your device\u2019s App Store or Play Store account settings. Cancelling a subscription will not affect your match history or league membership \u2014 you will simply lose access to the premium features at the end of your billing period.',
      },
    ],
  },
  {
    id: 'account-and-profile',
    title: 'Account & Profile Settings',
    icon: 'person-circle-outline',
    blocks: [
      {
        type: 'paragraph',
        text: 'You can update your name, nickname, and avatar at any time from your profile page. To protect the integrity of age and gender-restricted competitions, changes to your date of birth and gender are limited \u2014 you will see how many changes you have remaining before making an update.',
      },
      {
        type: 'paragraph',
        text: 'You can also link additional login methods, such as Google or Facebook, from the Connected Logins section of your account settings, making it easier to sign in across devices.',
      },
    ],
  },
  {
    id: 'disputes-and-fair-play',
    title: 'Disputes & Fair Play',
    icon: 'shield-checkmark-outline',
    blocks: [
      {
        type: 'paragraph',
        text: 'If a submitted result looks incorrect, the away team captain can raise a dispute instead of approving it. Disputed fixtures are flagged for league administrators, who will review the submission and any evidence provided before making a final decision.',
      },
      {
        type: 'paragraph',
        text: 'Repeated or unfounded disputes may be reviewed by league administrators to ensure fair play is maintained across all competitions.',
      },
    ],
  },
  {
    id: 'deleting-your-account',
    title: 'Deleting Your Account',
    icon: 'trash-outline',
    blocks: [
      {
        type: 'paragraph',
        text: 'You can request account deletion from your account settings at any time. This will permanently remove your personal information, though your historical match statistics may be retained in an anonymised form to preserve the accuracy of past league results.',
      },
      {
        type: 'paragraph',
        text: 'This action cannot be undone, so make sure it is what you want before confirming.',
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
