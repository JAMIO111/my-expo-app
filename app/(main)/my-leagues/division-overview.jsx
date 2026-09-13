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
import Heading from '@components/Heading';
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
              <View className="mb-4 rounded-2xl bg-bg-2 px-4 py-1 shadow-sm">
                <Text className="px-1 py-3 text-center font-tektur text-lg text-text-2">
                  There is no active season. Please come back once the new season has been
                  initiated.
                </Text>
              </View>
            ) : !currentSeasonComp && !isCompetitionsLoading ? (
              <View className="mx-2 my-2">
                <CTAButton
                  type="yellow"
                  text={`Initiate ${currentRole?.activeSeason?.name} competition`}
                  callbackFn={() => {
                    setShowModal(true);
                    setModalType('initiate-competition');
                  }}
                />
                <Text className="mt-4 px-2 font-tektur text-sm text-text-2">
                  You haven't initiated a competition for the {currentRole?.activeSeason?.name}{' '}
                  season yet. Please initiate a competition to add teams and create fixtures.
                </Text>
              </View>
            ) : !isCompetitionsLoading ? (
              <View className="mb-4 gap-2 rounded-2xl bg-bg-2 p-4 shadow-sm">
                <Text className="font-saira-semibold text-xl text-text-1">
                  {`${currentRole?.activeSeason?.name} ${currentSeasonComp?.name || 'Competition'} - ${currentSeasonComp?.status
                    .charAt(0)
                    .toUpperCase()}${currentSeasonComp?.status?.slice(1)}`}
                </Text>
                <Text className="font-saira-medium text-text-2">{`Initiated ${new Date(
                  currentSeasonComp?.created_at
                ).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`}</Text>
              </View>
            ) : null}
            {currentRole?.type === 'admin' &&
              currentSeasonComp &&
              !currentSeasonComp?.fixtures_generated && (
                <CTAButton
                  type="yellow"
                  text={`Generate ${currentRole?.activeSeason?.name} fixtures`}
                  callbackFn={() => {
                    setModalType('generate-fixtures');
                    setShowModal(true);
                  }}
                />
              )}
          </ExpandableView>

          {currentSeasonComp?.fixtures_generated && (
            <View className="gap-3 bg-bg-1 p-3 py-6">
              <View className="">
                <Heading text="Fixtures" />
              </View>
              <FixturesAccordion
                isExpanded={expandedAccordion === 'fixtures'}
                onPress={() =>
                  setExpandedAccordion(expandedAccordion === 'fixtures' ? null : 'fixtures')
                }
                season={currentRole.activeSeason}
                competitionInstance={currentSeasonComp}
              />
            </View>
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
