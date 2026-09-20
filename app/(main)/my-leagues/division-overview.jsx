import { StyleSheet, View, Text } from 'react-native';
import { useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import MembersAccordion from '@components/MembersAccordion';
import { useTeamsByDivision } from '@hooks/useTeamsByDivision';
import FixturesAccordion from '@components/FixturesAccordion';
import ExpandableView from '@components/ExpandableView';
import BottomSheetModal from '@components/BottomSheetModal';
import CTAButton from '@components/CTAButton';
import EditDivisionForm from '@components/EditDivisionForm';
import GenerateFixturesForm from '@components/GenerateFixturesForm';
import { useDivisions } from '@hooks/useDivisions';
import { useCompetitions } from '@hooks/useCompetitions';
import {
  Shield,
  Medal,
  Layers,
  Users,
  User,
  ChevronUp,
  ChevronDown,
  Wrench,
  CalendarClock,
  ShieldCheck,
} from 'lucide-react-native';

const DivisionOverview = () => {
  const { currentRole } = useUser();
  const { divisionId } = useLocalSearchParams();
  const { data: divisions } = useDivisions(currentRole?.district?.id);
  const {
    data: teams,
    isLoading: isTeamsLoading,
    isError: isTeamsError,
  } = useTeamsByDivision(divisionId);
  const {
    data: LeagueCompetition,
    isLoading: isCompetitionsLoading,
    isError: isCompetitionsError,
  } = useCompetitions({
    divisionId: divisionId,
    competitionType: 'league',
  });
  console.log('Competitions in Division Overview:', LeagueCompetition);
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const [showDetails, setShowDetails] = useState(true);
  const [showActiveCompetition, setShowActiveCompetition] = useState(true);
  const [showFixtures, setShowFixtures] = useState(false);
  const [showDivisionMembers, setShowDivisionMembers] = useState(true);
  const [modalType, setModalType] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const division = divisions?.find((d) => d.id === divisionId) || {};

  const currentSeasonComp = currentRole?.competitions?.find(
    (comp) =>
      LeagueCompetition?.[0]?.id === comp.competition_id &&
      comp.season_id === currentRole.activeSeason.id
  );

  const divisionDetailsConfig = [
    {
      title: 'Division Name',
      value: division?.name || 'N/A',
      icon: Shield,
    },
    {
      title: 'Division Tier',
      value: division?.tier ? `Tier ${division.tier}` : 'N/A',
      icon: Medal,
    },
    {
      title: 'Division Group',
      value: division?.group_name || 'N/A',
      icon: Layers,
    },
    {
      title: 'Competitor Type',
      value: division?.competitor_type
        ? division.competitor_type.slice(0, 1).toUpperCase() + division.competitor_type.slice(1)
        : 'N/A',
      icon: division?.competitor_type === 'team' ? Users : User,
    },
    {
      title: 'Promotion Spots',
      value: division?.promotion_spots || 'No promotions',
      icon: ChevronUp,
    },
    {
      title: 'Relegation Spots',
      value: division?.relegation_spots || 'No relegations',
      icon: ChevronDown,
    },
  ];

  console.log('Current Season Competition:', currentSeasonComp);
  console.log('Competitions Loading:', isCompetitionsLoading, 'Error:', isCompetitionsError);
  console.log('Active Season:', currentRole?.activeSeason);

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                onRightPress={() => {
                  setModalType('edit-division');
                  setShowModal(true);
                }}
                rightIcon={Wrench}
                showBack={true}
                title={division.name || 'My Division'}
              />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper useBottomInset={false} bottomColor="bg-brand" topColor="bg-brand">
        <ScrollView
          contentContainerStyle={{ gap: 12, marginVertical: 58, paddingBottom: 32 }}
          className="flex-1 bg-bg-2 p-3">
          <ExpandableView title="Division Details" show={showDetails} setShow={setShowDetails}>
            <View className="flex-col gap-2 p-2 pt-0">
              {divisionDetailsConfig.map(({ title, value, icon: Icon }) => (
                <View key={title} className="flex-row gap-2 pt-2">
                  {Icon && <Icon className="mr-2" size={20} color={'#666'} />}
                  <Text className="flex-1 px-1 font-saira text-lg text-text-2">{title}</Text>
                  <Text className="px-1 font-saira text-xl text-text-1">{value}</Text>
                </View>
              ))}
            </View>
          </ExpandableView>

          <ExpandableView
            title="League Competition"
            show={showActiveCompetition}
            setShow={setShowActiveCompetition}
            fixedOpen={!currentSeasonComp && !isCompetitionsLoading}>
            {isCompetitionsLoading || !currentRole ? (
              <View className="mb-4 rounded-2xl bg-bg-2 px-4 py-1 shadow-sm">
                <Text className="px-1 py-3 text-center font-tektur text-lg text-text-2">
                  Loading current season competition...
                </Text>
              </View>
            ) : !currentRole?.activeSeason && !isCompetitionsLoading ? (
              <View className="rounded-2xl bg-bg-2 px-4 py-1">
                <Text className="px-1 py-4 text-center font-tektur text-text-2">
                  There is no active season. Please come back once the new season has been
                  initiated.
                </Text>
              </View>
            ) : !currentSeasonComp && !isCompetitionsLoading ? (
              <View>
                <Text className="mb-4 px-2 font-tektur text-sm text-text-2">
                  You haven't initiated a competition for the {currentRole?.activeSeason?.name}{' '}
                  season yet. Please initiate a competition to add teams and create fixtures.
                </Text>
                <CTAButton
                  type="yellow"
                  text={`Initiate ${currentRole?.activeSeason?.name} competition`}
                  callbackFn={() => {
                    setShowModal(true);
                    setModalType('initiate-competition');
                  }}
                />
              </View>
            ) : !isCompetitionsLoading ? (
              <View className="flex-row items-start justify-between gap-4 rounded-2xl bg-bg-2 p-4">
                <Text className="flex-1 font-saira-semibold text-xl text-text-1">
                  {`${currentRole?.activeSeason?.name} ${currentSeasonComp?.name || 'Competition'}`}
                </Text>

                <View
                  className={`flex shrink-0 flex-row items-center gap-1 rounded-full px-2 py-1 ${
                    currentSeasonComp?.status === 'active'
                      ? 'bg-theme-green/20'
                      : 'bg-theme-orange/20'
                  }`}>
                  {currentSeasonComp?.status === 'active' ? (
                    <ShieldCheck size={16} color="#22c55e" />
                  ) : (
                    <CalendarClock size={16} color="#f97316" />
                  )}
                  <Text
                    className={`font-saira-medium ${
                      currentSeasonComp?.status === 'active' ? 'text-[#22c55e]' : 'text-[#f97316]'
                    }`}>
                    {currentSeasonComp?.status?.charAt(0).toUpperCase() +
                      currentSeasonComp?.status?.slice(1)}
                  </Text>
                </View>
              </View>
            ) : null}
            {currentRole?.type === 'admin' &&
              currentSeasonComp &&
              !currentSeasonComp?.fixtures_generated && (
                <View className="mt-3">
                  <CTAButton
                    type="yellow"
                    text={`Generate ${currentRole?.activeSeason?.name} fixtures`}
                    callbackFn={() => {
                      setModalType('generate-fixtures');
                      setShowModal(true);
                    }}
                  />
                </View>
              )}
          </ExpandableView>

          {currentSeasonComp?.fixtures_generated && (
            <ExpandableView
              title={`${currentRole?.activeSeason?.name} Fixtures`}
              show={showFixtures}
              setShow={setShowFixtures}>
              <FixturesAccordion competitionInstance={currentSeasonComp} />
            </ExpandableView>
          )}
          <ExpandableView
            title="Members"
            show={showDivisionMembers}
            setShow={setShowDivisionMembers}>
            <MembersAccordion
              isExpanded={expandedAccordion === 'division'}
              onPress={() =>
                setExpandedAccordion(expandedAccordion === 'division' ? null : 'division')
              }
              divisionName={division.name}
              teams={teams || []}
            />
          </ExpandableView>
        </ScrollView>
      </SafeViewWrapper>
      <BottomSheetModal
        showModal={showModal}
        setShowModal={setShowModal}
        title={
          modalType === 'generate-fixtures'
            ? `Generate ${currentRole.activeSeason.name} Fixtures`
            : modalType === 'edit-division'
              ? `${division.name} Settings`
              : `Initiate ${division.name} Competition`
        }>
        {modalType === 'generate-fixtures' ? (
          <GenerateFixturesForm
            competitionInstanceId={currentSeasonComp.id}
            closeModal={() => setShowModal(false)}
          />
        ) : modalType === 'edit-division' || modalType === 'initiate-competition' ? (
          <EditDivisionForm
            competition={LeagueCompetition?.[0]}
            division={division}
            participants={teams}
            closeModal={() => setShowModal(false)}
            context={modalType}
          />
        ) : null}
      </BottomSheetModal>
    </>
  );
};

export default DivisionOverview;

const styles = StyleSheet.create({});
